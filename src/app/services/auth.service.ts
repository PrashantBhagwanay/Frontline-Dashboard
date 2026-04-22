import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { from, Observable } from 'rxjs';
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

    private readonly REFRESH_BUFFER = 300 * 1000;

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

    async refreshAccessToken(): Promise<boolean> {
        if (!this.isBrowser) return false;

        const cfg = authConfig;
        const refreshToken = secureStorage.getItem(cfg.storageKeys.refreshToken);

        if (!refreshToken) return false;

        const tokenUrl = `https://${cfg.cognito.userPoolDomain}/oauth2/token`;

        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: cfg.cognito.clientId,
            refresh_token: refreshToken
        });

        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString()
            });

            if (!response.ok) return false;

            const data: TokenResponse = await response.json();

            // Refresh response does NOT return a new refresh_token, keep the old one
            if (!data.refresh_token) {
                data.refresh_token = refreshToken;
            }

            this.storeTokens(data);
            this.isAuthenticated.set(true);
            return true;
        } catch (err) {
            console.error('Token refresh failed', err);
            return false;
        }
    }

    getToken(): Observable<boolean> {
        return from(this.refreshAccessToken());
    }

    validateState(returnedState: string | null): boolean {
        if (!this.isBrowser) return false;
        const expectedState = sessionStorage.getItem(authConfig.storageKeys.oauthState);
        return !!expectedState && expectedState === returnedState;
    }

    getValidToken(): string | null {
        if (!this.isBrowser) return null;

        const cfg = authConfig;
        const token = secureStorage.getItem(cfg.storageKeys.accessToken);
        const expiry = secureStorage.getItem(cfg.storageKeys.tokenExpiry);

        if (!token || !expiry) return null;

        if (Date.now() > Number(expiry) - this.REFRESH_BUFFER) {
            return null;
        }

        return token;
    }

    getAccessToken(): string | null {
        if (!this.isBrowser) return null;
        return secureStorage.getItem(authConfig.storageKeys.accessToken);
    }

    getIdToken(): string | null {
        if (!this.isBrowser) return null;
        return secureStorage.getItem(authConfig.storageKeys.idToken);
    }

    isTokenExpired(): boolean {
        if (!this.isBrowser) return true;

        const expiry = secureStorage.getItem(authConfig.storageKeys.tokenExpiry);
        if (!expiry) return true;

        return Date.now() > Number(expiry) - this.REFRESH_BUFFER;
    }

    logout(): void {
        if (!this.isBrowser) return;

        const cfg = authConfig;

        secureStorage.removeItem(cfg.storageKeys.accessToken);
        secureStorage.removeItem(cfg.storageKeys.idToken);
        secureStorage.removeItem(cfg.storageKeys.refreshToken);
        secureStorage.removeItem(cfg.storageKeys.tokenExpiry);
        sessionStorage.removeItem(cfg.storageKeys.oauthState);
        sessionStorage.removeItem(cfg.storageKeys.pkceVerifier);

        this.isAuthenticated.set(false);

        window.location.href = '/';
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