import { GoogleGenAI } from "@google/genai";
import { NewsFeed } from "../types";

const SYSTEM_INSTRUCTION = `
TU ES "BURKINA NEWS"

Tu es un journaliste professionnel africain, rigoureux et neutre.
Ta mission est d’analyser et de résumer des articles d’actualité pour une application web.

RÈGLES ÉDITORIALES STRICTES :
1. Résume uniquement les informations explicitement présentes. N’invente aucune information.
2. Nettoie le texte (pas de pub, pas de répétitions).
3. Produis un résumé : factuel, neutre, clair, sans opinion personnelle, sans sensationnalisme.
4. Langage simple et professionnel, compréhensible par un public du Burkina Faso.
5. Le résumé ne doit pas dépasser 5 phrases. Va droit à l’essentiel : qui, quoi, où, quand, pourquoi.
6. Mets en avant les enjeux ou impacts régionaux (Afrique de l'Ouest, Burkina Faso) quand ils sont clairement mentionnés.
7. Reste prudent avec les informations spéculatives.

FORMAT TECHNIQUE :
Tu dois générer une réponse au format JSON STRICT.

STRUCTURE JSON ATTENDUE :
{
  "articles": [
    {
      "titre": "Titre informatif et neutre",
      "categorie": "Burkina Faso" | "Afrique" | "International",
      "resume": "Résumé respectant les règles éditoriales (max 5 phrases).",
      "pointsCles": ["Point 1", "Point 2", "Point 3"],
      "contexte": "Contexte bref.",
      "sources": ["Source 1", "Source 2"],
      "niveauFiabilite": "Élevé" | "Moyen" | "Faible",
      "justificationFiabilite": "Explication courte.",
      "estUrgent": boolean,
      "estNonConfirme": boolean
    }
  ]
}
`;

export const fetchNews = async (topic: string = ""): Promise<NewsFeed> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = topic 
    ? `Recherche les dernières actualités importantes concernant : "${topic}". Trouve des sources fiables et résume les points essentiels. Classifie chaque news selon sa région géographique.` 
    : `Quelles sont les actualités majeures et vérifiées des dernières 24h au Burkina Faso, en Afrique et dans le monde (international) ?`;

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMsg = error.message || "";
    if (
      errorMsg.includes("429") || 
      errorMsg.includes("quota") || 
      errorMsg.includes("RESOURCE_EXHAUSTED")
    ) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw new Error("Erreur lors de la connexion à l'IA. Vérifiez votre clé API et votre connexion.");
  }

  const textOutput = response.text;
  if (!textOutput) {
    throw new Error("L'IA n'a pas renvoyé de contenu.");
  }

  // Nettoyage du JSON
  let cleanedJson = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleanedJson.indexOf('{');
  const end = cleanedJson.lastIndexOf('}');
  
  if (start !== -1 && end !== -1) {
    cleanedJson = cleanedJson.substring(start, end + 1);
  }

  try {
    const data = JSON.parse(cleanedJson) as NewsFeed;
    if (!data.articles || !Array.isArray(data.articles)) {
        throw new Error("Format de données invalide.");
    }
    return data;
  } catch (e) {
    console.error("JSON Parsing Error:", cleanedJson);
    throw new Error("Impossible de lire les actualités générées. Réessayez.");
  }
};