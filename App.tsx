import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import RepoInput from './components/RepoInput';
import PetDisplay from './components/PetDisplay';
import StatsPanel from './components/StatsPanel';
import ActionPanel from './components/ActionPanel';
import { analyzeRepoStats, createPetProfile, generatePetImage, getPetReaction, getPetMoodDescription } from './services/geminiService';
import { PetProfile, PetState, RepoStats, PetMood, LogEntry } from './types';
import { Terminal, RefreshCw, PlayCircle, Clock } from 'lucide-react';

interface StoredRepoData {
  profile: PetProfile;
  stats: RepoStats;
  imageUrl?: string;
  lastUpdated: number;
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [repoName, setRepoName] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<PetProfile | null>(null);
  const [repoStats, setRepoStats] = useState<RepoStats | null>(null);
  
  const [petState, setPetState] = useState<PetState>({
    health: 70, 
    happiness: 50, 
    energy: 60,
    cleanliness: 70, 
    mood: PetMood.SLEEPY,
    level: 1,
    evolutionStage: 'Egg',
    codeQualityScore: 70, 
    moraleScore: 50,
    isArchived: false,
    statusHeadline: "Waiting for first workflow run..."
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [latestMessage, setLatestMessage] = useState<string>("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const addLog = (msg: string, type: 'info' | 'success' | 'warning' | 'error' | 'workflow' = 'info') => {
    const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        message: msg,
        type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 10));
  };

  const getEvolutionStage = (level: number): string => {
      if (level < 2) return 'Egg';
      if (level < 5) return 'Hatchling';
      if (level < 10) return 'Juvenile';
      if (level < 20) return 'Adult';
      if (level < 50) return 'Elder';
      return 'Ancient';
  };

  const mapStatsToState = (stats: RepoStats): PetState => {
    const qualityScore = stats.codeQuality.score;
    const moraleScore = stats.teamMorale.score;
    const level = Math.floor(stats.contributors / 2) + 1;

    let mood = PetMood.SLEEPY;
    if (stats.isArchived) mood = PetMood.GHOST;
    else if (moraleScore > 70) mood = PetMood.HAPPY;
    else if (moraleScore < 40) mood = PetMood.SAD;
    else if (qualityScore < 40) mood = PetMood.SICK;

    return {
        health: qualityScore,
        happiness: moraleScore,
        energy: stats.isArchived ? 10 : (stats.lastCommitDaysAgo < 7 ? 85 : 40),
        cleanliness: qualityScore,
        mood: mood,
        level: level,
        evolutionStage: getEvolutionStage(level),
        codeQualityScore: qualityScore,
        moraleScore: moraleScore,
        isArchived: stats.isArchived,
        statusHeadline: stats.statusHeadline || "Status Unknown"
    };
  };

  const runUpdateWorkflow = async (name: string, forceRefresh = false) => {
      setLoading(true);
      if (forceRefresh) {
          addLog("Manual trigger: Workflow dispatched", 'workflow');
      }

      // Simulate GitHub Actions "Steps"
      setTimeout(() => addLog("Action: Set up job", 'info'), 500);
      setTimeout(() => addLog("Action: Checkout repository", 'info'), 1200);

      try {
          // 1. Fetch Stats (Simulate "Run Analysis" step)
          setTimeout(() => addLog("Action: Run Analysis", 'info'), 2000);
          
          // Actual API call
          const currentStats = await analyzeRepoStats(name);
          
          setTimeout(() => addLog(`Analysis: Quality ${currentStats.codeQuality.score} / Morale ${currentStats.teamMorale.score}`, 'success'), 2800);

          // 2. Check Storage/Stability
          const storageKey = `repo_pet_${name.toLowerCase()}`;
          const storedDataString = localStorage.getItem(storageKey);
          
          let finalProfile: PetProfile;
          let finalImageUrl: string | undefined = undefined;
          let shouldRegenerateImage = false;

          if (storedDataString && !forceRefresh) {
              const storedData: StoredRepoData = JSON.parse(storedDataString);
              finalProfile = storedData.profile;
              finalImageUrl = storedData.imageUrl;
              
              // Stability Check
              const healthDiff = Math.abs(currentStats.codeQuality.score - storedData.stats.codeQuality.score);
              const moraleDiff = Math.abs(currentStats.teamMorale.score - storedData.stats.teamMorale.score);
              const archivedDiff = currentStats.isArchived !== storedData.stats.isArchived;

              if (healthDiff > 15 || moraleDiff > 15 || archivedDiff || !finalImageUrl) {
                  shouldRegenerateImage = true;
                  addLog("Diff: Significant changes detected. Triggering visual update.", 'warning');
              } else {
                  addLog("Diff: No significant changes. Skipping render.", 'info');
              }
              setLastUpdated(new Date(storedData.lastUpdated));
          } else {
              if (!storedDataString) addLog("Init: New repository detected.", 'info');
              else addLog("Force Refresh: Regenerating profile.", 'workflow');
              
              finalProfile = await createPetProfile(name, currentStats);
              shouldRegenerateImage = true;
          }

          // Update State
          setProfile(finalProfile);
          setRepoStats(currentStats);
          const newState = mapStatsToState(currentStats);
          if (!shouldRegenerateImage && finalImageUrl) {
              newState.imageUrl = finalImageUrl;
          }
          setPetState(newState);

          // 3. Image Generation Step
          if (shouldRegenerateImage) {
               addLog("Action: Render Visuals", 'info');
               const moodDesc = getPetMoodDescription(newState);
               let fullVisualPrompt = `${finalProfile.visualPrompt}. The character is ${moodDesc}. High quality 3D render.`;
               if (newState.isArchived) {
                   fullVisualPrompt += " The character looks like a translucent ghost or spirit, slightly faded.";
               }
               
               generatePetImage(fullVisualPrompt).then((url) => {
                   setPetState(prev => ({ ...prev, imageUrl: url }));
                   const dataToStore: StoredRepoData = {
                       profile: finalProfile,
                       stats: currentStats,
                       imageUrl: url,
                       lastUpdated: Date.now()
                   };
                   localStorage.setItem(storageKey, JSON.stringify(dataToStore));
                   setLastUpdated(new Date());
                   addLog("Workflow Complete: Visuals artifacts uploaded.", 'success');
               });
          } else {
               const dataToStore: StoredRepoData = {
                  profile: finalProfile,
                  stats: currentStats,
                  imageUrl: finalImageUrl,
                  lastUpdated: Date.now()
              };
              localStorage.setItem(storageKey, JSON.stringify(dataToStore));
              setLastUpdated(new Date());
              addLog("Workflow Complete: State cached.", 'success');
          }

          setLoading(false);

      } catch (error) {
          console.error(error);
          addLog("Workflow Failed: API Error", 'error');
          setLoading(false);
          setRepoName(null);
      }
  };

  const handleRepoSubmit = (name: string) => {
      setRepoName(name);
      addLog(`Workflow dispatched for ${name}`, 'workflow');
      runUpdateWorkflow(name);
  };

  const handleAction = async (actionId: string) => {
    if (!profile || !petState) return;
    setIsProcessingAction(true);

    const newState = { ...petState };
    let actionDescription = "";

    switch (actionId) {
      case 'feed': 
        newState.energy = Math.min(100, newState.energy + 20);
        newState.moraleScore = Math.min(100, newState.moraleScore + 2);
        actionDescription = "pushed a new commit";
        break;
      case 'clean': 
        newState.codeQualityScore = Math.min(100, newState.codeQualityScore + 10);
        newState.health = newState.codeQualityScore;
        newState.happiness = Math.max(0, newState.happiness - 5);
        actionDescription = "refactored the codebase to improve quality";
        break;
      case 'play': 
        newState.moraleScore = Math.min(100, newState.moraleScore + 15);
        newState.happiness = newState.moraleScore;
        newState.energy = Math.max(0, newState.energy - 10);
        actionDescription = "organized a team building event";
        break;
      case 'fix': 
        newState.codeQualityScore = Math.min(100, newState.codeQualityScore + 5);
        newState.health = newState.codeQualityScore;
        newState.moraleScore = Math.min(100, newState.moraleScore + 5);
        newState.happiness = newState.moraleScore;
        actionDescription = "closed a critical issue";
        break;
    }

    if (newState.codeQualityScore < 40) newState.mood = PetMood.SICK;
    else if (newState.moraleScore < 40) newState.mood = PetMood.SAD;
    else if (newState.energy > 80 && newState.moraleScore > 80) newState.mood = PetMood.EXCITED;
    else newState.mood = PetMood.HAPPY;

    setPetState(newState);
    addLog(`User Interaction: ${actionDescription}`, 'info');

    try {
      const reaction = await getPetReaction(profile.name, profile.personality, actionDescription, newState);
      setLatestMessage(reaction);
    } catch (e) {
      console.error("Failed to get reaction");
    }

    setIsProcessingAction(false);
  };

  const reset = () => {
    setRepoName(null);
    setProfile(null);
    setRepoStats(null);
    setPetState({
      health: 70,
      happiness: 50,
      energy: 60,
      cleanliness: 70,
      mood: PetMood.SLEEPY,
      level: 1,
      evolutionStage: 'Egg',
      codeQualityScore: 70,
      moraleScore: 50,
      isArchived: false,
      statusHeadline: "Idle"
    });
    setLogs([]);
    setLatestMessage("");
  };

  if (!repoName || !profile || !repoStats) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30">
        <RepoInput onSubmit={handleRepoSubmit} isLoading={loading} />
        {loading && (
          <div className="text-center mt-4 text-indigo-400 font-mono text-sm">
             <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
                <span>Workflow Running...</span>
             </div>
             <p className="text-xs text-slate-500">Dispatching jobs to analyze repository...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <Terminal size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-lg leading-tight">RepoGotchi</h1>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                        <span className="opacity-50">repo:</span> {repoName}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Last Workflow Run</span>
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                        <Clock size={10} />
                        {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Pending'}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => runUpdateWorkflow(repoName!, true)}
                        disabled={loading}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all
                            ${loading 
                                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' 
                                : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-300 hover:text-white'}
                        `}
                        title="Trigger Update Workflow"
                    >
                        <PlayCircle size={14} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Running...' : 'Run Workflow'}
                    </button>

                    <button 
                        onClick={reset}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        title="Change Repo"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats */}
        <div className="lg:col-span-3 order-2 lg:order-1 space-y-6">
            <StatsPanel petState={petState} repoStats={repoStats} />
            
            {/* Log Panel */}
            <div className="bg-slate-900 rounded-2xl p-0 border border-slate-800 h-64 overflow-hidden flex flex-col font-mono shadow-inner">
                <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workflow Log</h4>
                     <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                     </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 text-[10px]">
                    {logs.map((log) => (
                        <div key={log.id} className="flex gap-2">
                            <span className="text-slate-600 min-w-[50px]">
                                {log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}
                            </span>
                            <span className={`${
                                log.type === 'error' ? 'text-red-400' : 
                                log.type === 'warning' ? 'text-amber-400' : 
                                log.type === 'success' ? 'text-emerald-400' : 
                                log.type === 'workflow' ? 'text-purple-400' :
                                'text-slate-300'
                            }`}>
                                {log.type === 'workflow' && '> '}
                                {log.message}
                            </span>
                        </div>
                    ))}
                    {loading && (
                        <div className="animate-pulse text-slate-500">_</div>
                    )}
                </div>
            </div>
        </div>

        {/* Center: Pet */}
        <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col justify-between min-h-[60vh]">
            <PetDisplay profile={profile} state={petState} latestMessage={latestMessage} />
            <div className="mt-8">
                <ActionPanel onAction={handleAction} disabled={isProcessingAction} />
            </div>
        </div>

        {/* Right Column: Details/Lore */}
        <div className="lg:col-span-3 order-3 hidden lg:block">
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 h-full">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
                    Profile
                </h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs text-slate-500 uppercase">Traits</label>
                        <p className="text-slate-300 italic">"{profile.personality}"</p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase">Analysis Source</label>
                         <p className="text-xs text-slate-400 mt-1">
                            Generated from {repoStats.contributors} contributors and {repoStats.openIssues} open issues.
                        </p>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase">Level</label>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-mono text-white">{petState.level}</p>
                            <span className="text-xs text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                                {petState.evolutionStage}
                            </span>
                        </div>
                    </div>
                     <div>
                        <label className="text-xs text-slate-500 uppercase">Current Build</label>
                        <div className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-medium border
                            ${repoStats.isArchived ? 'bg-red-900/20 text-red-300 border-red-500/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}
                        `}>
                            {repoStats.isArchived ? 'ARCHIVED' : `v${repoStats.lastCommitDaysAgo}.0.${petState.level}`}
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;