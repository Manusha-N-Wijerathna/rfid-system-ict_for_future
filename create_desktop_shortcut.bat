@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ============================================
echo   Creating Desktop Shortcuts...
echo ============================================
echo.

set VBS_SCRIPT="%TEMP%\create_ict_shortcuts.vbs"
(
echo Set oWS = WScript.CreateObject("WScript.Shell"^)
echo Set fso = WScript.CreateObject("Scripting.FileSystemObject"^)
echo sDesktop = oWS.SpecialFolders("Desktop"^)
echo Set oLink = oWS.CreateShortcut(sDesktop ^& "\ICT Attendance System.lnk"^)
echo oLink.TargetPath = "%SCRIPT_DIR%start_system.bat"
echo oLink.WorkingDirectory = "%SCRIPT_DIR%"
echo oLink.Description = "Start ICT Attendance System"
echo If fso.FileExists("%SCRIPT_DIR%app_icon.ico"^) Then
echo     oLink.IconLocation = "%SCRIPT_DIR%app_icon.ico,0"
echo End If
echo oLink.Save
echo Set oStopLink = oWS.CreateShortcut(sDesktop ^& "\Stop Attendance System.lnk"^)
echo oStopLink.TargetPath = "%SCRIPT_DIR%stop_system.bat"
echo oStopLink.WorkingDirectory = "%SCRIPT_DIR%"
echo oStopLink.Description = "Stop ICT Attendance System"
echo oStopLink.IconLocation = "shell32.dll,27"
echo oStopLink.Save
) > %VBS_SCRIPT%

cscript //nologo %VBS_SCRIPT%
del %VBS_SCRIPT%

echo.
echo [SUCCESS] Shortcuts have been created on your Desktop:
echo   1. "ICT Attendance System"   -^> Double-click to start the system
echo   2. "Stop Attendance System"  -^> Double-click to stop all services
echo.
pause
