/**
 * OpenAI API service for code generation
 */

import { OPENAI_CONFIG, SYSTEM_INSTRUCTION, API_CONFIG } from './config.js';

/**
 * Extracts code from markdown fences
 * @param {string} responseText - The full text response from the model
 * @returns {string | null} The content of the first ```javascript block, or null
 */
export function extractCode(responseText) {
    const regex = /```javascript\s*([\s\S]*?)\s*```/m;
    const match = responseText.match(regex);
    return match ? match[1].trim() : null;
}

/**
 * Call OpenAI API to generate p5.js code
 * @param {string} prompt - User prompt
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<{aiText: string, codeBody: string | null}>} API response and extracted code
 */
export async function callOpenAIAPI(prompt, apiKey) {
    const apiUrl = OPENAI_CONFIG.getApiUrl();
    
    const payload = {
        model: OPENAI_CONFIG.modelName,
        messages: [
            {
                role: "system",
                content: SYSTEM_INSTRUCTION
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.7,
        max_tokens: 2000
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new Error(`API returned status ${response.status}: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    
    if (!result.choices?.[0]?.message?.content) {
        throw new Error("Received an invalid response structure from the API.");
    }

    const aiText = result.choices[0].message.content;
    const codeBody = extractCode(aiText);

    return { aiText, codeBody };
}

/**
 * Generate p5.js code with retry logic
 * @param {string} prompt - User prompt
 * @param {string} apiKey - OpenAI API key
 * @param {Function} onRetry - Callback on retry
 * @returns {Promise<{aiText: string, codeBody: string | null}>} API response and extracted code
 */
export async function generateCodeWithRetry(prompt, apiKey, onRetry = null) {
    let retries = 0;

    while (retries < API_CONFIG.maxRetries) {
        try {
            return await callOpenAIAPI(prompt, apiKey);
        } catch (error) {
            retries++;
            console.error(`Attempt ${retries} failed:`, error);
            
            if (retries >= API_CONFIG.maxRetries) {
                throw new Error(`Failed after ${API_CONFIG.maxRetries} attempts. ${error.message}`);
            }

            if (onRetry) {
                onRetry(retries);
            }

            const delay = API_CONFIG.getBackoffDelay(retries);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
