import React, { useEffect, useState } from 'react';
import { PetState, PetProfile, PetMood } from '../types';
import { Sparkles } from 'lucide-react';

interface PetDisplayProps {
  profile: PetProfile;
  state: PetState;
  latestMessage?: string;
}

const PetDisplay: React.FC<PetDisplayProps> = ({ profile, state, latestMessage }) => {
  const [moodAnimation, setMoodAnimation] = useState(false);

  // Trigger animation when mood changes
  useEffect(() => {
    setMoodAnimation(true);
    const timer = setTimeout(() => setMoodAnimation(false), 800);
    return () => clearTimeout(timer);
  }, [state.mood]);

  // Calculate visual filters based on advanced metrics
  const getFilters = () => {
    let filters = '';

    // ARCHIVED STATUS: Ghostly effect
    if (state.isArchived) {
        filters += 'grayscale(1) opacity(0.6) blur(0.5px) contrast(1.2) drop-shadow(0 0 10px rgba(255, 255, 255, 0.3)) ';
        return filters;
    }
    
    // Low Code Quality (Health/Cleanliness) -> Sick/Glitchy visual effects
    if (state.codeQualityScore < 40) {
       filters += 'sepia(0.8) hue-rotate(-50deg) saturate(2) blur(0.5px) '; // Sickly green/yellow
    } else if (state.codeQualityScore < 60) {
       filters += 'sepia(0.4) '; 
    }

    // Team Morale (Happiness) -> Brightness/Energy
    if (state.moraleScore > 80) {
        filters += 'brightness(1.2) saturate(1.3) drop-shadow(0 0 15px rgba(255, 215, 0, 0.6)) '; // Radiant/Happy
    } else if (state.moraleScore < 40) {
        filters += 'grayscale(0.9) brightness(0.7) contrast(1.1) '; // Sad/Depressed
    } else if (state.moraleScore < 60) {
        filters += 'grayscale(0.4) ';
    }

    return filters;
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full min-h-[400px]">
      
      {/* Speech Bubble */}
      {latestMessage && (
        <div className="absolute top-0 z-20 animate-bounce-slight max-w-[80%]">
          <div className={`
             px-6 py-4 rounded-2xl rounded-bl-none shadow-lg border-2 relative
             ${state.isArchived 
                ? 'bg-slate-800 text-slate-300 border-slate-600 font-serif italic' 
                : 'bg-white text-slate-900 border-indigo-500'}
          `}>
             <p className="font-medium text-lg leading-snug">"{latestMessage}"</p>
          </div>
        </div>
      )}

      {/* Pet Image Container */}
      <div className={`relative group mt-16 transition-all duration-300 ${moodAnimation ? 'scale-105' : 'scale-100'}`}>
        
        {/* Reaction Ring Animation */}
        {moodAnimation && (
            <div className="absolute -inset-4 rounded-full border-4 border-indigo-400/50 animate-ping z-0"></div>
        )}

        {/* Glow Effect - dynamic based on Morale */}
        <div className={`absolute -inset-4 bg-gradient-to-r 
          ${state.isArchived ? 'from-slate-500 to-gray-500 opacity-20' : 
            state.moraleScore > 70 ? 'from-amber-400 to-yellow-300 opacity-40' : 
            state.codeQualityScore < 40 ? 'from-green-900 to-slate-900 opacity-60' :
            state.moraleScore < 40 ? 'from-slate-700 to-gray-800 opacity-50' :
            'from-indigo-500 to-cyan-500 opacity-30'} 
          rounded-full blur-2xl group-hover:opacity-50 transition-all duration-500 z-0`}>
        </div>
        
        {/* The Image */}
        <div className={`relative w-80 h-80 md:w-96 md:h-96 rounded-3xl overflow-hidden border-4 shadow-2xl bg-slate-800 transition-all duration-700 z-10
            ${state.isArchived ? 'border-slate-600/50' : 'border-slate-700/50'}
            ${moodAnimation ? 'ring-4 ring-indigo-400 ring-offset-4 ring-offset-[#0f172a]' : ''}
             `}
             style={{ 
               filter: getFilters(),
               transform: state.codeQualityScore < 30 ? 'rotate(-3deg) scale(0.95)' : 'none'
             }}
        >
          {state.imageUrl ? (
            <img 
              src={state.imageUrl} 
              alt={profile.species} 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
              <Sparkles className="animate-spin text-indigo-500 mb-2" />
              Generating Visuals...
            </div>
          )}
          
          {/* Status Headline Overlay */}
          <div className="absolute bottom-4 left-0 right-0 px-4">
              <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/10 text-center shadow-lg">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-0.5">Status</p>
                <p className="text-sm font-medium leading-tight text-white line-clamp-2">
                    {state.statusHeadline}
                </p>
              </div>
          </div>
        </div>

        {/* Condition Badges */}
        <div className="absolute -left-10 top-10 flex flex-col gap-2 z-20">
             {/* Evolution Stage Badge */}
             <div className="bg-indigo-900/90 text-indigo-200 text-xs px-3 py-1.5 rounded-lg border border-indigo-700 shadow-xl backdrop-blur-sm flex items-center gap-1">
                <span className="text-lg">⭐</span> {state.evolutionStage}
            </div>

            {state.isArchived && (
                <div className="bg-slate-700/90 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-500 shadow-xl backdrop-blur-sm flex items-center gap-1">
                    <span className="text-lg">👻</span> Spirit Form
                </div>
            )}
        </div>
      </div>

      <div className="mt-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-1 flex items-center justify-center gap-2">
            {profile.name}
            {state.isArchived && <span className="text-sm font-normal text-slate-500 uppercase tracking-widest border border-slate-600 px-2 rounded">Archived</span>}
        </h2>
        <p className="text-indigo-300 font-medium">{profile.species}</p>
        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">{profile.description}</p>
      </div>
    </div>
  );
};

export default PetDisplay;