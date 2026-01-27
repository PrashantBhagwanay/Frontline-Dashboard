import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private isBrowser: boolean;

    private tokenUrl =
        'https://mingle-sso.eu1.inforcloudsuite.com:443/SKYL46J6XGTUT24N_TST/as/token.oauth2';

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    getToken() {

        // 🔒 HARD-CODED VALUES (AS REQUESTED)
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

        // ❗ BODY = null → params go in URL (EXACT CURL MATCH)
        return this.http.post<any>(this.tokenUrl, null, { params }).pipe(
            tap(res => {
                if (this.isBrowser && res?.access_token) {
                    localStorage.setItem('access_token', res.access_token);
                }
            })
        );
    }
}
