# ICT for Future — Attendance System
## Customer Setup Guide

**Version:** 1.0  
**Support:** Manusha Wijerathna  
**WhatsApp:** +94 XX XXX XXXX

---

## What's in the Box

- ✅ RFID reader device (ESP32 + MFRC-522 + LCD)
- ✅ USB power adapter
- ✅ Key fobs (one per student)
- ✅ USB installer drive
- ✅ This setup guide

---

## Requirements for Your PC

Before installation make sure your PC has:

- Windows 10 or 11
- SQL Server Express (free — download from microsoft.com)
- Node.js v18+ (free — download from nodejs.org)
- At least 4GB RAM
- WiFi connection

---

## Step 1 — Install SQL Server Express

1. Download **SQL Server Express** from microsoft.com/en-us/sql-server
2. Run the installer — choose **Basic** installation
3. Note the server name shown at the end (e.g. `DESKTOP-XXXXX\SQLEXPRESS`)
4. Write it here: ________________________

---

## Step 2 — Install Node.js

1. Download Node.js from nodejs.org — choose the **LTS** version
2. Run the installer with all default settings
3. Restart your PC after installation

---

## Step 3 — Edit the Config File

1. Open the USB drive
2. Open `config.env` in Notepad
3. Fill in your details:

```
DB_SERVER=DESKTOP-XXXXX\SQLEXPRESS    ← your server name from Step 1
CLASS_NAME=My Tuition Class            ← your class name
TEACHER_NAME=Mr. / Mrs. ...           ← your name
ADMIN_PASSWORD=yourpassword           ← choose a password
```

4. Set your grade fees
5. Save the file

---

## Step 4 — Run the Installer

1. Open the USB drive
2. Right-click `install.bat`
3. Select **Run as administrator**
4. Wait for installation to complete
5. You'll see "Installation Complete!" when done

---

## Step 5 — Connect the RFID Device

1. Plug the USB power adapter into the RFID device
2. Watch the LCD screen:
   - `ICT for Future` → `Initializing`
   - `Connecting WiFi` → your WiFi name
   - `WiFi Connected!` → your IP address
   - `Tap Key Tag` → **ready!**

⚠️ **Important:** The device must be on the same WiFi as your PC.

---

## Daily Use — Starting the System

1. Double-click **"Start Attendance System"** on your desktop
2. Wait 15 seconds
3. Browser opens automatically at http://localhost:3000
4. Login with your username and password

---

## Daily Use — Marking Attendance

Students simply **tap their key fob** on the reader:

| LCD Shows | Meaning |
|---|---|
| ✓ Student Name / Present! | Attendance marked ✅ |
| Already Marked! | Already scanned today |
| ✗ Unknown Tag | Tag not registered |

---

## How to Register a New Student

1. Go to **Students** page
2. Click **+ Register Student**
3. Fill in name, grade, phone, parent name
4. Click **Register Student**
5. Give the student their key fob
6. The RFID UID will be assigned when they first tap (or you can type it manually)

---

## How to Mark Payments

1. Go to **Payments** page
2. Select the month and year
3. After collecting cash — click **Mark as Paid** next to the student's name

---

## Stopping the System

1. Double-click **"Stop Attendance System"** on desktop
2. Or just shut down your PC normally

---

## Troubleshooting

**Dashboard won't open:**
- Double-click "Check Status" on desktop
- Make sure all 3 items show [OK]
- Try opening http://localhost:3000 manually

**ESP32 shows "WiFi Failed":**
- Check your WiFi name and password in the device firmware
- Make sure your PC and device are on the same WiFi

**Unknown Tag on LCD:**
- The student's key fob is not registered
- Go to Students page → Register the student → assign their UID

**Student name not showing on LCD:**
- Check the RFID UID matches what's registered in the system
- Open Students page and verify the UID

---

## Support

For any issues contact:

**Manusha Wijerathna**  
📱 WhatsApp: +94 XX XXX XXXX  
📧 Email: your@email.com  
⏰ Support hours: 8am – 8pm daily

---

*ICT for Future Attendance System v1.0*  
*All rights reserved © 2026 Manusha Wijerathna*
