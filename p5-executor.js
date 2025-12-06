/**
 * P5.js code execution and sketch management
 */

let currentSketch = null;

/**
 * Clears any existing sketch and runs the new p5.js code body.
 * @param {string} rawCodeBody - The p5.js code body provided by the AI.
 * @param {Function} showErrorModal - Function to display error messages
 * @returns {boolean} True if execution succeeded, false otherwise.
 */
export function runP5Code(rawCodeBody, showErrorModal) {
    // 1. Stop the existing sketch if running
    if (currentSketch) {
        currentSketch.remove();
        currentSketch = null;
    }

    // 2. Clear the container
    const container = document.getElementById('canvas-container');
    container.innerHTML = `<p class="text-gray-500 text-center">Your p5.js sketch will appear here.</p>`;

    if (!rawCodeBody || rawCodeBody.trim() === '') {
        return false;
    }

    // 3. Construct the full sketch function wrapper
    const sketchWrapper = `
        window.sketch = function(p) {
            // User code is inserted here. It must use p. prefix.
            // This is the raw code body from the AI response.
            ${rawCodeBody}
        };
    `;
    
    try {
        // 4. Use eval() to define the function in the global scope
        eval(sketchWrapper); 
        
        // 5. Check if 'window.sketch' function was defined
        if (typeof window.sketch === 'function') {
            // Remove placeholder text
            container.innerHTML = '';
            
            // 6. Create a new p5 instance in instance mode
            currentSketch = new p5(window.sketch, 'canvas-container');
            
            // 7. Clean up the global function reference immediately
            delete window.sketch; 
            return true;
        } else {
            throw new Error("AI response did not generate the required sketch function structure.");
        }
    } catch (e) {
        console.error("Error executing p5.js code:", e);
        showErrorModal(`An error occurred while running the sketch: ${e.message}`);
        return false;
    }
}

/**
 * Clean up the current sketch
 */
export function cleanupSketch() {
    if (currentSketch) {
        currentSketch.remove();
        currentSketch = null;
    }
}
