/**
 * Firebase initialization and authentication service
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, limit, orderBy, onSnapshot, Timestamp, addDoc, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getFirebaseConfig } from './config.js';

setLogLevel('Debug');

let app = null;
let db = null;
let auth = null;
let userId = null;
let isAuthReady = false;
let authStateCallback = null;

const config = getFirebaseConfig();

/**
 * Initialize Firebase app and authentication
 * @param {Function} onAuthReady - Callback when authentication is ready
 */
export async function initFirebase(onAuthReady) {
    authStateCallback = onAuthReady;
    
    if (Object.keys(config.config).length === 0) {
        console.error("Firebase config is empty. Cannot initialize.");
        return;
    }

    app = initializeApp(config.config);
    db = getFirestore(app);
    auth = getAuth(app);

    // Handle authentication state changes
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userId = user.uid;
        } else {
            // If auth fails for any reason, sign in anonymously
            try {
                await signInAnonymously(auth);
                userId = auth.currentUser.uid;
            } catch (error) {
                console.error("Anonymous sign-in failed:", error);
                // Fallback to a random ID if Firebase fails entirely
                userId = crypto.randomUUID();
            }
        }
        
        isAuthReady = true;
        
        // Start listening to chat history once authenticated
        if (db) {
            listenToChatHistory();
        }

        // Notify caller that auth is ready
        if (authStateCallback) {
            authStateCallback(userId);
        }
    });

    // Attempt custom token sign-in if token is provided
    if (config.initialAuthToken) {
        signInWithCustomToken(auth, config.initialAuthToken)
            .catch((error) => {
                console.error("Custom token sign-in failed. Falling back to anonymous.", error);
            });
    }
}

/**
 * Get the current user ID
 */
export function getUserId() {
    return userId;
}

/**
 * Check if authentication is ready
 */
export function isAuthenticationReady() {
    return isAuthReady;
}

/**
 * Get the Firestore collection path for the chat history
 */
function getChatCollectionRef() {
    if (!db) return null;
    return collection(db, 'artifacts', config.appId, 'public', 'data', 'chat_history');
}

/**
 * Listen to the latest messages in the public chat history
 */
function listenToChatHistory() {
    const ref = getChatCollectionRef();
    if (!ref) return;

    const q = query(
        ref,
        orderBy('timestamp', 'desc'),
        limit(5)
    );

    onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach(doc => {
            messages.unshift(doc.data());
        });
        // Messages are now available in the messages array
        // Manual DOM updates happen during live chat
    });
}

/**
 * Save a message to Firestore
 * @param {string} role - 'user' or 'model'
 * @param {string} text - The message text
 * @param {string | null} code - The generated code snippet
 */
export async function saveMessage(role, text, code = null) {
    const ref = getChatCollectionRef();
    if (!ref) return;
    
    // Guard: Prevent saving if authentication hasn't completed yet
    if (!userId) {
        console.warn("Attempted to save message before authentication was ready.");
        return; 
    }

    try {
        await addDoc(ref, {
            userId: userId,
            role: role,
            text: text,
            code: code,
            timestamp: Timestamp.now()
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}
