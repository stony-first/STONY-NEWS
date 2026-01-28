import React from 'react';
import { Newspaper } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b-4 border-burkina-red sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-gray-900 p-2.5 rounded-xl text-burkina-yellow shadow-inner">
            <Newspaper className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black font-serif text-gray-900 tracking-tighter leading-none uppercase">
              Stony<span className="text-burkina-red">News</span>
            </h1>
            <p className="text-[0.6rem] text-gray-500 uppercase tracking-[0.2em] font-bold mt-1">
              L'information en temps réel au Faso
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
            <div className="h-3 w-10 bg-burkina-red rounded-sm shadow-sm"></div>
            <div className="h-3 w-10 bg-burkina-green rounded-sm shadow-sm"></div>
            <div className="flex items-center justify-center h-5 w-5 text-burkina-yellow font-bold text-xl">
              ★
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;