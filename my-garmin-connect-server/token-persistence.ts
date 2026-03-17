import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TOKEN_FILE = join(__dirname, '.garmin-tokens.json');

export function persistTokens(tokens: unknown): void {
  writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

export function loadPersistedTokens(): { oauth1: any; oauth2: any } | null {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    return JSON.parse(readFileSync(TOKEN_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

export function clearPersistedTokens(): void {
  if (existsSync(TOKEN_FILE)) {
    unlinkSync(TOKEN_FILE);
  }
}
