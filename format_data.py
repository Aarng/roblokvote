import json
import re

# Cargar datos originales
with open('characters_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def clean_description(desc):
    if not desc:
        return 'Personaje de anime'

    # Remover markdown de AniList (~!, **, __)
    desc = re.sub(r'~!([^!]+)!~', r'\1', desc)
    desc = re.sub(r'\*\*([^*]+)\*\*', r'\1', desc)
    desc = re.sub(r'__([^_]+)__', r'\1', desc)
    desc = re.sub(r'\*([^*]+)\*', r'\1', desc)

    # Remover URLs
    desc = re.sub(r'https?://\S+', '', desc)

    # REMOVER ENLACES DE ANILIST: [texto](url)
    desc = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', desc)

    # Limpiar espacios multiples
    desc = re.sub(r'\s+', ' ', desc).strip()

    return desc

def extract_info(desc, anime):
    """Extrae informacion clave de la descripcion"""
    # Primero limpiar
    clean = clean_description(desc)

    info_parts = []

    # Buscar altura
    height_match = re.search(r'Height:\s*(\d+)\s*cm', desc, re.IGNORECASE)
    if height_match:
        info_parts.append(f"{height_match.group(1)} cm")

    # Buscar edad
    age_match = re.search(r'Age:\s*(\d+)', desc, re.IGNORECASE)
    if age_match:
        info_parts.append(f"{age_match.group(1)} anos")

    # Buscar rango/titulo
    rank_match = re.search(r'Rank:\s*([^.;]+)', desc, re.IGNORECASE)
    if rank_match:
        rank = clean_description(rank_match.group(1)).strip()[:25]
        if rank and rank not in ['Height', 'Age']:
            info_parts.append(f"{rank}")

    # Buscar afiliacion - buscar el primer item despues de Affiliation:
    aff_match = re.search(r'Affiliation[s]?:\s*([^;\n]+)', desc, re.IGNORECASE)
    if aff_match:
        aff = clean_description(aff_match.group(1)).strip()[:25]
        # Solo agregar si no es muy largo y tiene sentido
        if aff and len(aff) < 30 and not any(x in aff.lower() for x in ['height', 'age:', 'http']):
            info_parts.append(f"{aff}")

    # Si no encontramos datos estructurados, usar descripcion corta
    if not info_parts:
        # Tomar las primeras palabras de la descripcion limpia
        words = clean.split()[:8]  # Max 8 palabras
        if words:
            short_desc = ' '.join(words)
            if len(short_desc) > 80:
                short_desc = short_desc[:77] + '...'
            return short_desc
        return f"De {anime}"

    # Unir partes, maximo 3
    result = ' | '.join(info_parts[:3])
    # Limpiar residuos
    result = result.replace('De De ', 'De ')
    result = result.replace('anos anos', 'anos')

    return result

# Procesar cada personaje
for name, char_data in data.items():
    desc = char_data.get('description', '')
    anime = char_data.get('anime_title', 'Anime')

    # Crear descripcion formateada
    char_data['short_info'] = extract_info(desc, anime)

# Guardar datos actualizados
with open('characters_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print('Datos formateados guardados!')
print('')
print('Ejemplos:')
print('-' * 50)
for name in ['Monkey D. Luffy', 'Satoru Gojo', 'Saber', 'Toji Fushiguro', 'Naruto Uzumaki']:
    if name in data:
        char = data[name]
        print(f'{name}:')
        print(f'  Info: {char.get("short_info", "")}')
        print()
