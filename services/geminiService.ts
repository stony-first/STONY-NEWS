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
  if (!apiKey || apiKey.includes("undefined")) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = topic 
    ? `Recherche les dernières actualités importantes concernant : "${topic}". Trouve des sources fiables et résume les points essentiels. Classifie chaque news selon sa région géographique.` 
    : `Quelles sont les actualités majeures et vérifiées des dernières 24h au Burkina Faso, en Afrique et dans le monde (international) ?`;

  let response;
  try {
    // Utilisation de gemini-3-flash-preview sans responseSchema strict pour compatibilité avec Google Search
    response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        // Note: On ne met PAS responseSchema ni responseMimeType: "application/json" 
        // car cela cause souvent des erreurs 400 ou des formats invalides quand combiné avec Search.
      },
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (
      error.message?.includes("429") || 
      error.message?.includes("quota") || 
      error.message?.includes("RESOURCE_EXHAUSTED") ||
      error.status === 429
    ) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }

  let text = response.text;
  if (!text) {
    throw new Error("Aucune réponse de l'IA (texte vide).");
  }

  // Nettoyage robuste du JSON (suppression des balises markdown ```json ... ```)
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();
  
  // Extraction de la partie JSON si le modèle a ajouté du texte avant/après
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    text = text.substring(start, end + 1);
  }

  try {
    const data = JSON.parse(text) as NewsFeed;
    
    // Validation basique
    if (!data.articles || !Array.isArray(data.articles)) {
        throw new Error("Structure JSON invalide reçue.");
    }
    
    return data;
  } catch (e) {
    console.error("Erreur parsing JSON:", text);
    throw new Error("Le format des actualités reçu est incorrect.");
  }
};