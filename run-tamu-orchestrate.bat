@echo off
cd /d "%~dp0tamu-helper-cli"
powershell -NoProfile -ExecutionPolicy Bypass -File orchestrate.ps1 %*
