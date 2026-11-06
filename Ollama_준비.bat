@echo off
chcp 65001 > nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tayo-call\setup-ollama.ps1"
pause
