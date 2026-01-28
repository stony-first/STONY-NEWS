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
  
  const filters = ["À la une", "Burkina Faso", "Afrique", "International"];
  const [activeFilter, setActiveFilter] = useState("À la une");

  useEffect(() => {
    handleFetchNews();
  }, []);

  const handleFetchNews = async (topic: string = "") => {
    setIsLoading(true);
    setError(null);
    setNewsItems([]); 
    setCurrentTopic(topic || "À la une");
    setActiveFilter("À la une");

    try {
      const feed = await fetchNews(topic);
      setNewsItems(Array.isArray(feed.articles) ? feed.articles : []);
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        setError("CLÉ API MANQUANTE. Veuillez configurer votre environnement.");
      } else if (err.message === "QUOTA_EXCEEDED") {
        setError("Limite de requêtes atteinte. Réessayez dans un instant.");
      } else {
        setError(err.message || "Impossible de récupérer les actualités.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNews = (newsItems || []).filter(item => {
    if (activeFilter === "À la une") return true;
    return item.categorie === activeFilter;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-[#f8fafc]">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <form onSubmit={(e) => { e.preventDefault(); handleFetchNews(inputText); }} className="relative flex gap-2">
            <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-stony-red/20 focus:border-stony-red shadow-sm text-sm"
                  placeholder="De quoi voulez-vous parler ?"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
            </div>
            <button type="submit" disabled={isLoading} className="bg-gray-900 hover:bg-stony-red text-white px-5 py-2 rounded-xl transition-colors disabled:opacity-50 font-medium">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
            </button>
          </form>
        </div>

        {!isLoading && !error && (
          <div className="flex flex-wrap gap-2 mb-8">
            {filters.map((f) => (
              <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${activeFilter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold flex items-center">
                <span className="w-2 h-8 bg-stony-red mr-3 rounded-sm"></span>
                {currentTopic}
            </h2>
            <button onClick={() => handleFetchNews(inputText)} className="text-sm text-gray-500 flex items-center hover:text-stony-red transition-colors">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6 flex items-start animate-fade-in-up"><AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" /> {error}</div>}

        {isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl h-48 animate-pulse border border-gray-100"></div>)}</div>
        ) : (
          <div className="space-y-6">
            {filteredNews.length > 0 ? (
              filteredNews.map((article, index) => <NewsResultCard key={index} data={article} />)
            ) : !error && (
              <div className="text-center py-20 text-gray-400">
                Aucune actualité trouvée pour ce sujet.
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 text-center text-gray-400 text-xs">
        STONY NEWS © {new Date().getFullYear()} • Journalisme assisté par IA • Information en temps réel.
      </footer>
    </div>
  );
};

export default App;