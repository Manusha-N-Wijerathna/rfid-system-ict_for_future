@echo off
setlocal EnableExtensions
title ICT Attendance System - Stopping
color 0C

echo ============================================
echo   ICT for Future - Attendance System
echo   Stopping...
echo ============================================
echo.

echo [1/2] Stopping backend server...
taskkill /f /im AttendanceServer.exe >nul 2>&1
echo       Backend stopped.

echo.
echo [2/2] Stopping frontend server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":3000[ ]" ^| findstr /c:"LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo       Frontend stopped.

echo.
echo ============================================
echo   System stopped successfully.
echo ============================================
echo.
pause
