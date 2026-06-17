@echo off
setlocal
cd /d "%~dp0"

echo.
echo Runeterra Dou Dizhu local preview
echo.
echo URL: http://127.0.0.1:5175/
echo Keep this window open. Closing it will stop the preview server.
echo.

set "PYTHON_EXE=C:\Users\K\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
set "NODE_EXE=C:\Users\K\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if exist "%PYTHON_EXE%" (
  "%PYTHON_EXE%" -m http.server 5175 --bind 127.0.0.1
) else if exist "%NODE_EXE%" (
  "%NODE_EXE%" share-server.cjs
) else (
  echo.
  echo Could not find the bundled Python or Node runtime.
  echo You can still open index.html directly in a browser.
)

echo.
echo Preview server stopped.
pause
