import { GoogleGenAI } from "@google/genai";
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
5. Tu DOIS générer une réponse au format JSON STRICT.
6. N'ajoute PAS de balises markdown (comme \`\`\`json) autour de la réponse si possible, ou assure-toi que le JSON est valide à l'intérieur.

STRUCTURE JSON ATTENDUE :
{
  "articles": [
    {
      "titre": "Titre accrocheur",
      "categorie": "Burkina Faso" | "Afrique" | "International",
      "resume": "Résumé complet en 5-7 phrases.",
      "pointsCles": ["Point 1", "Point 2", "Point 3"],
      "contexte": "Contexte bref.",
      "sources": ["Source 1", "Source 2"],
      "niveauFiabilite": "Élevé" | "Moyen" | "Faible",
      "justificationFiabilite": "...",
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

  // Utilisation de gemini-3-flash-preview sans responseSchema strict pour compatibilité avec Google Search
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      // Note: On ne met PAS responseSchema ni responseMimeType: "application/json" 
      // car cela cause souvent des erreurs 400 ou des formats invalides quand combiné avec Search.
    },
  });

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