# EasyInterview Architecture

This document describes the high-level architecture of the EasyInterview platform.

## System Overview
EasyInterview is a multimodal AI coaching platform that leverages real-time vision, speech, and text to simulate professional interviews.

## Core Pillars

### 1. Vision Engine
- **Captured via**: Browser MediaDevices API.
- **Processing**: Periodic base64 snapshots of the user's video feed.
- **AI Integration**: Snapshots are sent to Google Gemini Pro Vision to analyze body language, professional attire, and presence.

### 2. Speech Engine (Multimodal Sync)
- **STT (Speech-to-Text)**: Uses Web Speech API for real-time transcription.
- **TTS (Text-to-Speech)**: Uses browser-native synthesis to provide "Ava's" voice.
- **Synchronization**: Managed via custom hooks (`useSpeech.ts`) to ensure AI doesn't talk over the user.

### 3. Intelligence Layer (Gemini)
- **State Management**: Uses stateful history to maintain context throughout the interview.
- **Prompt Engineering**: Dynamic system instructions tailored to the candidate's resume and job description.

## Data Flow
1. User speaks -> STT Transcription.
2. Transcription + Video Snapshot -> Gemini API.
3. Gemini Response Text -> TTS Synthesis.
4. Final Transcript -> Scoring & Feedback Engine.

## Tech Stack
- **Frontend**: React (Vite)
- **Styling**: TailwindCSS
- **AI**: Google Generative AI (Gemini SDK)
- **Deployment**: Vercel
