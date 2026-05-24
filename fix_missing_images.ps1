# Script para corregir personajes con errores o URLs incorrectas

$baseUrl = "https://api.jikan.moe/v4"

function Get-CharacterImage {
    param([string]$name, [string]$anime)

    try {
        $searchUrl = "$baseUrl/characters?q=$([System.Web.HttpUtility]::UrlEncode($name))&limit=1"
        $response = Invoke-RestMethod -Uri $searchUrl -Method Get -ErrorAction Stop

        if ($response.data.Count -eq 0) {
            Write-Host "No se encontró: $name" -ForegroundColor Red
            return $null
        }

        $malId = $response.data[0].mal_id
        $characterName = $response.data[0].name

        $detailUrl = "$baseUrl/characters/$malId/full"
        Start-Sleep -Milliseconds 800
        $detailResponse = Invoke-RestMethod -Uri $detailUrl -Method Get -ErrorAction Stop

        $imageUrl = $detailResponse.data.images.jpg.image_url

        Write-Host "✓ $characterName -> $imageUrl" -ForegroundColor Green

        return [PSCustomObject]@{
            Name = $name
            Anime = $anime
            ImageUrl = $imageUrl
            MalId = $malId
        }
    }
    catch {
        Write-Host "Error con $name : $_" -ForegroundColor Red
        return $null
    }
}

# Personajes a corregir (buscar con nombres alternativos)
$toFix = @(
    # Nombres alternativos para personajes no encontrados
    @{Name="Portgas D. Ace"; Anime="ONE PIECE"; Search="Ace One Piece"},
    @{Name="Kizaru"; Anime="ONE PIECE"; Search="Borsalino"},
    @{Name="Sailor Mars"; Anime="Sailor Moon"; Search="Rei Hino"},
    @{Name="Gilgamesh"; Anime="Fate/Zero"; Search="Gilgamesh Fate"},
    @{Name="Griffith"; Anime="Berserk"; Search="Griffith"},
    @{Name="Hyakkimaru"; Anime="Dororo"; Search="Hyakkimaru"},
    @{Name="Raiden"; Anime="Metal Gear Rising"; Search="Raiden Metal Gear"},
    @{Name="Dante"; Anime="Devil May Cry"; Search="Dante Devil May Cry"},
    @{Name="Garou"; Anime="One-Punch Man"; Search="Garou"},
    @{Name="Han Daewi"; Anime="The God of High School"; Search="Daewi Han"},
    @{Name="Shinra Kusakabe"; Anime="Fire Force"; Search="Shinra Kusakabe"},
    @{Name="Mirko"; Anime="My Hero Academia"; Search="Mirko"},
    @{Name="Kaneki"; Anime="Tokyo Ghoul"; Search="Ken Kaneki"},
    @{Name="Eto"; Anime="Tokyo Ghoul"; Search="Eto Yoshimura"},
    @{Name="2B"; Anime="Nier: Automata"; Search="YoRHa No.2 Type B"},
    @{Name="Denji"; Anime="Chainsaw Man"; Search="Denji"},
    @{Name="Asta"; Anime="Black Clover"; Search="Asta"},
    @{Name="Sailor Mercury"; Anime="Sailor Moon"; Search="Ami Mizuno"}
)

Write-Host "=== CORRIGIENDO IMÁGENES ===" -ForegroundColor Cyan
$fixedResults = @()

foreach ($char in $toFix) {
    $result = Get-CharacterImage -name $char.Search -anime $char.Anime
    if ($result) {
        $result.Name = $char.Name  # Restaurar el nombre original
        $fixedResults += $result
    }
    Start-Sleep -Milliseconds 800
}

# Guardar correcciones
$fixedResults | ConvertTo-Json -Depth 4 | Out-File -FilePath "C:\Users\SHANA\Desktop\Projects\roblokvote\fixed_images.json" -Encoding UTF8

Write-Host "`n=== CORRECCIONES GUARDADAS ===" -ForegroundColor Green
$fixedResults | ForEach-Object { Write-Host "$($_.Name): $($_.ImageUrl)" }
