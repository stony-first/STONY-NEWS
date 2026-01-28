import { GoogleGenAI, Type } from "@google/genai";
import { NewsFeed } from "../types";

const SYSTEM_INSTRUCTION = `
TU ES "STONY NEWS"

Tu es un rédacteur en chef IA autonome spécialisé dans l'actualité internationale, africaine et du Burkina Faso.
Ton rôle n'est PAS de discuter avec l'utilisateur, mais de générer un FLUX D'ACTUALITÉS (News Feed) précis et rigoureux.

MISSION :
1. Utilise l'outil de recherche (Google Search) pour trouver les informations les plus récentes et pertinentes.
2. Couvre l'actualité en 3 volets prioritaires : 
   - Le Burkina Faso (local)
   - L'Afrique (régional)
   - Le Monde (international majeur)
3. Sélectionne les 3 à 6 faits marquants les plus importants.
4. CLASSIFIE chaque article dans l'une de ces catégories : "Burkina Faso", "Afrique", ou "International".
5. Rédige un article synthétique pour chaque fait.

RÈGLES DE RÉDACTION :
- Style journalistique neutre, factuel et précis.
- Citer les sources.
- Ne jamais inventer.

Tu dois répondre UNIQUEMENT au format JSON structuré contenant une liste d'articles.
`;

export const fetchNews = async (topic: string = ""): Promise<NewsFeed> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = topic 
    ? `Recherche les dernières actualités importantes concernant : "${topic}". Trouve des sources fiables et résume les points essentiels. Classifie chaque news selon sa région géographique.` 
    : `Quelles sont les actualités majeures et vérifiées des dernières 24h au Burkina Faso, en Afrique et dans le monde (international) ? Trouve un équilibre entre ces régions.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          articles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                titre: { type: Type.STRING, description: "Titre journalistique accrocheur." },
                categorie: { 
                  type: Type.STRING, 
                  enum: ["Burkina Faso", "Afrique", "International"],
                  description: "Zone géographique de l'information." 
                },
                resume: { type: Type.STRING, description: "Résumé complet en 5-7 phrases." },
                pointsCles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 points clés." },
                contexte: { type: Type.STRING, description: "Contexte bref." },
                sources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Noms des médias sources." },
                niveauFiabilite: { type: Type.STRING, enum: ["Élevé", "Moyen", "Faible"] },
                justificationFiabilite: { type: Type.STRING },
                estUrgent: { type: Type.BOOLEAN },
                estNonConfirme: { type: Type.BOOLEAN }
              },
              required: ["titre", "categorie", "resume", "pointsCles", "contexte", "sources", "niveauFiabilite", "estUrgent", "estNonConfirme"]
            }
          }
        }
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from Gemini");
  }

  try {
    const data = JSON.parse(text) as NewsFeed;
    return data;
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Erreur lors de la récupération des actualités.");
  }
};