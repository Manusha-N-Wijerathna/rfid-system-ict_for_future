@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title ICT Attendance System - Installer
color 0A

echo ============================================
echo   ICT for Future - Attendance System
echo   Installer v1.0
echo   Developed by Manusha Wijerathna
echo ============================================
echo.

:: Check admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Please run this installer as Administrator.
    echo Right-click install.bat and select "Run as administrator"
    pause
    exit /b 1
)

echo [1/6] Creating system folders...
mkdir "C:\AttendanceSystem" 2>nul
mkdir "C:\AttendanceSystem\backend" 2>nul
mkdir "C:\AttendanceSystem\frontend" 2>nul
mkdir "C:\AttendanceSystem\logs" 2>nul
mkdir "C:\AttendanceSystem\data" 2>nul
echo       Done.

echo.
echo [2/6] Copying backend files...
xcopy /E /I /Y "backend\*" "C:\AttendanceSystem\backend\" >nul
if not exist "C:\AttendanceSystem\backend\dist\AttendanceServer.exe" (
    echo ERROR: Backend executable was not found in backend\dist.
    pause
    exit /b 1
)
copy /Y "backend\dist\AttendanceServer.exe" "C:\AttendanceSystem\backend\AttendanceServer.exe" >nul
echo       Done.

echo.
echo [3/6] Copying frontend files...
xcopy /E /I /Y "frontend\*" "C:\AttendanceSystem\frontend\" >nul
if not exist "C:\AttendanceSystem\frontend\package.json" (
    echo ERROR: Frontend files were not copied.
    pause
    exit /b 1
)
echo       Done.

echo.
echo [4/6] Copying startup scripts...
copy /Y "start_system.bat"   "C:\AttendanceSystem\start_system.bat" >nul
copy /Y "stop_system.bat"    "C:\AttendanceSystem\stop_system.bat" >nul
copy /Y "check_status.bat"   "C:\AttendanceSystem\check_status.bat" >nul
copy /Y "preinstall_check.bat" "C:\AttendanceSystem\preinstall_check.bat" >nul
copy /Y "config.env" "C:\AttendanceSystem\backend\.env" >nul
echo       Done.

echo.
echo [5/6] Creating desktop shortcuts...
set SCRIPT="%TEMP%\CreateShortcuts.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Start Attendance System.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "C:\AttendanceSystem\start_system.bat" >> %SCRIPT%
echo oLink.Description = "Start ICT Attendance System" >> %SCRIPT%
echo oLink.WorkingDirectory = "C:\AttendanceSystem" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%
echo       Done.

echo.
echo [6/6] Running first-time database setup...

:: Read DB_SERVER and DB_NAME from the .env we just copied
for /f "tokens=1,* delims==" %%A in ('findstr /b "DB_SERVER" "C:\AttendanceSystem\backend\.env"') do set "DB_SVR=%%B"
for /f "tokens=1,* delims==" %%A in ('findstr /b "DB_NAME" "C:\AttendanceSystem\backend\.env"') do set "DB_NM=%%B"

:: Check if ODBC Driver 17 is installed
reg query "HKLM\SOFTWARE\ODBC\ODBCINST.INI\ODBC Driver 17 for SQL Server" >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: "ODBC Driver 17 for SQL Server" is not installed.
    echo Please download and install it from:
    echo https://go.microsoft.com/fwlink/?linkid=2187214
    pause
    exit /b 1
)

:: Create the database if it doesn't exist
echo       Creating database [%DB_NM%] on [%DB_SVR%]...
sqlcmd -S "%DB_SVR%" -E -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'%DB_NM%') CREATE DATABASE [%DB_NM%];" 2>nul
if %errorLevel% neq 0 (
    echo WARNING: Could not auto-create database via sqlcmd.
    echo          Make sure SQL Server is running and the database "%DB_NM%" exists.
    echo          You can create it manually in SSMS if needed.
)

:: Run the exe to create tables
cd /d "C:\AttendanceSystem\backend"
AttendanceServer.exe --setup-only
if %errorLevel% neq 0 (
    echo ERROR: Database setup failed.
    echo        1. Make sure SQL Server is running
    echo        2. Verify DB_SERVER in C:\AttendanceSystem\backend\.env
    echo           Current value: %DB_SVR%
    echo        3. Make sure database "%DB_NM%" exists in SQL Server
    echo        4. Check that ODBC Driver 17 for SQL Server is installed
    pause
    exit /b 1
)
echo       Done.

echo.
echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo   System installed at: C:\AttendanceSystem
echo   Desktop shortcut created.
echo.
echo   NEXT STEPS:
echo   1. Double-click "Start Attendance System"
echo      shortcut on your desktop
echo   2. Wait 10 seconds for system to start
echo   3. Open http://localhost:3000
echo   4. Login with your credentials
echo.
pause
