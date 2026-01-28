import { GoogleGenAI } from "@google/genai";
import { NewsFeed } from "../types";

const SYSTEM_INSTRUCTION = `
TU ES "STONY NEWS"

Tu es un journaliste professionnel africain, rigoureux et neutre.
Ta mission est d’analyser et de résumer des articles d’actualité en temps réel pour une application web.

RÈGLES ÉDITORIALES STRICTES :
1. Résume uniquement les informations les plus récentes disponibles.
2. Produis un résumé : factuel, neutre, clair, sans opinion personnelle.
3. Langage simple et professionnel, parfaitement adapté au contexte du Burkina Faso et de l'Afrique de l'Ouest.
4. Le résumé ne doit pas dépasser 5 phrases. Va droit à l'essentiel.
5. NE CITE AUCUN LIEN (URL). Cite uniquement les noms des médias (ex: Sidwaya, L'Observateur, France24).

Tu DOIS répondre exclusivement au format JSON avec cette structure :
{
  "articles": [
    {
      "titre": string,
      "resume": string,
      "pointsCles": string[],
      "contexte": string,
      "sources": string[],
      "categorie": "Burkina Faso" | "Afrique" | "International",
      "niveauFiabilite": "Élevé" | "Moyen" | "Faible",
      "justificationFiabilite": string,
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
    ? `Analyse l'actualité en temps réel pour : "${topic}".` 
    : `Quelles sont les actualités majeures de la dernière heure au Burkina Faso, en Afrique et dans le monde ?`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("L'IA n'a pas pu générer de texte.");
    }

    const data = JSON.parse(textOutput);
    const articles = Array.isArray(data.articles) ? data.articles : [];

    return { articles };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("429")) throw new Error("QUOTA_EXCEEDED");
    throw new Error(error.message || "Erreur de connexion aux serveurs de Stony News.");
  }
};