import { Injectable } from '@angular/core';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 100000;
const SALT = new TextEncoder().encode('rh-soft-secure-storage-salt');
const PASSPHRASE = 'Rhs0ft_2024$ecureSt0r4g3!K3y';

@Injectable({ providedIn: 'root' })
export class SecureStorageService {

    private cryptoKey: CryptoKey | null = null;

    private async deriveKey(): Promise<CryptoKey> {
        if (this.cryptoKey) return this.cryptoKey;

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(PASSPHRASE),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        this.cryptoKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: SALT,
                iterations: PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: ALGORITHM, length: KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );

        return this.cryptoKey;
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async setItem(key: string, value: string): Promise<void> {
        const cryptoKey = await this.deriveKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(value);

        const encrypted = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv },
            cryptoKey,
            encoded
        );

        const payload = iv.toString() + '.' + this.arrayBufferToBase64(encrypted);
        localStorage.setItem(key, payload);
    }

    async getItem(key: string): Promise<string | null> {
        const payload = localStorage.getItem(key);
        if (!payload) return null;

        try {
            const dotIndex = payload.indexOf('.');
            if (dotIndex === -1) return payload;

            const ivStr = payload.substring(0, dotIndex);
            const ciphertext = payload.substring(dotIndex + 1);

            const iv = new Uint8Array(ivStr.split(',').map(Number));
            const cryptoKey = await this.deriveKey();
            const decrypted = await crypto.subtle.decrypt(
                { name: ALGORITHM, iv },
                cryptoKey,
                this.base64ToArrayBuffer(ciphertext)
            );

            return new TextDecoder().decode(decrypted);
        } catch {
            return null;
        }
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    clear(): void {
        localStorage.clear();
    }
}
