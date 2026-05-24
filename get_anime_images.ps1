# Script para obtener URLs de imágenes de personajes de anime desde Jikan API

$baseUrl = "https://api.jikan.moe/v4"

# Función para buscar personaje y obtener su imagen
function Get-CharacterImage {
    param([string]$name, [string]$anime)

    try {
        # Buscar personaje
        $searchUrl = "$baseUrl/characters?q=$([System.Web.HttpUtility]::UrlEncode($name))&limit=1"
        $response = Invoke-RestMethod -Uri $searchUrl -Method Get -ErrorAction Stop

        if ($response.data.Count -eq 0) {
            Write-Host "No se encontró: $name" -ForegroundColor Red
            return $null
        }

        $malId = $response.data[0].mal_id
        $characterName = $response.data[0].name

        # Obtener detalles completos
        $detailUrl = "$baseUrl/characters/$malId/full"
        Start-Sleep -Milliseconds 800  # Rate limiting
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
        return [PSCustomObject]@{
            Name = $name
            Anime = $anime
            ImageUrl = "ERROR"
            MalId = $null
        }
    }
}

# Lista de personajes MELEE (38)
$meleeCharacters = @(
    @{Name="Sanji"; Anime="ONE PIECE"},
    @{Name="Yuji Itadori"; Anime="Jujutsu Kaisen"},
    @{Name="Aoi Todo"; Anime="JUJUTSU KAISEN"},
    @{Name="Maki Zenin"; Anime="JUJUTSU KAISEN"},
    @{Name="Toji Fushiguro"; Anime="JUJUTSU KAISEN"},
    @{Name="Naoya Zenin"; Anime="JUJUTSU KAISEN"},
    @{Name="Naruto Uzumaki"; Anime="Naruto"},
    @{Name="Rock Lee"; Anime="Naruto"},
    @{Name="Vegeta"; Anime="Dragon Ball Z"},
    @{Name="Broly"; Anime="Dragon Ball Super"},
    @{Name="Gohan"; Anime="Dragon Ball Z"},
    @{Name="Piccolo"; Anime="Dragon Ball Z"},
    @{Name="Gon Freecss"; Anime="Hunter x Hunter"},
    @{Name="Killua Zoldyck"; Anime="Hunter x Hunter"},
    @{Name="Genos"; Anime="One-Punch Man"},
    @{Name="Saitama"; Anime="One-Punch Man"},
    @{Name="Garou"; Anime="One-Punch Man"},
    @{Name="Baki Hanma"; Anime="BAKI"},
    @{Name="Yujiro Hanma"; Anime="BAKI"},
    @{Name="Mori Jin"; Anime="The God of High School"},
    @{Name="Han Daewi"; Anime="The God of High School"},
    @{Name="Denji"; Anime="Chainsaw Man"},
    @{Name="Power"; Anime="Chainsaw Man"},
    @{Name="Shinra Kusakabe"; Anime="Fire Force"},
    @{Name="Akaza"; Anime="Demon Slayer"},
    @{Name="Ban"; Anime="Seven Deadly Sins"},
    @{Name="All Might"; Anime="My Hero Academia"},
    @{Name="Izuku Midoriya"; Anime="My Hero Academia"},
    @{Name="Mirko"; Anime="My Hero Academia"},
    @{Name="Eren Yeager"; Anime="Attack on Titan"},
    @{Name="Joseph Joestar"; Anime="JoJo's Bizarre Adventure"},
    @{Name="Jonathan Joestar"; Anime="JoJo's Bizarre Adventure"},
    @{Name="DIO"; Anime="JoJo's Bizarre Adventure"},
    @{Name="Benimaru Shinmon"; Anime="Fire Force"},
    @{Name="Kaneki"; Anime="Tokyo Ghoul"},
    @{Name="Eto"; Anime="Tokyo Ghoul"}
)

# Lista de personajes ESPADA (45)
$swordCharacters = @(
    @{Name="Dracule Mihawk"; Anime="ONE PIECE"},
    @{Name="Shanks"; Anime="ONE PIECE"},
    @{Name="Trafalgar Law"; Anime="ONE PIECE"},
    @{Name="Ichigo Kurosaki"; Anime="BLEACH"},
    @{Name="Byakuya Kuchiki"; Anime="BLEACH"},
    @{Name="Kenpachi Zaraki"; Anime="BLEACH"},
    @{Name="Genryusai Yamamoto"; Anime="BLEACH"},
    @{Name="Kisuke Urahara"; Anime="BLEACH"},
    @{Name="Sunraku"; Anime="Shangri-La Frontier"},
    @{Name="Arthur Pencilgon"; Anime="Shangri-La Frontier"},
    @{Name="Tanjiro Kamado"; Anime="Demon Slayer"},
    @{Name="Giyu Tomioka"; Anime="Demon Slayer"},
    @{Name="Kyojuro Rengoku"; Anime="Demon Slayer"},
    @{Name="Muichiro Tokito"; Anime="Demon Slayer"},
    @{Name="Zenitsu Agatsuma"; Anime="Demon Slayer"},
    @{Name="Yoriichi Tsugikuni"; Anime="Demon Slayer"},
    @{Name="Sasuke Uchiha"; Anime="Naruto"},
    @{Name="Mifune"; Anime="Soul Eater"},
    @{Name="Asta"; Anime="Black Clover"},
    @{Name="Erza Scarlet"; Anime="Fairy Tail"},
    @{Name="Kirito"; Anime="Sword Art Online"},
    @{Name="Asuna Yuuki"; Anime="Sword Art Online"},
    @{Name="Guts"; Anime="Berserk"},
    @{Name="Griffith"; Anime="Berserk"},
    @{Name="Kenshin Himura"; Anime="Rurouni Kenshin"},
    @{Name="Hyakkimaru"; Anime="Dororo"},
    @{Name="Levi Ackerman"; Anime="Attack on Titan"},
    @{Name="Mikasa Ackerman"; Anime="Attack on Titan"},
    @{Name="Vergil"; Anime="Devil May Cry"},
    @{Name="Raiden"; Anime="Metal Gear Rising"},
    @{Name="2B"; Anime="Nier: Automata"},
    @{Name="Saber"; Anime="Fate/stay night"},
    @{Name="Mugen"; Anime="Samurai Champloo"},
    @{Name="Jinwoo Sung"; Anime="Solo Leveling"},
    @{Name="Hakumen"; Anime="BlazBlue"},
    @{Name="Sesshomaru"; Anime="Inuyasha"},
    @{Name="Inuyasha"; Anime="Inuyasha"},
    @{Name="Ragna the Bloodedge"; Anime="BlazBlue"},
    @{Name="Noctis Lucis Caelum"; Anime="Final Fantasy XV"},
    @{Name="Dante"; Anime="Devil May Cry"},
    @{Name="Rimuru Tempest"; Anime="That Time I Got Reincarnated as a Slime"},
    @{Name="Inosuke Hashibira"; Anime="Demon Slayer"},
    @{Name="Escanor"; Anime="Seven Deadly Sins"},
    @{Name="Sho Kusakabe"; Anime="Fire Force"}
)

# Lista de personajes MAGIA (39)
$magicCharacters = @(
    @{Name="Yuta Okkotsu"; Anime="JUJUTSU KAISEN"},
    @{Name="Satoru Gojo"; Anime="JUJUTSU KAISEN"},
    @{Name="Megumi Fushiguro"; Anime="JUJUTSU KAISEN"},
    @{Name="Ryomen Sukuna"; Anime="JUJUTSU KAISEN"},
    @{Name="Suguru Geto"; Anime="JUJUTSU KAISEN"},
    @{Name="Mahito"; Anime="JUJUTSU KAISEN"},
    @{Name="Choso"; Anime="JUJUTSU KAISEN"},
    @{Name="Megumin"; Anime="KonoSuba"},
    @{Name="Frieren"; Anime="Frieren: Beyond Journey's End"},
    @{Name="Fern"; Anime="Frieren: Beyond Journey's End"},
    @{Name="Portgas D. Ace"; Anime="ONE PIECE"},
    @{Name="Aokiji"; Anime="ONE PIECE"},
    @{Name="Akainu"; Anime="ONE PIECE"},
    @{Name="Kizaru"; Anime="ONE PIECE"},
    @{Name="Boa Hancock"; Anime="ONE PIECE"},
    @{Name="Eustass Kid"; Anime="ONE PIECE"},
    @{Name="Blackbeard"; Anime="ONE PIECE"},
    @{Name="Perona"; Anime="ONE PIECE"},
    @{Name="Charlotte Katakuri"; Anime="ONE PIECE"},
    @{Name="Milim Nava"; Anime="That Time I Got Reincarnated as a Slime"},
    @{Name="Diablo"; Anime="That Time I Got Reincarnated as a Slime"},
    @{Name="Lucy Heartfilia"; Anime="Fairy Tail"},
    @{Name="Zeref"; Anime="Fairy Tail"},
    @{Name="Noelle Silva"; Anime="Black Clover"},
    @{Name="Tatsumaki"; Anime="One Punch Man"},
    @{Name="Madoka Kaname"; Anime="Madoka Magica"},
    @{Name="Homura Akemi"; Anime="Madoka Magica"},
    @{Name="Mami Tomoe"; Anime="Madoka Magica"},
    @{Name="Ainz Ooal Gown"; Anime="Overlord"},
    @{Name="Emilia"; Anime="Re:Zero"},
    @{Name="Beatrice"; Anime="Re:Zero"},
    @{Name="Roxy Migurdia"; Anime="Mushoku Tensei"},
    @{Name="Rudeus Greyrat"; Anime="Mushoku Tensei"},
    @{Name="Anos Voldigoad"; Anime="The Misfit of Demon King Academy"},
    @{Name="Howl"; Anime="Howl's Moving Castle"},
    @{Name="Sailor Moon"; Anime="Sailor Moon"},
    @{Name="Sailor Mars"; Anime="Sailor Moon"},
    @{Name="Sailor Mercury"; Anime="Sailor Moon"},
    @{Name="Gilgamesh"; Anime="Fate/Zero"}
)

# Resultados
$results = @{
    Melee = @()
    Sword = @()
    Magic = @()
}

Write-Host "=== OBTENIENDO IMÁGENES - CATEGORÍA: MELEE ===" -ForegroundColor Cyan
foreach ($char in $meleeCharacters) {
    $result = Get-CharacterImage -name $char.Name -anime $char.Anime
    if ($result) {
        $results.Melee += $result
    }
    Start-Sleep -Milliseconds 800  # Rate limiting de Jikan (1 req/seg aprox)
}

Write-Host "`n=== OBTENIENDO IMÁGENES - CATEGORÍA: ESPADA ===" -ForegroundColor Cyan
foreach ($char in $swordCharacters) {
    $result = Get-CharacterImage -name $char.Name -anime $char.Anime
    if ($result) {
        $results.Sword += $result
    }
    Start-Sleep -Milliseconds 800
}

Write-Host "`n=== OBTENIENDO IMÁGENES - CATEGORÍA: MAGIA ===" -ForegroundColor Cyan
foreach ($char in $magicCharacters) {
    $result = Get-CharacterImage -name $char.Name -anime $char.Anime
    if ($result) {
        $results.Magic += $result
    }
    Start-Sleep -Milliseconds 800
}

# Guardar resultados en JSON
$jsonOutput = $results | ConvertTo-Json -Depth 4
$jsonOutput | Out-File -FilePath "C:\Users\SHANA\Desktop\Projects\roblokvote\anime_images.json" -Encoding UTF8

Write-Host "`n=== RESULTADOS GUARDADOS EN anime_images.json ===" -ForegroundColor Green
Write-Host $jsonOutput
