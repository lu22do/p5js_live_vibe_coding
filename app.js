/**
 * Main application controller
 */

import { initFirebase, saveMessage, getUserId } from './firebase-service.js';
import { runP5Code } from './p5-executor.js';
import {
    initializeUIElements,
    uiElements,
    appendMessage,
    showErrorModal,
    setLoadingState,
    clearUserInput,
    getUserInput,
    updateCodeDisplay,
    updateUserIdDisplay,
    setInitialUIState,
    setReadyState
} from './ui-manager.js';
import { generateCodeWithRetry } from './gemini-service.js';
import { OPENAI_CONFIG } from './config.js';

/**
 * Handle send message event
 */
async function handleSendMessage(event) {
    event.preventDefault();

    const prompt = getUserInput();
    if (!prompt) return;

    // 1. Disable input and show loading
    setLoadingState(true);
    clearUserInput();

    // 2. Display user message
    appendMessage('user', prompt);
    // Save the user message
    saveMessage('user', prompt);

    try {
        // 3. Call OpenAI API to generate code
        const { aiText, codeBody } = await generateCodeWithRetry(prompt, OPENAI_CONFIG.apiKey);

        // 4. Update AI response UI
        const defaultMessage = "The AI generated the p5.js sketch below:";
        const displayMessage = codeBody ? defaultMessage : `I encountered an issue generating a runnable sketch. Here is the raw output I received: \n\n${aiText}`;
        
        appendMessage('model', displayMessage, codeBody);
        // Save the model message
        saveMessage('model', aiText, codeBody);
        
        // 5. Update Code Display Area
        updateCodeDisplay(codeBody || aiText);

        // 6. Execute Code (if found)
        if (codeBody) {
            runP5Code(codeBody, showErrorModal);
        }

    } catch (error) {
        console.error("Error:", error);
        showErrorModal(`Failed to get a response from the AI. Please try again later. Error: ${error.message}`);
        appendMessage('model', "I'm having trouble connecting to the AI right now. Please check the console for details.");
        saveMessage('model', `Failed to generate code: ${error.message}`);
    } finally {
        // 7. Re-enable input and hide loading
        setLoadingState(false);
        setReadyState();
    }
}

/**
 * Initialize the application
 */
function initializeApp() {
    // Initialize UI elements
    initializeUIElements();
    
    // Set initial state
    setInitialUIState();

    // Setup event listeners
    uiElements.chatForm.addEventListener('submit', handleSendMessage);

    // Initialize Firebase
    initFirebase((userId) => {
        updateUserIdDisplay(userId);
        setReadyState();
    });
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
