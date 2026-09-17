import { doc, setDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import { DEMO_USER, demoProfile, emptyProfile, emptySettings } from "@/lib/seed";
import type {
  Account,
  HorizonDays,
  IncomeEvent,
  Obligation,
  SessionUser,
  UserProfile,
  UserSettings,
} from "@/lib/types";

const STORAGE_KEY = "runway.finance.v1";

type Database = {
  hydrated: boolean;
  session: SessionUser | null;
  profiles: Record<string, UserProfile>;
};

const EMPTY: Database = { hydrated: false, session: null, profiles: {} };

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function load(): Database {
  if (typeof window === "undefined") return clone(EMPTY);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { hydrated: true, session: null, profiles: {} };
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      hydrated: true,
      session: parsed.session ?? null,
      profiles: parsed.profiles ?? {},
    };
  } catch {
    return { hydrated: true, session: null, profiles: {} };
  }
}

let state: Database = clone(EMPTY);
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  state = load();
  hydrated = true;
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ session: state.session, profiles: state.profiles }),
  );
}

function emit() {
  const session = state.session;
  const profiles = { ...state.profiles };
  if (session && profiles[session.uid]) {
    const profile = profiles[session.uid]!;
    profiles[session.uid] = {
      ...profile,
      accounts: [...profile.accounts],
      incomeEvents: [...profile.incomeEvents],
      obligations: [...profile.obligations],
      settings: { ...profile.settings },
    };
  }
  state = { hydrated: true, session, profiles };
  persist();
  listeners.forEach((listener) => listener());
  void syncFirebaseProfile();
}

async function syncFirebaseProfile() {
  const firebase = getFirebase();
  const session = state.session;
  if (!firebase || !session || session.provider !== "firebase") return;
  const profile = state.profiles[session.uid];
  if (!profile) return;
  try {
    await setDoc(doc(firebase.db, "users", session.uid), {
      email: session.email,
      displayName: session.displayName,
      updatedAt: new Date().toISOString(),
      ...profile,
    });
  } catch {
    // Local writes already succeeded. Firestore is best-effort for the demo.
  }
}

function ensureProfile(uid: string): UserProfile {
  if (!state.profiles[uid]) {
    state.profiles[uid] = uid === DEMO_USER.uid ? demoProfile() : emptyProfile();
  }
  return state.profiles[uid]!;
}

export function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): Database {
  hydrate();
  return state;
}

export function getServerSnapshot(): Database {
  return EMPTY;
}

export function getSession(): SessionUser | null {
  return getSnapshot().session;
}

export function getProfile(uid?: string | null): UserProfile {
  const sessionUid = uid ?? getSnapshot().session?.uid;
  if (!sessionUid) return emptyProfile();
  return ensureProfile(sessionUid);
}

export function setSession(user: SessionUser | null) {
  hydrate();
  state.session = user;
  if (user) ensureProfile(user.uid);
  emit();
}

export function openInterviewDemo() {
  hydrate();
  state.session = DEMO_USER;
  state.profiles[DEMO_USER.uid] = demoProfile();
  emit();
}

export function upsertLocalUser(user: SessionUser) {
  hydrate();
  state.session = user;
  ensureProfile(user.uid);
  emit();
}

function mutateProfile(mutator: (profile: UserProfile) => void) {
  hydrate();
  const session = state.session;
  if (!session) throw new Error("You need to sign in before saving financial data.");
  const profile = ensureProfile(session.uid);
  mutator(profile);
  emit();
}

export function addAccount(input: Omit<Account, "id"> & { id?: string }) {
  const account: Account = {
    id: input.id ?? crypto.randomUUID(),
    name: input.name.trim(),
    type: input.type,
    balance: input.balance,
    institution: input.institution.trim(),
    nessieAccountId: input.nessieAccountId,
  };
  if (!account.name) throw new Error("Account name is required.");
  if (!Number.isFinite(account.balance)) throw new Error("Enter a valid balance.");
  mutateProfile((profile) => {
    profile.accounts = [account, ...profile.accounts.filter((item) => item.id !== account.id)];
  });
  return account;
}

export function deleteAccount(id: string) {
  mutateProfile((profile) => {
    profile.accounts = profile.accounts.filter((item) => item.id !== id);
  });
}

export function addIncome(input: Omit<IncomeEvent, "id"> & { id?: string }) {
  const event: IncomeEvent = {
    id: input.id ?? crypto.randomUUID(),
    source: input.source.trim(),
    amount: input.amount,
    date: input.date,
    recurrence: input.recurrence,
    certainty: input.certainty,
    nessieDepositId: input.nessieDepositId,
  };
  if (!event.source) throw new Error("Income source is required.");
  if (!Number.isFinite(event.amount) || event.amount <= 0) {
    throw new Error("Enter an income amount greater than zero.");
  }
  if (!event.date) throw new Error("Choose the next pay date.");
  mutateProfile((profile) => {
    profile.incomeEvents = [
      event,
      ...profile.incomeEvents.filter((item) => item.id !== event.id),
    ];
  });
  return event;
}

export function deleteIncome(id: string) {
  mutateProfile((profile) => {
    profile.incomeEvents = profile.incomeEvents.filter((item) => item.id !== id);
  });
}

export function addObligation(input: Omit<Obligation, "id"> & { id?: string }) {
  const obligation: Obligation = {
    id: input.id ?? crypto.randomUUID(),
    name: input.name.trim(),
    amount: input.amount,
    dueDate: input.dueDate,
    recurrence: input.recurrence,
    certainty: input.certainty,
    nessieBillId: input.nessieBillId,
  };
  if (!obligation.name) throw new Error("Obligation name is required.");
  if (!Number.isFinite(obligation.amount) || obligation.amount <= 0) {
    throw new Error("Enter an amount greater than zero.");
  }
  if (!obligation.dueDate) throw new Error("Choose a due date.");
  mutateProfile((profile) => {
    profile.obligations = [
      obligation,
      ...profile.obligations.filter((item) => item.id !== obligation.id),
    ];
  });
  return obligation;
}

export function deleteObligation(id: string) {
  mutateProfile((profile) => {
    profile.obligations = profile.obligations.filter((item) => item.id !== id);
  });
}

export function updateSettings(patch: Partial<UserSettings>) {
  mutateProfile((profile) => {
    profile.settings = { ...profile.settings, ...patch };
  });
}

export function setHorizon(horizonDays: HorizonDays) {
  updateSettings({ horizonDays });
}

export function replaceFromNessie(mapped: {
  accounts: Account[];
  incomeEvents: IncomeEvent[];
  obligations: Obligation[];
  dailySpendEstimate: number;
  nessieCustomerId: string;
}) {
  mutateProfile((profile) => {
    profile.accounts = mapped.accounts;
    profile.incomeEvents = mapped.incomeEvents;
    profile.obligations = mapped.obligations;
    profile.settings = {
      ...profile.settings,
      ...emptySettings(),
      horizonDays: profile.settings.horizonDays,
      comfortBuffer: profile.settings.comfortBuffer,
      dailySpendEstimate: mapped.dailySpendEstimate,
      nessieCustomerId: mapped.nessieCustomerId,
      lastNessieImportAt: new Date().toISOString(),
    };
  });
}

export function signOutLocal() {
  hydrate();
  state.session = null;
  emit();
}

export function resetDemo() {
  hydrate();
  state.profiles[DEMO_USER.uid] = demoProfile();
  state.session = DEMO_USER;
  emit();
}
