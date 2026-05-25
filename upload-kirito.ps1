# Subir imagen de Kirito a Convex Storage
$ErrorActionPreference = "Stop"

$imagePath = "C:\Users\SHANA\Desktop\Projects\roblokvote\images\Kirito.png"
$projectDir = "C:\Users\SHANA\Desktop\Projects\roblokvote"

Write-Host "🚀 Subiendo imagen de Kirito a Convex Storage..." -ForegroundColor Cyan
Write-Host ""

Set-Location $projectDir

try {
    # Ejecutar comando de Convex
    $result = npx convex file upload $imagePath --name "Kirito.png" 2>&1

    Write-Host $result -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Imagen subida exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 INSTRUCCIONES:" -ForegroundColor Yellow
    Write-Host "   1. Copia la URL generada arriba (formato: https://...convex.cloud/api/storage/...)"
    Write-Host "   2. Ve al dashboard: https://dashboard.convex.dev"
    Write-Host "   3. Navega a: Data → characters"
    Write-Host "   4. Busca 'Kirito' y haz clic para editar"
    Write-Host "   5. Pega la URL en el campo 'image'"
    Write-Host "   6. Guarda los cambios"
    Write-Host ""
} catch {
    Write-Host "❌ Error subiendo imagen:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Asegurate de que:" -ForegroundColor Yellow
    Write-Host "   - Convex CLI está instalado: npm install -g convex"
    Write-Host "   - Estás logueado: npx convex login"
    Write-Host "   - El proyecto está inicializado: npx convex dev"
}

Pause
