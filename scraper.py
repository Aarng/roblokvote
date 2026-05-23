import requests
import json
import time
import re
from bs4 import BeautifulSoup
import os

# Lista de personajes con sus animes asociados para búsqueda más precisa
character_anime_map = {
    # One Piece
    "Monkey D. Luffy": "One Piece",
    "Roronoa Zoro": "One Piece",
    "Sanji": "One Piece",
    "Dracule Mihawk": "One Piece",
    "Garp": "One Piece",
    "Shanks": "One Piece",
    "Trafalgar Law": "One Piece",
    "Brook": "One Piece",
    "Kozuki Oden": "One Piece",
    "Portgas D. Ace": "One Piece",
    "Enel": "One Piece",
    "Crocodile": "One Piece",
    "Aokiji": "One Piece",
    "Akainu": "One Piece",
    "Kizaru": "One Piece",
    "Boa Hancock": "One Piece",
    "Donquixote Doflamingo": "One Piece",
    "Eustass Kid": "One Piece",
    "Marco": "One Piece",
    "Blackbeard": "One Piece",
    "Perona": "One Piece",
    "Bartolomeo": "One Piece",
    "Charlotte Katakuri": "One Piece",

    # Jujutsu Kaisen
    "Yuta Okkotsu": "Jujutsu Kaisen",
    "Satoru Gojo": "Jujutsu Kaisen",
    "Megumi Fushiguro": "Jujutsu Kaisen",
    "Ryomen Sukuna": "Jujutsu Kaisen",
    "Suguru Geto": "Jujutsu Kaisen",
    "Mahito": "Jujutsu Kaisen",
    "Yuji Itadori": "Jujutsu Kaisen",
    "Aoi Todo": "Jujutsu Kaisen",
    "Maki Zenin": "Jujutsu Kaisen",
    "Toji Fushiguro": "Jujutsu Kaisen",
    "Choso": "Jujutsu Kaisen",

    # Naruto/Boruto
    "Naruto Uzumaki": "Naruto",
    "Rock Lee": "Naruto",
    "Might Guy": "Naruto",
    "Neji Hyuga": "Naruto",
    "Choji Akimichi": "Naruto",
    "Killer Bee": "Naruto",
    "Sasuke Uchiha": "Naruto",
    "Madara Uchiha": "Naruto",
    "Itachi Uchiha": "Naruto",
    "Pain": "Naruto",
    "Kakashi Hatake": "Naruto",
    "Minato Namikaze": "Naruto",
    "Jiraiya": "Naruto",
    "Orochimaru": "Naruto",
    "Tsunade": "Naruto",
    "Gaara": "Naruto",
    "Hinata Hyuga": "Naruto",
    "Sakura Haruno": "Naruto",
    "Shikamaru Nara": "Naruto",

    # Dragon Ball
    "Son Goku": "Dragon Ball",
    "Vegeta": "Dragon Ball",
    "Broly": "Dragon Ball",
    "Jiren": "Dragon Ball",
    "Gohan": "Dragon Ball",
    "Piccolo": "Dragon Ball",

    # Hunter x Hunter
    "Gon Freecss": "Hunter x Hunter",
    "Killua Zoldyck": "Hunter x Hunter",
    "Isaac Netero": "Hunter x Hunter",
    "Uvogin": "Hunter x Hunter",
    "Phinks": "Hunter x Hunter",
    "Chrollo Lucilfer": "Hunter x Hunter",
    "Hisoka Morow": "Hunter x Hunter",
    "Kurapika": "Hunter x Hunter",
    "Leorio Paradinight": "Hunter x Hunter",
    "Illumi Zoldyck": "Hunter x Hunter",

    # One Punch Man
    "Saitama": "One Punch Man",
    "Genos": "One Punch Man",
    "Garou": "One Punch Man",
    "Tatsumaki": "One Punch Man",
    "Fubuki": "One Punch Man",

    # Mashle
    "Mash Burnedead": "Mashle",

    # Kengan Ashura
    "Tokita Ohma": "Kengan Ashura",
    "Wakatsuki Takeshi": "Kengan Ashura",

    # Baki
    "Baki Hanma": "Baki",
    "Yujiro Hanma": "Baki",

    # The God of High School
    "Mori Jin": "The God of High School",
    "Han Daewi": "The God of High School",

    # Chainsaw Man
    "Denji": "Chainsaw Man",
    "Power": "Chainsaw Man",

    # Fire Force
    "Shinra Kusakabe": "Fire Force",

    # Demon Slayer
    "Tanjiro Kamado": "Demon Slayer",
    "Giyu Tomioka": "Demon Slayer",
    "Kyojuro Rengoku": "Demon Slayer",
    "Muichiro Tokito": "Demon Slayer",
    "Zenitsu Agatsuma": "Demon Slayer",
    "Yoriichi Tsugikuni": "Demon Slayer",
    "Akaza": "Demon Slayer",
    "Inosuke Hashibira": "Demon Slayer",

    # Seven Deadly Sins
    "Ban": "Seven Deadly Sins",
    "Escanor": "Seven Deadly Sins",
    "Meliodas": "Seven Deadly Sins",
    "Diane": "Seven Deadly Sins",
    "King": "Seven Deadly Sins",
    "Gowther": "Seven Deadly Sins",
    "Merlin": "Seven Deadly Sins",
    "Elizabeth Liones": "Seven Deadly Sins",

    # My Hero Academia
    "All Might": "My Hero Academia",
    "Izuku Midoriya": "My Hero Academia",
    "Mirko": "My Hero Academia",
    "Katsuki Bakugo": "My Hero Academia",
    "Shoto Todoroki": "My Hero Academia",
    "Ochaco Uraraka": "My Hero Academia",
    "Tenya Iida": "My Hero Academia",
    "Tsuyu Asui": "My Hero Academia",
    "Shota Aizawa": "My Hero Academia",
    "Endeavor": "My Hero Academia",
    "Hawks": "My Hero Academia",
    "All For One": "My Hero Academia",
    "Tomura Shigaraki": "My Hero Academia",

    # Undead Unluck
    "Andy": "Undead Unluck",
    "Fuuko Izumo": "Undead Unluck",

    # Attack on Titan
    "Eren Yeager": "Attack on Titan",
    "Levi Ackerman": "Attack on Titan",
    "Mikasa Ackerman": "Attack on Titan",
    "Armin Arlert": "Attack on Titan",
    "Erwin Smith": "Attack on Titan",
    "Hange Zoe": "Attack on Titan",
    "Zeke Yeager": "Attack on Titan",

    # Dorohedoro
    "Kaiman": "Dorohedoro",
    "Noi": "Dorohedoro",
    "Nikaido": "Dorohedoro",
    "Shin": "Dorohedoro",
    "En": "Dorohedoro",

    # JoJo's Bizarre Adventure
    "Joseph Joestar": "JoJo's Bizarre Adventure",
    "Jonathan Joestar": "JoJo's Bizarre Adventure",
    "Jotaro Kujo": "JoJo's Bizarre Adventure",
    "Dio Brando": "JoJo's Bizarre Adventure",
    "Giorno Giovanna": "JoJo's Bizarre Adventure",
    "Jolyne Cujoh": "JoJo's Bizarre Adventure",
    "Johnny Joestar": "JoJo's Bizarre Adventure",
    "Josuke Higashikata": "JoJo's Bizarre Adventure",
    "Kira Yoshikage": "JoJo's Bizarre Adventure",
    "Diavolo": "JoJo's Bizarre Adventure",

    # Bleach
    "Ichigo Kurosaki": "Bleach",
    "Byakuya Kuchiki": "Bleach",
    "Kenpachi Zaraki": "Bleach",
    "Toshiro Hitsugaya": "Bleach",
    "Genryusai Yamamoto": "Bleach",
    "Kisuke Urahara": "Bleach",
    "Rukia Kuchiki": "Bleach",
    "Orihime Inoue": "Bleach",
    "Uryu Ishida": "Bleach",
    "Yasutora Sado": "Bleach",
    "Sosuke Aizen": "Bleach",
    "Grimmjow Jaegerjaquez": "Bleach",
    "Ulquiorra Cifer": "Bleach",

    # Shangri-La Frontier
    "Sunraku": "Shangri-La Frontier",
    "Arthur Pencilgon": "Shangri-La Frontier",

    # Konosuba
    "Megumin": "KonoSuba",
    "Aqua": "KonoSuba",
    "Darkness": "KonoSuba",
    "Kazuma Satou": "KonoSuba",

    # Frieren
    "Frieren": "Frieren: Beyond Journey's End",
    "Fern": "Frieren: Beyond Journey's End",

    # Black Clover
    "Asta": "Black Clover",
    "Yami Sukehiro": "Black Clover",
    "Yuno": "Black Clover",
    "Noelle Silva": "Black Clover",
    "Julius Novachrono": "Black Clover",
    "Mereoleona Vermillion": "Black Clover",
    "Fuegoleon Vermillion": "Black Clover",
    "Jack the Ripper": "Black Clover",
    "Charlotte Roselei": "Black Clover",
    "William Vangeance": "Black Clover",

    # Fairy Tail
    "Erza Scarlet": "Fairy Tail",
    "Lucy Heartfilia": "Fairy Tail",
    "Zeref": "Fairy Tail",
    "Natsu Dragneel": "Fairy Tail",
    "Gray Fullbuster": "Fairy Tail",
    "Wendy Marvell": "Fairy Tail",
    "Gajeel Redfox": "Fairy Tail",
    "Laxus Dreyar": "Fairy Tail",
    "Mirajane Strauss": "Fairy Tail",
    "Gildarts Clive": "Fairy Tail",
    "Jellal Fernandes": "Fairy Tail",

    # Sword Art Online
    "Kirito": "Sword Art Online",
    "Asuna Yuuki": "Sword Art Online",
    "Alice Zuberg": "Sword Art Online",

    # Berserk
    "Guts": "Berserk",
    "Griffith": "Berserk",

    # Rurouni Kenshin
    "Kenshin Himura": "Rurouni Kenshin",
    "Makoto Shishio": "Rurouni Kenshin",

    # Samurai Champloo
    "Mugen": "Samurai Champloo",
    "Jin": "Samurai Champloo",

    # BlazBlue
    "Hakumen": "BlazBlue",
    "Ragna the Bloodedge": "BlazBlue",

    # Inuyasha
    "Sesshomaru": "Inuyasha",
    "Inuyasha": "Inuyasha",
    "Kagura Sohma": "Inuyasha",

    # Devil May Cry
    "Vergil": "Devil May Cry",
    "Dante": "Devil May Cry",
    "Nero": "Devil May Cry",

    # Metal Gear / Other games
    "Raiden": "Metal Gear",
    "Solid Snake": "Metal Gear",

    # NieR
    "2B": "NieR: Automata",
    "9S": "NieR: Automata",
    "A2": "NieR: Automata",

    # Fate
    "Saber": "Fate/stay night",
    "Gilgamesh": "Fate/stay night",
    "Archer": "Fate/stay night",
    "Rin Tohsaka": "Fate/stay night",
    "Sakura Matou": "Fate/stay night",
    "Kiritsugu Emiya": "Fate/Zero",
    "Iskandar": "Fate/Zero",

    # Madoka Magica
    "Madoka Kaname": "Puella Magi Madoka Magica",
    "Homura Akemi": "Puella Magi Madoka Magica",
    "Mami Tomoe": "Puella Magi Madoka Magica",
    "Sayaka Miki": "Puella Magi Madoka Magica",
    "Kyoko Sakura": "Puella Magi Madoka Magica",

    # Overlord
    "Ainz Ooal Gown": "Overlord",
    "Albedo": "Overlord",
    "Shalltear Bloodfallen": "Overlord",
    "Demiurge": "Overlord",

    # Re:Zero
    "Emilia": "Re:Zero",
    "Beatrice": "Re:Zero",
    "Subaru Natsuki": "Re:Zero",
    "Rem": "Re:Zero",
    "Ram": "Re:Zero",
    "Roswaal L. Mathers": "Re:Zero",

    # Mushoku Tensei
    "Roxy Migurdia": "Mushoku Tensei",
    "Rudeus Greyrat": "Mushoku Tensei",
    "Eris Boreas Greyrat": "Mushoku Tensei",
    "Sylphiette": "Mushoku Tensei",

    # The Misfit of Demon King Academy
    "Anos Voldigoad": "The Misfit of Demon King Academy",
    "Misha Necron": "The Misfit of Demon King Academy",
    "Sasha Necron": "The Misfit of Demon King Academy",

    # Howl's Moving Castle
    "Howl": "Howl's Moving Castle",

    # Sailor Moon
    "Sailor Moon": "Sailor Moon",
    "Sailor Mars": "Sailor Moon",
    "Sailor Mercury": "Sailor Moon",
    "Sailor Jupiter": "Sailor Moon",
    "Sailor Venus": "Sailor Moon",
    "Tuxedo Mask": "Sailor Moon",

    # That Time I Got Reincarnated as a Slime
    "Rimuru Tempest": "That Time I Got Reincarnated as a Slime",
    "Milim Nava": "That Time I Got Reincarnated as a Slime",
    "Diablo": "That Time I Got Reincarnated as a Slime",
    "Veldora Tempest": "That Time I Got Reincarnated as a Slime",
    "Benimaru": "That Time I Got Reincarnated as a Slime",

    # Final Fantasy
    "Noctis Lucis Caelum": "Final Fantasy XV",
    "Cloud Strife": "Final Fantasy VII",
    "Sephiroth": "Final Fantasy VII",
    "Squall Leonhart": "Final Fantasy VIII",
    "Tidus": "Final Fantasy X",
    "Lightning": "Final Fantasy XIII",
    "Tifa Lockhart": "Final Fantasy VII",
    "Aerith Gainsborough": "Final Fantasy VII",
}

def search_anilist(character_name, anime_name=None):
    """Busca personaje en AniList GraphQL API"""
    query = '''
    query ($search: String) {
        Character(search: $search) {
            id
            name {
                full
                native
            }
            image {
                large
                medium
            }
            description
            media(sort: POPULARITY_DESC) {
                nodes {
                    title {
                        romaji
                        english
                    }
                    type
                }
            }
        }
    }
    '''

    variables = {"search": character_name}

    try:
        response = requests.post(
            'https://graphql.anilist.co',
            json={'query': query, 'variables': variables},
            headers={'Content-Type': 'application/json'},
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('data') and data['data'].get('Character'):
                char = data['data']['Character']

                # Limpiar descripción
                desc = char.get('description', '') or ''
                desc = re.sub(r'<[^>]+>', '', desc)  # Remover HTML
                desc = desc.replace('__', '').replace('**', '').replace('*', '')
                desc = re.sub(r'\s+', ' ', desc).strip()
                desc = desc[:200] + '...' if len(desc) > 200 else desc

                # Obtener título del anime
                title = ""
                if char.get('media') and char['media'].get('nodes'):
                    media = char['media']['nodes'][0]
                    title = media.get('title', {}).get('english') or media.get('title', {}).get('romaji', '')

                return {
                    'name': char['name']['full'],
                    'image': char['image']['large'] or char['image']['medium'],
                    'description': desc if desc else f"Personaje de {title}",
                    'anime_title': title
                }
    except Exception as e:
        print(f"Error AniList para {character_name}: {e}")

    return None

def search_jikan(character_name, anime_name=None):
    """Busca personaje en Jikan (MyAnimeList) API"""
    try:
        search_term = character_name
        response = requests.get(
            f'https://api.jikan.moe/v4/characters?q={search_term}&limit=1',
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('data') and len(data['data']) > 0:
                char = data['data'][0]

                # Obtener detalles completos
                char_id = char['mal_id']
                detail_response = requests.get(
                    f'https://api.jikan.moe/v4/characters/{char_id}/full',
                    timeout=10
                )

                desc = ""
                anime_title = ""

                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    if detail_data.get('data'):
                        full_char = detail_data['data']
                        desc = full_char.get('about', '') or ''
                        desc = re.sub(r'<[^>]+>', '', desc)
                        desc = desc.replace('\n', ' ').replace('__', '').replace('**', '')
                        desc = re.sub(r'\s+', ' ', desc).strip()
                        desc = desc[:200] + '...' if len(desc) > 200 else desc

                        # Obtener anime
                        if full_char.get('anime') and len(full_char['anime']) > 0:
                            anime_title = full_char['anime'][0].get('anime', {}).get('title', '')

                return {
                    'name': char['name'],
                    'image': char['images']['jpg']['image_url'],
                    'description': desc if desc else f"Personaje de {anime_title}",
                    'anime_title': anime_title
                }

        time.sleep(0.5)  # Rate limiting
    except Exception as e:
        print(f"Error Jikan para {character_name}: {e}")

    return None

def search_moepedia(character_name):
    """Busca personaje en MoePedia/Anime-Planet scraping"""
    try:
        search_term = character_name.replace(' ', '%20')
        url = f'https://www.anime-planet.com/characters/all?name={search_term}'

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            char_card = soup.find('a', class_='cardCharacter')

            if char_card:
                char_url = 'https://www.anime-planet.com' + char_card['href']
                char_response = requests.get(char_url, headers=headers, timeout=10)

                if char_response.status_code == 200:
                    char_soup = BeautifulSoup(char_response.text, 'html.parser')

                    # Imagen
                    img = char_soup.find('img', class_='mainThumb')
                    image_url = img['src'] if img else None

                    # Descripción
                    desc_div = char_soup.find('div', class_='entryContent')
                    desc = desc_div.get_text(strip=True) if desc_div else ""
                    desc = desc[:200] + '...' if len(desc) > 200 else desc

                    # Título del anime
                    anime_link = char_soup.find('a', {'data-entity': 'anime'})
                    anime_title = anime_link.get_text(strip=True) if anime_link else ""

                    if image_url:
                        return {
                            'name': character_name,
                            'image': image_url,
                            'description': desc if desc else f"Personaje de {anime_title}",
                            'anime_title': anime_title
                        }

                time.sleep(1)
    except Exception as e:
        print(f"Error Anime-Planet para {character_name}: {e}")

    return None

def scrape_character(character_name):
    """Intenta múltiples fuentes para obtener datos del personaje"""
    anime = character_anime_map.get(character_name)

    print(f"Buscando: {character_name}...", end=' ')

    # Intentar AniList primero (mejor calidad)
    result = search_anilist(character_name, anime)
    if result:
        print(f"[OK] AniList")
        return result

    # Intentar Jikan
    result = search_jikan(character_name, anime)
    if result:
        print(f"[OK] Jikan")
        return result

    # Intentar Anime-Planet
    result = search_moepedia(character_name)
    if result:
        print(f"[OK] Anime-Planet")
        return result

    print(f"[FAIL] No encontrado")
    return None

def download_image(url, filename):
    """Descarga la imagen del personaje"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            with open(filename, 'wb') as f:
                f.write(response.content)
            return True
    except Exception as e:
        print(f"Error descargando imagen: {e}")

    return False

def main():
    # Cargar lista de personajes del archivo data.js
    # Extraer nombres del archivo data.js
    import re as regex

    with open('data.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Extraer nombres de personajes
    pattern = r'name:\s*"([^"]+)"'
    character_names = regex.findall(pattern, content)

    print(f"Encontrados {len(character_names)} personajes para scrapear")
    print("="*60)

    results = {}
    images_dir = 'images'

    if not os.path.exists(images_dir):
        os.makedirs(images_dir)

    # Scrapear cada personaje
    for i, name in enumerate(character_names):
        result = scrape_character(name)

        if result:
            # Descargar imagen
            safe_name = name.replace(' ', '_').replace('.', '').replace(':', '')
            img_filename = f"{images_dir}/{safe_name}.jpg"

            if download_image(result['image'], img_filename):
                result['local_image'] = img_filename
            else:
                result['local_image'] = None

            results[name] = result
        else:
            results[name] = {
                'name': name,
                'image': None,
                'local_image': None,
                'description': 'Información no disponible',
                'anime_title': character_anime_map.get(name, 'Desconocido')
            }

        # Guardar progreso cada 10 personajes
        if (i + 1) % 10 == 0:
            with open('characters_data.json', 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            print(f"\nGuardado progreso: {i+1}/{len(character_names)}")

        time.sleep(0.5)  # Rate limiting

    # Guardar resultados finales
    with open('characters_data.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("\n" + "="*60)
    print(f"Scraping completado!")
    print(f"Total personajes: {len(character_names)}")
    print(f"Encontrados: {sum(1 for r in results.values() if r.get('image'))}")
    print(f"No encontrados: {sum(1 for r in results.values() if not r.get('image'))}")

if __name__ == '__main__':
    main()
