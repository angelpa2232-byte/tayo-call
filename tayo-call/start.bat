@echo off
chcp 65001 > nul
title 타요 영상통화 시작
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch.ps1" %*
if errorlevel 1 (
    echo.
    echo 실행하지 못했습니다. 위 오류를 확인해주세요.
    pause
    exit /b 1
)
exit /b 0
