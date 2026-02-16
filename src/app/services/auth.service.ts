
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs/operators';

const finalUrl = 'https://d3irwj23ouzur5.cloudfront.net';
// const finalUrl = 'https://mingle-sso.eu1.inforcloudsuite.com';


@Injectable({ providedIn: 'root' })
export class AuthService {

    private isBrowser: boolean;

    private tokenUrl =
        `${finalUrl}:443/SKYL46J6XGTUT24N_TST/as/token.oauth2`;

    // Refresh token 5 minutes before expiry
    private REFRESH_BUFFER = 300 * 1000;

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    // Returns token if still valid, otherwise null
    getValidToken(): string | null {
        if (!this.isBrowser) return null;

        const token = localStorage.getItem('access_token');
        const expiry = localStorage.getItem('token_expiry');

        if (!token || !expiry) return null;

        if (Date.now() > Number(expiry) - this.REFRESH_BUFFER) {
            return null;
        }

        return token;
    }

    // Calls auth API using hard-coded credentials
    getToken() {

        const params = new HttpParams()
            .set(
                'client_id',
                'SKYL46J6XGTUT24N_TST~OOLTtR5N6soL_BiYe-KVvnHYK_EAjAq1ymHVTygYpeE'
            )
            .set(
                'client_secret',
                'uszE8jr4lyAGwmj3j5GqDNpZR_w2j8XeJX6NLEMateSVgFbkrrzU3tigNqOKWsafTStooQ7S8xNaiWDD8-1wgw'
            )
            .set(
                'username',
                'SKYL46J6XGTUT24N_TST#kOU79NL5BXeNJKDujA3Fk-l7zmtXOvDXO_A8Rup_6BBjs3lJQcDUW3VTXiA8ylwxURCgYR8UVbb8QKFs0A9JtA'
            )
            .set(
                'password',
                'smpM_vL6qahvU63r8jUbPfz22QPGASShrMsW9QWyDZhl5zveNtjImIied0h9MNkrEy109_gO92FsSYuYpYuEnA'
            )
            .set('grant_type', 'password');

        return this.http.post<any>(this.tokenUrl, null, { params }).pipe(
            tap(res => {
                if (this.isBrowser && res?.access_token) {
                    localStorage.setItem('access_token', res.access_token);

                    const expiryTime = Date.now() + res.expires_in * 1000;
                    localStorage.setItem('token_expiry', expiryTime.toString());
                }
            })
        );
    }
}
