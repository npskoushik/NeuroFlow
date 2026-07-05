import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, update, remove, query, orderByChild, limitToLast } from 'firebase/database'
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth'

// ──────────────────────────────────────────────────────────────
// Firebase Configuration
// ──────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
let auth: Auth | null = null

// Initialize Auth (anonymous)
export const initializeAuth = async () => {
  auth = getAuth(app)
  try {
    await signInAnonymously(auth)
    console.log('✅ Firebase: Anonymous auth successful')
  } catch (error) {
    console.error('❌ Firebase: Anonymous auth failed', error)
  }
}

// Export database and auth
export { db, app }
export const getAuthInstance = () => auth

// ──────────────────────────────────────────────────────────────
// Database Paths (Constants)
// ──────────────────────────────────────────────────────────────
export const DB_PATHS = {
  MACHINES: 'machines',
  ALARMS: 'alarms',
  CHAT_HISTORY: 'chatHistory',
  USER_SESSIONS: 'userSessions',
  SETTINGS: 'settings',
}

// ──────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────

/**
 * Write data to Firebase Realtime Database
 */
export const writeData = async (path: string, data: any) => {
  try {
    const dbRef = ref(db, path)
    await set(dbRef, data)
    console.log(`✅ Firebase: Data written to ${path}`)
    return true
  } catch (error) {
    console.error(`❌ Firebase: Write failed to ${path}`, error)
    return false
  }
}

/**
 * Read data from Firebase Realtime Database
 */
export const readData = async (path: string) => {
  try {
    const dbRef = ref(db, path)
    const snapshot = await get(dbRef)
    if (snapshot.exists()) {
      console.log(`✅ Firebase: Data read from ${path}`)
      return snapshot.val()
    } else {
      console.log(`⚠️ Firebase: No data at ${path}`)
      return null
    }
  } catch (error) {
    console.error(`❌ Firebase: Read failed from ${path}`, error)
    return null
  }
}

/**
 * Update specific fields (merge, don't overwrite)
 */
export const updateData = async (path: string, updates: any) => {
  try {
    const dbRef = ref(db, path)
    await update(dbRef, updates)
    console.log(`✅ Firebase: Data updated at ${path}`)
    return true
  } catch (error) {
    console.error(`❌ Firebase: Update failed at ${path}`, error)
    return false
  }
}

/**
 * Delete data from Firebase
 */
export const deleteData = async (path: string) => {
  try {
    const dbRef = ref(db, path)
    await remove(dbRef)
    console.log(`✅ Firebase: Data deleted from ${path}`)
    return true
  } catch (error) {
    console.error(`❌ Firebase: Delete failed from ${path}`, error)
    return false
  }
}

/**
 * Query data with ordering and limits
 */
export const queryData = async (path: string, orderBy: string, limit: number) => {
  try {
    const dbRef = ref(db, path)
    const q = query(dbRef, orderByChild(orderBy), limitToLast(limit))
    const snapshot = await get(q)
    if (snapshot.exists()) {
      return snapshot.val()
    }
    return null
  } catch (error) {
    console.error(`❌ Firebase: Query failed at ${path}`, error)
    return null
  }
}

/**
 * Generate unique ID (timestamp + random)
 */
export const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
