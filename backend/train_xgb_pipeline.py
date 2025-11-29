import os
import pandas as pd
import numpy as np
import joblib
from tqdm import tqdm
from typing import List, Optional
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, 
    r2_score, accuracy_score, classification_report
)
from xgboost import XGBRegressor, XGBClassifier
from sentence_transformers import SentenceTransformer, util
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ResumeFeatureEngineer:
    """
    Advanced feature engineering for resume scoring.
    Extracts meaningful features that predict resume quality.
    """
    
    def __init__(self, embedder_name: str = "all-MiniLM-L6-v2"):
        self.embedder = SentenceTransformer(embedder_name)
        logger.info(f"Loaded embedding model: {embedder_name}")
    
    def extract_features(
        self,
        resume_text: str,
        jd_text: str,
        skills_resume: str = "",
        skills_jd: str = "",
        years_resume: float = 0.0,
        years_jd: float = 0.0
    ) -> np.ndarray:
        """
        Extract comprehensive feature set from resume and JD.
        
        Returns:
            1D numpy array of features
        """
        features = []
        
        # 1. Semantic Similarity (using sentence transformers)
        emb_resume = self.embedder.encode(str(resume_text), convert_to_tensor=True)
        emb_jd = self.embedder.encode(str(jd_text), convert_to_tensor=True)
        semantic_sim = float(util.cos_sim(emb_resume, emb_jd).cpu().numpy().squeeze())
        features.append(semantic_sim)
        
        # 2. Keyword Overlap
        resume_words = set(str(resume_text).lower().split())
        jd_words = set(str(jd_text).lower().split())
        keyword_overlap = len(resume_words & jd_words) / max(len(jd_words), 1)
        features.append(keyword_overlap)
        
        # 3. Skills Match
        skills_r = set(s.strip().lower() for s in str(skills_resume).split(",") if s.strip())
        skills_j = set(s.strip().lower() for s in str(skills_jd).split(",") if s.strip())
        if skills_j:
            skills_match = len(skills_r & skills_j) / len(skills_j)
        else:
            skills_match = 0.5  # Neutral if no skills specified
        features.append(skills_match)
        
        # 4. Number of matching skills
        features.append(len(skills_r & skills_j))
        
        # 5. Total skills in resume
        features.append(len(skills_r))
        
        # 6. Experience Match
        if years_jd > 0:
            exp_match = min(years_resume / years_jd, 2.0)  # Cap at 2x to avoid huge numbers
        else:
            exp_match = 1.0
        features.append(exp_match)
        
        # 7. Years difference (absolute)
        features.append(abs(years_resume - years_jd))
        
        # 8. Resume Length Features
        features.append(len(str(resume_text)))  # Character count
        features.append(len(str(resume_text).split()))  # Word count
        features.append(len(str(resume_text).split('\n')))  # Line count
        
        # 9. JD Length Features
        features.append(len(str(jd_text)))
        features.append(len(str(jd_text).split()))
        
        # 10. Formatting Quality Indicators
        features.append(str(resume_text).count('•') + str(resume_text).count('-'))  # Bullet points
        features.append(str(resume_text).count('\n\n'))  # Paragraph breaks
        
        # 11. Section Detection (binary indicators)
        resume_lower = str(resume_text).lower()
        sections = ['experience', 'education', 'skills', 'summary', 'projects']
        for section in sections:
            features.append(1.0 if section in resume_lower else 0.0)
        
        # 12. Contact Info Present
        import re
        has_email = 1.0 if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', str(resume_text)) else 0.0
        has_phone = 1.0 if re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', str(resume_text)) else 0.0
        features.append(has_email)
        features.append(has_phone)
        
        # 13. Readability Score (simple version)
        words = str(resume_text).split()
        if words:
            avg_word_length = np.mean([len(w) for w in words])
            features.append(avg_word_length)
        else:
            features.append(0.0)
        
        # 14. JD Keyword Density
        important_words = ['required', 'must', 'experience', 'skills', 'qualifications']
        jd_lower = str(jd_text).lower()
        keyword_density = sum(jd_lower.count(w) for w in important_words) / max(len(jd_lower.split()), 1)
        features.append(keyword_density)
        
        return np.array(features).reshape(1, -1)
    
    def get_feature_names(self) -> list:
        """Return feature names for interpretability."""
        return [
            'semantic_similarity',
            'keyword_overlap',
            'skills_match_ratio',
            'num_matching_skills',
            'total_resume_skills',
            'experience_match_ratio',
            'years_difference',
            'resume_char_count',
            'resume_word_count',
            'resume_line_count',
            'jd_char_count',
            'jd_word_count',
            'bullet_points',
            'paragraph_breaks',
            'has_experience_section',
            'has_education_section',
            'has_skills_section',
            'has_summary_section',
            'has_projects_section',
            'has_email',
            'has_phone',
            'avg_word_length',
            'jd_keyword_density'
        ]


def load_and_prepare_data(csv_path: str, task: str = 'regression') -> tuple:
    """
    Load CSV and prepare features and labels.
    
    Args:
        csv_path: Path to CSV file
        task: 'regression' for score prediction (0-100), 
              'classification' for binary (hire/reject)
    
    Returns:
        X, y, feature_names
    """
    logger.info(f"Loading data from {csv_path}")
    df = pd.read_csv(csv_path)
    
    logger.info(f"Loaded {len(df)} rows")
    logger.info(f"Columns: {df.columns.tolist()}")
    
    # Initialize feature engineer
    engineer = ResumeFeatureEngineer()
    
    # Extract features for each row
    feature_list = []
    labels = []
    
    logger.info("Extracting features...")
    for idx, row in tqdm(df.iterrows(), total=len(df)):
        try:
            features = engineer.extract_features(
                resume_text=str(row.get('resume_text', '')),
                jd_text=str(row.get('jd_text', '')),
                skills_resume=str(row.get('skills_resume', '')),
                skills_jd=str(row.get('skills_jd', '')),
                years_resume=float(row.get('years_exp_resume', 0)),
                years_jd=float(row.get('years_exp_jd', 0))
            )
            
            feature_list.append(features.flatten())
            
            # Get label
            label = row.get('label', row.get('score', 0))
            
            if task == 'classification':
                # Convert to binary (assuming label is 0-100 or 0-1)
                if label > 1:  # Assume 0-100 scale
                    label = 1 if label >= 60 else 0
                else:  # Already binary
                    label = int(label)
            else:  # regression
                if label <= 1:  # Convert 0-1 to 0-100
                    label = label * 100
                label = float(label)
            
            labels.append(label)
            
        except Exception as e:
            logger.error(f"Error processing row {idx}: {e}")
            continue
    
    if not feature_list:
        raise ValueError("No valid rows were processed from the dataset.")
    
    X = np.vstack(feature_list)
    y = np.array(labels)
    
    logger.info(f"Features shape: {X.shape}")
    logger.info(f"Labels shape: {y.shape}")
    logger.info(f"Label distribution: min={y.min():.2f}, max={y.max():.2f}, mean={y.mean():.2f}")
    
    return X, y, engineer.get_feature_names()


def train_model(
    X_train, X_test, y_train, y_test,
    task: str = 'regression',
    model_path: str = 'models/trained_model.joblib',
    scaler_path: str = 'models/feature_scaler.joblib',
    feature_names: Optional[List[str]] = None
):
    """
    Train XGBoost model with proper validation.
    """
    # Scale features
    logger.info("Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    if task == 'classification':
        logger.info("Training XGBoost Classifier...")
        model = XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='logloss'
        )
    else:  # regression
        logger.info("Training XGBoost Regressor...")
        model = XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='rmse'
        )
    
    # Fit model
    model.fit(
        X_train_scaled, y_train,
        eval_set=[(X_test_scaled, y_test)],
        verbose=False
    )
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    
    if task == 'classification':
        accuracy = accuracy_score(y_test, y_pred)
        logger.info(f"Test Accuracy: {accuracy:.4f}")
        logger.info("\nClassification Report:")
        logger.info(classification_report(y_test, y_pred))
    else:
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        logger.info(f"Test RMSE: {rmse:.4f}")
        logger.info(f"Test MAE: {mae:.4f}")
        logger.info(f"Test R²: {r2:.4f}")
        
        # Show sample predictions
        logger.info("\nSample predictions:")
        for i in range(min(5, len(y_test))):
            logger.info(f"  Actual: {y_test[i]:.2f}, Predicted: {y_pred[i]:.2f}")
    
    # Save model and scaler
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    logger.info(f"Model saved to {model_path}")
    logger.info(f"Scaler saved to {scaler_path}")
    
    # Feature importance
    if feature_names:
        feature_importance = pd.DataFrame({
            'feature': feature_names,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        logger.info("\nTop 10 Important Features:")
        logger.info(feature_importance.head(10).to_string())
    
    return model, scaler


if __name__ == "__main__":
    # Configuration
    DATA_PATH = "resume_jd_dataset_50k.csv"  # Your CSV file
    TASK = "regression"  # or "classification"
    MODEL_PATH = "models/xgb_model.joblib"
    SCALER_PATH = "models/feature_scaler.joblib"
    
    # Check if data exists
    if not os.path.exists(DATA_PATH):
        logger.error(f"Data file not found: {DATA_PATH}")
        logger.info("Please ensure your CSV has these columns:")
        logger.info("  - resume_text, jd_text, skills_resume, skills_jd")
        logger.info("  - years_exp_resume, years_exp_jd")
        logger.info("  - label (0-100 for scores, or 0/1 for hire/reject)")
        exit(1)
    
    # Load and prepare data
    X, y, feature_names = load_and_prepare_data(DATA_PATH, task=TASK)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=(y > 60) if TASK == 'regression' else y
    )
    
    logger.info(f"Training set: {len(X_train)} samples")
    logger.info(f"Test set: {len(X_test)} samples")
    
    # Train model
    model, scaler = train_model(
        X_train, X_test, y_train, y_test,
        task=TASK,
        model_path=MODEL_PATH,
        scaler_path=SCALER_PATH,
        feature_names=feature_names
    )
    
    logger.info("\nTraining complete!")
    logger.info(f"To use this model, update your backend to load:")
    logger.info(f"  - {MODEL_PATH}")
    logger.info(f"  - {SCALER_PATH}")

