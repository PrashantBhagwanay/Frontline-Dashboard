import * as CryptoJS from 'crypto-js';

// Encryption key - in production this should come from environment/config
// and ideally be rotated. For now, a static key with some entropy.
const ENCRYPTION_KEY = 'nbs-frontline-dashboard-2026-xk9m2p';

export function encryptValue(plainText: string): string {
    if (!plainText) {
        return '';
    }
    try {
        return CryptoJS.AES.encrypt(plainText, ENCRYPTION_KEY).toString();
    } catch (err) {
        console.error('Encryption failed', err);
        return '';
    }
}

export function decryptValue(cipherText: string): string {
    if (!cipherText) {
        return '';
    }
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (err) {
        console.error('Decryption failed', err);
        return '';
    }
}