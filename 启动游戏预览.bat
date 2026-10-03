@echo off
setlocal
cd /d "%~dp0"

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm were not found. Install Node.js 22.12 or newer first.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing locked dependencies...
  call npm.cmd install
  if errorlevel 1 exit /b 1
)

echo.
echo Runeterra Dou Dizhu React preview
echo URL: http://127.0.0.1:5175/
echo Keep this window open. Closing it stops the preview server.
echo.

start "" "http://127.0.0.1:5175/"
call npm.cmd run dev -- --host 127.0.0.1 --port 5175

echo.
echo Preview server stopped.
pause
