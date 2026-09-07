from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/attendance", tags=["Attendance"])

_register_mode = {
    "active":      False,
    "scanned_uid": None,
    "scanned_at":  None,
}


# ── Register mode ──────────────────────────────────────────
@router.post("/register-mode/start")
def start_register_mode():
    _register_mode["active"]      = True
    _register_mode["scanned_uid"] = None
    _register_mode["scanned_at"]  = None
    return {"message": "Register mode activated"}


@router.post("/register-mode/stop")
def stop_register_mode():
    _register_mode["active"]      = False
    _register_mode["scanned_uid"] = None
    _register_mode["scanned_at"]  = None
    return {"message": "Register mode deactivated"}


@router.get("/register-mode/result")
def get_register_mode_result():
    return {
        "active":      _register_mode["active"],
        "scanned_uid": _register_mode["scanned_uid"],
        "scanned_at":  _register_mode["scanned_at"],
    }


# ── RFID scan (ESP32) ──────────────────────────────────────
@router.post("/scan")
def rfid_scan(data: schemas.RFIDScanIn, db: Session = Depends(get_db)):
    admin = db.query(models.Admin).filter(
        models.Admin.rfid_uid == data.rfid_uid.strip().upper()
    ).first()
    if admin:
        from app.routers.admin import login_rfid
        login_rfid(schemas.AdminRfidLoginIn(rfid_uid=data.rfid_uid), db)
        return {"message": "Admin RFID login ready", "admin": admin.full_name}

    if _register_mode["active"]:
        _register_mode["scanned_uid"] = data.rfid_uid
        _register_mode["scanned_at"]  = datetime.now().isoformat()
        _register_mode["active"]      = False
        return {"message": "UID captured for registration", "rfid_uid": data.rfid_uid}

    student = db.query(models.Student).filter(
        models.Student.rfid_uid == data.rfid_uid
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Unknown RFID tag")

    today_start = datetime.combine(date.today(), datetime.min.time())
    already = db.query(models.Attendance).filter(
        models.Attendance.student_id == student.id,
        models.Attendance.scanned_at >= today_start,
    ).first()
    if already:
        return {"message": "Already marked today", "student": student.name}

    record = models.Attendance(student_id=student.id)
    db.add(record)
    db.commit()
    return {"message": "Attendance marked", "student": student.name}


# ── Manual attendance mark ─────────────────────────────────
@router.post("/manual")
def manual_mark(student_id: int, date_str: str = None, db: Session = Depends(get_db)):
    """Manually mark a student present for a given date (defaults to today)."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    try:
        target = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else date.today()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    day_start = datetime.combine(target, datetime.min.time())
    day_end   = datetime.combine(target, datetime.max.time())

    already = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.scanned_at.between(day_start, day_end),
    ).first()
    if already:
        return {"message": "Already marked for this date", "student": student.name}

    record = models.Attendance(
        student_id=student_id,
        scanned_at=datetime.combine(target, datetime.now().time()),
    )
    db.add(record)
    db.commit()
    return {"message": "Attendance marked manually", "student": student.name}


# ── Manual attendance unmark ───────────────────────────────
@router.delete("/manual")
def manual_unmark(student_id: int, date_str: str = None, db: Session = Depends(get_db)):
    """Remove attendance record for a student on a given date."""
    try:
        target = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else date.today()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    day_start = datetime.combine(target, datetime.min.time())
    day_end   = datetime.combine(target, datetime.max.time())

    record = db.query(models.Attendance).filter(
        models.Attendance.student_id == student_id,
        models.Attendance.scanned_at.between(day_start, day_end),
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="No attendance record found")

    db.delete(record)
    db.commit()
    return {"message": "Attendance removed"}


@router.delete("/record/{attendance_id}")
def remove_attendance_record(attendance_id: int, db: Session = Depends(get_db)):
    """Remove one exact attendance record, including an accidental RFID scan."""
    record = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(record)
    db.commit()
    return {"message": "Attendance removed"}


# ── Live feed ──────────────────────────────────────────────
def _current_payment_status(db: Session, records):
    student_ids = {record.student_id for record in records}
    if not student_ids:
        return {}

    payments = db.query(models.Payment).filter(
        models.Payment.student_id.in_(student_ids),
        models.Payment.month == date.today().month,
        models.Payment.year == date.today().year,
    ).all()
    return {payment.student_id: payment.paid for payment in payments}


@router.get("/live", response_model=list[schemas.AttendanceOut])
def live_attendance(db: Session = Depends(get_db)):
    today_start = datetime.combine(date.today(), datetime.min.time())
    records = db.query(models.Attendance).filter(
        models.Attendance.scanned_at >= today_start
    ).order_by(models.Attendance.scanned_at.desc()).all()
    payment_status = _current_payment_status(db, records)
    return [
        schemas.AttendanceOut(
            id=r.id,
            student_id=r.student_id,
            student_name=r.student.name,
            grade=r.student.grade,
            rfid_uid=r.student.rfid_uid,
            time=r.scanned_at.strftime("%I:%M %p"),
            payment_paid=payment_status.get(r.student_id, False),
        )
        for r in records
    ]


# ── Attendance by date ─────────────────────────────────────
@router.get("/", response_model=list[schemas.AttendanceOut])
def get_attendance_by_date(date_str: str = None, db: Session = Depends(get_db)):
    try:
        target = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else date.today()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    start = datetime.combine(target, datetime.min.time())
    end   = datetime.combine(target, datetime.max.time())
    records = db.query(models.Attendance).filter(
        models.Attendance.scanned_at.between(start, end)
    ).order_by(models.Attendance.scanned_at.desc()).all()
    payment_status = _current_payment_status(db, records)
    return [
        schemas.AttendanceOut(
            id=r.id,
            student_id=r.student_id,
            student_name=r.student.name,
            grade=r.student.grade,
            rfid_uid=r.student.rfid_uid,
            time=r.scanned_at.strftime("%I:%M %p"),
            payment_paid=payment_status.get(r.student_id, False),
        )
        for r in records
    ]


# ── Monthly attendance report per student ─────────────────
@router.get("/report/monthly")
def monthly_report(month: int, year: int, db: Session = Depends(get_db)):
    """Returns attendance count per student for a given month."""
    students = db.query(models.Student).order_by(models.Student.name).all()
    result   = []
    for s in students:
        count = db.query(models.Attendance).filter(
            models.Attendance.student_id == s.id,
            db.query(models.Attendance).filter(
                models.Attendance.scanned_at >= datetime(year, month, 1),
                models.Attendance.scanned_at < datetime(year, month % 12 + 1, 1)
                if month < 12 else models.Attendance.scanned_at < datetime(year + 1, 1, 1),
            ).exists(),
        ).count()

        # Simpler direct count
        from sqlalchemy import extract
        count = db.query(models.Attendance).filter(
            models.Attendance.student_id == s.id,
            extract("month", models.Attendance.scanned_at) == month,
            extract("year",  models.Attendance.scanned_at) == year,
        ).count()

        result.append({
            "student_id":   s.id,
            "name":         s.name,
            "grade":        s.grade,
            "present_days": count,
        })
    return result


# ── Student attendance history ─────────────────────────────
@router.get("/history/{student_id}")
def student_history(student_id: int, month: int = None, year: int = None, db: Session = Depends(get_db)):
    """Returns all attendance records for a specific student."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    from sqlalchemy import extract
    query = db.query(models.Attendance).filter(models.Attendance.student_id == student_id)

    if month and year:
        query = query.filter(
            extract("month", models.Attendance.scanned_at) == month,
            extract("year",  models.Attendance.scanned_at) == year,
        )

    records = query.order_by(models.Attendance.scanned_at.desc()).all()
    return {
        "student":  {
            "id":          student.id,
            "name":        student.name,
            "grade":       student.grade,
            "phone":       student.phone,
            "parent_name": student.parent_name,
            "rfid_uid":    student.rfid_uid,
        },
        "records":  [{"id": r.id, "date": r.scanned_at.strftime("%Y-%m-%d"), "time": r.scanned_at.strftime("%I:%M %p")} for r in records],
        "total":    len(records),
    }