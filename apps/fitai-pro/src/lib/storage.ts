import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { decryptText, encryptText } from './crypto';
import { APP_SCHEMA_VERSION, type AppState, type VaultEnvelope } from './types';

const VAULT_KEY = 'fitai.pro.v3.vault';
const MAX_IMPORT_BYTES = 12_000_000;

export async function hasVault(): Promise<boolean> {
  return Boolean(await readRaw());
}

export async function saveState(pin: string, state: AppState): Promise<void> {
  const normalized: AppState = {
    ...state,
    schemaVersion: APP_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  const envelope = await encryptText(JSON.stringify(normalized), pin);
  await writeRaw(JSON.stringify(envelope));
}

export async function loadState(pin: string): Promise<AppState> {
  const raw = await readRaw();
  if (!raw) throw new Error('No hay datos locales de FitAI Pro en este dispositivo.');
  const envelope = parseEnvelope(raw);
  const plain = await decryptText(envelope, pin);
  return parseState(plain);
}

export async function clearState(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key: VAULT_KEY });
  } else if (typeof window !== 'undefined') {
    window.localStorage.removeItem(VAULT_KEY);
  }
}

export async function exportVault(): Promise<string> {
  const raw = await readRaw();
  if (!raw) throw new Error('No existen datos locales para exportar.');
  parseEnvelope(raw);
  return raw;
}

export async function importVault(raw: string, pin: string): Promise<AppState> {
  if (new Blob([raw]).size > MAX_IMPORT_BYTES) throw new Error('El respaldo supera el tamaño permitido.');
  const envelope = parseEnvelope(raw);
  const plain = await decryptText(envelope, pin);
  const state = parseState(plain);
  await writeRaw(JSON.stringify(envelope));
  return state;
}

export async function changePin(currentPin: string, newPin: string): Promise<void> {
  const state = await loadState(currentPin);
  await saveState(newPin, state);
}

function parseEnvelope(raw: string): VaultEnvelope {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('El archivo de respaldo no contiene JSON válido.');
  }
  if (!isRecord(value)) throw new Error('Formato de respaldo no válido.');
  if (
    value.version !== 1 ||
    value.kdf !== 'PBKDF2-SHA-256' ||
    typeof value.iterations !== 'number' ||
    typeof value.salt !== 'string' ||
    typeof value.iv !== 'string' ||
    typeof value.cipherText !== 'string' ||
    typeof value.savedAt !== 'string'
  ) {
    throw new Error('Formato de respaldo no compatible.');
  }
  return value as unknown as VaultEnvelope;
}

function parseState(raw: string): AppState {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error('Los datos descifrados están dañados.');
  }
  if (!isRecord(value) || value.schemaVersion !== APP_SCHEMA_VERSION) {
    throw new Error('La versión del respaldo no es compatible con FitAI Pro 3.');
  }
  if (!isRecord(value.profile) || typeof value.profile.displayName !== 'string') {
    throw new Error('El perfil del respaldo no es válido.');
  }
  const arrays = ['exercises', 'templates', 'sessions', 'personalRecords', 'recipes', 'meals', 'clients', 'steps'];
  for (const key of arrays) {
    if (!Array.isArray(value[key])) throw new Error(`La colección ${key} del respaldo no es válida.`);
  }
  if (!isRecord(value.settings)) throw new Error('La configuración del respaldo no es válida.');
  return value as unknown as AppState;
}

async function readRaw(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key: VAULT_KEY });
    return value;
  }
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(VAULT_KEY);
}

async function writeRaw(raw: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key: VAULT_KEY, value: raw });
    return;
  }
  if (typeof window === 'undefined') throw new Error('El almacenamiento local no está disponible.');
  window.localStorage.setItem(VAULT_KEY, raw);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
