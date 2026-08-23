@echo off
title SG-Build Mobile

echo ============================================
echo    SG-Build Mobile - Expo
echo ============================================
echo.

REM 获取当前目录
set "SCRIPT_DIR=%~dp0"
set "MOBILE_DIR=%SCRIPT_DIR%frontend-mobile"

cd /d %MOBILE_DIR%
npx expo start --port 8081
