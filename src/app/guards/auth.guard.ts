import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    if (!isBrowser) return true;

    // Allow Cognito redirect (has code in URL)
    const params = new URLSearchParams(window.location.search);
    if (params.get('code') && params.get('state')) {
        return true;
    }

    // Valid token? Allow
    if (auth.getValidToken()) {
        return true;
    }

    // No valid token - redirect to login
    router.navigate(['/']);
    return false;
};