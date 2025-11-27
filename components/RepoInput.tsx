import React, { useState } from 'react';
import { Github, Loader2 } from 'lucide-react';

interface RepoInputProps {
  onSubmit: (repoName: string) => void;
  isLoading: boolean;
}

const RepoInput: React.FC<RepoInputProps> = ({ onSubmit, isLoading }) => {
  const [repo, setRepo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repo.trim()) {
      onSubmit(repo.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-lg mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500/20 mb-4 ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0f172a]">
          <Github size={40} className="text-indigo-400" />
        </div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
          RepoGotchi
        </h1>
        <p className="text-slate-400">
          Enter a GitHub repository (e.g., 'facebook/react') to spawn its guardian spirit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full relative">
        <input
          type="text"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="owner/repository"
          disabled={isLoading}
          className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 text-lg rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!repo || isLoading}
          className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-6 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Spawn'}
        </button>
      </form>

      <div className="mt-8 grid grid-cols-3 gap-4 w-full text-center text-sm text-slate-500">
        <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
          <span className="block text-indigo-400 font-bold mb-1">Analyze</span>
          Code Quality
        </div>
        <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
          <span className="block text-cyan-400 font-bold mb-1">Generate</span>
          Unique Pet
        </div>
        <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
          <span className="block text-emerald-400 font-bold mb-1">Evolve</span>
          With Commits
        </div>
      </div>
    </div>
  );
};

export default RepoInput;
