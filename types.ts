export enum PetMood {
  HAPPY = 'Happy',
  SAD = 'Sad',
  SICK = 'Sick',
  ANGRY = 'Angry',
  SLEEPY = 'Sleepy',
  EXCITED = 'Excited',
  GHOST = 'Ghost'
}

export interface CodeQualityAnalysis {
  score: number; // 0-100
  complexity: 'Low' | 'Medium' | 'High';
  testCoverage: number; // Percentage
  lintingErrors: 'Few' | 'Moderate' | 'Many';
  reason: string;
}

export interface TeamMoraleAnalysis {
  score: number; // 0-100
  mergeVelocity: 'Slow' | 'Steady' | 'Fast';
  sentiment: 'Negative' | 'Neutral' | 'Positive';
  collaboration: 'Siloed' | 'Cooperative' | 'Synergistic';
  reason: string;
}

export interface RepoStats {
  openIssues: number;
  pullRequests: number;
  lastCommitDaysAgo: number;
  contributors: number;
  isArchived: boolean;
  bestPractices: string[];
  topContributors: string[];
  codeQuality: CodeQualityAnalysis;
  teamMorale: TeamMoraleAnalysis;
  statusHeadline: string; // Descriptive status (e.g. "Drowning in Lint Errors")
}

export interface PetProfile {
  name: string;
  species: string;
  description: string;
  personality: string;
  visualPrompt: string; // Used to generate the image
}

export interface PetState {
  health: number; // 0-100 (Heavily impacted by Code Quality)
  happiness: number; // 0-100 (Heavily impacted by Team Morale)
  energy: number; // 0-100
  cleanliness: number; // 0-100 (Code quality)
  mood: PetMood;
  level: number;
  evolutionStage: string; // 'Egg', 'Hatchling', 'Juvenile', etc.
  imageUrl?: string;
  
  // Explicit tracking for visuals
  codeQualityScore: number;
  moraleScore: number;
  isArchived: boolean;
  statusHeadline: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'workflow';
}

export interface ChatMessage {
  sender: 'user' | 'pet';
  text: string;
}