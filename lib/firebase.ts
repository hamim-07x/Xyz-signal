
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, child } from "firebase/database";

// REAL CONFIG PROVIDED BY USER
const firebaseConfig = {
  apiKey: "AIzaSyBHykzMVwD87O4gRglC-hCfbEgvdr6e064",
  authDomain: "team-xyz-519ab.firebaseapp.com",
  databaseURL: "https://team-xyz-519ab-default-rtdb.firebaseio.com",
  projectId: "team-xyz-519ab",
  storageBucket: "team-xyz-519ab.firebasestorage.app",
  messagingSenderId: "618572972164",
  appId: "1:618572972164:web:52a4aa87409cd85b9d02d1"
};

let app;
let db: any = null;

try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("Firebase Connected: Project team-xyz-519ab");
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

export const saveUserToFirebase = async (user: any) => {
    if (!db || !user) return;
    
    // Don't save default Guest ID if you want only real TG users
    if (user.id === 1001 && user.first_name === "WEB_USER") return;

    try {
        const userRef = ref(db, 'users/' + user.id);
        const snapshot = await get(userRef);
        
        const timestamp = new Date().toISOString();

        if (snapshot.exists()) {
            // Update existing user
            await update(userRef, {
                lastLogin: timestamp,
                firstName: user.first_name || 'Unknown',
                username: user.username || 'No Username',
                language: user.language_code || 'en'
            });
        } else {
            // Create new user
            await set(userRef, {
                id: user.id,
                firstName: user.first_name || 'Unknown',
                username: user.username || 'No Username',
                language: user.language_code || 'en',
                firstLogin: timestamp,
                lastLogin: timestamp,
                platform: 'Telegram Mini App',
                status: 'Active'
            });
        }
    } catch (e) {
        console.error("Error saving to Firebase:", e);
    }
};

export const getRealUserCount = async (): Promise<number> => {
    if (!db) return 0;
    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, "users"));
        if (snapshot.exists()) {
            return Object.keys(snapshot.val()).length;
        } else {
            return 0;
        }
    } catch (error) {
        console.error("Error fetching user count:", error);
        return 0;
    }
};

export { db };
