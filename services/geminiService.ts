import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { UserDetails, FeedbackReport } from "../types";

// Safely access the API key
let API_KEY = '';
try {
  // Check if import.meta.env exists before accessing it
  if (import.meta && import.meta.env) {
    API_KEY = import.meta.env.VITE_API_KEY || '';
  }
} catch (e) {
  console.warn("Environment variable access failed:", e);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Using gemini-1.5-flash as it is stable and available on the free tier immediately
const CHAT_MODEL = 'gemini-1.5-flash';
const ANALYSIS_MODEL = 'gemini-1.5-flash'; 

export const startInterviewSession = async (userDetails: UserDetails): Promise<Chat> => {
  if (!API_KEY) {
    console.error("API Key is missing. Please check .env or Vercel Settings.");
    throw new Error("API Key is missing. Please add VITE_API_KEY to your environment variables.");
  }

  const systemInstruction = `You are an expert HR interviewer and career coach conducting a video interview.
  
  CANDIDATE DETAILS:
  - Name: ${userDetails.name || 'Candidate'}
  - Role: ${userDetails.targetRole}
  - Industry: ${userDetails.industry}
  - Level: ${userDetails.experienceLevel}

  INSTRUCTIONS:
  1. Act as a professional interviewer. Be polite, encouraging, but rigorous.
  2. Ask ONE question at a time.
  3. LANGUAGE & SPEECH HANDLING:
     - Conduct the interview strictly in ENGLISH.
     - **CRITICAL**: The candidate is using real-time voice-to-text.
     - They may have "realistic" speech patterns like fillers ("aa", "hh", "umm"), long pauses, or cut-off sentences.
     - You MUST understand the core meaning behind these disfluencies. Treat "hh" or "aa" as natural pauses.
     - Do not comment on the fillers unless they severely impact clarity. Focus on the answer's content.
  4. VISUAL AWARENESS:
     - You will receive a video snapshot of the candidate with each turn.
     - Analyze their non-verbal cues (eye contact, smile, nervousness, posture).
     - Occasionally comment on this if relevant (e.g., "I see you're confident," "You seem a bit distracted").
  5. RESPONSE STYLE:
     - Keep spoken responses short (max 2-3 sentences) to maintain a conversational flow.
     - Speak naturally. You can use occasional conversational fillers (e.g., "Alright," "I see") to sound less robotic.
  6. Do NOT give a full evaluation yet. Just interview.
  
  Start by welcoming the candidate in English and asking the first question.`;

  try {
    const chat = ai.chats.create({
      model: CHAT_MODEL,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return chat;
  } catch (error) {
    console.error("Failed to create chat session:", error);
    throw error;
  }
};

export const sendMessageWithVideo = async (
  chat: Chat, 
  text: string, 
  imageBase64?: string | null
): Promise<string> => {
  const parts: any[] = [];
  
  if (text && text.trim().length > 0) {
    parts.push({ text });
  } else {
    // If audio was unintelligible or silent, but video was present
    parts.push({ text: "[User nodded or provided non-verbal input]" });
  }

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64
      }
    });
  }

  try {
    // Passing the array directly to message as per SDK requirement for multimodal
    const response = await chat.sendMessage({
      message: parts
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error (Send Message):", error);
    return "I'm sorry, I'm having trouble connecting to the server. Could you repeat that?";
  }
};

export const sendInitialMessageWithResume = async (chat: Chat, userDetails: UserDetails): Promise<string> => {
  const parts: any[] = [];
  
  let text = `I am ready for the interview. My name is ${userDetails.name}. Role: ${userDetails.targetRole}.`;
  if (userDetails.jobDescription) text += `\nJob Description Context: ${userDetails.jobDescription}`;
  
  parts.push({ text });

  if (userDetails.resumeBase64 && userDetails.resumeMimeType) {
    parts.push({
      inlineData: {
        mimeType: userDetails.resumeMimeType,
        data: userDetails.resumeBase64
      }
    });
  }

  try {
    const response = await chat.sendMessage({
      message: parts
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error (Initial):", error);
    return "Hello! I'm ready to start the interview. Can you hear me?";
  }
};

export const generateDetailedFeedback = async (
  transcript: { role: string; text: string }[],
  userDetails: UserDetails
): Promise<FeedbackReport> => {
  
  const transcriptText = transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n\n');

  const prompt = `
    Analyze this mock video interview session and the candidate's resume.
    
    Candidate: ${userDetails.name}
    Role: ${userDetails.targetRole}
    Experience: ${userDetails.experienceLevel}
    
    TRANSCRIPT:
    ${transcriptText}

    Generate a detailed structured JSON report.
    
    IMPORTANT SCORING RULES:
    
    1. **INTERVIEW SCORE (OVERALL SCORE)**:
       - This must be calculated STRICTLY based on the candidate's answers in the transcript.
       - **CRITICAL**: Do NOT include the Resume/ATS score in this calculation. They are separate.
       - If the transcript shows the candidate did NOT answer questions, or the answers were missing/empty, the **Overall Score must be 0**.
       - If the candidate answered poorly, score low (e.g., 20-40).
       - This score represents "Did they pass the interview?".

    2. **RESUME & ATS ANALYSIS (INDEPENDENT)**:
       - Analyze the provided resume file (if available) against the Target Role ("${userDetails.targetRole}") and Job Description.
       - Calculate an **ATS Score (0-100)** based *only* on the resume document keywords, formatting, and relevance.
       - **CRITICAL**: Even if the interview score is 0, the ATS Score can be high (e.g., 90) if the resume is good. Do not lower the ATS score because of a bad interview.

    3. **OUTPUT FORMAT**:
       - Strictly follow the JSON schema.
       - All scores are out of 100.
  `;

  const parts: any[] = [{ text: prompt }];

  if (userDetails.resumeBase64 && userDetails.resumeMimeType) {
    parts.push({
      inlineData: {
        mimeType: userDetails.resumeMimeType,
        data: userDetails.resumeBase64
      }
    });
  }

  const feedbackSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      overallSummary: { type: Type.STRING },
      overallScore: { type: Type.INTEGER, description: "Interview performance only. 0 if no answers." },
      categoryFeedback: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            score: { type: Type.INTEGER, description: "Score out of 100" },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["category", "score", "strengths", "improvements"]
        }
      },
      questionFeedback: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            userAnswer: { type: Type.STRING },
            goodPoints: { type: Type.STRING },
            missingPoints: { type: Type.STRING },
            improvedExample: { type: Type.STRING },
          },
          required: ["question", "userAnswer", "goodPoints", "missingPoints", "improvedExample"]
        }
      },
      resumeAnalysis: {
        type: Type.OBJECT,
        properties: {
          atsScore: { type: Type.INTEGER, description: "ATS Score out of 100 based on resume file only" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["atsScore", "strengths", "weaknesses", "suggestions"]
      },
      skillGaps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            skill: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["strong", "weak", "missing"] },
            category: { type: Type.STRING, enum: ["technical", "domain", "soft"] }
          },
          required: ["skill", "status", "category"]
        }
      },
      learningRoadmap: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            skill: { type: Type.STRING },
            action: { type: Type.STRING },
            resourceType: { type: Type.STRING }
          },
          required: ["skill", "action", "resourceType"]
        }
      }
    },
    required: ["overallSummary", "overallScore", "categoryFeedback", "questionFeedback", "resumeAnalysis", "skillGaps", "learningRoadmap"]
  };

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: feedbackSchema
      }
    });

    let text = response.text || "{}";
    
    // Robust cleanup to handle any potential markdown wrapper or whitespace
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
       text = text.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(text) as FeedbackReport;
  } catch (e) {
    console.error("Analysis failed", e);
    throw new Error("Failed to generate feedback report. Please ensure your transcript is sufficient.");
  }
};