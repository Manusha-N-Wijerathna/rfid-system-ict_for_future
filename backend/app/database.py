from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import urllib
import os

load_dotenv()

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
        print("✅ Database connected successfully!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False