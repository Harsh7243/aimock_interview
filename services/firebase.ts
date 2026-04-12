
// FIX: Corrected Firebase import path to use the scoped package '@firebase/app'.
import { initializeApp } from "@firebase/app";
// FIX: Corrected Firebase import path to use the scoped package '@firebase/auth'.
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "@firebase/auth";
// FIX: Corrected Firebase import path to use the scoped package '@firebase/firestore'.
import { getFirestore, doc, setDoc, collection, addDoc, getDocs, query, orderBy, deleteDoc, limit, startAfter, QueryDocumentSnapshot, DocumentData } from "@firebase/firestore";
import type { InterviewSession } from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    lastLogin: new Date(),
  }, { merge: true });
  return user;
};

export const logout = (): Promise<void> => {
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const saveInterviewSession = async (session: InterviewSession): Promise<void> => {
    try {
        const userSessionsCollection = collection(db, `users/${session.userId}/sessions`);
        await addDoc(userSessionsCollection, session);
    } catch (error) {
        console.error("Error saving interview session: ", error);
        throw error;
    }
};

export const getInterviewSessions = async (
    userId: string, 
    lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    pageSize: number = 10
): Promise<{ sessions: InterviewSession[], lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
    try {
        const sessionsCollectionRef = collection(db, `users/${userId}/sessions`);
        let q = query(sessionsCollectionRef, orderBy("completedAt", "desc"), limit(pageSize));
        
        if (lastDoc) {
            q = query(sessionsCollectionRef, orderBy("completedAt", "desc"), startAfter(lastDoc), limit(pageSize));
        }

        const querySnapshot = await getDocs(q);
        
        const sessions: InterviewSession[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            sessions.push({
                id: doc.id,
                ...data,
                completedAt: data.completedAt.toDate(),
            } as InterviewSession);
        });

        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

        return { sessions, lastVisible };
    } catch (error) {
        console.error("Error fetching interview sessions:", error);
        throw error;
    }
};

export const deleteInterviewSession = async (userId: string, sessionId: string): Promise<void> => {
    try {
        const sessionDocRef = doc(db, `users/${userId}/sessions`, sessionId);
        await deleteDoc(sessionDocRef);
    } catch (error) {
        console.error("Error deleting interview session:", error);
        throw error;
    }
};
