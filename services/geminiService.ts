import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { UserDetails, FeedbackReport } from "../types";

// ✅ Read API key securely from environment variable
// The API key must be obtained exclusively from process.env.API_KEY per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// PRIORITY LIST: Strictly restricted to user's available 2.5 models
const MODEL_PRIORITY_LIST = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
];

// Cache the working model so we don't check every time
let activeModel: string | null = null;

// Helper to find a working model
const getWorkingModel = async (): Promise<string> => {
  if (activeModel) return activeModel;

  console.log("Checking for available Gemini models...");
  
  for (const model of MODEL_PRIORITY_LIST) {
    try {
      console.log(`Testing model quota: ${model}...`);
      // CRITICAL FIX: Use generateContent instead of countTokens.
      // countTokens does not consume 'generate_content' quota, so it gives false positives 
      // when the daily limit (e.g., 20/day) is reached.
      // We send a minimal request to test the actual generation capability.
      await ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: 'hi' }] }],
        config: { 
          maxOutputTokens: 1,
          thinkingConfig: { thinkingBudget: 0 } // Disable thinking for probe to safe tokens and latency
        }
      });
      
      console.log(`✅ Model operational: ${model}`);
      activeModel = model;
      return model;
    } catch (error: any) {
      // Check for Quota Exceeded (429) or Not Found (404)
      const isQuotaError = error.status === 429 || error.code === 429 || 
                           (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')));
      
      if (isQuotaError) {
        console.warn(`⚠️ Model ${model} QUOTA EXCEEDED. Switching to next...`);
      } else {
        console.warn(`⚠️ Model ${model} failed check (Status: ${error.status || error.message}).`);
      }
      // Continue to next model in list
    }
  }

  // If everything fails, default to the primary 2.5 model (and let the UI handle the error)
  console.log("⚠️ All checks failed, defaulting to gemini-2.5-flash");
  return 'gemini-2.5-flash';
};

export const startInterviewSession = async (userDetails: UserDetails): Promise<Chat> => {
  // 1. Determine which model to use dynamically
  const CHAT_MODEL = await getWorkingModel();

  const systemInstruction = `You are **Ava**, an expert HR interviewer and career coach conducting a video interview.
  
  CANDIDATE DETAILS:
  - Name: ${userDetails.name || 'Candidate'}
  - Role: ${userDetails.targetRole}
  - Industry: ${userDetails.industry}
  - Level: ${userDetails.experienceLevel}

  INSTRUCTIONS:
  1. Act as a professional interviewer named Ava. Be polite, encouraging, but rigorous.
  2. Ask ONE question at a time.
  3. LANGUAGE & SPEECH HANDLING:
     - Conduct the interview strictly in ENGLISH.
     - **CRITICAL**: The candidate is using real-time voice-to-text.
     - They may have "realistic" speech patterns like fillers ("aa", "hh", "umm"), long pauses, or cut-off sentences.
     - You MUST understand the core meaning behind these disfluencies. Treat "hh" or "aa" as natural pauses.
     - Do not comment on the fillers unless they severely impact clarity. Focus on the answer's content.
  4. **ACTIVE VISUAL MONITORING (CRITICAL)**:
     - You will receive a video snapshot of the candidate with each turn.
     - **You must ACTIVELY analyze their body language, posture, and eye contact.**
     - If you detect issues (e.g., candidate looking away/down, slouching, bad lighting, nervous expressions, or looking off-screen):
       - **IMMEDIATELY** politely mention it before asking the next question.
       - Example: "I notice you are looking down quite a bit. Try to maintain eye contact with the camera. Now, regarding..."
       - Example: "Your posture seems a bit relaxed, try to sit up straight to project confidence. Moving on..."
     - If they look good, occasionally compliment it: "Good eye contact and confidence."
  5. RESPONSE STYLE:
     - Keep spoken responses short (max 2-3 sentences) to maintain a conversational flow.
     - Speak naturally. You can use occasional conversational fillers (e.g., "Alright," "I see") to sound less robotic.
  6. Do NOT give a full evaluation report yet. Just interview and provide real-time visual coaching.
  
  Start by welcoming the candidate in English (introduce yourself as Ava) and asking the first question.`;

  const chat = ai.chats.create({
    model: CHAT_MODEL,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  return chat;
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
  } catch (error: any) {
    // Log full error for debugging
    console.error("Gemini API Error:", error);

    // Normalize error object (sometimes it's nested in error.error)
    const errorObj = error.error || error;
    const message = error.message || errorObj.message || JSON.stringify(error);

    // 1. Check for Network / XHR / RPC errors
    if (message.includes('xhr error') || message.includes('Rpc failed') || message.includes('fetch failed') || message.includes('NetworkError')) {
       // Do not reset model cache for network errors, just inform user
       return "Error: Network connection unstable. I couldn't receive your message. Please try sending again.";
    }

    // 2. Check for Quota Exceeded (429)
    const isQuotaError = error.status === 429 || error.code === 429 || 
                         (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED'));
    
    if (isQuotaError) {
       activeModel = null; // Clear active model so getWorkingModel tries the next one (Lite)
       return "Error: Daily quota exceeded for this model. Please tap Retry/Send to switch to the backup model.";
    }

    // 3. Check for 404 / Not Found
    if (error.status === 404 || message.includes('404')) {
       activeModel = null; // Force re-check on next attempt
       return "Error: AI Service temporarily unavailable (404). Please try again.";
    }
    
    // Default fallback
    return "Error: Something went wrong. Please try again.";
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
  } catch (error: any) {
    const errorObj = error.error || error;
    const message = error.message || errorObj.message || JSON.stringify(error);

    // Network Errors
    if (message.includes('xhr error') || message.includes('Rpc failed') || message.includes('fetch failed')) {
       return "Error: Network connection failed. Please check your internet.";
    }

    const isQuotaError = error.status === 429 || error.code === 429 || 
                         (message.includes('429') || message.includes('quota') || message.includes('RESOURCE_EXHAUSTED'));

    if (error.status === 404) {
       activeModel = null;
       return "Error: Model not found (404). Please check configuration.";
    }
    
    if (isQuotaError) {
       activeModel = null; // Reset so next try uses fallback
       return "Error: Quota exceeded. Please try again to switch models.";
    }
    
    return "Error: Failed to initialize. Please check your connection.";
  }
};

export const generateDetailedFeedback = async (
  transcript: { role: string; text: string }[],
  userDetails: UserDetails
): Promise<FeedbackReport> => {
  
  // Also use the working model for feedback
  const ANALYSIS_MODEL = await getWorkingModel();

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
       - **SCORING CALIBRATION**:
         - **0**: ONLY use this if the transcript shows absolute silence, technical errors, or "No Answer" for ALL questions.
         - **10-30**: Candidate gave very short, one-word, or irrelevant answers. (Do NOT give 0 if they spoke).
         - **31-50**: Candidate attempted to answer but was vague, incorrect, or lacked depth.
         - **51-70**: Average performance, answered the basics but missed details.
         - **71-100**: Strong, clear, and detailed answers.
       - **RULE**: If the candidate provided ANY audible text (even if short), the score MUST be greater than 0.

    2. **RESUME & ATS ANALYSIS (INDEPENDENT)**:
       - Analyze the provided resume file (if available) against the Target Role ("${userDetails.targetRole}") and Job Description.
       - Calculate an **ATS Score (0-100)** based *only* on the resume document keywords, formatting, and relevance.
       - **CRITICAL**: Even if the interview score is 0, the ATS Score can be high (e.g., 90) if the resume is good. Do not lower the ATS score because of a bad interview.

    3. **FEEDBACK CATEGORIES**:
       - You MUST include these exact categories in "categoryFeedback" with scores (0-100):
         1. "Communication" (Did they provide complete, relevant answers?)
         2. "Technical Knowledge"
         3. "Problem Solving & Analytical Skills"
         4. "Visual Presence & Confidence"
         5. "Resume Presentation & Elaboration" (Did they explain their resume well?)
       - Apply the same scoring calibration rule (No 0s unless silent).

    4. **OUTPUT FORMAT**:
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
