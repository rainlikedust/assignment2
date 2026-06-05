@echo off
cd /d "%~dp0"
echo ===================================
echo 1. Building new HTML files...
echo ===================================
call make.bat html

echo.
echo ===================================
echo 2. Committing source files to master...
echo ===================================
git add .
git commit -m "Update site content"
git push origin master

echo.
echo ===================================
echo 3. Deploying to gh-pages branch...
echo ===================================
git worktree remove ..\assignment2_ghpages --force 2>nul
git worktree add ..\assignment2_ghpages gh-pages
robocopy build\html ..\assignment2_ghpages /MIR /XD .git >nul
cd ..\assignment2_ghpages
git add .
git commit -m "Deploy updated site"
git push origin gh-pages
cd ..\assignment2_repo
git worktree remove ..\assignment2_ghpages --force

echo.
echo ===================================
echo All Done! The website will update in 1-2 minutes.
echo ===================================
pause
