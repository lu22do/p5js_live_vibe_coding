/**
 * UI management and chat display logic
 */

/**
 * Cache DOM elements
 */
export const uiElements = {
    chatForm: null,
    userInput: null,
    chatHistory: null,
    codeDisplay: null,
    sendButton: null,
    loadingContainer: null,
    userIdDisplay: null,
    errorModal: null,
    errorMessage: null,
    clipboardModal: null
};

/**
 * Initialize UI element references
 */
export function initializeUIElements() {
    uiElements.chatForm = document.getElementById('chat-form');
    uiElements.userInput = document.getElementById('user-input');
    uiElements.chatHistory = document.getElementById('chat-history');
    uiElements.codeDisplay = document.getElementById('code-display');
    uiElements.sendButton = document.getElementById('send-button');
    uiElements.loadingContainer = document.getElementById('loading-container');
    uiElements.userIdDisplay = document.getElementById('user-id-display');
    uiElements.errorModal = document.getElementById('error-modal');
    uiElements.errorMessage = document.getElementById('error-message');
    uiElements.clipboardModal = document.getElementById('clipboard-modal');
}

/**
 * Append a message to the chat history
 * @param {string} role - 'user' or 'model'
 * @param {string} text - The message text
 * @param {string | null} code - The generated code snippet
 */
export function appendMessage(role, text, code = null) {
    const container = document.createElement('div');
    container.className = `flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    const bubble = document.createElement('div');
    bubble.className = `max-w-xs md:max-w-md p-3 text-sm rounded-xl ${role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`;
    
    // Add message text
    bubble.innerHTML = `<p>${text}</p>`;

    // Add generated code display
    if (code) {
        const codeBlockContainer = document.createElement('div');
        codeBlockContainer.className = 'mt-2';
        
        const codePre = document.createElement('pre');
        codePre.className = 'code-block text-xs';
        codePre.textContent = code;

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy Code';
        copyButton.className = 'mt-2 text-xs bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded-md transition duration-150';
        copyButton.onclick = () => copyToClipboard(code);
        
        codeBlockContainer.appendChild(codePre);
        codeBlockContainer.appendChild(copyButton);

        bubble.appendChild(codeBlockContainer);
    }

    container.appendChild(bubble);
    uiElements.chatHistory.appendChild(container);
    uiElements.chatHistory.scrollTop = uiElements.chatHistory.scrollHeight; // Scroll to bottom
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
export function copyToClipboard(text) {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        uiElements.clipboardModal.classList.remove('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            uiElements.clipboardModal.classList.add('opacity-0', 'pointer-events-none');
        }, 1500);
    } catch (err) {
        console.error('Could not copy text: ', err);
    }
}

/**
 * Show error modal with message
 * @param {string} message - Error message to display
 */
export function showErrorModal(message) {
    uiElements.errorMessage.textContent = message;
    uiElements.errorModal.classList.remove('opacity-0', 'pointer-events-none');
}

/**
 * Set loading state
 * @param {boolean} isLoading - Whether the app is loading
 */
export function setLoadingState(isLoading) {
    uiElements.sendButton.disabled = isLoading;
    uiElements.userInput.disabled = isLoading;
    uiElements.loadingContainer.style.display = isLoading ? 'block' : 'none';
}

/**
 * Clear user input
 */
export function clearUserInput() {
    uiElements.userInput.value = '';
}

/**
 * Get user input value
 */
export function getUserInput() {
    return uiElements.userInput.value.trim();
}

/**
 * Update code display
 * @param {string} code - Code to display
 */
export function updateCodeDisplay(code) {
    uiElements.codeDisplay.textContent = code;
}

/**
 * Update user ID display
 * @param {string} userId - User ID to display
 */
export function updateUserIdDisplay(userId) {
    uiElements.userIdDisplay.textContent = userId;
}

/**
 * Set initial UI state
 */
export function setInitialUIState() {
    uiElements.sendButton.disabled = true;
    uiElements.userInput.disabled = true;
    uiElements.userInput.placeholder = "Connecting to services...";
}

/**
 * Enable input and set ready state
 */
export function setReadyState() {
    uiElements.sendButton.disabled = false;
    uiElements.userInput.disabled = false;
    uiElements.userInput.placeholder = "Enter your p5.js request...";
    uiElements.userInput.focus();
}
