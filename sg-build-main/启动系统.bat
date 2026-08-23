@echo off
title SG-Build Startup

echo ============================================
echo    SG-Build Startup
echo ============================================
echo.

REM 获取当前目录
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend-web"

echo [1/2] Starting backend...
netstat -ano 2>nul | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Backend already running on port 3000
) else (
    start "Backend" cmd /k "cd /d %BACKEND_DIR% && node dist/main.js"
    echo [OK] Backend started on port 3000
    timeout /t 3 /nobreak >nul
)

echo [2/2] Starting frontend...
netstat -ano 2>nul | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Frontend already running on port 3001
) else (
    start "Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"
    echo [OK] Frontend started on port 3001
    timeout /t 6 /nobreak >nul
)

echo.
echo ============================================
echo    URL:  http://localhost:3001
echo    User: admin / admin123
echo ============================================
echo.
echo Press any key to open browser...
pause >nul
start http://localhost:3001
