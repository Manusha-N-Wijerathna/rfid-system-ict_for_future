@echo off
setlocal EnableExtensions EnableDelayedExpansion
title ICT Attendance System - Pre-Installation Check
color 0E

echo ============================================
echo   ICT for Future - Pre-Installation Check
echo   Run this BEFORE installing on customer PC
echo ============================================
echo.

set PASS=0
set FAIL=0

:: Check Windows version
echo Checking Windows version...
ver | find "10." >nul
if %errorLevel% == 0 (
    echo   [OK] Windows 10 detected
    set /a PASS+=1
) else (
    ver | find "11." >nul
    if %errorLevel% == 0 (
        echo   [OK] Windows 11 detected
        set /a PASS+=1
    ) else (
        echo   [!!] Windows version may not be supported
        set /a FAIL+=1
    )
)

:: Check Node.js
echo.
echo Checking Node.js...
node --version >nul 2>&1
if %errorLevel% == 0 (
    for /f %%v in ('node --version') do echo   [OK] Node.js %%v installed
    set /a PASS+=1
) else (
    echo   [!!] Node.js NOT installed
    echo        Download from: nodejs.org
    set /a FAIL+=1
)

:: Check npm
echo.
echo Checking npm...
npm --version >nul 2>&1
if %errorLevel% == 0 (
    for /f %%v in ('npm --version') do echo   [OK] npm %%v installed
    set /a PASS+=1
) else (
    echo   [!!] npm NOT found
    set /a FAIL+=1
)

:: Check SQL Server
echo.
echo Checking SQL Server...
sc query MSSQL$SQLEXPRESS >nul 2>&1
if %errorLevel% == 0 (
    echo   [OK] SQL Server Express found
    set /a PASS+=1
) else (
    sc query MSSQLSERVER >nul 2>&1
    if %errorLevel% == 0 (
        echo   [OK] SQL Server found
        set /a PASS+=1
    ) else (
        echo   [!!] SQL Server NOT installed
        echo        Download from: microsoft.com/sql-server
        set /a FAIL+=1
    )
)

:: Check RAM
echo.
echo Checking RAM...
for /f %%p in ('powershell -NoProfile -Command "[math]::Floor((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)"') do set RAM=%%p
if defined RAM (
    if !RAM! geq 4 (
        echo   [OK] !RAM!GB RAM available
        set /a PASS+=1
    ) else (
        echo   [!!] Only !RAM!GB RAM - minimum 4GB required
        set /a FAIL+=1
    )
) else (
    echo   [!!] Could not determine installed RAM
    set /a FAIL+=1
)
:ramDone

:: Check disk space
echo.
echo Checking disk space...
for /f %%a in ('powershell -NoProfile -Command "[math]::Floor((Get-PSDrive -Name C).Free / 1GB)"') do set FREE=%%a
if defined FREE (
    if !FREE! geq 2 (
        echo   [OK] !FREE!GB free space on C:
        set /a PASS+=1
    ) else (
        echo   [!!] Low disk space - only !FREE!GB free
        set /a FAIL+=1
    )
) else (
    echo   [!!] Could not determine free disk space
    set /a FAIL+=1
)
:diskDone

:: Check WiFi
echo.
echo Checking WiFi connection...
ping 8.8.8.8 -n 1 -w 1000 >nul 2>&1
if %errorLevel% == 0 (
    echo   [OK] Internet/network connected
    set /a PASS+=1
) else (
    echo   [!!] No network connection detected
    set /a FAIL+=1
)

:: Print IP
echo.
echo Your PC IP address:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4"') do (
    set IP=%%a
    setlocal enabledelayedexpansion
    set IP=!IP: =!
    echo   !IP!
    endlocal
)

echo.
echo ============================================
echo   Results: %PASS% passed, %FAIL% failed
echo ============================================
if %FAIL% == 0 (
    echo   System is READY for installation!
) else (
    echo   Please fix the issues above before installing.
)
echo.
pause
