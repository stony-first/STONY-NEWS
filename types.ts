export enum ReliabilityLevel {
  HIGH = "Élevé",
  MEDIUM = "Moyen",
  LOW = "Faible"
}

export type NewsCategory = "Burkina Faso" | "Afrique" | "International";

export interface NewsArticle {
  titre: string;
  resume: string;
  pointsCles: string[];
  contexte: string;
  sources: string[];
  categorie: NewsCategory;
  niveauFiabilite: ReliabilityLevel;
  justificationFiabilite?: string;
  estUrgent: boolean;
  estNonConfirme: boolean;
}

export interface NewsFeed {
  articles: NewsArticle[];
}