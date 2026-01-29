import { GoogleGenAI } from "@google/genai";
import { NewsFeed, GroundingSource } from "../types";

const SYSTEM_INSTRUCTION = `
TU ES LA RÉDACTION DE "STONY NEWS"

Ton identité : Stony News.
Ton rôle : Journaliste expert du Burkina Faso et de l'Afrique de l'Ouest.
Ta mission : Produire un bulletin d'information factuel, neutre et rigoureux en utilisant la recherche en ligne.

RÈGLES ÉDITORIALES :
1. Analyse plusieurs sources (AIB, Sidwaya, LeFaso.net, etc.).
2. Priorité : Burkina Faso et zone AES.
3. Résumé : 5 phrases maximum par article.
4. Fiabilité : Évalue la source. Si douteuse, marque "Niveau : Moyen/Faible".
5. Liens : Inclus TOUJOURS les URLs réelles trouvées.

FORMAT DE RÉPONSE OBLIGATOIRE (JSON PUR) :
{
  "articles": [
    {
      "titre": "Titre percutant",
      "resume": "Résumé des faits...",
      "pointsCles": ["Point 1", "Point 2"],
      "contexte": "Pourquoi c'est important",
      "sources": ["Nom Source"],
      "liens": ["URL"],
      "categorie": "Burkina Faso" | "Afrique" | "International",
      "niveauFiabilite": "Élevé" | "Moyen" | "Faible",
      "justificationFiabilite": "Brève explication",
      "estUrgent": boolean,
      "estNonConfirme": boolean
    }
  ]
}
NE RÉPONDS QUE PAR LE JSON. PAS DE TEXTE AVANT OU APRÈS. PAS DE BALISES MARKDOWN.`;

export const fetchNews = async (topic: string = ""): Promise<NewsFeed> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    throw new Error("API_KEY_MISSING");
  }

  // Utilisation de Gemini Flash Lite pour une stabilité maximale avec les outils de recherche
  const ai = new GoogleGenAI({ apiKey });

  const prompt = topic 
    ? `Rédige un bulletin STONY NEWS complet et récent sur : "${topic}". Utilise la recherche en ligne pour trouver des sources fraîches.` 
    : `Quelles sont les dernières actualités (dernières 24h) au Burkina Faso et en Afrique de l'Ouest ? Utilise la recherche pour un bulletin STONY NEWS à jour.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest", // Version plus stable pour les requêtes avec Search
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        // On ne met PAS de responseMimeType ici car cela cause souvent l'erreur 500 avec googleSearch
        temperature: 0.1,
      },
    });

    let textOutput = response.text;
    if (!textOutput) {
      throw new Error("La rédaction n'a renvoyé aucun contenu.");
    }

    // Nettoyage manuel du JSON au cas où le modèle aurait ajouté des balises
    const cleanJson = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Format de réponse invalide de la rédaction.");
    }

    const data = JSON.parse(jsonMatch[0]);
    const articles = Array.isArray(data.articles) ? data.articles : [];

    const groundingSources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          groundingSources.push({
            title: chunk.web.title,
            url: chunk.web.uri
          });
        }
      });
    }

    return { articles, groundingSources };

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    
    if (error.message?.includes("xhr error") || error.message?.includes("500")) {
      throw new Error("Le service de recherche Stony News est momentanément saturé. Réessayez dans 30 secondes.");
    }

    throw new Error("Impossible de joindre la rédaction. Vérifiez votre connexion.");
  }
};