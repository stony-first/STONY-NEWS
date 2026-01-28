
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import NewsResultCard from './components/NewsResultCard';
import { fetchNews } from './services/geminiService';
import { NewsArticle, GroundingSource } from './types';
import { Search, Loader2, RefreshCw, AlertCircle, Clock, ExternalLink } from 'lucide-react';

const CACHE_KEY = 'stony_news_cache';
const CACHE_EXPIRATION = 15 * 60 * 1000; // 15 minutes en millisecondes

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [currentTopic, setCurrentTopic] = useState('À la une');
  const [isLoading, setIsLoading] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  const filters = ["À la une", "Burkina Faso", "Afrique", "International"];
  const [activeFilter, setActiveFilter] = useState("À la une");

  // Fonction pour charger depuis le cache
  const loadFromCache = useCallback(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { articles, timestamp, topic, groundingSources: cachedSources } = JSON.parse(cachedData);
      const isExpired = Date.now() - timestamp > CACHE_EXPIRATION;
      
      if (!isExpired) {
        setNewsItems(articles);
        setGroundingSources(cachedSources || []);
        setLastUpdated(timestamp);
        setCurrentTopic(topic);
        return true;
      }
    }
    return false;
  }, []);

  const handleFetchNews = async (topic: string = "", forceRefresh: boolean = false) => {
    // Si on ne force pas le refresh et qu'il n'y a pas de recherche spécifique, on check le cache
    if (!forceRefresh && !topic && loadFromCache()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentTopic(topic || "À la une");
    setActiveFilter("À la une");

    try {
      const feed = await fetchNews(topic);
      if (feed && Array.isArray(feed.articles)) {
        setNewsItems(feed.articles);
        setGroundingSources(feed.groundingSources || []);
        const now = Date.now();
        setLastUpdated(now);
        
        // On ne met en cache que la "Une" (recherche vide)
        if (!topic) {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            articles: feed.articles,
            groundingSources: feed.groundingSources,
            timestamp: now,
            topic: "À la une"
          }));
        }
      } else {
        setNewsItems([]);
        setGroundingSources([]);
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      if (err.message === "API_KEY_MISSING") {
        setError("CLÉ API MANQUANTE : Ajoutez API_KEY dans les variables d'environnement Vercel.");
      } else if (err.message === "QUOTA_EXCEEDED") {
        setError("Limite de l'API Gemini atteinte (Gratuit). Les résultats affichés peuvent être anciens. Réessayez dans 1 minute.");
        loadFromCache(); // Tentative de secours avec le cache
      } else {
        setError(err.message || "Une erreur est survenue.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Au montage, on essaie le cache, sinon on fetch
    if (!loadFromCache()) {
      handleFetchNews();
    }
  }, [loadFromCache]);

  const filteredNews = (newsItems || []).filter(item => {
    if (activeFilter === "À la une") return true;
    return item.categorie === activeFilter;
  });

  const getTimeAgo = () => {
    if (!lastUpdated) return "";
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    if (seconds < 60) return "À l'instant";
    const minutes = Math.floor(seconds / 60);
    return `Il y a ${minutes} min`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-[#f8fafc]">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleFetchNews(inputText, true); }} 
            className="relative flex gap-2"
          >
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-stony-red/20 focus:border-stony-red shadow-sm text-sm"
                  placeholder="Rechercher une actualité..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
            </div>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="bg-gray-900 hover:bg-stony-red text-white px-6 py-2 rounded-xl transition-all disabled:opacity-50 font-medium shadow-sm"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
            </button>
          </form>
        </div>

        {!isLoading && !error && (
          <div className="flex flex-wrap gap-2 mb-8">
            {filters.map((f) => (
              <button 
                key={f} 
                onClick={() => setActiveFilter(f)} 
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  activeFilter === f 
                  ? 'bg-gray-900 text-white border-gray-900' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-serif font-bold flex items-center">
                  <span className="w-1.5 h-8 bg-stony-red mr-3 rounded-full"></span>
                  {currentTopic}
              </h2>
              {lastUpdated && !isLoading && (
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 ml-4 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Mise à jour : {getTimeAgo()}
                </p>
              )}
            </div>
            <button 
              onClick={() => handleFetchNews(inputText, true)} 
              disabled={isLoading}
              className="text-sm text-gray-500 flex items-center hover:text-stony-red transition-colors group disabled:opacity-50 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"
            >
                <RefreshCw className={`w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-700 ${isLoading ? 'animate-spin' : ''}`} /> 
                {isLoading ? "Mise à jour..." : "Actualiser"}
            </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6 flex items-start animate-fade-in-up shadow-sm">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" /> 
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 h-56 animate-pulse border border-gray-100 flex flex-col gap-4">
                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                <div className="h-8 bg-gray-100 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 mb-12">
            {filteredNews.length > 0 ? (
              filteredNews.map((article, index) => <NewsResultCard key={index} data={article} />)
            ) : !error && (
              <div className="text-center py-24 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <p className="text-gray-400 font-medium">Aucun bulletin disponible pour ce filtre.</p>
                <button 
                  onClick={() => handleFetchNews("", true)} 
                  className="mt-4 text-stony-red font-semibold hover:underline"
                >
                  Revenir à la une
                </button>
              </div>
            )}

            {/* Display grounding Sources to comply with Google Search grounding requirements */}
            {!isLoading && groundingSources.length > 0 && (
              <div className="mt-8 p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center">
                  <ExternalLink className="w-4 h-4 mr-2" /> Sources consultées par l'IA
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groundingSources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center truncate"
                    >
                      <span className="truncate">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-10 text-center">
        <div className="flex justify-center space-x-1 mb-4">
            <div className="h-1.5 w-6 bg-stony-red rounded-full"></div>
            <div className="h-1.5 w-6 bg-stony-green rounded-full"></div>
            <div className="h-1.5 w-6 bg-stony-yellow rounded-full"></div>
        </div>
        <p className="text-gray-500 text-[10px] font-medium tracking-widest uppercase">
          STONY NEWS © {new Date().getFullYear()} • Journalisme assisté par Intelligence Artificielle
        </p>
      </footer>
    </div>
  );
};

export default App;
