# train_xgb_pipeline.py
import os, joblib, pandas as pd, numpy as np
from tqdm import tqdm
from sentence_transformers import SentenceTransformer, util
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score
from xgboost import XGBClassifier

HERE = os.path.dirname(__file__)
DATA_PATH = os.path.join(HERE, "resume_jd_dataset_50k.csv")   # <- your 50k CSV
MODEL_OUT = os.path.join(HERE, "models", "xgb_calibrated.joblib")
SCALER_OUT = os.path.join(HERE, "models", "feature_scaler.joblib")

EMB_NAME = "all-MiniLM-L6-v2"

# --- Feature helpers (same ideas used in scorer_sentbert.py) ---
def _skills_set(skills: str):
    return set(s.strip().lower() for s in str(skills).split(",") if s.strip())

def compute_row_features(resume, jd, skills_resume, skills_jd, years_resume, years_jd, embedder):
    # semantic similarity
    emb_r = embedder.encode(str(resume), convert_to_tensor=True)
    emb_j = embedder.encode(str(jd), convert_to_tensor=True)
    sim = float(util.cos_sim(emb_r, emb_j).cpu().numpy().squeeze())

    sr = _skills_set(skills_resume)
    sj = _skills_set(skills_jd)
    overlap = len(sr & sj)
    coverage = overlap / max(len(sj), 1)

    years_diff = abs(float(years_resume) - float(years_jd))

    # simple formatting heuristics
    resume_len = len(str(resume))
    jd_len = len(str(jd))
    bullets = str(resume).count("\n-") + str(resume).count("\n•")
    headers = sum([1 for h in ["summary","experience","education","skills","projects","achievements"] if h in str(resume).lower()])

    return [sim, overlap, coverage, years_diff, resume_len, jd_len, bullets, headers]

# --- Load data ---
print("Loading CSV:", DATA_PATH)
df = pd.read_csv(DATA_PATH)
print("Rows:", len(df))

# embedder (downloads once)
print("Loading SBERT model:", EMB_NAME)
embedder = SentenceTransformer(EMB_NAME)

# build feature matrix
feats = []
ys = []
print("Computing features...")
for _, row in tqdm(df.iterrows(), total=len(df)):
    f = compute_row_features(
        resume = row.get("resume_text",""),
        jd = row.get("jd_text",""),
        skills_resume = row.get("skills_resume",""),
        skills_jd = row.get("skills_jd",""),
        years_resume = row.get("years_exp_resume",0),
        years_jd = row.get("years_exp_jd",0),
        embedder = embedder
    )
    feats.append(f)
    ys.append(int(row.get("label",0)))

X = np.array(feats)
y = np.array(ys)

# split for quick evaluation (we train on full X with calibration after validation)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.10, random_state=42, stratify=y)

# standardize numeric features
scaler = StandardScaler()
Xs_train = scaler.fit_transform(X_train)
Xs_test = scaler.transform(X_test)

# XGBoost base model
print("Training XGBoost...")
xgb = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    use_label_encoder=False,
    eval_metric="logloss",
    random_state=42,
    n_jobs=8
)

# Calibrated classifier (isotonic for large data; use method='sigmoid' if issues)
calibrator = CalibratedClassifierCV(estimator=xgb, cv=5, method="isotonic")
calibrator.fit(Xs_train, y_train)

# evaluate
probs_test = calibrator.predict_proba(Xs_test)[:,1]
preds_test = (probs_test >= 0.5).astype(int)
print("ROC AUC:", roc_auc_score(y_test, probs_test))
print("Accuracy:", accuracy_score(y_test, preds_test))
print("Precision:", precision_score(y_test, preds_test))

# Save scaler + calibrated model
os.makedirs(os.path.join(HERE,"models"), exist_ok=True)
joblib.dump(calibrator, MODEL_OUT)
joblib.dump(scaler, SCALER_OUT)
print("Saved calibrated model ->", MODEL_OUT)
print("Saved scaler ->", SCALER_OUT)

