import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import fetch from "node-fetch"; // Asegúrate de tener esto si estás usando Node < 18
import { Buffer } from "buffer";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

dotenv.config();
const app = express();
const PORT = 3001;

app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());

app.post("/search", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Falta el término de búsqueda." });
  }

  try {
    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${process.env.IGDB_ACCESS_TOKEN}`,
        "Content-Type": "text/plain",
      },
      body: `search "${query}"; fields name,cover.url; where category != (3,11,12,13) ;limit 20;`,
    });

    const igdbData = await response.json();

    const simplifiedResults = igdbData.map((item) => ({
      name: item.name,
      imageUrl: item.cover
        ? `https:${item.cover.url.replace("t_thumb", "t_cover_big")}`
        : null,
    }));

    res.json(simplifiedResults);
  } catch (err) {
    console.error("Error al buscar en IGDB:", err);
    res.status(500).json({ error: "Error al buscar en IGDB" });
  }
});

app.post("/searchImage", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Falta el término de búsqueda." });
  }

  try {
    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID,
        Authorization: `Bearer ${process.env.IGDB_ACCESS_TOKEN}`,
        "Content-Type": "text/plain",
      },
      body: `fields name, cover.url; where name = "${query}" & category != (3,5,11,12,13); ; limit 1;`,
    });

    const igdbData = await response.json();

    const simplifiedResults = igdbData.map((item) => ({
      name: item.name,
      imageUrl: item.cover
        ? `https:${item.cover.url.replace("t_thumb", "t_cover_big")}`
        : null,
    }));

    res.json(simplifiedResults);
  } catch (err) {
    console.error("Error al buscar en IGDB:", err);
    res.status(500).json({ error: "Error al buscar en IGDB" });
  }
});

app.post("/geminiText", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sin respuesta";

    res.json({ text });
  } catch (error) {
    console.error("Error en /geminiText:", error);
    res.status(500).json({ error: "Error al comunicarse con Gemini" });
  }
});

app.post("/gemini-vision", async (req, res) => {
  const { prompt, imageBase64 } = req.body;

  if (!prompt || !imageBase64) {
    return res.status(400).json({ error: "Faltan el prompt o la imagen." });
  }

  try {
    // Validate base64 data
    const buffer = Buffer.from(imageBase64, "base64");
    console.log("Buffer length:", buffer.length);

    // Use inlineData instead of file upload
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg", // Adjust if needed (e.g., image/png)
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sin respuesta";

    if (text === "Sin respuesta") {
      console.log(
        "Full Gemini API response:",
        JSON.stringify(response, null, 2)
      );
    }

    const searchResponse = await fetch(`http://localhost:${PORT}/searchImage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text }),
    });

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error("Search endpoint error:", errorData);
      return res.status(searchResponse.status).json({
        error: "Error al buscar detalles del juego",
        details: errorData,
      });
    }

    const searchResults = await searchResponse.json();
    console.log(searchResults);
    res.json({ searchResults });
  } catch (error) {
    console.error("Error en /gemini-vision:", error);
    res.status(500).json({
      error: "Error al comunicarse con Gemini Vision",
      details: error.message,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
