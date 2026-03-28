@echo off
chcp 65001 >nul
title 6面勇士 - 启动器
echo.
echo ==========================================
echo          6面勇士 启动器
echo ==========================================
echo.
echo 正在检查依赖...

cd /d "F:\UGit\dicehero2"

if not exist "node_modules" (
    echo [提示] 首次启动，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
    echo [成功] 依赖安装完成
    echo.
)

echo [提示] 正在启动游戏服务器...
echo [提示] 启动完成后将自动打开浏览器
echo [提示] 按 Ctrl+C 可停止服务器
echo.
echo ==========================================
echo.

start http://localhost:3000

call npm run dev

echo.
echo 服务器已停止
pause