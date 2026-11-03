@echo off
REM ==============================================================================
REM NH POS Shop & Retail SaaS - 1-Click Windows GitHub Push Script
REM ==============================================================================
chcp 65001 >nul
echo.
echo ==========================================================
echo    NH POS Shop - Windows 1-Click GitHub Auto-Sync Script
echo ==========================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed on this PC. Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo [1/4] Building latest files for dist/ and docs/...
call npm run build

echo.
echo [2/4] Staging files...
git branch -M main
git add .

echo.
echo [3/4] Committing changes...
git commit -m "Fix password hash verification for GitHub Pages and Netlify"

echo.
echo [4/4] Pushing to GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [NOTE] If remote is not configured or push failed:
    echo Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
    echo Then run: git push -u origin main
) else (
    echo.
    echo ==========================================================
    echo SUCCESS: Code successfully updated on GitHub!
    echo ==========================================================
)

pause
