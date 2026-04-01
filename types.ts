
import type { User as FirebaseUser } from "@firebase/auth";

export type AppUser = FirebaseUser | null;
export type InterviewType = "Technical" | "HR";
export type Difficulty = "easy" | "medium" | "hard";

export interface SkillState {
  name: string;
  confidence: number;   // [0, 1]
  uncertainty: number;  // [0, 1]
  history: number[];    // numeric scores
}

// Added missing fields used in results and history pages
export interface Feedback {
  score: number;        // Overall score (typically 0-10 or -1 to 1)
  strengths: string;
  weaknesses: string;
  suggestions: string;
  brushUpTopics?: string[]; // New field for specific study recommendations
  difficultyNext: Difficulty;
  technicalKnowledge?: number;
  problemSolving?: number;
  communication?: number;
  clarity?: number;
}

// Added duration and requiresCode for session tracking
export interface QuestionAndAnswer {
  question: string;
  answer: string;
  skillEvaluated?: string;
  score?: number;
  code?: string;
  feedback?: Feedback;
  duration?: number;
  requiresCode?: boolean;
  status?: 'answered' | 'skipped';
}

// Added missing InterviewConfig interface
export interface InterviewConfig {
  jobRole: string;
  interviewType: InterviewType;
  resumeData?: {
    base64: string;
    mimeType: string;
    fileName: string;
  };
}

// Added missing InterviewSession interface
export interface InterviewSession {
  id?: string;
  userId: string;
  config: InterviewConfig;
  questionsAndAnswers: QuestionAndAnswer[];
  overallScore: number;
  completedAt: Date;
}

export interface ResumeAnalysis {
  jobTargetAlignment: {
    summary: string;
    semanticScore: number;
    explanation: string;
  };
  impactAnalysis: {
    gaps: string[];
    lowImpactBullets: string[];
    quantificationPriority: string[];
  };
  skillGapAnalysis: {
    missingCritical: string[];
    unsupportedClaims: string[];
    overloadedSections: string[];
    skillClassification: {
      core: string[];
      supporting: string[];
      optional: string[];
    };
  };
  structureAndScan: {
    findings: string[];
    reorderingSuggestions: string[];
    densityEvaluation: string;
  };
  languageEnhancement: {
    criticalImprovements: string[];
    toneShiftSuggestions: string;
    atsMitigationSteps: string[];
  };
  interviewBridging: {
    likelyQuestions: string[];
    challengePoints: string[];
    evidenceNeeds: string[];
  };
  riskLevel: "Low" | "Medium" | "High";
  priorityActionSteps: string[];
}
