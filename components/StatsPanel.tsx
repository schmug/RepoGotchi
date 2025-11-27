import React from 'react';
import { PetState, RepoStats } from '../types';
import { Heart, Smile, Zap, GitPullRequest, AlertCircle, GitCommit, Shield, Activity, Users, BookOpen, Archive, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface StatsPanelProps {
  petState: PetState;
  repoStats: RepoStats;
}

const ProgressBar: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1.5">
      <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
        {icon}
        {label}
      </div>
      <span className="text-slate-400 text-xs font-mono">{Math.round(value)}%</span>
    </div>
    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`} 
        style={{ width: `${Math.max(5, value)}%` }}
      ></div>
    </div>
  </div>
);

const DetailCard: React.FC<{ title: string; score: number; reason: string; children: React.ReactNode; colorClass: string }> = ({ title, score, reason, children, colorClass }) => (
  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
    <div className="flex justify-between items-center border-b border-slate-700/50 pb-2">
      <span className={`font-bold ${colorClass}`}>{title}</span>
      <span className="text-white font-mono text-sm">{Math.round(score)}/100</span>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs">
        {children}
    </div>
    <div className="text-xs text-slate-400 italic mt-1 border-l-2 border-slate-600 pl-2">
        "{reason}"
    </div>
  </div>
);

const Badge: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = "text-slate-200" }) => (
    <div className="flex flex-col items-center p-2 bg-slate-900/40 rounded-lg">
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
        <span className={`font-medium ${color} text-center text-xs truncate w-full`}>{value}</span>
    </div>
);

const StatsPanel: React.FC<StatsPanelProps> = ({ petState, repoStats }) => {
  const data = [
    { name: 'Issues', value: repoStats.openIssues, color: '#f87171' },
    { name: 'PRs', value: repoStats.pullRequests, color: '#34d399' },
    { name: 'Contribs', value: repoStats.contributors, color: '#60a5fa' },
  ];

  const workflowStatus = petState.health > 50 ? 'passing' : 'failing';

  return (
    <div className="grid grid-cols-1 gap-6">
      
      {/* GitHub Workflow Header */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-3">
            {workflowStatus === 'passing' ? (
                <CheckCircle2 className="text-emerald-500" size={20} />
            ) : (
                <XCircle className="text-red-500" size={20} />
            )}
            <div>
                <h4 className="text-slate-200 font-bold text-sm leading-tight">
                    {workflowStatus === 'passing' ? 'Workflow Passing' : 'Workflow Failing'}
                </h4>
                <p className="text-slate-500 text-[10px] font-mono">
                    Build #{repoStats.lastCommitDaysAgo * 12 + 4} • branch: main
                </p>
            </div>
        </div>
        <div className="text-right">
             <span className={`text-xs font-mono px-2 py-1 rounded border ${workflowStatus === 'passing' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                {workflowStatus === 'passing' ? 'Stable' : 'Critical'}
             </span>
        </div>
      </div>

      {/* Archive Warning */}
      {repoStats.isArchived && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <Archive className="text-red-400" size={24} />
            <div>
                <h4 className="text-red-400 font-bold text-sm">Repository Archived</h4>
                <p className="text-red-200/70 text-xs">This repo is abandoned. The pet is a spirit of code past.</p>
            </div>
        </div>
      )}

      {/* Pet Vitals */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={18} className="text-indigo-400" />
            Pet Vitals
        </h3>
        <ProgressBar 
          label="Health (Code Quality)" 
          value={petState.health} 
          color="bg-gradient-to-r from-red-500 to-rose-400" 
          icon={<Heart size={16} className="text-rose-400" />} 
        />
        <ProgressBar 
          label="Happiness (Morale)" 
          value={petState.happiness} 
          color="bg-gradient-to-r from-yellow-500 to-amber-400" 
          icon={<Smile size={16} className="text-amber-400" />} 
        />
        <ProgressBar 
          label="Energy" 
          value={petState.energy} 
          color="bg-gradient-to-r from-blue-500 to-cyan-400" 
          icon={<Zap size={16} className="text-cyan-400" />} 
        />
      </div>

      {/* Detailed Analysis */}
      <div className="space-y-4">
          <DetailCard 
            title="Code Quality" 
            score={petState.codeQualityScore} 
            reason={repoStats.codeQuality.reason}
            colorClass="text-emerald-400"
          >
             <Badge label="Complexity" value={repoStats.codeQuality.complexity} color={repoStats.codeQuality.complexity === 'High' ? 'text-red-400' : 'text-emerald-400'} />
             <Badge label="Coverage" value={`${repoStats.codeQuality.testCoverage}%`} />
             <Badge label="Linting" value={repoStats.codeQuality.lintingErrors} color={repoStats.codeQuality.lintingErrors === 'Many' ? 'text-red-400' : 'text-emerald-400'} />
          </DetailCard>

          <DetailCard 
            title="Team Morale" 
            score={petState.moraleScore} 
            reason={repoStats.teamMorale.reason}
            colorClass="text-amber-400"
          >
             <Badge label="Merge Speed" value={repoStats.teamMorale.mergeVelocity} />
             <Badge label="Sentiment" value={repoStats.teamMorale.sentiment} color={repoStats.teamMorale.sentiment === 'Negative' ? 'text-red-400' : 'text-amber-400'} />
             <Badge label="Collab" value={repoStats.teamMorale.collaboration} />
          </DetailCard>
      </div>

      {/* Practices & Contributors */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-4">
         <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                <BookOpen size={12} /> Best Practices
            </h4>
            <div className="flex flex-wrap gap-2">
                {repoStats.bestPractices.length > 0 ? repoStats.bestPractices.map((practice, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px]">
                        {practice}
                    </span>
                )) : (
                    <span className="text-slate-500 text-xs italic">No specific standards detected</span>
                )}
            </div>
         </div>
         
         <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                <Users size={12} /> Top Contributors
            </h4>
            <div className="flex flex-wrap gap-2">
                {repoStats.topContributors.length > 0 ? repoStats.topContributors.map((name, i) => (
                    <span key={i} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px]">
                        @{name}
                    </span>
                )) : (
                    <span className="text-slate-500 text-xs italic">Community driven</span>
                )}
            </div>
         </div>
      </div>

      {/* Repo Stats Pie */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Activity Metrics</h3>
        
        <div className="flex-1 flex flex-col justify-center">
            <div className="h-32 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                        itemStyle={{ color: '#f1f5f9' }}
                    />
                </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-700/30 p-2 rounded-lg flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-400" />
                    <span className="text-slate-300">{repoStats.openIssues} Issues</span>
                </div>
                <div className="bg-slate-700/30 p-2 rounded-lg flex items-center gap-2">
                    <GitPullRequest size={14} className="text-emerald-400" />
                    <span className="text-slate-300">{repoStats.pullRequests} PRs</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;