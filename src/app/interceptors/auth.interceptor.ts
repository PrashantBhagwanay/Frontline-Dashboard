import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { authConfig } from '../config/auth.config';
import { secureStorage } from '../services/secure-storage.util';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);
    const auth = inject(AuthService);

    if (!isBrowser) return next(req);

    // Skip Cognito endpoints
    if (req.url.includes('/oauth2/') || req.url.includes('cognito')) {
        return next(req);
    }

    const token = secureStorage.getItem(authConfig.storageKeys.accessToken);

    const authReq = token
        ? req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
                accept: 'application/json'
            }
        })
        : req;

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // On 401, token is invalid - force logout
            if (error.status === 401) {
                console.warn('401 received - forcing logout');
                auth.forceLogout('Your session has expired. Please login again.');
            }
            return throwError(() => error);
        })
    );
};