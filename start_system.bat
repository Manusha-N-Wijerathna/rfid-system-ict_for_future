@echo off
setlocal EnableExtensions
cd /d "C:\AttendanceSystem"
title ICT Attendance System - Starting...
color 0A

echo ============================================
echo   ICT for Future - Attendance System
echo   Starting up...
echo ============================================
echo.

:: Check if already running
set BACKEND_RUNNING=0
tasklist /fi "imagename eq AttendanceServer.exe" | find /i "AttendanceServer.exe" >nul
if not errorlevel 1 (
    curl -fsS http://localhost:8000/ >nul 2>&1
    if not errorlevel 1 set BACKEND_RUNNING=1
)
if "!BACKEND_RUNNING!" == "1" (
    curl -fsS http://localhost:3000/ >nul 2>&1
    if not errorlevel 1 (
        echo System is already running!
        echo Opening dashboard...
        timeout /t 2 >nul
        start "" "http://localhost:3000"
        exit /b 0
    )
    echo Backend is already running; starting the frontend...
)

echo [1/3] Starting database server...
net start MSSQLSERVER >nul 2>&1
net start MSSQL$SQLEXPRESS >nul 2>&1
echo       Database ready.

echo.
echo [2/3] Starting backend API server...
if "!BACKEND_RUNNING!" == "1" goto backend_ready
if not exist "C:\AttendanceSystem\backend\AttendanceServer.exe" (
    echo ERROR: Backend executable is missing.
    pause
    exit /b 1
)
if not exist "C:\AttendanceSystem\logs" mkdir "C:\AttendanceSystem\logs"
cd /d "C:\AttendanceSystem\backend"
start /min "" cmd /c "AttendanceServer.exe >> C:\AttendanceSystem\logs\backend.log 2>&1"
echo       Waiting for backend to start...
timeout /t 5 >nul

:: Check backend started
curl -fsS http://localhost:8000/ >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Backend did not respond at http://localhost:8000
    echo        Check C:\AttendanceSystem\logs\backend.log
    pause
    exit /b 1
)
echo       Backend ready at http://localhost:8000
    :backend_ready
    if "!BACKEND_RUNNING!" == "1" echo       Backend already running at http://localhost:8000

echo.
echo [3/3] Starting frontend dashboard...
if not exist "C:\AttendanceSystem\frontend\package.json" (
    echo ERROR: Frontend package.json is missing.
    pause
    exit /b 1
)
cd /d "C:\AttendanceSystem\frontend"
start /min "" cmd /c "npm start >> C:\AttendanceSystem\logs\frontend.log 2>&1"
echo       Waiting for dashboard to start...
timeout /t 8 >nul
curl -fsS http://localhost:3000/ >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Frontend did not respond at http://localhost:3000
    echo        Check C:\AttendanceSystem\logs\frontend.log
    pause
    exit /b 1
)
echo       Dashboard ready at http://localhost:3000

echo.
echo ============================================
echo   System is running!
echo ============================================
echo.
echo   Dashboard : http://localhost:3000
echo   API       : http://localhost:8000
echo.
echo   Opening dashboard in browser...
timeout /t 2 >nul
start "" "http://localhost:3000"

echo.
echo   You can minimize this window.
echo   DO NOT close it while using the system.
echo.
pause
