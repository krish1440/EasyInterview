/**
 * @file geminiService.ts
 * @module Services/AI
 * @description Core service layer for interfacing with Google Generative AI (Gemini).
 * Handles multimodal interview sessions, real-time message exchange with visual context,
 * and comprehensive feedback generation using structured JSON outputs.
 * 
 * @version 1.1.0
 * @package EasyInterview
 */

import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { UserDetails, FeedbackReport } from "../types";

/**
 * Initializes the Google Generative AI instance with the provided API key.
 * @access private
 */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Internal priority list for Gemini models.
 * Implements a failover hierarchy: Primary (latest) -> Stable Flash-lite.
 * @constant {string[]}
 * @private
 */
const MODEL_PRIORITY_LIST = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

/**
 * Locally cached working model identifier to prevent redundant health checks.
 * @type {string | null}
 */
let activeModel: string | null = null;

/**
 * Determines if a given error is related to API quota exhaustion or rate limiting.
 * 
 * @param {any} error - The error object caught during an API call.
 * @returns {boolean} True if the error indicates a quota or resource exhaustion issue.
 */
const isErrorQuotaRelated = (error: any): boolean => {
  const msg = (error.message || JSON.stringify(error)).toLowerCase();
  return (
    error.status === 429 || 
    error.code === 429 || 
    msg.includes('429') || 
    msg.includes('quota') || 
    msg.includes('resource_exhausted') ||
    msg.includes('exhausted')
  );
};

/**
 * Discovers the optimal operational model from the priority list.
 * 
 * @description
 * Implements a greedy health-check algorithm that:
 * 1. Checks for a cached 'activeModel' to avoid redundant RTT.
 * 2. Iteratively tests models for quota availability and network reachability.
 * 3. Logs telemetry for model availability.
 * 
 * @async
 * @function getWorkingModel
 * @returns {Promise<string>} An operational model identifier (e.g., 'gemini-2.5-flash').
 * @throws {Error} Implicitly defaults to the primary model if all health checks fail.
 */
const getWorkingModel = async (): Promise<string> => {
  if (activeModel) return activeModel;

  console.log("Checking for available Gemini models...");
  
  for (const model of MODEL_PRIORITY_LIST) {
    try {
      console.log(`Testing model quota: ${model}...`);
      await ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: 'hi' }] }],
        config: { 
          maxOutputTokens: 1,
        }
      });
      
      console.log(`✅ Model operational: ${model}`);
      activeModel = model;
      return model;
    } catch (error: any) {
      if (isErrorQuotaRelated(error)) {
        console.warn(`⚠️ Model ${model} QUOTA EXCEEDED. Switching to next...`);
      } else {
        console.warn(`⚠️ Model ${model} failed check.`, error);
      }
    }
  }

  console.log("⚠️ All checks failed, defaulting to gemini-2.5-flash");
  return 'gemini-2.5-flash';
};

/**
 * Orchestrates the initialization of a specialized interview session.
 * 
 * @description
 * Configures the Google GenAI Chat instance with a high-fidelity system instruction (the "Ava" persona).
 * The persona is dynamically injected with candidate-specific metadata to ensure a contextual 
 * and rigorous interview experience.
 * 
 * @async
 * @function startInterviewSession
 * @param {UserDetails} userDetails - The candidate's professional profile, target role, and experience level.
 * @returns {Promise<Chat>} A configured Google Generative AI Chat session.
 * @see {@link Chat} for session-based messaging logic.
 */
export const startInterviewSession = async (userDetails: UserDetails): Promise<Chat> => {
  const CHAT_MODEL = await getWorkingModel();
  
  console.log(`Starting session with model: ${CHAT_MODEL}`);

  const systemInstruction = `
# ROLE: SOPHISTICATED AI INTERVIEW ARCHITECT (AVA)
You are **Ava**, a high-tier HR Executive and Career Strategist. Your mission is to conduct a professional, high-stakes mock interview that feels authentic, challenging, and ultimately transformative.

## CANDIDATE PROFILE:
- **Identifier**: ${userDetails.name || 'Candidate'}
- **Target Horizon**: ${userDetails.targetRole}
- **Industry Sector**: ${userDetails.industry}
- **Expertise Tier**: ${userDetails.experienceLevel}

## CORE OPERATIONAL PRINCIPLES:
1. **Persona**: Direct, articulate, and encouraging. You are not a bot; you are a mentor. Your tone should be executive-level: polished but warm.
2. **Pacing**: Ask exactly **ONE** pointed question at a time. Do not overwhelm the candidate.
3. **Linguistic Intelligence**: 
   - Operations are strictly in **ENGLISH**.
   - The candidate is utilizing real-time transcription. Ignore disfluencies ("um", "ah", "stuttering") and focus on the semantic intent behind their words.
4. **Visual Synthesis**:
   - You have access to real-time visual frames. Monitor posture, eye contact, and professional presence.
   - **Crucial**: Weave visual feedback into your transitions. If you notice a lack of eye contact or poor posture, address it gently as a "coaching tip" before moving to the next question.
5. **Response Architecture**: Keep your spoken dialogue concise (2-4 sentences). Use high-impact professional vocabulary.

## INTERVIEW FLOW:
- **Phase 1: Rapport**: Professional greeting and initial situational question.
- **Phase 2: Domain Deep-Dive**: Rigorous exploration of skills relevant to ${userDetails.targetRole}.
- **Phase 3: Behavioral/Cultural**: Scenario-based questions (STAR method).
- **Phase 4: Synthesis**: Final wrap-up.

Initialize the session now by welcoming the candidate with executive grace and posing your opening question.
  `.trim();

  const chat = ai.chats.create({
    model: CHAT_MODEL,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  return chat;
};

/**
 * Facilitates multimodal communication (textual input + visual frames) with the AI.
 * 
 * @description
 * This is the core interactive bridge. It serializes textual transcripts and 
 * optional base64 image snapshots into a multimodal payload for the Gemini Vision model.
 * It includes robust error mapping for:
 * - Network instability (Fetch/XHR/RPC failures)
 * - Provider-side resource exhaustion (429 Quota Exceeded)
 * - Service availability (404/500 errors)
 * 
 * @async
 * @function sendMessageWithVideo
 * @param {Chat} chat - The active stateful chat session.
 * @param {string} text - The transcribed speech or user-typed text.
 * @param {string | null} [imageBase64] - A base64 encoded snapshot of the candidate's video feed.
 * @returns {Promise<string>} The AI's natural language response.
 */
export const sendMessageWithVideo = async (
  chat: Chat, 
  text: string, 
  imageBase64?: string | null
): Promise<string> => {
  const parts: any[] = [];
  
  if (text && text.trim().length > 0) {
    parts.push({ text });
  } else {
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
    const response = await chat.sendMessage({
      message: parts
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    const errorObj = error.error || error;
    const message = error.message || errorObj.message || JSON.stringify(error);

    if (message.includes('xhr error') || message.includes('Rpc failed') || message.includes('fetch failed') || message.includes('NetworkError')) {
       return "Error: Network connection unstable. I couldn't receive your message. Please try sending again.";
    }

    if (isErrorQuotaRelated(error)) {
       activeModel = null;
       return "Error: Daily quota exceeded for this model. Please tap Retry/Send to switch to the backup model.";
    }

    if (error.status === 404 || message.includes('404')) {
       activeModel = null;
       return "Error: AI Service temporarily unavailable (404). Please try again.";
    }
    
    return "Error: Something went wrong. Please try again.";
  }
};

/**
 * Initializes the interview by providing the candidate's resume and initial profile context.
 * 
 * @async
 * @param {Chat} chat - The Chat session instance.
 * @param {UserDetails} userDetails - The candidate's details including resume data.
 * @returns {Promise<string>} The first question or acknowledgement from the AI.
 */
export const sendInitialMessageWithResume = async (chat: Chat, userDetails: UserDetails): Promise<string> => {
  const parts: any[] = [];
  
  let text = `[SESSION INITIALIZATION]
Candidate: ${userDetails.name}
Role: ${userDetails.targetRole}
Experience Level: ${userDetails.experienceLevel}

The candidate has entered the interview space. Please initialize the "Ava" persona and begin the session by acknowledging their background and posing a strategic opening question.
${userDetails.jobDescription ? `\n--- JOB DESCRIPTION CONTEXT ---\n${userDetails.jobDescription}` : ''}`;
  
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
    console.error("Initial Connection Error:", error);
    const errorObj = error.error || error;
    const message = error.message || errorObj.message || JSON.stringify(error);

    if (message.includes('xhr error') || message.includes('Rpc failed') || message.includes('fetch failed')) {
       return "Error: Network connection failed. Please check your internet.";
    }

    if (error.status === 404) {
       activeModel = null;
       return "Error: Model not found (404). Please check configuration.";
    }
    
    if (isErrorQuotaRelated(error)) {
       activeModel = null;
       return "Error: Quota exceeded. Please try again to switch models.";
    }
    
    return `Error: Failed to initialize. (${message.substring(0, 100)}...)`;
  }
};

/**
 * Generates an end-of-session comprehensive analytical report.
 * 
 * @description
 * Implements a complex analytical pipeline that:
 * 1. Aggregates the entire transcript into a dense contextual payload.
 * 2. Injects the candidate's resume (if provided) as a multimodal PDF/Image part.
 * 3. Enforces strict JSON output via type-safe schemas using Gemini's structured output capability.
 * 4. Parses and validates the response into a FeedbackReport object.
 * 
 * The report covers overall scoring, categorical feedback, ATS resume analysis, 
 * and a tactical learning roadmap.
 * 
 * @async
 * @function generateDetailedFeedback
 * @param {Array<{role: string, text: string}>} transcript - The sequential dialogue history of the session.
 * @param {UserDetails} userDetails - Essential candidate metadata and resume data.
 * @returns {Promise<FeedbackReport>} The final structured analysis for the candidate.
 * @throws {Error} If the AI fails to produce a valid JSON report or schema validation fails.
 */
export const generateDetailedFeedback = async (
  transcript: { role: string; text: string }[],
  userDetails: UserDetails
): Promise<FeedbackReport> => {
  const ANALYSIS_MODEL = await getWorkingModel();
  const transcriptText = transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n\n');

  const prompt = `
# EXECUTIVE INTERVIEW & RESUME AUDIT
Perform a multi-dimensional analysis of the following mock interview session and professional credentials.

## CONTEXT:
- **Candidate Alpha**: ${userDetails.name || 'Anonymous candidate'}
- **Target Role**: ${userDetails.targetRole}
- **Experience Level**: ${userDetails.experienceLevel}

## DATA SOURCE (TRANSCRIPT):
${transcriptText}

## ANALYSIS REQUIREMENTS:
1. **Linguistic Precision**: Evaluate vocabulary, clarity, and confidence.
2. **Content Depth**: Audit technical accuracy and the Use of STAR (Situation, Task, Action, Result) in behavioral answers.
3. **ATS Alignment**: Cross-reference the resume against the target role requirements for keyword density and structural integrity.
4. **Growth Roadmap**: Construct a tactical learning path to bridge identified skill gaps.

Generate a hyper-structured JSON report following the prescribed schema. Ensure scores (0-100) are rigorous and reflect executive-level expectations.
  `.trim();

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
