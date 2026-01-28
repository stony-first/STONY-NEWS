import React from 'react';
import { NewsArticle, ReliabilityLevel } from '../types';
import { AlertTriangle, CheckCircle, HelpCircle, Siren, Share2, Globe, MapPin, ExternalLink } from 'lucide-react';

interface NewsResultCardProps {
  data: NewsArticle;
}

const NewsResultCard: React.FC<NewsResultCardProps> = ({ data }) => {
  const getReliabilityColor = (level: ReliabilityLevel) => {
    switch (level) {
      case ReliabilityLevel.HIGH: return 'bg-burkina-green/10 text-burkina-green border-burkina-green/20';
      case ReliabilityLevel.MEDIUM: return 'bg-burkina-yellow/10 text-yellow-700 border-burkina-yellow/20';
      case ReliabilityLevel.LOW: return 'bg-burkina-red/10 text-burkina-red border-burkina-red/20';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getReliabilityIcon = (level: ReliabilityLevel) => {
    switch (level) {
      case ReliabilityLevel.HIGH: return <CheckCircle className="w-4 h-4 mr-1" />;
      case ReliabilityLevel.MEDIUM: return <HelpCircle className="w-4 h-4 mr-1" />;
      case ReliabilityLevel.LOW: return <AlertTriangle className="w-4 h-4 mr-1" />;
      default: return null;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Burkina Faso': return 'bg-burkina-red text-white';
      case 'Afrique': return 'bg-burkina-green text-white';
      case 'International': return 'bg-blue-600 text-white';
      default: return 'bg-gray-800 text-white';
    }
  };

  return (
    <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden w-full mb-8 animate-fade-in-up">
      {/* Header */}
      <div className="p-5 md:p-6 border-b border-gray-50 bg-gray-50/50">
        <div className="flex flex-wrap gap-2 mb-3 items-center">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${getCategoryColor(data.categorie)}`}>
            {data.categorie === 'International' ? <Globe className="w-3 h-3 mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
            {data.categorie.toUpperCase()}
          </span>

          {data.estUrgent && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white animate-pulse">
              <Siren className="w-3 h-3 mr-1" />
              URGENT
            </span>
          )}
          
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getReliabilityColor(data.niveauFiabilite)}`}>
            {getReliabilityIcon(data.niveauFiabilite)}
            {data.niveauFiabilite}
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-900 leading-tight mb-1">
          {data.titre}
        </h2>
      </div>

      {/* Content */}
      <div className="p-5 md:p-6 space-y-5">
        <p className="text-gray-800 leading-relaxed text-base md:text-lg">
          {data.resume}
        </p>

        {/* Points Clés */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">L'essentiel</h3>
          <ul className="space-y-1.5">
            {data.pointsCles.map((point, index) => (
              <li key={index} className="flex items-start text-sm md:text-base text-gray-700">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-burkina-red mt-2 mr-2.5 flex-shrink-0"></span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sources & Links */}
        <div className="pt-4 border-t border-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Sources de consultation directes</div>
              <div className="flex flex-wrap gap-2">
                {data.liens && data.liens.length > 0 ? (
                  data.liens.map((link, i) => (
                    <a 
                      key={i} 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-100"
                    >
                      <ExternalLink className="w-3 h-3 mr-1.5" />
                      {data.sources[i] || "Lien source"}
                    </a>
                  ))
                ) : (
                  data.sources.map((s, i) => (
                    <span key={i} className="bg-gray-100 px-2 py-1 rounded text-gray-600 text-xs font-medium">
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            <button 
              onClick={() => {
                  if (navigator.share) {
                      navigator.share({
                          title: data.titre,
                          text: `${data.titre}\n\n${data.resume}`,
                      }).catch(console.error);
                  } else {
                      navigator.clipboard.writeText(`${data.titre}\n\n${data.resume}`);
                      alert("Copié dans le presse-papier !");
                  }
              }}
              className="flex items-center text-gray-400 hover:text-burkina-green transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default NewsResultCard;