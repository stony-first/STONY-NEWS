import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import NewsResultCard from './components/NewsResultCard';
import { fetchNews } from './services/geminiService';
import { NewsArticle } from './types';
import { Search, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [currentTopic, setCurrentTopic] = useState('À la une');
  const [isLoading, setIsLoading] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsArticle[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const filters = ["À la une", "Burkina Faso", "Afrique", "International"];
  const [activeFilter, setActiveFilter] = useState("À la une");

  // Load initial news on mount
  useEffect(() => {
    handleFetchNews();
  }, []);

  const handleFetchNews = async (topic: string = "") => {
    setIsLoading(true);
    setError(null);
    setNewsItems([]); 
    setCurrentTopic(topic || "À la une");
    setActiveFilter("À la une"); // Reset filter when searching new topics

    try {
      const feed = await fetchNews(topic);
      setNewsItems(feed.articles);
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING") {
        setError("CLÉ API MANQUANTE. Veuillez ajouter la variable 'API_KEY' dans les réglages Vercel, puis redéployer le projet.");
      } else {
        setError(err.message || "Impossible de récupérer les actualités pour le moment. Vérifiez votre connexion.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFetchNews(inputText);
  };

  // Filtered list based on active filter
  const filteredNews = newsItems.filter(item => {
    if (activeFilter === "À la une") return true;
    return item.categorie === activeFilter;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-[#f8fafc]">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 max-w-4xl">
        
        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSubmit} className="relative flex gap-2">
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                type="text"
                className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl leading-relaxed placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-stony-red/20 focus:border-stony-red shadow-sm text-sm"
                placeholder="Rechercher un sujet (ex: Burkina Faso, Ukraine, Économie...)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                />
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="bg-gray-900 hover:bg-stony-red text-white px-5 py-2 rounded-xl transition-colors disabled:opacity-50 text-sm font-medium whitespace-nowrap"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
            </button>
          </form>
        </div>

        {/* Filter Buttons */}
        {!isLoading && !error && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center sm:justify-start">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeFilter === filter
                    ? 'bg-gray-900 text-white shadow-md transform scale-105'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-stony-red hover:text-stony-red'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}

        {/* Section Title & Refresh */}
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-gray-900 flex items-center">
                <span className="w-2 h-8 bg-stony-red mr-3 rounded-sm"></span>
                {currentTopic} 
                {activeFilter !== "À la une" && <span className="text-gray-400 font-normal ml-2 text-base">/ {activeFilter}</span>}
            </h2>
            <button 
                onClick={() => handleFetchNews(inputText)}
                disabled={isLoading}
                className="flex items-center text-sm text-gray-500 hover:text-stony-green transition-colors"
            >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
            </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-xl mb-6 flex items-start shadow-sm">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-600" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
             {[1, 2, 3].map((i) => (
                 <div key={i} className="bg-white rounded-xl h-64 border border-gray-100"></div>
             ))}
          </div>
        )}

        {/* News Feed */}
        {!isLoading && filteredNews.length > 0 && (
          <div className="space-y-6">
            {filteredNews.map((article, index) => (
              <NewsResultCard key={index} data={article} />
            ))}
          </div>
        )}

        {/* Empty State (Filtered) */}
        {!isLoading && !error && newsItems.length > 0 && filteredNews.length === 0 && (
             <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 mb-2">Aucune actualité trouvée dans la catégorie <span className="font-bold">{activeFilter}</span>.</p>
                <button 
                    onClick={() => setActiveFilter("À la une")} 
                    className="text-stony-red font-medium hover:underline"
                >
                    Voir toutes les actualités
                </button>
            </div>
        )}

        {/* Empty State (Global) */}
        {!isLoading && !error && newsItems.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400">Aucune actualité trouvée pour ce sujet.</p>
                <button 
                    onClick={() => handleFetchNews("")} 
                    className="mt-4 text-stony-red font-medium hover:underline"
                >
                    Voir les actualités principales
                </button>
            </div>
        )}

      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-xs">
            STONY NEWS © {new Date().getFullYear()} • Généré par IA en temps réel • Vérifiez toujours les sources officielles.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;