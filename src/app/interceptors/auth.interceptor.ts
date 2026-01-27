import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    if (!isBrowser) {
        return next(req);
    }

    const token = localStorage.getItem('access_token');

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
