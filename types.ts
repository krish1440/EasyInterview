export enum AppStep {
  HOME = 'HOME',
  SETUP = 'SETUP',
  INTERVIEW = 'INTERVIEW',
  FEEDBACK = 'FEEDBACK',
}

export interface UserDetails {
  name: string;
  targetRole: string;
  experienceLevel: string;
  industry: string;
  language: string; // Added language support
  jobDescription: string;
  resumeFile: File | null;
  resumeBase64: string | null;
  resumeMimeType: string | null;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface InterviewQuestion {
  id: number;
  question: string;
  userAnswer: string;
  category: string; // inferred
}

export interface CategoryFeedback {
  category: string;
  score: number;
  strengths: string[];
  improvements: string[];
}

export interface QuestionFeedback {
  question: string;
  userAnswer: string;
  goodPoints: string;
  missingPoints: string;
  improvedExample: string;
}

export interface SkillGap {
  skill: string;
  status: 'strong' | 'weak' | 'missing';
  category: 'technical' | 'domain' | 'soft';
}

export interface LearningItem {
  skill: string;
  action: string;
  resourceType: string;
}

export interface FeedbackReport {
  overallSummary: string;
  overallScore: number;
  categoryFeedback: CategoryFeedback[];
  questionFeedback: QuestionFeedback[];
  resumeAnalysis: {
    atsScore: number; // Added ATS score
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  skillGaps: SkillGap[];
  learningRoadmap: LearningItem[];
}

export interface SessionRecord {
  id: string;
  date: string;
  role: string;
  score: number;
}