@echo off
cd /d "%~dp0"
py -3.13 -m venv .venv
if errorlevel 1 goto fail
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto fail
echo Installation complete. Open start-windows.cmd and keep it running.
pause
exit /b 0
:fail
echo Install Python 3.13 (64-bit) from python.org and the official smart-card reader driver, then retry.
pause
exit /b 1
