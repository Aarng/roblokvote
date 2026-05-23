import json
import re

# Cargar datos con títulos
with open('characters_data.json', 'r', encoding='utf-8') as f:
    scraped_data = json.load(f)

# Cargar data.js actual
with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Extraer personajes
pattern = r'name:\s*"([^"]+)"[^}]+category:\s*"([^"]+)"[^}]+emoji:\s*"([^"]+)"[^}]+image:\s*"([^"]+)"'
matches = re.findall(pattern, content)

# Crear nuevo contenido
new_content = '''const candidates = [
'''

for name, category, emoji, image in matches:
    char_data = scraped_data.get(name, {})

    # Usar el título formateado de wiki_scraper_v2
    title = char_data.get('formatted_info') or char_data.get('title', '')
    title = title.replace('"', '\\"').replace('\n', ' ')

    # Limitar longitud
    if len(title) > 90:
        title = title[:87] + '...'

    anime = char_data.get('anime_title', '').replace('"', '\\"')

    new_content += f'  {{ name: "{name}", category: "{category}", emoji: "{emoji}", image: "{image}", title: "{title}", anime: "{anime}" }},\n'

new_content += '''];

const categories = ['MELEE', 'ESPADA', 'MAGIA'];
'''

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('data.js actualizado con títulos de wikis!')
print(f'Total personajes: {len(matches)}')

# Mostrar ejemplos
print('\nEjemplos:')
for name in ['Monkey D. Luffy', 'Satoru Gojo', 'Saber', 'Naruto Uzumaki', 'Son Goku']:
    if name in scraped_data:
        title = scraped_data[name].get('title', 'N/A')
        print(f'  {name}: {title}')
