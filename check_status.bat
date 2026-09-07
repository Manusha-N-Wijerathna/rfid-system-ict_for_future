@echo off
setlocal EnableExtensions
title ICT Attendance System - Status Check
color 0B

echo ============================================
echo   ICT for Future - System Status Check
echo ============================================
echo.

:: Check SQL Server
echo Checking SQL Server...
sc query MSSQL$SQLEXPRESS | find "RUNNING" >nul 2>&1
if %errorLevel% == 0 (
    echo   [OK] SQL Server is running
) else (
    sc query MSSQLSERVER | find "RUNNING" >nul 2>&1
    if %errorLevel% == 0 (
        echo   [OK] SQL Server is running
    ) else (
        echo   [!!] SQL Server is NOT running
    )
)

:: Check Backend
echo.
echo Checking backend API...
curl -fsS http://localhost:8000/ >nul 2>&1
if %errorLevel% == 0 (
    echo   [OK] Backend is running at http://localhost:8000
) else (
    echo   [!!] Backend is NOT running
)

:: Check Frontend
echo.
echo Checking frontend...
netstat -aon | findstr /r /c:":3000[ ]" | findstr /c:"LISTENING" >nul
if %errorLevel% == 0 (
    echo   [OK] Frontend is running at http://localhost:3000
) else (
    echo   [!!] Frontend is NOT running
)

:: Check WiFi IP
echo.
echo Your PC IP address (for ESP32 firmware):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4"') do (
    set IP=%%a
    setlocal enabledelayedexpansion
    set IP=!IP: =!
    echo   !IP!
    endlocal
)

echo.
echo ============================================
pause
