import type { VaultEnvelope } from './types';

const ITERATIONS = 250_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function encryptText(plainText: string, pin: string): Promise<VaultEnvelope> {
  assertPin(pin);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt, ITERATIONS);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plainText),
  );

  return {
    version: 1,
    kdf: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    cipherText: bytesToBase64(new Uint8Array(encrypted)),
    savedAt: new Date().toISOString(),
  };
}

export async function decryptText(envelope: VaultEnvelope, pin: string): Promise<string> {
  assertPin(pin);
  if (envelope.version !== 1 || envelope.kdf !== 'PBKDF2-SHA-256') {
    throw new Error('Formato de bóveda no compatible.');
  }
  if (!Number.isInteger(envelope.iterations) || envelope.iterations < 100_000) {
    throw new Error('Parámetros de cifrado no válidos.');
  }
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const cipherText = base64ToBytes(envelope.cipherText);
  const key = await deriveKey(pin, salt, envelope.iterations);
  try {
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherText);
    return decoder.decode(decrypted);
  } catch {
    throw new Error('PIN incorrecto o datos locales dañados.');
  }
}

async function deriveKey(pin: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function assertPin(pin: string): void {
  if (pin.trim().length < 4 || pin.length > 128) {
    throw new Error('El PIN debe tener entre 4 y 128 caracteres.');
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (!value || value.length > 20_000_000) throw new Error('Datos cifrados no válidos.');
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new Error('Datos cifrados no válidos.');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
