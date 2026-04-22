import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    console.log('========== AUTH GUARD ==========');

    // SSR safety - allow during server render, real check happens in browser
    if (!isBrowser) {
        console.log('SSR context - skipping guard check');
        console.log('================================');
        return true;
    }

    // Check URL for Cognito redirect params
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    console.log('URL code:', code);
    console.log('URL state:', state);
    console.log('URL error:', error);

    // Case 1: Cognito returned an error
    if (error) {
        console.log('Cognito returned error -> redirecting to login');
        console.log('================================');
        router.navigate(['/']);
        return false;
    }

    // Case 2: Cognito redirect in progress - allow so callback/login handler can process
    if (code && state) {
        console.log('OAuth redirect in progress -> allow');
        console.log('================================');
        return true;
    }

    // Case 3: Check if user has a valid (non-expired) token
    const validToken = auth.getValidToken();

    if (validToken) {
        console.log('Valid token found -> allow');
        console.log('Token preview:', validToken.slice(0, 30) + '...');
        console.log('================================');
        return true;
    }

    // Case 4: Token exists but expired - check if isAuthenticated signal says yes
    if (auth.isAuthenticated()) {
        console.log('Authenticated flag true but token expired -> allow for now');
        console.log('Refresh token flow should kick in');
        console.log('================================');
        return true;
    }

    // Case 5: No token, no code - block and go to login
    console.log('No token, no code -> redirect to login');
    console.log('================================');
    router.navigate(['/']);
    return false;
};