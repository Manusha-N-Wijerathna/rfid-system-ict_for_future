from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class AdminLoginIn(BaseModel):
    username: str
    password: str

class AdminProfileOut(BaseModel):
    id:              int
    full_name:       str
    username:        str
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True

class AdminProfileUpdate(BaseModel):
    full_name:       Optional[str] = None
    username:        Optional[str] = None
    password:        Optional[str] = None
    profile_picture: Optional[str] = None



class StudentCreate(BaseModel):
    name:        str
    grade:       str
    rfid_uid:    Optional[str]  = None
    phone:       Optional[str]  = None
    parent_name: Optional[str]  = None
    address:     Optional[str]  = None
    dob:         Optional[date] = None

class StudentUpdate(BaseModel):
    name:        Optional[str]  = None
    grade:       Optional[str]  = None
    phone:       Optional[str]  = None
    parent_name: Optional[str]  = None
    address:     Optional[str]  = None
    dob:         Optional[date] = None

class StudentOut(BaseModel):
    id:          int
    name:        str
    grade:       str
    rfid_uid:    Optional[str]  = None
    phone:       Optional[str]  = None
    parent_name: Optional[str]  = None
    address:     Optional[str]  = None
    dob:         Optional[date] = None

    class Config:
        from_attributes = True


class GradeFeeOut(BaseModel):
    id:         int
    grade:      str
    fee_amount: Decimal

    class Config:
        from_attributes = True

class GradeFeeUpdate(BaseModel):
    fee_amount: Decimal


class AttendanceOut(BaseModel):
    id:           int
    student_id:   int
    student_name: str
    grade:        str
    rfid_uid:     Optional[str] = None
    time:         str

    class Config:
        from_attributes = True


class PaymentOut(BaseModel):
    id:         int
    student_id: int
    name:       str
    grade:      str
    month:      int
    year:       int
    paid:       bool
    paid_at:    Optional[datetime] = None
    fee_amount: Optional[Decimal]  = None

    class Config:
        from_attributes = True

class MarkPaymentIn(BaseModel):
    student_id: int
    month:      int
    year:       int


class RFIDScanIn(BaseModel):
    rfid_uid: str

class AssignRFIDIn(BaseModel):
    rfid_uid: str