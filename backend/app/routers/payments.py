from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import datetime
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/history/{student_id}")
def get_student_payment_history(student_id: int, db: Session = Depends(get_db)):
    """Returns full payment history for a specific student."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    payments = db.query(models.Payment).filter(
        models.Payment.student_id == student_id
    ).order_by(models.Payment.year.desc(), models.Payment.month.desc()).all()

    return {
        "student": {"id": student.id, "name": student.name, "grade": student.grade},
        "payments": [
            {
                "id":      p.id,
                "month":   p.month,
                "year":    p.year,
                "paid":    p.paid,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
            }
            for p in payments
        ],
        "total_paid":   sum(1 for p in payments if p.paid),
        "total_unpaid": sum(1 for p in payments if not p.paid),
    }


@router.get("/", response_model=list[schemas.PaymentOut])
def get_payments(month: int, year: int, db: Session = Depends(get_db)):
    students = db.query(models.Student).order_by(models.Student.name).all()
    fees     = {f.grade: f.fee_amount for f in db.query(models.GradeFee).all()}
    result   = []
    for s in students:
        payment = db.query(models.Payment).filter(
            models.Payment.student_id == s.id,
            models.Payment.month == month,
            models.Payment.year  == year,
        ).first()
        result.append(
            schemas.PaymentOut(
                id=payment.id if payment else 0,
                student_id=s.id,
                name=s.name,
                grade=s.grade,
                month=month,
                year=year,
                paid=payment.paid if payment else False,
                paid_at=payment.paid_at if payment else None,
                fee_amount=fees.get(s.grade),
            )
        )
    return result


@router.post("/mark")
def mark_paid(data: schemas.MarkPaymentIn, db: Session = Depends(get_db)):
    payment = db.query(models.Payment).filter(
        models.Payment.student_id == data.student_id,
        models.Payment.month == data.month,
        models.Payment.year  == data.year,
    ).first()
    if payment:
        payment.paid    = True
        payment.paid_at = datetime.now()
    else:
        payment = models.Payment(
            student_id=data.student_id,
            month=data.month,
            year=data.year,
            paid=True,
            paid_at=datetime.now(),
        )
        db.add(payment)
    db.commit()
    db.refresh(payment)
    return {"message": "Marked as paid"}


@router.post("/unmark")
def unmark_paid(data: schemas.MarkPaymentIn, db: Session = Depends(get_db)):
    payment = db.query(models.Payment).filter(
        models.Payment.student_id == data.student_id,
        models.Payment.month == data.month,
        models.Payment.year  == data.year,
    ).first()
    if payment:
        payment.paid    = False
        payment.paid_at = None
        db.commit()
    return {"message": "Marked as unpaid"}