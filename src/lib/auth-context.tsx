"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase";
import {
  getServerSnapshot,
  getSnapshot,
  openInterviewDemo,
  setSession,
  signOutLocal,
  subscribe,
  upsertLocalUser,
} from "@/lib/store";
import type { SessionUser } from "@/lib/types";

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  firebaseEnabled: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  openDemo: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function hashPassword(password: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`runway:${password}`));
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function localUserId(email: string) {
  return `local_${email.trim().toLowerCase()}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const db = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const firebaseEnabled = isFirebaseConfigured();

  useEffect(() => {
    const firebase = getFirebase();
    if (!firebase) return;
    return onAuthStateChanged(firebase.auth, (firebaseUser) => {
      if (!firebaseUser) {
        if (getSnapshot().session?.provider === "firebase") setSession(null);
        return;
      }
      setSession({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Signed-in user",
        provider: "firebase",
      });
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: db.session,
      ready: db.hydrated,
      firebaseEnabled,
      openDemo: () => openInterviewDemo(),
      signIn: async (email, password) => {
        if (!email || !password) throw new Error("Email and password are required.");
        const firebase = getFirebase();
        if (firebase) {
          await signInWithEmailAndPassword(firebase.auth, email.trim(), password);
          return;
        }
        const key = `runway.localUsers.v1`;
        const users = JSON.parse(window.localStorage.getItem(key) || "{}") as Record<
          string,
          { hash: string; name: string }
        >;
        const record = users[email.trim().toLowerCase()];
        if (!record || record.hash !== (await hashPassword(password))) {
          throw new Error("Email or password is incorrect. Create an account or try again.");
        }
        upsertLocalUser({
          uid: localUserId(email),
          email: email.trim().toLowerCase(),
          displayName: record.name,
          provider: "local",
        });
      },
      signUp: async (name, email, password) => {
        if (!name.trim()) throw new Error("Name is required.");
        if (!email.trim() || !password) throw new Error("Email and password are required.");
        if (password.length < 6) throw new Error("Use at least 6 characters for the password.");
        const firebase = getFirebase();
        if (firebase) {
          const credential = await createUserWithEmailAndPassword(firebase.auth, email.trim(), password);
          await updateProfile(credential.user, { displayName: name.trim() });
          return;
        }
        const key = `runway.localUsers.v1`;
        const users = JSON.parse(window.localStorage.getItem(key) || "{}") as Record<
          string,
          { hash: string; name: string }
        >;
        const normalized = email.trim().toLowerCase();
        if (users[normalized]) throw new Error("That email already has an account. Sign in instead.");
        users[normalized] = { hash: await hashPassword(password), name: name.trim() };
        window.localStorage.setItem(key, JSON.stringify(users));
        upsertLocalUser({
          uid: localUserId(normalized),
          email: normalized,
          displayName: name.trim(),
          provider: "local",
        });
      },
      signOut: async () => {
        const firebase = getFirebase();
        if (firebase && db.session?.provider === "firebase") {
          await firebaseSignOut(firebase.auth);
        }
        signOutLocal();
      },
    }),
    [db.hydrated, db.session, firebaseEnabled],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
