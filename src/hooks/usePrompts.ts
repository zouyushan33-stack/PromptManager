import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-error';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Prompt } from '../types';

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
         if(error instanceof Error && error.message.includes('the client is offline')) {
           console.error("Please check your Firebase configuration.");
         }
      }
    }
    testConnection();
  }, []);

  // Listen to auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // Listen to prompts collection
  useEffect(() => {
    const promptsRef = collection(db, 'prompts');
    const unsubscribe = onSnapshot(promptsRef, (snapshot) => {
      const dbPrompts = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
        };
      }) as Prompt[];
      
      // Sort client-side by createdAt descending (newest first)
      dbPrompts.sort((a, b) => b.createdAt - a.createdAt);
      setPrompts(dbPrompts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'prompts');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addPrompt = async (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'authorName'>) => {
    if (!user) throw new Error("Must be logged in to create prompt");
    const newDocRef = doc(collection(db, 'prompts')); // Auto ID
    
    try {
      // We use integer timestamp for `createdAt` and `updatedAt` to match schema,
      // but wait, Firestore security rules say `incoming().createdAt == request.time`.
      // Using `serverTimestamp()` handles this on the backend.
      // But we mapped it to `number` in our types. Let's send the numeric timestamp!
      // But rules enforce `request.time` using serverTimestamp... wait!
      // In JS, we can just send `Date.now()`, but firestore rule `request.time` represents the commit time.
      // Ah. If rule says `incoming().createdAt == request.time`, client MUST use `serverTimestamp()`,
      // but if we use `serverTimestamp()`, it saves as a Firestore Timestamp, NOT a number.
      // Let's modify the document using `serverTimestamp()` and we'll ignore strict type locally.
      
      const payload = {
        ...prompt,
        userId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(newDocRef, payload);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `prompts/${newDocRef.id}`);
    }
  };

  const updatePrompt = async (id: string, updatedFields: Partial<Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'authorName'>>) => {
    if (!user) throw new Error("Must be logged in to update prompt");
    try {
      const docRef = doc(db, 'prompts', id);
      await updateDoc(docRef, {
        ...updatedFields,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `prompts/${id}`);
    }
  };

  const deletePrompt = async (id: string) => {
    if (!user) throw new Error("Must be logged in to delete prompt");
    try {
      const docRef = doc(db, 'prompts', id);
      await deleteDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `prompts/${id}`);
    }
  };

  return {
    prompts,
    user,
    loading,
    addPrompt,
    updatePrompt,
    deletePrompt,
  };
}
