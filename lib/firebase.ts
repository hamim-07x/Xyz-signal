
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, child, onValue, push } from "firebase/database";

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

// --- USER MANAGEMENT ---
export const saveUserToFirebase = async (user: any) => {
    if (!db || !user) return;
    if (user.id === 1001 && user.first_name === "WEB_USER") return;

    try {
        const userRef = ref(db, 'users/' + user.id);
        const snapshot = await get(userRef);
        const timestamp = new Date().toISOString();

        const userData = {
            firstName: user.first_name || 'Unknown',
            username: user.username || 'No Username',
            language: user.language_code || 'en',
            photoUrl: user.photo_url || '', // Save Photo URL
            lastLogin: timestamp
        };

        if (snapshot.exists()) {
            await update(userRef, userData);
        } else {
            await set(userRef, {
                id: user.id,
                ...userData,
                firstLogin: timestamp,
                platform: 'Telegram Mini App',
                isBanned: false, // Default status
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

// --- ADMIN USER MANAGEMENT (NEW) ---
export const subscribeToAllUsers = (callback: (users: any[]) => void) => {
    if (!db) return () => {};
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
            const usersObj = snapshot.val();
            const usersArray = Object.values(usersObj);
            callback(usersArray);
        } else {
            callback([]);
        }
    });
    return unsubscribe;
};

export const toggleUserBanStatus = async (userId: number, currentStatus: boolean) => {
    if (!db) return;
    const userRef = ref(db, `users/${userId}`);
    try {
        await update(userRef, {
            isBanned: !currentStatus,
            status: !currentStatus ? 'Banned' : 'Active'
        });
    } catch (e) {
        console.error("Error toggling ban:", e);
    }
};

export const listenToUserBanStatus = (userId: number, callback: (isBanned: boolean) => void) => {
    if (!db) return () => {};
    const userRef = ref(db, `users/${userId}/isBanned`);
    const unsubscribe = onValue(userRef, (snapshot) => {
        const isBanned = snapshot.exists() ? snapshot.val() : false;
        callback(isBanned);
    });
    return unsubscribe;
};

// --- GLOBAL SETTINGS MANAGEMENT (SYNC FOR EVERYONE) ---
export const saveGlobalSettings = async (settings: any) => {
    if (!db) return;
    try {
        await set(ref(db, 'settings'), settings);
    } catch (e) {
        console.error("Error saving settings:", e);
        throw e;
    }
};

export const subscribeToSettings = (callback: (settings: any) => void) => {
    if (!db) return () => {};
    const settingsRef = ref(db, 'settings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            // Default settings if none exist
            callback({
                appName: 'X-HUNTER',
                channelLink: '',
                contactLink: '',
                strictMode: false,
                adsTarget: 10,
                adRewardHours: 1,
                dailyAdLimit: 1
            });
        }
    });
    return unsubscribe; // Return unsubscribe function
};

// --- KEY MANAGEMENT (SERVER SIDE) ---
export const generateKeysOnServer = async (keys: any[]) => {
    if (!db) return;
    const updates: any = {};
    keys.forEach(key => {
        updates['keys/' + key.key] = key;
    });
    await update(ref(db), updates);
};

export const redeemKeyOnServer = async (keyString: string, userId: number): Promise<{success: boolean, duration?: number, message: string}> => {
    if (!db) return { success: false, message: "Server Error" };
    
    const keyRef = ref(db, `keys/${keyString}`);
    
    try {
        const snapshot = await get(keyRef);
        if (!snapshot.exists()) {
            return { success: false, message: "INVALID KEY" };
        }

        const keyData = snapshot.val();
        if (keyData.isUsed) {
            return { success: false, message: "KEY ALREADY USED" };
        }

        // Mark as used
        const now = Date.now();
        await update(keyRef, {
            isUsed: true,
            usedBy: userId,
            activatedAt: now
        });

        return { success: true, duration: keyData.durationMs, message: "SUCCESS" };
    } catch (e) {
        console.error(e);
        return { success: false, message: "CONNECTION ERROR" };
    }
};

// --- AD REWARD SYSTEM ---

export const checkAdEligibility = async (userId: number, dailyLimit: number): Promise<boolean> => {
    if (!db) return false;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const adRef = ref(db, `users/${userId}/ad_claims/${today}`);
    
    try {
        const snapshot = await get(adRef);
        if (snapshot.exists()) {
            const count = snapshot.val();
            return count < dailyLimit;
        }
        return true; // No claims yet today
    } catch (e) {
        return false;
    }
};

export const grantAdReward = async (userId: number, hours: number): Promise<number> => {
    if (!db) return 0;
    const durationMs = hours * 60 * 60 * 1000;
    const today = new Date().toISOString().split('T')[0];
    
    const userAdRef = ref(db, `users/${userId}/ad_claims/${today}`);
    
    try {
        // Increment daily count
        const snapshot = await get(userAdRef);
        const currentCount = snapshot.exists() ? snapshot.val() : 0;
        await set(userAdRef, currentCount + 1);

        // Calculate and return reward duration
        return durationMs;
    } catch (e) {
        console.error("Ad Grant Error", e);
        return 0;
    }
};

export const subscribeToKeys = (callback: (keys: any[]) => void) => {
    if (!db) return () => {};
    const keysRef = ref(db, 'keys');
    const unsubscribe = onValue(keysRef, (snapshot) => {
        if (snapshot.exists()) {
            const keysObj = snapshot.val();
            const keysArray = Object.values(keysObj);
            callback(keysArray);
        } else {
            callback([]);
        }
    });
    return unsubscribe;
};

export const deleteAllKeysOnServer = async () => {
    if(!db) return;
    await set(ref(db, 'keys'), null);
}

export const deleteSingleKeyOnServer = async (keyToDelete: string) => {
    if(!db) return;
    await set(ref(db, `keys/${keyToDelete}`), null);
}

export { db };
