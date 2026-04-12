/**
 * @file types.ts
 * @module Data/Interfaces
 * @description Domain-driven type definitions and enumerations for the EasyInterview ecosystem.
 * This file serves as the definitive source of truth for conversational and analytical data structures.
 * 
 * @version 1.0.0
 */

/**
 * Lifecycle stages of the interview application.
 * Defines the navigation flow and component rendering state.
 */
export enum AppStep {
  /** Landing page state */
  HOME = 'HOME',
  /** Configuration and resume upload state */
  SETUP = 'SETUP',
  /** Live AI interview session state */
  INTERVIEW = 'INTERVIEW',
  /** Results and feedback analysis state */
  FEEDBACK = 'FEEDBACK',
}

/**
 * Encapsulates the configuration and professional profile of the candidate.
 */
export interface UserDetails {
  /** The candidate's full name */
  name: string;
  /** Professional title the candidate is applying for */
  targetRole: string;
  /** Years or level of expertise (e.g., "Intermediate", "5+ years") */
  experienceLevel: string;
  /** Professional sector */
  industry: string;
  /** Preferred interview language (e.g., "English") */
  language: string;
  /** Specific job details for contextualized questioning */
  jobDescription: string;
  /** Raw File object of the uploaded resume */
  resumeFile: File | null;
  /** Base64 representation of the resume for API submission */
  resumeBase64: string | null;
  /** File format identifier (e.g., "application/pdf") */
  resumeMimeType: string | null;
}

/**
 * Represents a single exchange in the interview conversation history.
 */
export interface Message {
  /** The entity that generated the message */
  role: 'user' | 'model';
  /** The textual content of the message */
  text: string;
  /** Epoch timestamp of when the message was sent */
  timestamp: number;
}

/**
 * Tracks an individual question and answer pair during the session.
 */
export interface InterviewQuestion {
  /** Unique sequential identifier */
  id: number;
  /** The question posed by the AI */
  question: string;
  /** The transcribed answer from the candidate */
  userAnswer: string;
  /** The classified theme of the question (e.g., "Behavioral", "Technical") */
  category: string;
}

/**
 * Professional breakdown of performance in a specific competency area.
 */
export interface CategoryFeedback {
  /** The professional axis being evaluated */
  category: string;
  /** Numerical rating from 0-100 */
  score: number;
  /** List of identified high-performance indicators */
  strengths: string[];
  /** Actionable areas needing further development */
  improvements: string[];
}

/**
 * Granular evaluation of a specific answer provided during the interview.
 */
export interface QuestionFeedback {
  /** The original question text */
  question: string;
  /** The raw transcript of the user's response */
  userAnswer: string;
  /** Positive elements found in the answer */
  goodPoints: string;
  /** Critical missing components or errors */
  missingPoints: string;
  /** A model answer that demonstrates optimal communication */
  improvedExample: string;
}

/**
 * Identifies specific professional discrepancies between the candidate and role requirements.
 */
export interface SkillGap {
  /** Normalized name of the skill or technology */
  skill: string;
  /** Relative proficiency status */
  status: 'strong' | 'weak' | 'missing';
  /** Typification of the skill */
  category: 'technical' | 'domain' | 'soft';
}

/**
 * An actionable step in the project's personalized growth plan.
 */
export interface LearningItem {
  /** Target competency to acquire or improve */
  skill: string;
  /** Specific pedagogical task (e.g., "Complete a React project") */
  action: string;
  /** Suggested medium for learning (e.g., "Project-based", "Documentation") */
  resourceType: string;
}

/**
 * The final comprehensive analytical output of the interview system.
 */
export interface FeedbackReport {
  /** Executive summary of the session */
  overallSummary: string;
  /** Aggregated performance percentage */
  overallScore: number;
  /** Thematic evaluations */
  categoryFeedback: CategoryFeedback[];
  /** Itemized response analysis */
  questionFeedback: QuestionFeedback[];
  /** Specialized resume and ATS compliance analysis */
  resumeAnalysis: {
    /** Estimated Applicant Tracking System (ATS) score */
    atsScore: number;
    /** Resume document highlights */
    strengths: string[];
    /** Critical resume omissions or formatting issues */
    weaknesses: string[];
    /** Strategic advice for resume optimization */
    suggestions: string[];
  };
  /** Comparative skill mapping */
  skillGaps: SkillGap[];
  /** Chronological learning and development roadmap */
  learningRoadmap: LearningItem[];
}

/**
 * A persistent historical record of an individual interview attempt.
 */
export interface SessionRecord {
  /** Unique session identifier */
  id: string;
  /** Iso-formatted or localized date string */
  date: string;
  /** Target role applied for during the session */
  role: string;
  /** Resulting overall score */
  score: number;
}