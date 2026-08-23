# Android 测试构建脚本
# 使用前请确保：
# 1. 手机和电脑在同一局域网
# 2. 修改下方的 LOCAL_IP 为你的实际局域网 IP
# 3. 后端已在 14725 端口运行

$LOCAL_IP = "192.168.1.100"  # 修改为你的实际 IP

Write-Host "=== 淮工集团 Android 测试构建 ===" -ForegroundColor Green
Write-Host "本地 IP: $LOCAL_IP" -ForegroundColor Cyan

# 1. 启动后端（如果未运行）
Write-Host "`n[1/5] 检查后端服务..." -ForegroundColor Yellow
$backendRunning = $false
try {
    $res = Invoke-WebRequest -Uri "http://localhost:14725/health" -TimeoutSec 2 -ErrorAction Stop
    if ($res.StatusCode -eq 200) { $backendRunning = $true }
} catch {}
if (-not $backendRunning) {
    Write-Host "启动后端..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\个人资料\app\sg-build-main\backend; node dist/main.js"
    Start-Sleep 5
}

# 2. 构建前端（生产模式）
Write-Host "`n[2/5] 构建前端..." -ForegroundColor Yellow
$env:CAPACITOR = "true"
$env:NEXT_PUBLIC_API_BASE = "http://$LOCAL_IP:14725"
cd C:\个人资料\app\sg-build-main\frontend-web
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "构建失败" -ForegroundColor Red; exit 1 }

# 3. 同步到 Android
Write-Host "`n[3/5] 同步 Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Host "同步失败" -ForegroundColor Red; exit 1 }

# 4. 打开 Android Studio
Write-Host "`n[4/5] 打开 Android Studio..." -ForegroundColor Yellow
npx cap open android

# 5. 启动前端预览服务器（供真机浏览器访问）
Write-Host "`n[5/5] 启动预览服务器..." -ForegroundColor Yellow
Write-Host "手机浏览器访问: http://$LOCAL_IP:14726" -ForegroundColor Green
Write-Host "或在 Android Studio 中运行模拟器/真机调试" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\个人资料\app\sg-build-main\frontend-web; npx next start"