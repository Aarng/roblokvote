import requests
from bs4 import BeautifulSoup
import json
import time
import re
from urllib.parse import quote

# Mapeo de personajes a sus URLs de wiki específicas
CHARACTER_WIKI_URLS = {
    # One Piece
    'Monkey D. Luffy': 'https://onepiece.fandom.com/wiki/Monkey_D._Luffy',
    'Roronoa Zoro': 'https://onepiece.fandom.com/wiki/Roronoa_Zoro',
    'Sanji': 'https://onepiece.fandom.com/wiki/Sanji',
    'Nami': 'https://onepiece.fandom.com/wiki/Nami',
    'Usopp': 'https://onepiece.fandom.com/wiki/Usopp',
    'Tony Tony Chopper': 'https://onepiece.fandom.com/wiki/Tony_Tony_Chopper',
    'Nico Robin': 'https://onepiece.fandom.com/wiki/Nico_Robin',
    'Franky': 'https://onepiece.fandom.com/wiki/Franky',
    'Brook': 'https://onepiece.fandom.com/wiki/Brook',
    'Jinbe': 'https://onepiece.fandom.com/wiki/Jinbe',
    'Shanks': 'https://onepiece.fandom.com/wiki/Shanks',
    'Dracule Mihawk': 'https://onepiece.fandom.com/wiki/Dracule_Mihawk',
    'Garp': 'https://onepiece.fandom.com/wiki/Monkey_D._Garp',
    'Trafalgar Law': 'https://onepiece.fandom.com/wiki/Trafalgar_D._Water_Law',
    'Kozuki Oden': 'https://onepiece.fandom.com/wiki/Kozuki_Oden',
    'Portgas D. Ace': 'https://onepiece.fandom.com/wiki/Portgas_D._Ace',
    'Enel': 'https://onepiece.fandom.com/wiki/Enel',
    'Crocodile': 'https://onepiece.fandom.com/wiki/Crocodile',
    'Aokiji': 'https://onepiece.fandom.com/wiki/Kuzan',
    'Akainu': 'https://onepiece.fandom.com/wiki/Sakazuki',
    'Kizaru': 'https://onepiece.fandom.com/wiki/Borsalino',
    'Boa Hancock': 'https://onepiece.fandom.com/wiki/Boa_Hancock',
    'Donquixote Doflamingo': 'https://onepiece.fandom.com/wiki/Donquixote_Doflamingo',
    'Eustass Kid': 'https://onepiece.fandom.com/wiki/Eustass_Kid',
    'Marco': 'https://onepiece.fandom.com/wiki/Marco',
    'Blackbeard': 'https://onepiece.fandom.com/wiki/Marshall_D._Teach',
    'Perona': 'https://onepiece.fandom.com/wiki/Perona',
    'Bartolomeo': 'https://onepiece.fandom.com/wiki/Bartolomeo',
    'Charlotte Katakuri': 'https://onepiece.fandom.com/wiki/Charlotte_Katakuri',

    # Naruto
    'Naruto Uzumaki': 'https://naruto.fandom.com/wiki/Naruto_Uzumaki',
    'Sasuke Uchiha': 'https://naruto.fandom.com/wiki/Sasuke_Uchiha',
    'Sakura Haruno': 'https://naruto.fandom.com/wiki/Sakura_Haruno',
    'Kakashi Hatake': 'https://naruto.fandom.com/wiki/Kakashi_Hatake',
    'Rock Lee': 'https://naruto.fandom.com/wiki/Rock_Lee',
    'Might Guy': 'https://naruto.fandom.com/wiki/Might_Guy',
    'Neji Hyuga': 'https://naruto.fandom.com/wiki/Neji_Hy%C5%ABga',
    'Choji Akimichi': 'https://naruto.fandom.com/wiki/Ch%C5%8Dji_Akimichi',
    'Shikamaru Nara': 'https://naruto.fandom.com/wiki/Shikamaru_Nara',
    'Ino Yamanaka': 'https://naruto.fandom.com/wiki/Ino_Yamanaka',
    'Hinata Hyuga': 'https://naruto.fandom.com/wiki/Hinata_Hy%C5%ABga',
    'Kiba Inuzuka': 'https://naruto.fandom.com/wiki/Kiba_Inuzuka',
    'Shino Aburame': 'https://naruto.fandom.com/wiki/Shino_Aburame',
    'Gaara': 'https://naruto.fandom.com/wiki/Gaara',
    'Killer Bee': 'https://naruto.fandom.com/wiki/Killer_B',

    # Dragon Ball
    'Son Goku': 'https://dragonball.fandom.com/wiki/Goku',
    'Vegeta': 'https://dragonball.fandom.com/wiki/Vegeta',
    'Broly': 'https://dragonball.fandom.com/wiki/Broly',
    'Jiren': 'https://dragonball.fandom.com/wiki/Jiren',
    'Gohan': 'https://dragonball.fandom.com/wiki/Gohan',
    'Piccolo': 'https://dragonball.fandom.com/wiki/Piccolo',

    # Jujutsu Kaisen
    'Yuji Itadori': 'https://jujutsu-kaisen.fandom.com/wiki/Yuji_Itadori',
    'Satoru Gojo': 'https://jujutsu-kaisen.fandom.com/wiki/Satoru_Gojo',
    'Megumi Fushiguro': 'https://jujutsu-kaisen.fandom.com/wiki/Megumi_Fushiguro',
    'Nobara Kugisaki': 'https://jujutsu-kaisen.fandom.com/wiki/Nobara_Kugisaki',
    'Ryomen Sukuna': 'https://jujutsu-kaisen.fandom.com/wiki/Sukuna',
    'Suguru Geto': 'https://jujutsu-kaisen.fandom.com/wiki/Suguru_Geto',
    'Mahito': 'https://jujutsu-kaisen.fandom.com/wiki/Mahito',
    'Maki Zenin': 'https://jujutsu-kaisen.fandom.com/wiki/Maki_Zenin',
    'Toji Fushiguro': 'https://jujutsu-kaisen.fandom.com/wiki/Toji_Fushiguro',
    'Aoi Todo': 'https://jujutsu-kaisen.fandom.com/wiki/Aoi_Todo',
    'Choso': 'https://jujutsu-kaisen.fandom.com/wiki/Choso',

    # Hunter x Hunter
    'Gon Freecss': 'https://hunterxhunter.fandom.com/wiki/Gon_Freecss',
    'Killua Zoldyck': 'https://hunterxhunter.fandom.com/wiki/Killua_Zoldyck',
    'Kurapika': 'https://hunterxhunter.fandom.com/wiki/Kurapika',
    'Leorio Paradinight': 'https://hunterxhunter.fandom.com/wiki/Leorio_Paradinight',
    'Hisoka Morow': 'https://hunterxhunter.fandom.com/wiki/Hisoka_Morow',
    'Isaac Netero': 'https://hunterxhunter.fandom.com/wiki/Isaac_Netero',
    'Chrollo Lucilfer': 'https://hunterxhunter.fandom.com/wiki/Chrollo_Lucilfer',
    'Uvogin': 'https://hunterxhunter.fandom.com/wiki/Uvogin',
    'Phinks': 'https://hunterxhunter.fandom.com/wiki/Phinks_Magcub',

    # Demon Slayer
    'Tanjiro Kamado': 'https://kimetsu-no-yaiba.fandom.com/wiki/Tanjiro_Kamado',
    'Nezuko Kamado': 'https://kimetsu-no-yaiba.fandom.com/wiki/Nezuko_Kamado',
    'Zenitsu Agatsuma': 'https://kimetsu-no-yaiba.fandom.com/wiki/Zenitsu_Agatsuma',
    'Inosuke Hashibira': 'https://kimetsu-no-yaiba.fandom.com/wiki/Inosuke_Hashibira',
    'Giyu Tomioka': 'https://kimetsu-no-yaiba.fandom.com/wiki/Giyu_Tomioka',
    'Kyojuro Rengoku': 'https://kimetsu-no-yaiba.fandom.com/wiki/Kyojuro_Rengoku',
    'Shinobu Kocho': 'https://kimetsu-no-yaiba.fandom.com/wiki/Shinobu_Kocho',
    'Muichiro Tokito': 'https://kimetsu-no-yaiba.fandom.com/wiki/Muichiro_Tokito',
    'Akaza': 'https://kimetsu-no-yaiba.fandom.com/wiki/Akaza',

    # My Hero Academia
    'Izuku Midoriya': 'https://myheroacademia.fandom.com/wiki/Izuku_Midoriya',
    'Katsuki Bakugo': 'https://myheroacademia.fandom.com/wiki/Katsuki_Bakugo',
    'Shoto Todoroki': 'https://myheroacademia.fandom.com/wiki/Shoto_Todoroki',
    'All Might': 'https://myheroacademia.fandom.com/wiki/Toshinori_Yagi',
    'Ochaco Uraraka': 'https://myheroacademia.fandom.com/wiki/Ochaco_Uraraka',
    'Tenya Iida': 'https://myheroacademia.fandom.com/wiki/Tenya_Ida',
    'Tsuyu Asui': 'https://myheroacademia.fandom.com/wiki/Tsuyu_Asui',
    'Eijiro Kirishima': 'https://myheroacademia.fandom.com/wiki/Eijiro_Kirishima',
    'Momo Yaoyorozu': 'https://myheroacademia.fandom.com/wiki/Momo_Yaoyorozu',
    'Denki Kaminari': 'https://myheroacademia.fandom.com/wiki/Denki_Kaminari',

    # Bleach
    'Ichigo Kurosaki': 'https://bleach.fandom.com/wiki/Ichigo_Kurosaki',
    'Rukia Kuchiki': 'https://bleach.fandom.com/wiki/Rukia_Kuchiki',
    'Orihime Inoue': 'https://bleach.fandom.com/wiki/Orihime_Inoue',
    'Uryu Ishida': 'https://bleach.fandom.com/wiki/Ury%C5%AB_Ishida',
    'Renji Abarai': 'https://bleach.fandom.com/wiki/Renji_Abarai',
    'Byakuya Kuchiki': 'https://bleach.fandom.com/wiki/Byakuya_Kuchiki',
    'Kenpachi Zaraki': 'https://bleach.fandom.com/wiki/Kenpachi_Zaraki',
    'Toshiro Hitsugaya': 'https://bleach.fandom.com/wiki/T%C5%8Dshir%C5%8D_Hitsugaya',
    'Kisuke Urahara': 'https://bleach.fandom.com/wiki/Kisuke_Urahara',

    # Attack on Titan
    'Eren Yeager': 'https://attackontitan.fandom.com/wiki/Eren_Yeager',
    'Mikasa Ackerman': 'https://attackontitan.fandom.com/wiki/Mikasa_Ackermann',
    'Armin Arlert': 'https://attackontitan.fandom.com/wiki/Armin_Arlert',
    'Levi Ackerman': 'https://attackontitan.fandom.com/wiki/Levi_Ackermann',
    'Erwin Smith': 'https://attackontitan.fandom.com/wiki/Erwin_Smith',

    # One Punch Man
    'Saitama': 'https://onepunchman.fandom.com/wiki/Saitama',
    'Genos': 'https://onepunchman.fandom.com/wiki/Genos',
    'Garou': 'https://onepunchman.fandom.com/wiki/Garou',
    'Tatsumaki': 'https://onepunchman.fandom.com/wiki/Tatsumaki',

    # Chainsaw Man
    'Denji': 'https://chainsaw-man.fandom.com/wiki/Denji',
    'Power': 'https://chainsaw-man.fandom.com/wiki/Power',
    'Makima': 'https://chainsaw-man.fandom.com/wiki/Makima',

    # Black Clover
    'Asta': 'https://blackclover.fandom.com/wiki/Asta',
    'Yuno': 'https://blackclover.fandom.com/wiki/Yuno',
    'Noelle Silva': 'https://blackclover.fandom.com/wiki/Noelle_Silva',
    'Yami Sukehiro': 'https://blackclover.fandom.com/wiki/Yami_Sukehiro',

    # Fairy Tail
    'Natsu Dragneel': 'https://fairytail.fandom.com/wiki/Natsu_Dragneel',
    'Lucy Heartfilia': 'https://fairytail.fandom.com/wiki/Lucy_Heartfilia',
    'Erza Scarlet': 'https://fairytail.fandom.com/wiki/Erza_Scarlet',
    'Gray Fullbuster': 'https://fairytail.fandom.com/wiki/Gray_Fullbuster',

    # Sword Art Online
    'Kirito': 'https://swordartonline.fandom.com/wiki/Kirigaya_Kazuto',
    'Asuna Yuuki': 'https://swordartonline.fandom.com/wiki/Yuuki_Asuna',

    # Re:Zero
    'Subaru Natsuki': 'https://rezero.fandom.com/wiki/Natsuki_Subaru',
    'Emilia': 'https://rezero.fandom.com/wiki/Emilia',
    'Rem': 'https://rezero.fandom.com/wiki/Rem',
    'Ram': 'https://rezero.fandom.com/wiki/Ram',

    # Overlord
    'Ainz Ooal Gown': 'https://overlordmaruyama.fandom.com/wiki/Ainz_Ooal_Gown',
    'Albedo': 'https://overlordmaruyama.fandom.com/wiki/Albedo',

    # Seven Deadly Sins
    'Meliodas': 'https://nanatsu-no-taizai.fandom.com/wiki/Meliodas',
    'Elizabeth Liones': 'https://nanatsu-no-taizai.fandom.com/wiki/Elizabeth_Liones',
    'Ban': 'https://nanatsu-no-taizai.fandom.com/wiki/Ban',
    'Diane': 'https://nanatsu-no-taizai.fandom.com/wiki/Diane',
    'King': 'https://nanatsu-no-taizai.fandom.com/wiki/King',

    # JoJo
    'Jotaro Kujo': 'https://jojo.fandom.com/wiki/Jotaro_Kujo',
    'Dio Brando': 'https://jojo.fandom.com/wiki/Dio_Brando',
    'Giorno Giovanna': 'https://jojo.fandom.com/wiki/Giorno_Giovanna',

    # Fate
    'Saber': 'https://typemoon.fandom.com/wiki/Artoria_Pendragon',
    'Gilgamesh': 'https://typemoon.fandom.com/wiki/Gilgamesh',

    # Mushoku Tensei
    'Rudeus Greyrat': 'https://mushokutensei.fandom.com/wiki/Rudeus_Greyrat',
    'Roxy Migurdia': 'https://mushokutensei.fandom.com/wiki/Roxy_Migurdia',
    'Eris Boreas Greyrat': 'https://mushokutensei.fandom.com/wiki/Eris_Boreas_Greyrat',

    # Slime
    'Rimuru Tempest': 'https://tensura.fandom.com/wiki/Rimuru_Tempest',
    'Milim Nava': 'https://tensura.fandom.com/wiki/Milim_Nava',

    # Berserk
    'Guts': 'https://berserk.fandom.com/wiki/Guts',
    'Griffith': 'https://berserk.fandom.com/wiki/Griffith',

    # Inuyasha
    'Inuyasha': 'https://inuyasha.fandom.com/wiki/Inuyasha',
    'Sesshomaru': 'https://inuyasha.fandom.com/wiki/Sessh%C5%8Dmaru',
    'Kagome Higurashi': 'https://inuyasha.fandom.com/wiki/Kagome_Higurashi',

    # Madoka Magica
    'Madoka Kaname': 'https://madoka.fandom.com/wiki/Madoka_Kaname',
    'Homura Akemi': 'https://madoka.fandom.com/wiki/Homura_Akemi',
    'Mami Tomoe': 'https://madoka.fandom.com/wiki/Mami_Tomoe',

    # Sailor Moon
    'Sailor Moon': 'https://sailormoon.fandom.com/wiki/Usagi_Tsukino',

    # Dorohedoro
    'Kaiman': 'https://dorohedoro.fandom.com/wiki/Kaiman',
    'Nikaido': 'https://dorohedoro.fandom.com/wiki/Nikaido',

    # Vinland Saga
    'Thorfinn': 'https://vinlandsaga.fandom.com/wiki/Thorfinn',
    'Askeladd': 'https://vinlandsaga.fandom.com/wiki/Askeladd',

    # Konosuba
    'Kazuma Satou': 'https://konosuba.fandom.com/wiki/Satou_Kazuma',
    'Megumin': 'https://konosuba.fandom.com/wiki/Megumin',
    'Aqua': 'https://konosuba.fandom.com/wiki/Aqua',
    'Darkness': 'https://konosuba.fandom.com/wiki/Dustiness_Ford_Lalatina',

    # Frieren
    'Frieren': 'https://frieren.fandom.com/wiki/Frieren',

    # Mashle
    'Mash Burnedead': 'https://mashle.fandom.com/wiki/Mash_Burnedead',

    # Undead Unluck
    'Andy': 'https://undead-unluck.fandom.com/wiki/Andy',
    'Fuuko Izumo': 'https://undead-unluck.fandom.com/wiki/Fuuko_Izumo',

    # Baki
    'Baki Hanma': 'https://baki.fandom.com/wiki/Baki_Hanma',
    'Yujiro Hanma': 'https://baki.fandom.com/wiki/Yujiro_Hanma',
}

# Titulos personalizados para personajes
CHARACTER_TITLES = {
    'Monkey D. Luffy': 'Capitan de los Piratas del Sombrero de Paja',
    'Roronoa Zoro': 'Espadachin Pirata / Cazador de Piratas',
    'Sanji': 'Pierna Negra / Cocinero Pirata',
    'Nami': 'Gata Ladrona / Navegante',
    'Shanks': 'El Pelirrojo / Emperador del Mar',
    'Dracule Mihawk': 'Ojos de Halcon / Mejor Espadachin del Mundo',
    'Garp': 'El Heroe de la Marina / Puño del Dragon',
    'Trafalgar Law': 'Cirujano de la Muerte / Capitan de los Piratas Heart',
    'Portgas D. Ace': 'Puño de Fuego / Comandante de los Piratas de Barbablanca',
    'Kozuki Oden': 'Daimyo de Kuri / Oden Kozuki',
    'Enel': 'Dios de Skypiea',
    'Crocodile': 'Mr. 0 / Rey del Desierto',
    'Aokiji': 'El Perro Pardo Azul / Almirante de Hielo',
    'Akainu': 'El Perro Rojo / Almirante de Magma',
    'Kizaru': 'El Mono Amarillo / Almirante de Luz',
    'Boa Hancock': 'La Emperatriz Pirata / Princesa Serpiente',
    'Donquixote Doflamingo': 'Joker / Rey de Dressrosa',
    'Eustass Kid': 'Capitan Kid / Pirata con Recompensa Alta',
    'Marco': 'El Fénix / Comandante de Barbablanca',
    'Blackbeard': 'Marshall D. Teach / Emperador de las Tinieblas',
    'Charlotte Katakuri': 'El Hombre de los 300 Millones / Comandante Dulce',

    # Naruto
    'Naruto Uzumaki': 'Septimo Hokage / Ninja Numero 1 Hiperactivo',
    'Sasuke Uchiha': 'Sombra del Sexto Hokage / Uchiha del Sharingan',
    'Rock Lee': 'Especialista en Taijutsu / Ceja Maravillosa',
    'Might Guy': 'El Ninja Mas Fuerte de Konoha / Maestro de Taijutsu',
    'Neji Hyuga': 'Genio del Clan Hyuga / Jutsu de Ocho Trigramas',
    'Choji Akimichi': 'Cabeza de Mariposa / Maestro del Modo Calorias',

    # Dragon Ball
    'Son Goku': 'Super Saiyan / Guerrero Legendario',
    'Vegeta': 'Principe de los Saiyans / El Orgulloso Guerrero',
    'Broly': 'Super Saiyan Legendario / El Saiyan Exiliado',
    'Jiren': 'Guerrero del Universo 11 / El Gris',
    'Gohan': 'El Gran Saiyaman / Hijo de Goku',
    'Piccolo': 'Namekusei Demonio / Maestro de Gohan',

    # Jujutsu Kaisen
    'Satoru Gojo': 'El Chaman Mas Fuerte / Profesor de Jujutsu',
    'Yuji Itadori': 'Recipiente de Sukuna / Estudiante de Primero',
    'Megumi Fushiguro': 'Usuario de Tecnicas de Sombras / Estudiante',
    'Nobara Kugisaki': 'Chaman de Maldiciones / Estudiante',
    'Ryomen Sukuna': 'Rey de las Maldiciones / La Bestia de 4 Brazos',
    'Maki Zenin': 'Semibruta del Clan Zenin / Especialista en Armas',
    'Toji Fushiguro': 'El Asesino de Chaman / El Sin Energia Maldita',
    'Aoi Todo': 'Chaman de Grado Especial / Mejor Amigo de Todo',

    # Hunter x Hunter
    'Gon Freecss': 'Aspirante a Cazador / Hijo de Ging',
    'Killua Zoldyck': 'Asesino de la Familia Zoldyck / Usuario de Nen',
    'Kurapika': 'Sobreviviente del Clan Kurta / Cazador de Ojos Escarlata',
    'Hisoka Morow': 'El Mago / Cazador de Pleitos',
    'Chrollo Lucilfer': 'Jefe de la Brigada Fantasma / Ladron de Habilidades',

    # Demon Slayer
    'Tanjiro Kamado': 'Cazador de Demonios / Usuario de Respiracion del Sol',
    'Nezuko Kamado': 'Demonio Protectora / Hermana de Tanjiro',
    'Zenitsu Agatsuma': 'Cazador de Demonios / Maestro de la Respiracion del Rayo',
    'Inosuke Hashibira': 'Cazador de Demonios / Usuario de Respiracion de la Bestia',
    'Giyu Tomioka': 'Pilar del Agua / Cazador de Demonios',
    'Kyojuro Rengoku': 'Pilar de las Llamas / Cazador de Demonios',
    'Shinobu Kocho': 'Pilar del Insecto / Cazadora de Demonios',
    'Akaza': 'Luna Superior Tres / Demonio de Alto Rango',

    # My Hero Academia
    'Izuku Midoriya': 'Deku / Heredero del One For All',
    'Katsuki Bakugo': 'Kacchan / Gran Explosion Asesina',
    'Shoto Todoroki': 'Hijo del Numero 1 / Hielo y Fuego',
    'All Might': 'El Simbolo de la Paz / Numero 1 Heroe',
    'Ochaco Uraraka': 'Uravity / Heroe Gravedad Cero',

    # Bleach
    'Ichigo Kurosaki': 'Sustituto de Shinigami / Vizard',
    'Byakuya Kuchiki': 'Capitan del 6to Escuadron / Nobleza de la Sociedad de Almas',
    'Kenpachi Zaraki': 'Capitan del 11vo Escuadron / El Espadachin Mas Fuerte',
    'Toshiro Hitsugaya': 'Capitan del 10mo Escuadron / Hyorinmaru',
    'Kisuke Urahara': 'Ex-Capitan del 12vo Escuadron / Inventor',

    # Attack on Titan
    'Eren Yeager': 'Portador del Titan de Ataque / Fundador',
    'Mikasa Ackerman': 'Los Ackerman / Soldado Elite',
    'Levi Ackerman': 'Capitan / Soldado Mas Fuerte de la Humanidad',

    # One Punch Man
    'Saitama': 'Caped Baldy / One Punch Man',
    'Genos': 'Demon Cyborg / Estudiante de Saitama',
    'Garou': 'El Cazador de Heroes / Human Monster',

    # Chainsaw Man
    'Denji': 'Chainsaw Man / Cazador de Demonios Hibrido',
    'Power': 'Demonio de la Sangre / Cazadora de Demonios',

    # Black Clover
    'Asta': 'Usuario Anti-Magia / Sin Magia',
    'Yuno': 'Usuario de Magia de Viento / El Cisne de Cuatro Hojas',
    'Noelle Silva': 'Usuario de Magia de Agua / Princesa de la Casa Silva',
    'Yami Sukehiro': 'Capitan de los Toros Negros / Magia de Oscuridad',

    # Fairy Tail
    'Natsu Dragneel': 'Dragon Slayer de Fuego / Salamander',
    'Lucy Heartfilia': 'Maga de Espiritus Celestiales',
    'Erza Scarlet': 'Reina de las Fadas / Caballero Fairy Tail',
    'Gray Fullbuster': 'Mago del Hielo Demonio Devastador',

    # Sword Art Online
    'Kirito': 'El Espadachin Negro / Beta Tester',
    'Asuna Yuuki': 'Flash / Sub-Lider de los Caballeros de la Sangre',

    # Re:Zero
    'Subaru Natsuki': 'Retornado por la Muerte / Caballero de Emilia',
    'Emilia': 'Semibruta de Hielo / Candidata a Reina',
    'Rem': 'Sirviente Oni / Gemela de Ram',

    # Overlord
    'Ainz Ooal Gown': 'Rey Hechicero / Lider de Nazarick',
    'Albedo': 'Guardiana de los NPCs / Amor Obsesivo',

    # Seven Deadly Sins
    'Meliodas': "Dragon's Sin of Wrath / Capitan de los Pecados",
    'Ban': 'Fox''s Sin of Greed / Ladron Inmortal',
    'Diane': "Serpent's Sin of Envy / Giganta",
    'King': "Grizzly's Sin of Sloth / Rey de las Hadas",

    # JoJo
    'Jotaro Kujo': 'Star Platinum / Jotaro de las Estrellas',
    'Dio Brando': 'The World / Vampiro Inmortal',
    'Giorno Giovanna': 'Gold Experience / Sueno es ser Gang-Star',

    # Fate
    'Saber': 'Rey Arturo / Caballero de la Espada',
    'Gilgamesh': 'Rey de los Heroes / Puertas de Babilonia',

    # Mushoku Tensei
    'Rudeus Greyrat': 'Mago Renaciente / Ojos Demoniacos',
    'Roxy Migurdia': 'Maga Migurd / Maestra de Rudeus',

    # Slime
    'Rimuru Tempest': 'Monarca Demonio / Slime Reencarnado',
    'Milim Nava': 'Uno de los Ocho Demonios / Dragona Destructora',

    # Berserk
    'Guts': 'El Espadachin Negro / Portador de Dragonslayer',
    'Griffith': 'Femto / Lider de la Banda del Halcon',

    # Inuyasha
    'Inuyasha': 'Hanyo / Medio Demonio',
    'Sesshomaru': 'Senor de los Demonios / Hermano de Inuyasha',

    # Madoka Magica
    'Madoka Kaname': 'Dios de las Chicas Magicas',
    'Homura Akemi': 'Chica Magica del Tiempo',

    # Sailor Moon
    'Sailor Moon': 'Soldado de la Justicia / Usagi Tsukino',

    # Konosuba
    'Megumin': 'Archimaga Explosion / Clan Carmine',
    'Aqua': 'Diosa del Agua / Arquiprieta',

    # Frieren
    'Frieren': 'Maga Elfica / Viajera Eterna',

    # Mashle
    'Mash Burnedead': 'Sin Magia / Musculos Magicos',

    # Undead Unluck
    'Andy': 'Indestructible / Unluck',
    'Fuuko Izumo': 'Desafortunada / Usuario de Unluck',

    # Baki
    'Baki Hanma': 'El Campeon / Hijo del Ogro',
    'Yujiro Hanma': 'El Ogro / El Mas Fuerte de la Tierra',
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

def scrape_wiki_page(url, char_name):
    """Scrapea informacion de una pagina de wiki"""
    try:
        response = requests.get(url, headers=headers, timeout=15)

        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, 'html.parser')

        data = {
            'url': url,
            'source': 'Fandom Wiki'
        }

        # Buscar infobox - diferentes formatos
        infobox = None

        # Opcion 1: aside portable-infobox
        infobox = soup.find('aside', class_='portable-infobox')

        # Opcion 2: table infobox
        if not infobox:
            infobox = soup.find('table', {'class': lambda x: x and 'infobox' in x.lower()})

        # Opcion 3: div infobox
        if not infobox:
            infobox = soup.find('div', {'class': lambda x: x and 'infobox' in x.lower()})

        if infobox:
            # Extraer datos de la infobox
            # Buscar todos los elementos que contienen etiquetas y valores
            rows = infobox.find_all(['tr', 'div', 'section'])

            for row in rows:
                # Buscar label
                label_elem = row.find(['th', 'h3', 'b', 'dt']) or row.find(class_=lambda x: x and 'label' in str(x).lower())
                value_elem = row.find(['td', 'dd', 'div', 'span']) or row.find(class_=lambda x: x and 'value' in str(x).lower())

                if label_elem and value_elem:
                    label = label_elem.get_text(strip=True).lower()
                    value = value_elem.get_text(strip=True)

                    # Limpiar valor
                    value = re.sub(r'\[.*?\]', '', value)  # Remover [citation needed] etc
                    value = re.sub(r'\s+', ' ', value)

                    if 'age' in label:
                        data['age'] = value[:50]
                    elif 'height' in label:
                        data['height'] = value[:50]
                    elif 'weight' in label:
                        data['weight'] = value[:50]
                    elif 'birthday' in label or 'birth date' in label:
                        data['birthday'] = value[:50]
                    elif 'status' in label:
                        data['status'] = value[:50]
                    elif any(x in label for x in ['occupation', 'affiliation', 'job', 'profession']):
                        data['occupation'] = value[:80]
                    elif any(x in label for x in ['alias', 'epithet', 'other names', 'also known as']):
                        data['alias'] = value[:80]
                    elif 'debut' in label:
                        data['debut'] = value[:50]

        # Extraer descripcion del primer parrafo
        content = soup.find('div', {'class': ['mw-parser-output', 'mw-body-content']})
        if content:
            # Buscar el primer parrafo que tenga texto sustancial
            for elem in content.find_all(['p', 'div'], recursive=False):
                text = elem.get_text(strip=True)
                # Filtrar parrafos muy cortos o de navegacion
                if len(text) > 40 and not text.startswith('This article') and not text.startswith('For other uses'):
                    # Limpiar texto
                    text = re.sub(r'\[\d+\]', '', text)  # Remover referencias
                    text = re.sub(r'\s+', ' ', text)
                    data['description'] = text[:350] + ('...' if len(text) > 350 else '')
                    break

        return data

    except Exception as e:
        print(f"    Error: {str(e)[:60]}")
        return None

def main():
    # Cargar datos existentes
    with open('characters_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    print("Scrapeando wikis de Fandom para obtener titulos y datos...")
    print("=" * 70)

    updated_count = 0
    failed_count = 0

    for i, (char_name, char_data) in enumerate(data.items()):
        anime = char_data.get('anime_title', '')

        # Verificar si tenemos URL de wiki
        wiki_url = CHARACTER_WIKI_URLS.get(char_name)

        print(f"[{i+1}/{len(data)}] {char_name[:30]:<30}", end=' ')

        # Obtener titulo personalizado
        title = CHARACTER_TITLES.get(char_name)

        if wiki_url:
            # Scrapear la wiki
            wiki_data = scrape_wiki_page(wiki_url, char_name)

            if wiki_data:
                # Actualizar datos
                if wiki_data.get('height'):
                    char_data['height'] = wiki_data['height']
                if wiki_data.get('age'):
                    char_data['age'] = wiki_data['age']
                if wiki_data.get('alias'):
                    char_data['alias'] = wiki_data['alias']
                if wiki_data.get('occupation'):
                    char_data['occupation'] = wiki_data['occupation']
                if wiki_data.get('description'):
                    char_data['wiki_description'] = wiki_data['description']

                # Usar alias como titulo si no tenemos uno personalizado
                if not title and wiki_data.get('alias'):
                    title = wiki_data['alias'].split(',')[0][:40]

                updated_count += 1
                print(f"[OK] Wiki scrapeada")
            else:
                failed_count += 1
                print(f"[WIKI FAIL]")
        else:
            print(f"[NO WIKI] Usando titulo generico")

        # Asignar titulo
        if not title:
            title = f"Personaje de {anime[:20]}"

        char_data['title'] = title

        # Crear descripcion formateada
        desc_parts = []
        if char_data.get('height'):
            desc_parts.append(f"{char_data['height']}")
        if char_data.get('age'):
            desc_parts.append(f"{char_data['age']}")
        desc_parts.append(f"{title}")

        char_data['formatted_info'] = ' | '.join(desc_parts[:3])

        # Guardar progreso cada 10
        if (i + 1) % 10 == 0:
            with open('characters_data.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"\n  [SAVE] Progreso guardado: {i+1}/{len(data)}\n")

        time.sleep(0.7)

    # Guardar final
    with open('characters_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 70)
    print(f"Completado!")
    print(f"Wikis scrapeadas: {updated_count}")
    print(f"Sin wiki: {failed_count}")

if __name__ == '__main__':
    main()
