@echo off
title SG-Build Startup

echo ============================================
echo    SG-Build Startup
echo ============================================
echo.

echo [1/2] Starting backend...
netstat -ano 2>nul | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Backend already running on port 3000
) else (
    start "Backend" cmd /k "cd /d E:\Desktop\APP\backend && node dist/main.js"
    echo [OK] Backend started on port 3000
    timeout /t 3 /nobreak >nul
)

echo [2/2] Starting frontend...
netstat -ano 2>nul | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Frontend already running on port 3001
) else (
    start "Frontend" cmd /k "cd /d E:\Desktop\APP\frontend-web && npm run dev"
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
