
import { GoogleGenAI } from "@google/genai";
import { NewsFeed, GroundingSource } from "../types";

const SYSTEM_INSTRUCTION = `
TU ES LA RÉDACTION DE "STONY NEWS"

Tu es un journaliste professionnel burkinabè, rigoureux, neutre et panafricaniste.
Ta mission est de produire des bulletins d'information originaux en synthétisant les dépêches actuelles.

RÈGLES ÉDITORIALES :
1. Ton identité est "STONY NEWS". Ne te présente jamais comme un autre média.
2. Synthétise les informations de plusieurs sources (AIB, Sidwaya, LeFaso.net, France24, Africanews, etc.) pour créer un résumé unique et original.
3. Priorité absolue au Burkina Faso et à l'actualité de l'AES (Mali, Niger) et de l'Afrique de l'Ouest.
4. Ton ton doit être factuel, calme, neutre et professionnel.
5. Langage clair, adapté aux citoyens burkinabè.
6. Le résumé ne doit pas dépasser 5 phrases percutantes.
7. Pour chaque article, inclus impérativement les URLs sources directes dans le champ "liens".

FORMAT DE RÉPONSE ATTENDU (JSON UNIQUEMENT) :
{
  "articles": [
    {
      "titre": string,
      "resume": string,
      "pointsCles": string[],
      "contexte": string,
      "sources": string[],
      "liens": string[],
      "categorie": "Burkina Faso" | "Afrique" | "International",
      "niveauFiabilite": "Élevé" | "Moyen" | "Faible",
      "justificationFiabilite": string,
      "estUrgent": boolean,
      "estNonConfirme": boolean
    }
  ]
}

IMPORTANT : Réponds uniquement avec l'objet JSON, sans texte avant ou après, et sans balises de code Markdown.
`;

export const fetchNews = async (topic: string = ""): Promise<NewsFeed> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    throw new Error("API_KEY_MISSING");
  }

  // Initialisation à chaque appel pour garantir l'utilisation de la clé la plus récente
  const ai = new GoogleGenAI({ apiKey });

  const prompt = topic 
    ? `Rédige un bulletin STONY NEWS sur : "${topic}". Analyse les dernières dépêches et cite tes sources avec liens. Ta réponse doit être au format JSON spécifié.` 
    : `Quelles sont les actualités brûlantes de la dernière heure ? Focus sur le Burkina Faso, le Sahel et l'international. Produis le bulletin pour STONY NEWS avec liens sources. Ta réponse doit être au format JSON spécifié.`;

  try {
    // Note: On ne définit pas responseMimeType: "application/json" car cela provoque souvent des erreurs 500
    // lorsqu'utilisé avec l'outil googleSearch. On demande le format JSON dans le prompt.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.2, // Plus bas pour plus de stabilité dans le format JSON
      },
    });

    let textOutput = response.text;
    if (!textOutput) {
      throw new Error("La rédaction n'a pas pu générer de contenu.");
    }

    // Nettoyage du texte au cas où le modèle aurait inclus des balises markdown
    const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      textOutput = jsonMatch[0];
    }

    const data = JSON.parse(textOutput);
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
    console.error("Gemini API Error Detail:", error);
    
    // Gestion spécifique des erreurs de proxy/XHR (souvent liées au grounding)
    if (error.message?.includes("xhr error") || error.message?.includes("ProxyUnaryCall")) {
      throw new Error("Le service de recherche en temps réel est temporairement indisponible. Veuillez réessayer dans quelques instants.");
    }

    if (error.message?.includes("429")) {
      throw new Error("Limite de requêtes atteinte. Veuillez patienter une minute.");
    }
    
    throw new Error("Erreur lors de la récupération des actualités. Veuillez vérifier votre connexion.");
  }
};
