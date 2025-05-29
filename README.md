# 🎮 QuizByte API

Esta API proporciona endpoints para realizar búsquedas de videojuegos en la base de datos de IGDB y generar descripciones utilizando **Google Gemini**, incluyendo soporte para procesamiento de imágenes.

## 🚀 Tecnologías Utilizadas

- **Node.js + Express**
- **IGDB API** (vía `fetch`)
- **Google Gemini API** (texto e imagen)
- **CORS**, **dotenv**, **body-parser**

---

## Despliegue en Vercel

https://quiz-byte-api.vercel.app/ 

## 📦 Instalación

1. Clona el repositorio:

```bash
git clone https://github.com/tuusuario/quizbyte-api.git
cd quizbyte-api

```

2. 
## Endpoints

### 1. POST /question

🧠 **Descripción**:\
Genera 5 preguntas de trivia difíciles basadas en una lista de videojuegos proporcionada. Cada pregunta incluye 4 opciones (A, B, C, D) y una única respuesta correcta indicada por la letra correspondiente.

**Body**:

```json
{
  "games": ["League of Legends", "Firewatch", "Apex Legends", "The Forest", "Devil May Cry 5"]
}
```

**Respuesta esperada**:

```json
[
  {
    "pregunta": "En League of Legends, ¿qué hace el objeto 'Corazón de Hielo' además de reducir el enfriamiento y aumentar la armadura?",
    "respuestas": {
      "A": "Otorga velocidad de movimiento adicional al estar cerca de campeones enemigos.",
      "B": "Reduce la velocidad de ataque de los enemigos cercanos.",
      "C": "Causa daño mágico en área al recibir daño.",
      "D": "Aumenta la regeneración de maná basada en el daño recibido."
    },
    "respuesta_correcta": "B"
  },
  {
    "pregunta": "En Firewatch, ¿cuál es el nombre del perro que Delilah menciona pero nunca aparece físicamente en el juego?",
    "respuestas": {
      "A": "Sparky",
      "B": "Watson",
      "C": "Bojack",
      "D": "Jellystone"
    },
    "respuesta_correcta": "B"
  }
  // 3 preguntas más…
]
```

### 2. POST /image

📷 **Descripción**:\
Dado un archivo de imagen, detecta nombres de videojuegos visibles y los retorna como texto plano.

**Formato de entrada** (multipart/form-data):

- `file`: archivo de imagen (PNG, JPG, etc.)

**Respuesta esperada**:

```json
{
  "games": ["Halo", "The Last of Us Part II", "Celeste"]
}
```

### 3. POST /search

🔍 **Descripción**:\
Busca un videojuego por nombre (exacto o aproximado) en la base de datos de IGDB, devolviendo su nombre y URL de la portada. Se limita a 20 resultados y excluye categorías irrelevantes como mods, ports, expansiones, etc.

**Consulta (IGDB API)**:

```
search "${query}";
fields name, cover.url;
where category != (3, 11, 12, 13);
limit 20;
```

**Body**:

```json
{
  "query": "Halo"
}
```

**Respuesta esperada**:

```json
[
  {
    "name": "Halo: Combat Evolved",
    "imageUrl": "https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg"
  },
  {
    "name": "Halo 3",
    "imageUrl": "https://images.igdb.com/igdb/image/upload/t_cover_big/xyz456.jpg"
  }
  // hasta 20 resultados…
]
```

**Categorías excluidas**:

- 3: Expansion
- 11: DLC / Addon
- 12: Bundle
- 13: Standalone expansion

## 📌 Notas adicionales

- Los resultados de `/question` están diseñados para trivias difíciles, por lo que pueden contener detalles muy específicos.
- La extracción visual de `/image` se basa en detección OCR combinada con modelos de lenguaje para extraer nombres probables de juegos.
- La API utiliza la base de datos de IGDB para búsquedas y portadas.00
