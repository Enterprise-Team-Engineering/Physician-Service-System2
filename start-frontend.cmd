@echo off
setlocal
set "PROJECT_ROOT=%~dp0"
set "PORTABLE_NODE=%PROJECT_ROOT%.tools\node-v16.20.2-win-x64"

if not exist "%PORTABLE_NODE%\node.exe" (
  echo Portable Node.js was not found at:
  echo %PORTABLE_NODE%
  echo Install Node.js 16 or newer, then run npm install in the frontend folder.
  pause
  exit /b 1
)

set "PATH=%PORTABLE_NODE%;%PATH%"
cd /d "%PROJECT_ROOT%frontend"
call "%PORTABLE_NODE%\npm.cmd" run dev
endlocal
