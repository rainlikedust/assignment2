@echo off
cd /d "%~dp0"
echo ===================================
echo 1. Building new HTML files...
echo ===================================
call make.bat clean
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
cd build\html
git add .
git commit -m "Deploy updated site"
git push https://github.com/rainlikedust/assgn1.git gh-pages
cd ..\..

echo.
echo ===================================
echo All Done! The website will update in 1-2 minutes.
echo ===================================
pause
