import requests
from bs4 import BeautifulSoup
import json
import time
import re
from urllib.parse import quote

# Mapeo de animes a sus wikis de Fandom
WIKI_MAPPING = {
    'ONE PIECE': 'https://onepiece.fandom.com/wiki/',
    'One Piece': 'https://onepiece.fandom.com/wiki/',
    'Naruto': 'https://naruto.fandom.com/wiki/',
    'Dragon Ball Z': 'https://dragonball.fandom.com/wiki/',
    'Dragon Ball Super': 'https://dragonball.fandom.com/wiki/',
    'Dragon Ball Super: Broly': 'https://dragonball.fandom.com/wiki/',
    'JUJUTSU KAISEN': 'https://jujutsu-kaisen.fandom.com/wiki/',
    'Jujutsu Kaisen': 'https://jujutsu-kaisen.fandom.com/wiki/',
    'Hunter x Hunter (2011)': 'https://hunterxhunter.fandom.com/wiki/',
    'Bleach': 'https://bleach.fandom.com/wiki/',
    'Demon Slayer': 'https://kimetsu-no-yaiba.fandom.com/wiki/',
    'My Hero Academia': 'https://myheroacademia.fandom.com/wiki/',
    'One-Punch Man': 'https://onepunchman.fandom.com/wiki/',
    'Attack on Titan': 'https://attackontitan.fandom.com/wiki/',
    'Fate/Zero': 'https://typemoon.fandom.com/wiki/',
    'Fate/stay night': 'https://typemoon.fandom.com/wiki/',
    'Sword Art Online': 'https://swordartonline.fandom.com/wiki/',
    'Black Clover': 'https://blackclover.fandom.com/wiki/',
    'Fairy Tail': 'https://fairytail.fandom.com/wiki/',
    'Seven Deadly Sins': 'https://nanatsu-no-taizai.fandom.com/wiki/',
    'Overlord': 'https://overlord.fandom.com/wiki/',
    'Re:Zero': 'https://rezero.fandom.com/wiki/',
    'Mushoku Tensei': 'https://mushokutensei.fandom.com/wiki/',
    'That Time I Got Reincarnated as a Slime': 'https://tensura.fandom.com/wiki/',
    'JoJo\'s Bizarre Adventure': 'https://jojo.fandom.com/wiki/',
    'Chainsaw Man': 'https://chainsaw-man.fandom.com/wiki/',
    'Fire Force': 'https://fire-force.fandom.com/wiki/',
    'Baki': 'https://baki.fandom.com/wiki/',
    'Kengan Ashura': 'https://kenganverse.fandom.com/wiki/',
    'The God of High School': 'https://godofhighschool.fandom.com/wiki/',
    'Tower of God': 'https://towerofgod.fandom.com/wiki/',
    'Blue Lock': 'https://bluelock.fandom.com/wiki/',
    'Haikyuu': 'https://haikyuu.fandom.com/wiki/',
    'Kuroko no Basket': 'https://kuroko.fandom.com/wiki/',
    'Pokemon': 'https://pokemon.fandom.com/wiki/',
    'Digimon': 'https://digimon.fandom.com/wiki/',
    'Yu-Gi-Oh': 'https://yugioh.fandom.com/wiki/',
    'Inuyasha': 'https://inuyasha.fandom.com/wiki/',
    'Rurouni Kenshin': 'https://kenshin.fandom.com/wiki/',
    'Gintama': 'https://gintama.fandom.com/wiki/',
    'Fullmetal Alchemist': 'https://fma.fandom.com/wiki/',
    'Cowboy Bebop': 'https://cowboybebop.fandom.com/wiki/',
    'Samurai Champloo': 'https://samuraichamploo.fandom.com/wiki/',
    'Soul Eater': 'https://souleater.fandom.com/wiki/',
    'Death Note': 'https://deathnote.fandom.com/wiki/',
    'Code Geass': 'https://codegeass.fandom.com/wiki/',
    'Evangelion': 'https://evangelion.fandom.com/wiki/',
    'Puella Magi Madoka Magica': 'https://madoka.fandom.com/wiki/',
    'Sailor Moon': 'https://sailormoon.fandom.com/wiki/',
    'Yuri!!! on Ice': 'https://yurionice.fandom.com/wiki/',
    'Free!': 'https://free-anime.fandom.com/wiki/',
    'Dorohedoro': 'https://dorohedoro.fandom.com/wiki/',
    'Vinland Saga': 'https://vinlandsaga.fandom.com/wiki/',
    'Vagabond': 'https://vagabond.fandom.com/wiki/',
    'Berserk': 'https://berserk.fandom.com/wiki/',
    'Guts': 'https://berserk.fandom.com/wiki/',
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
}

def clean_text(text):
    """Limpia texto HTML y caracteres especiales"""
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\[\d+\]', '', text)
    text = re.sub(r'\([^)]*citation[^)]*\)', '', text, flags=re.IGNORECASE)
    text = text.replace('\xa0', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def format_name_for_url(name):
    """Formatea el nombre para la URL de la wiki"""
    # Reemplazar espacios con guiones bajos
    name = name.replace(' ', '_')
    return name

def scrape_fandom_wiki(char_name, anime_name):
    """Scrapea información de Fandom wiki"""
    # Encontrar la wiki base
    wiki_base = None
    for anime_key, wiki_url in WIKI_MAPPING.items():
        if anime_key.lower() in anime_name.lower():
            wiki_base = wiki_url
            break

    if not wiki_base:
        return None

    # Intentar diferentes formatos de nombre
    names_to_try = [
        char_name,
        char_name.replace(' ', '_'),
        char_name.split()[0],  # Solo el primer nombre
    ]

    for name_variant in names_to_try:
        try:
            url = wiki_base + quote(name_variant.replace(' ', '_'))
            response = requests.get(url, headers=headers, timeout=15)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # Buscar la infobox
                infobox = soup.find('aside', class_='portable-infobox') or soup.find('table', class_='infobox')

                data = {
                    'name': char_name,
                    'anime': anime_name,
                    'source': 'Fandom Wiki',
                    'url': url
                }

                if infobox:
                    # Extraer campos comunes de la infobox
                    rows = infobox.find_all(['tr', 'div'])

                    for row in rows:
                        # Buscar etiquetas y valores
                        label = row.find(['th', 'dt', 'h3', 'b']) or row.find(class_=lambda x: x and 'label' in x.lower())
                        value = row.find(['td', 'dd', 'div']) or row.find(class_=lambda x: x and 'value' in x.lower())

                        if label and value:
                            label_text = clean_text(label.get_text()).lower()
                            value_text = clean_text(value.get_text())

                            if 'age' in label_text:
                                data['age'] = value_text
                            elif 'height' in label_text or ' stature' in label_text:
                                data['height'] = value_text
                            elif 'weight' in label_text:
                                data['weight'] = value_text
                            elif 'birth' in label_text:
                                data['birthday'] = value_text
                            elif 'status' in label_text:
                                data['status'] = value_text
                            elif 'occupation' in label_text or 'affiliation' in label_text or 'job' in label_text:
                                data['occupation'] = value_text
                            elif 'debut' in label_text:
                                data['debut'] = value_text
                            elif 'alias' in label_text or 'epithet' in label_text or ' epithet' in label_text:
                                data['alias'] = value_text
                            elif 'birthday' in label_text:
                                data['birthday'] = value_text
                            elif 'zodiac' in label_text:
                                data['zodiac'] = value_text
                            elif 'blood' in label_text:
                                data['blood_type'] = value_text

                # Extraer descripción del primer párrafo
                content = soup.find('div', class_='mw-parser-output')
                if content:
                    paragraphs = content.find_all('p', recursive=False)
                    for p in paragraphs:
                        text = clean_text(p.get_text())
                        if text and len(text) > 30 and not text.startswith('This article'):
                            data['description'] = text[:300] + ('...' if len(text) > 300 else '')
                            break

                # Extraer imagen de la infobox
                if infobox:
                    img = infobox.find('img')
                    if img and img.get('src'):
                        img_url = img['src']
                        if img_url.startswith('/'):
                            img_url = 'https://static.wikia.nocookie.net' + img_url
                        data['image'] = img_url

                return data

            time.sleep(0.5)

        except Exception as e:
            print(f"  Error con {name_variant}: {str(e)[:50]}")
            continue

    return None

def get_character_title(char_name, anime_name, wiki_data):
    """Genera un título/epíteto para el personaje basado en la información de la wiki"""
    titles = []

    if wiki_data:
        # Priorizar alias/epíteto
        if wiki_data.get('alias'):
            alias = wiki_data['alias'].split(',')[0].strip()
            if alias and alias != char_name:
                titles.append(alias)

        # Ocupación
        if wiki_data.get('occupation'):
            occ = wiki_data['occupation'].split(',')[0].strip()
            if occ:
                titles.append(occ)

    # Si no hay datos de wiki, usar el anime
    if not titles:
        if 'ONE PIECE' in anime_name.upper() or 'One Piece' in anime_name:
            # Para One Piece intentar extraer el título/epíteto conocido
            if char_name == 'Monkey D. Luffy':
                titles.append('Capitán de los Piratas del Sombrero de Paja')
            elif char_name == 'Roronoa Zoro':
                titles.append('Espadachín Pirata / Cazador de Piratas')
            elif char_name == 'Sanji':
                titles.append('Pierna Negra / Cocinero Pirata')
            elif char_name == 'Nami':
                titles.append('Gata Ladrona / Navegante')
            elif char_name == 'Shanks':
                titles.append('El Pelirrojo / Emperador del Mar')
            elif char_name == 'Dracule Mihawk':
                titles.append('Ojos de Halcón / Mejor Espadachín del Mundo')

        elif 'Naruto' in anime_name:
            if char_name == 'Naruto Uzumaki':
                titles.append('Séptimo Hokage / El Ninja Número 1 Hiperactivo')

        elif 'Dragon Ball' in anime_name:
            if char_name == 'Son Goku':
                titles.append('Super Saiyan / Guerrero Legendario')
            elif char_name == 'Vegeta':
                titles.append('Príncipe de los Saiyans')

        elif 'JUJUTSU KAISEN' in anime_name.upper() or 'Jujutsu Kaisen' in anime_name:
            if char_name == 'Satoru Gojo':
                titles.append('El Chamán Más Fuerte / Profesor')
            elif char_name == 'Yuji Itadori':
                titles.append('Recipiente de Sukuna / Estudiante de Primer Año')

    return titles[0] if titles else f"Personaje de {anime_name}"

def main():
    # Cargar datos existentes
    with open('characters_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Scrapeando wikis de Fandom para {len(data)} personajes...")
    print("=" * 70)

    updated_count = 0
    failed_count = 0

    for i, (char_name, char_data) in enumerate(data.items()):
        anime_name = char_data.get('anime_title', '')

        print(f"[{i+1}/{len(data)}] {char_name} ({anime_name[:30]})...", end=' ')

        # Scrapear wiki
        wiki_data = scrape_fandom_wiki(char_name, anime_name)

        if wiki_data:
            # Actualizar datos
            if wiki_data.get('age'):
                char_data['age'] = wiki_data['age']
            if wiki_data.get('height'):
                char_data['height'] = wiki_data['height']
            if wiki_data.get('occupation'):
                char_data['occupation'] = wiki_data['occupation']
            if wiki_data.get('alias'):
                char_data['alias'] = wiki_data['alias']
            if wiki_data.get('description'):
                char_data['wiki_description'] = wiki_data['description']
            if wiki_data.get('birthday'):
                char_data['birthday'] = wiki_data['birthday']

            # Generar título/epíteto
            title = get_character_title(char_name, anime_name, wiki_data)
            char_data['title'] = title

            # Crear descripción formateada
            desc_parts = []
            if wiki_data.get('height'):
                desc_parts.append(f"📏 {wiki_data['height']}")
            if wiki_data.get('age'):
                desc_parts.append(f"👤 {wiki_data['age']}")
            if title:
                desc_parts.append(f"⭐ {title}")

            char_data['formatted_info'] = ' • '.join(desc_parts[:3])

            print(f"[OK] {title[:40]}")
            updated_count += 1
        else:
            # Usar datos existentes para generar descripción
            title = get_character_title(char_name, anime_name, None)
            char_data['title'] = title
            char_data['formatted_info'] = f"⭐ {title}"
            print(f"[SIN WIKI] Usando datos básicos")
            failed_count += 1

        # Guardar progreso cada 10 personajes
        if (i + 1) % 10 == 0:
            with open('characters_data.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"\n  [SAVE] Progreso: {i+1}/{len(data)}\n")

        time.sleep(0.8)  # Rate limiting

    # Guardar datos finales
    with open('characters_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 70)
    print(f"Scraping completado!")
    print(f"Exitosos: {updated_count}")
    print(f"Sin wiki: {failed_count}")

if __name__ == '__main__':
    main()
