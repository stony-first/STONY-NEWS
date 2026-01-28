import React from 'react';
import { Radio } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-stony-red p-2 rounded-lg text-white">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-gray-900 tracking-tight">
              STONY<span className="text-stony-red">NEWS</span>
            </h1>
            <p className="text-[0.65rem] text-gray-500 uppercase tracking-widest font-semibold">
              Info Faso, Afrique & Monde
            </p>
          </div>
        </div>
        <div className="flex space-x-1">
            <div className="h-2 w-8 bg-stony-red rounded-full"></div>
            <div className="h-2 w-8 bg-stony-green rounded-full"></div>
            <div className="h-2 w-8 bg-stony-yellow rounded-full"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;