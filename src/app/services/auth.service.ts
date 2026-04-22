import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { authConfig } from '../config/auth.config';
import { createPkcePair, randomString } from './pkce.util';
import { secureStorage } from './secure-storage.util';

interface TokenResponse {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private platformId = inject(PLATFORM_ID);
    private isBrowser: boolean;

    // 1 min buffer - if less than 1 min remaining, treat as expired
    private readonly EXPIRY_BUFFER = 60 * 1000;

    readonly isAuthenticated = signal<boolean>(false);

    constructor() {
        this.isBrowser = isPlatformBrowser(this.platformId);

        if (this.isBrowser) {
            this.isAuthenticated.set(!!this.getValidToken());
        }
    }

    async login(): Promise<void> {
        if (!this.isBrowser) return;

        const cfg = authConfig;

        const pkce = await createPkcePair();
        sessionStorage.setItem(cfg.storageKeys.pkceVerifier, pkce.verifier);

        const state = randomString(24);
        sessionStorage.setItem(cfg.storageKeys.oauthState, state);

        const url =
            `https://${cfg.cognito.userPoolDomain}/oauth2/authorize` +
            `?client_id=${encodeURIComponent(cfg.cognito.clientId)}` +
            `&response_type=${encodeURIComponent(cfg.cognito.responseType)}` +
            `&scope=${encodeURIComponent(cfg.cognito.scopes.join(' '))}` +
            `&redirect_uri=${encodeURIComponent(cfg.cognito.redirectUri)}` +
            `&code_challenge_method=S256` +
            `&code_challenge=${encodeURIComponent(pkce.challenge)}` +
            `&state=${encodeURIComponent(state)}`;

        window.location.href = url;
    }

    async exchangeCodeForToken(code: string): Promise<void> {
        if (!this.isBrowser) return;

        const cfg = authConfig;
        const verifier = sessionStorage.getItem(cfg.storageKeys.pkceVerifier);

        if (!verifier) {
            throw new Error('Missing PKCE verifier in session storage');
        }

        const tokenUrl = `https://${cfg.cognito.userPoolDomain}/oauth2/token`;

        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: cfg.cognito.clientId,
            code: code,
            redirect_uri: cfg.cognito.redirectUri,
            code_verifier: verifier
        });

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Token exchange failed: ${response.status} ${text}`);
        }

        const data: TokenResponse = await response.json();
        this.storeTokens(data);

        sessionStorage.removeItem(cfg.storageKeys.oauthState);
        sessionStorage.removeItem(cfg.storageKeys.pkceVerifier);

        this.isAuthenticated.set(true);
    }

    validateState(returnedState: string | null): boolean {
        if (!this.isBrowser) return false;
        const expectedState = sessionStorage.getItem(authConfig.storageKeys.oauthState);
        return !!expectedState && expectedState === returnedState;
    }

    // Returns token ONLY if still valid. Null if missing or expired.
    getValidToken(): string | null {
        if (!this.isBrowser) return null;

        const cfg = authConfig;
        const token = secureStorage.getItem(cfg.storageKeys.accessToken);
        const expiry = secureStorage.getItem(cfg.storageKeys.tokenExpiry);

        if (!token || !expiry) return null;

        if (Date.now() > Number(expiry) - this.EXPIRY_BUFFER) {
            return null;
        }

        return token;
    }

    isTokenExpired(): boolean {
        if (!this.isBrowser) return true;

        const expiry = secureStorage.getItem(authConfig.storageKeys.tokenExpiry);
        if (!expiry) return true;

        return Date.now() > Number(expiry) - this.EXPIRY_BUFFER;
    }

    // Milliseconds remaining until token expires (0 if already expired)
    getTimeUntilExpiry(): number {
        if (!this.isBrowser) return 0;

        const expiry = secureStorage.getItem(authConfig.storageKeys.tokenExpiry);
        if (!expiry) return 0;

        const remaining = Number(expiry) - Date.now() - this.EXPIRY_BUFFER;
        return Math.max(0, remaining);
    }

    // Force logout - clear everything and redirect to login
    forceLogout(reason?: string): void {
        if (!this.isBrowser) return;

        const cfg = authConfig;

        secureStorage.removeItem(cfg.storageKeys.accessToken);
        secureStorage.removeItem(cfg.storageKeys.idToken);
        secureStorage.removeItem(cfg.storageKeys.refreshToken);
        secureStorage.removeItem(cfg.storageKeys.tokenExpiry);
        sessionStorage.removeItem(cfg.storageKeys.oauthState);
        sessionStorage.removeItem(cfg.storageKeys.pkceVerifier);

        this.isAuthenticated.set(false);

        if (reason) {
            sessionStorage.setItem('logout_reason', reason);
        }

        window.location.href = '/';
    }

    logout(): void {
        this.forceLogout();
    }

    private storeTokens(data: TokenResponse): void {
        const cfg = authConfig;

        secureStorage.setItem(cfg.storageKeys.accessToken, data.access_token);
        secureStorage.setItem(cfg.storageKeys.idToken, data.id_token);

        if (data.refresh_token) {
            secureStorage.setItem(cfg.storageKeys.refreshToken, data.refresh_token);
        }

        const expiryTime = Date.now() + data.expires_in * 1000;
        secureStorage.setItem(cfg.storageKeys.tokenExpiry, expiryTime.toString());
    }
}