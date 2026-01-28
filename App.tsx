
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import NewsResultCard from './components/NewsResultCard';
import { fetchNews } from './services/geminiService';
import { NewsArticle } from './types';
import { Search, Loader2, RefreshCw, AlertCircle, Clock, Info } from 'lucide-react';

const CACHE_KEY = 'stony_news_cache_v5';
const CACHE_EXPIRATION = 15 * 60 * 1000; 

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [currentTopic, setCurrentTopic] = useState('À la une');
  const [isLoading, setIsLoading] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  const filters = ["À la une", "Burkina Faso", "Afrique", "International"];
  const [activeFilter, setActiveFilter] = useState("À la une");

  const loadFromCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { articles, timestamp, topic } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > CACHE_EXPIRATION;
        
        if (!isExpired && articles && articles.length > 0) {
          setNewsItems(articles);
          setLastUpdated(timestamp);
          setCurrentTopic(topic || "À la une");
          return true;
        }
      }
    } catch (e) {
      console.warn("Cache error", e);
    }
    return false;
  }, []);

  const handleFetchNews = async (topic: string = "", forceRefresh: boolean = false) => {
    if (!forceRefresh && !topic && loadFromCache()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // On garde les anciens articles pendant le chargement pour éviter un écran vide,
    // sauf si c'est une nouvelle recherche spécifique
    if (topic) setNewsItems([]); 

    try {
      const feed = await fetchNews(topic);
      if (feed && Array.isArray(feed.articles) && feed.articles.length > 0) {
        setNewsItems(feed.articles);
        const now = Date.now();
        setLastUpdated(now);
        setCurrentTopic(topic || (inputText ? inputText : "À la une"));
        
        if (!topic) {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            articles: feed.articles,
            timestamp: now,
            topic: "À la une"
          }));
        }
      } else {
        setError("Aucun bulletin n'a pu être rédigé pour ce sujet.");
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message || "Une erreur inattendue est survenue lors de la rédaction.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loadFromCache()) {
      handleFetchNews("", true);
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
    if (minutes < 60) return `Il y a ${minutes} min`;
    return `Il y a ${Math.floor(minutes / 60)}h`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-[#f8fafc]">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleFetchNews(inputText, true); }} 
            className="relative flex gap-3"
          >
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-burkina-red/5 focus:border-burkina-red shadow-sm text-base transition-all"
                  placeholder="Rechercher une actualité ou un sujet..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
            </div>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="bg-gray-900 hover:bg-burkina-red text-white px-8 py-2 rounded-2xl transition-all disabled:opacity-50 font-bold shadow-lg flex items-center shrink-0"
            >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {isLoading ? "Rédaction..." : "Lancer"}
            </button>
          </form>
        </div>

        {!isLoading && !error && newsItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((f) => (
              <button 
                key={f} 
                onClick={() => setActiveFilter(f)} 
                className={`px-6 py-2.5 rounded-xl text-sm font-bold border-2 transition-all whitespace-nowrap shadow-sm ${
                  activeFilter === f 
                  ? 'bg-burkina-red text-white border-burkina-red shadow-red-200' 
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h2 className="text-2xl font-serif font-black flex items-center text-gray-900 truncate max-w-[250px] sm:max-w-none">
                  <span className="w-2 h-8 bg-burkina-red mr-4 rounded-sm shrink-0"></span>
                  {currentTopic}
              </h2>
              {lastUpdated && !isLoading && (
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-2 ml-6 flex items-center font-bold">
                  <Clock className="w-3 h-3 mr-1.5" /> Bureau de rédaction : {getTimeAgo()}
                </p>
              )}
            </div>
            <button 
              onClick={() => handleFetchNews(inputText, true)} 
              disabled={isLoading}
              className="p-2.5 text-gray-400 hover:text-burkina-red transition-all group disabled:opacity-50 bg-white rounded-xl border-2 border-gray-50 shadow-sm"
              title="Actualiser le bulletin"
            >
                <RefreshCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ${isLoading ? 'animate-spin' : ''}`} /> 
            </button>
        </div>

        {error && (
          <div className="bg-white border-l-4 border-burkina-red p-6 rounded-2xl mb-8 flex items-start shadow-xl animate-fade-in-up">
            <AlertCircle className="w-6 h-6 text-burkina-red mr-4 flex-shrink-0 mt-1" /> 
            <div className="text-gray-800">
              <p className="font-black text-lg">Note de la rédaction</p>
              <p className="text-sm opacity-80">{error}</p>
              <button 
                onClick={() => handleFetchNews(inputText, true)}
                className="mt-4 text-xs font-bold text-burkina-red hover:underline uppercase"
              >
                Réessayer la demande
              </button>
            </div>
          </div>
        )}

        {isLoading && newsItems.length === 0 ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-8 h-64 animate-pulse border-2 border-gray-50 flex flex-col gap-6 shadow-sm">
                <div className="h-6 bg-gray-100 rounded-full w-1/4"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-3/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 rounded-lg w-full"></div>
                  <div className="h-4 bg-gray-100 rounded-lg w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8 mb-16 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                <div className="bg-white p-4 rounded-full shadow-xl">
                  <Loader2 className="h-8 w-8 animate-spin text-burkina-red" />
                </div>
              </div>
            )}
            {filteredNews.length > 0 ? (
              filteredNews.map((article, index) => <NewsResultCard key={index} data={article} />)
            ) : !error && !isLoading && (
              <div className="text-center py-32 bg-white border-2 border-dashed border-gray-200 rounded-[3rem] shadow-sm">
                <Info className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                <p className="text-gray-400 font-bold text-xl">Aucune dépêche trouvée.</p>
                <p className="text-gray-300 text-sm mt-2">La rédaction est en attente de nouvelles informations sur ce sujet.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-16 text-center mt-auto">
        <div className="flex justify-center items-center space-x-2 mb-6">
            <div className="h-1 w-12 bg-burkina-red"></div>
            <div className="h-1 w-12 bg-burkina-green"></div>
            <div className="text-burkina-yellow font-black text-2xl">★</div>
            <div className="h-1 w-12 bg-burkina-green"></div>
            <div className="h-1 w-12 bg-burkina-red"></div>
        </div>
        <h3 className="text-xl font-serif font-black tracking-widest mb-2 uppercase">STONY NEWS</h3>
        <p className="text-gray-500 text-[0.6rem] font-bold tracking-[0.3em] uppercase">
          Plateforme d'information citoyenne assistée par technologie Gemini
        </p>
        <p className="text-gray-600 text-[0.6rem] mt-8 font-medium uppercase">
          STONY NEWS © {new Date().getFullYear()} • Journalisme Indépendant
        </p>
      </footer>
    </div>
  );
};

export default App;
