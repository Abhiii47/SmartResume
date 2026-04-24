import pytest
from unittest.mock import patch, MagicMock
import sys

# We need to mock these before any imports from backend.database
# To avoid poisoning other tests, we'll do it carefully
@pytest.fixture(scope="module", autouse=True)
def mock_env_dependencies():
    """Fixture to mock missing environment dependencies for this test module."""
    mocks = {
        "sqlalchemy": MagicMock(),
        "sqlalchemy.ext.declarative": MagicMock(),
        "sqlalchemy.orm": MagicMock(),
        "config": MagicMock()
    }
    with patch.dict(sys.modules, mocks):
        yield

    # Clean up to prevent side effects on other test modules
    for mod in list(sys.modules.keys()):
        if mod.startswith("backend.database"):
            del sys.modules[mod]

def test_init_db():
    """Test that init_db calls Base.metadata.create_all with the correct engine"""
    # Import inside the test to ensure it uses the mocks from the fixture
    from backend.database import init_db, engine, Base

    with patch.object(Base.metadata, 'create_all') as mock_create_all:
        init_db()
        mock_create_all.assert_called_once_with(bind=engine)

def test_get_db():
    """Test that get_db yields a session and closes it"""
    from backend.database import get_db

    mock_session = MagicMock()
    with patch("backend.database.SessionLocal", return_value=mock_session) as mock_session_local:
        db_generator = get_db()
        db = next(db_generator)

        assert db == mock_session
        mock_session_local.assert_called_once()

        with pytest.raises(StopIteration):
            next(db_generator)

        mock_session.close.assert_called_once()

def test_init_db_exception():
    """Test that init_db handles exceptions during creation"""
    from backend.database import init_db, Base

    with patch.object(Base.metadata, 'create_all') as mock_create_all:
        mock_create_all.side_effect = Exception("Test Error")
        # Should not raise exception because it's caught and printed in backend/database.py
        init_db()
        mock_create_all.assert_called_once()
