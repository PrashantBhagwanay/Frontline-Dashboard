import { encryptValue, decryptValue } from './crypto.util';

export const secureStorage = {
    setItem(key: string, value: string): void {
        if (typeof window === 'undefined') return;
        const encrypted = encryptValue(value);
        localStorage.setItem(key, encrypted);
    },

    getItem(key: string): string | null {
        if (typeof window === 'undefined') return null;
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        const decrypted = decryptValue(encrypted);
        return decrypted || null;
    },

    removeItem(key: string): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
    }
};