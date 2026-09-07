from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, Base, test_connection
from app.routers import students, attendance, payments, admin

app = FastAPI(title="RFID School API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(payments.router)
app.include_router(admin.router)



@app.on_event("startup")
def startup():
    if test_connection():
        Base.metadata.create_all(bind=engine)
        with engine.begin() as conn:
            has_rfid_column = conn.execute(text("""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'admins' AND COLUMN_NAME = 'rfid_uid'
            """)).scalar()
            if not has_rfid_column:
                conn.execute(text("ALTER TABLE admins ADD rfid_uid VARCHAR(50) NULL"))
        print("[OK] Tables ready!")
    else:
        print("[ERROR] Could not connect to database - check your .env")


@app.get("/")
def root():
    return {"message": "RFID School API is running"}