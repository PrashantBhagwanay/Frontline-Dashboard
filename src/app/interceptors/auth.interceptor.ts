import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { authConfig } from '../config/auth.config';
import { secureStorage } from '../services/secure-storage.util';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    if (!isBrowser) {
        return next(req);
    }

    // Skip Cognito OAuth endpoints
    if (req.url.includes('/oauth2/') || req.url.includes('cognito')) {
        return next(req);
    }

    const token = secureStorage.getItem(authConfig.storageKeys.accessToken);

    if (token) {
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
                accept: 'application/json'
            }
        });
        return next(authReq);
    }

    return next(req);
};