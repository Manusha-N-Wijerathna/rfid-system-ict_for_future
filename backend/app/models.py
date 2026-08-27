from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Admin(Base):
    __tablename__ = "admins"

    id              = Column(Integer,     primary_key=True, index=True)
    full_name       = Column(String(100), nullable=False)
    username        = Column(String(50),  unique=True, nullable=False)
    password_hash   = Column(String(255), nullable=False)
    profile_picture = Column(Text,        nullable=True)



class Student(Base):
    __tablename__ = "students"

    id           = Column(Integer,      primary_key=True, index=True)
    name         = Column(String(100),  nullable=False)
    grade        = Column(String(20),   nullable=False)
    rfid_uid     = Column(String(50),   unique=True, nullable=True)
    phone        = Column(String(20),   nullable=True)
    parent_name  = Column(String(100),  nullable=True)
    address      = Column(String(255),  nullable=True)
    dob          = Column(Date,         nullable=True)

    attendance = relationship("Attendance", back_populates="student")
    payments   = relationship("Payment",    back_populates="student")


class GradeFee(Base):
    __tablename__ = "grade_fees"

    id         = Column(Integer,       primary_key=True, index=True)
    grade      = Column(String(20),    nullable=False, unique=True)
    fee_amount = Column(Numeric(10,2), nullable=False, default=0)


class Attendance(Base):
    __tablename__ = "attendance"

    id         = Column(Integer,  primary_key=True, index=True)
    student_id = Column(Integer,  ForeignKey("students.id"), nullable=False)
    scanned_at = Column(DateTime, server_default=func.now())

    student = relationship("Student", back_populates="attendance")


class Payment(Base):
    __tablename__ = "payments"

    id         = Column(Integer,  primary_key=True, index=True)
    student_id = Column(Integer,  ForeignKey("students.id"), nullable=False)
    month      = Column(Integer,  nullable=False)
    year       = Column(Integer,  nullable=False)
    paid       = Column(Boolean,  default=False)
    paid_at    = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="payments")