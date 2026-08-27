from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/fees/all", response_model=list[schemas.GradeFeeOut])
def get_all_fees(db: Session = Depends(get_db)):
    return db.query(models.GradeFee).order_by(models.GradeFee.grade).all()


@router.patch("/fees/{grade_fee_id}", response_model=schemas.GradeFeeOut)
def update_fee(grade_fee_id: int, data: schemas.GradeFeeUpdate, db: Session = Depends(get_db)):
    fee = db.query(models.GradeFee).filter(models.GradeFee.id == grade_fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Grade fee not found")
    fee.fee_amount = data.fee_amount
    db.commit()
    db.refresh(fee)
    return fee


@router.get("/", response_model=list[schemas.StudentOut])
def get_all_students(db: Session = Depends(get_db)):
    return db.query(models.Student).order_by(models.Student.name).all()


@router.get("/{student_id}", response_model=schemas.StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    s = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    return s


@router.post("/", response_model=schemas.StudentOut)
def add_student(data: schemas.StudentCreate, db: Session = Depends(get_db)):
    if data.rfid_uid:
        dup = db.query(models.Student).filter(
            models.Student.rfid_uid == data.rfid_uid.strip().upper()
        ).first()
        if dup:
            raise HTTPException(status_code=400, detail="RFID UID already registered")
    student = models.Student(
        name=data.name.strip(),
        grade=data.grade,
        rfid_uid=data.rfid_uid.strip().upper() if data.rfid_uid else None,
        phone=data.phone,
        parent_name=data.parent_name,
        address=data.address,
        dob=data.dob,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.patch("/{student_id}", response_model=schemas.StudentOut)
def update_student(student_id: int, data: schemas.StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for field, value in data.dict(exclude_unset=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student


@router.patch("/{student_id}/assign-rfid", response_model=schemas.StudentOut)
def assign_rfid(student_id: int, data: schemas.AssignRFIDIn, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    existing = db.query(models.Student).filter(
        models.Student.rfid_uid == data.rfid_uid.strip().upper(),
        models.Student.id != student_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"RFID UID already assigned to {existing.name}")
    student.rfid_uid = data.rfid_uid.strip().upper()
    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.query(models.Attendance).filter(models.Attendance.student_id == student_id).delete()
    db.query(models.Payment).filter(models.Payment.student_id == student_id).delete()
    db.delete(student)
    db.commit()
    return JSONResponse(status_code=200, content={"message": "Student removed"})