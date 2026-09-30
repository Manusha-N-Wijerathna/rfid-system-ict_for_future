@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "APP_ROOT=%~dp0"
cd /d "%APP_ROOT%"
title ICT Attendance System - Starting...
color 0A

echo ============================================
echo   ICT for Future - Attendance System
echo   Starting up...
echo ============================================
echo.

:: Check if already running
set BACKEND_RUNNING=0
tasklist /fi "imagename eq AttendanceServer.exe" 2>nul | find /i "AttendanceServer.exe" >nul
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

if not exist "%APP_ROOT%logs" mkdir "%APP_ROOT%logs"
cd /d "%APP_ROOT%backend"

if exist "%APP_ROOT%backend\AttendanceServer.exe" (
    start /min "" cmd /c ^""%APP_ROOT%backend\AttendanceServer.exe" >> "%APP_ROOT%logs\backend.log" 2>&1^"
) else if exist "%APP_ROOT%backend\dist\AttendanceServer.exe" (
    start /min "" cmd /c ^""%APP_ROOT%backend\dist\AttendanceServer.exe" >> "%APP_ROOT%logs\backend.log" 2>&1^"
) else (
    start /min "" cmd /c ^"python run_server.py >> "%APP_ROOT%logs\backend.log" 2>&1^"
)

echo       Waiting for backend to start...
for /l %%i in (1,1,10) do (
    timeout /t 1 >nul
    curl -fsS http://localhost:8000/ >nul 2>&1
    if not errorlevel 1 goto backend_ok
)

echo ERROR: Backend did not respond at http://localhost:8000
echo        Check %APP_ROOT%logs\backend.log
pause
exit /b 1

:backend_ok
echo       Backend ready at http://localhost:8000

:backend_ready
if "!BACKEND_RUNNING!" == "1" echo       Backend already running at http://localhost:8000

echo.
echo [3/3] Starting frontend dashboard...
if not exist "%APP_ROOT%frontend\package.json" (
    echo ERROR: Frontend package.json is missing.
    pause
    exit /b 1
)

cd /d "%APP_ROOT%frontend"
if exist "%APP_ROOT%frontend\.next" (
    start /min "" cmd /c ^"cd /d "%APP_ROOT%frontend" ^&^& npm start >> "%APP_ROOT%logs\frontend.log" 2>&1^"
) else (
    start /min "" cmd /c ^"cd /d "%APP_ROOT%frontend" ^&^& npm run dev >> "%APP_ROOT%logs\frontend.log" 2>&1^"
)

echo       Waiting for dashboard to start...
for /l %%i in (1,1,15) do (
    timeout /t 1 >nul
    curl -fsS http://localhost:3000/ >nul 2>&1
    if not errorlevel 1 goto frontend_ok
)

echo ERROR: Frontend did not respond at http://localhost:3000
echo        Check %APP_ROOT%logs\frontend.log
pause
exit /b 1

:frontend_ok
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
echo   To stop the system, double-click "Stop Attendance System".
echo.
pause
