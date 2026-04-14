@echo off
echo ===================================
echo Central Bolivia Deploy Script
echo ===================================
echo.

cd /d "C:\Users\Thrilz\OneDrive\Desktop\skills1\central-bolivia"

echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo Adding files to git...
call git add .
if errorlevel 1 (
    echo ERROR: git add failed
    pause
    exit /b 1
)

echo.
echo Committing changes...
call git commit -m "Add C21 property scraper, fix maps, remove AI"
if errorlevel 1 (
    echo WARNING: Nothing to commit or commit failed
)

echo.
echo Pushing to GitHub...
call git push origin main
if errorlevel 1 (
    echo ERROR: git push failed
    pause
    exit /b 1
)

echo.
echo ===================================
echo Deploy complete! Check Vercel for build status.
echo ===================================
pause
