@echo off
echo Subiendo imagen de Kirito a Convex Storage...
cd /d "C:\Users\SHANA\Desktop\Projects\roblokvote"
npx convex file upload images\Kirito.png --name "Kirito.png"
echo.
echo Si la subida fue exitosa, copia la URL generada arriba
echo Luego ve al dashboard de Convex y actualiza el personaje Kirito
echo.
pause
