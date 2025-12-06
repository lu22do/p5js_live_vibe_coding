/**
 * Configuration and constants for the AI p5.js Code Generator
 */

// Load environment variables
const loadEnv = () => {
    try {
        // Try to load from window.__ENV__ (populated by server)
        if (typeof window !== 'undefined' && window.__ENV__) {
            return window.__ENV__;
        }
        // Fallback to checking global scope or return defaults
        return {};
    } catch (e) {
        return {};
    }
};

const env = loadEnv();

// Firebase setup
export const getFirebaseConfig = () => ({
    appId: env.VITE_APP_ID || 'default-app-id',
    config: JSON.parse(env.VITE_FIREBASE_CONFIG || '{}'),
    initialAuthToken: env.VITE_INITIAL_AUTH_TOKEN || null,
});

// OpenAI API configuration
export const OPENAI_CONFIG = {
    apiKey: env.VITE_OPENAI_API_KEY || "",
    modelName: 'gpt-4o-mini',
    getApiUrl: function() {
        return 'https://api.openai.com/v1/chat/completions';
    }
};

// System Instruction for the AI: MUST generate p5.js instance mode code
export const SYSTEM_INSTRUCTION = `You are a specialized p5.js code generator. Your task is to ONLY respond with the complete body of a p5.js sketch function, using instance mode. This code body will be placed inside 'function sketch(p) { ... YOUR CODE HERE ... }'. You MUST define p.setup = function() { ... } and p.draw = function() { ... } within your generated code. Use p.createCanvas, p.background, p.fill, etc. for all p5 functions. Enclose the code block in triple backticks and use the language identifier javascript. DO NOT include any explanatory text, markdown, or comments outside the code block. The code must be ready to run.`;

// API retry configuration
export const API_CONFIG = {
    maxRetries: 3,
    getBackoffDelay: (retryCount) => Math.pow(2, retryCount) * 1000 // Exponential backoff
};
