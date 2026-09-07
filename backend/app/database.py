from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import urllib
import os
import sys

# When running as a PyInstaller exe, sys.executable points to the .exe file.
# We need to load .env from the same directory as the exe, not from the
# PyInstaller temp extraction directory (sys._MEIPASS).
if getattr(sys, 'frozen', False):
    _base_dir = os.path.dirname(sys.executable)
else:
    _base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_env_path = os.path.join(_base_dir, '.env')
print(f"[INFO] Loading config from: {_env_path}")
load_dotenv(_env_path)

DB_SERVER = os.getenv("DB_SERVER", "localhost")
DB_NAME   = os.getenv("DB_NAME", "rfid_school")

params = urllib.parse.quote_plus(
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={DB_SERVER};"
    f"DATABASE={DB_NAME};"
    f"Trusted_Connection=yes;"
    f"TrustServerCertificate=yes;"
)

CONN_STR = f"mssql+pyodbc:///?odbc_connect={params}"

engine = create_engine(CONN_STR, fast_executemany=True, echo=True)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("[OK] Database connected successfully!")
        return True
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        return False