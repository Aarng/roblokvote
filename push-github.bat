@echo off
echo ====================================
echo Subiendo a GitHub - 4lex2/roblokvote
echo ====================================
echo.
cd "C:\Users\SHANA\Desktop\Projects\roblokvote"
echo Configurando credenciales...
git config user.email "you@example.com"
git config user.name "Your Name"
echo.
echo Conectando a GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/4lex2/roblokvote.git
echo.
echo Haciendo push...
git push -u origin main
echo.
echo ====================================
echo Si pide usuario: escribe tu usuario de GitHub
echo Si pide password: usa tu Personal Access Token
echo ====================================
pause
