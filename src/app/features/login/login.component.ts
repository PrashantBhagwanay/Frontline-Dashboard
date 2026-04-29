import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
    private auth = inject(AuthService);
    private router = inject(Router);

    readonly year = new Date().getFullYear();
    readonly loading = signal(false);
    readonly processing = signal(false);
    readonly errorMessage = signal<string | null>(null);

    async ngOnInit(): Promise<void> {
        // Step 1: Check if URL has ?code=xxx from Cognito redirect
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const returnedState = params.get('state');
        const errorParam = params.get('error');

        // Step 2: Cognito returned an error
        if (errorParam) {
            this.errorMessage.set(`Cognito error: ${errorParam}`);
            this.cleanUrl();
            return;
        }

        // Step 3: Cognito returned a code - verify it
        if (code) {
            this.processing.set(true);

            try {
                // Verify state (CSRF protection)
                if (!this.auth.validateState(returnedState)) {
                    throw new Error('OAuth state mismatch');
                }

                // Exchange code for access token
                await this.auth.exchangeCodeForToken(code);

                // Token stored successfully - user is authenticated
                this.cleanUrl();
                this.router.navigate(['/dashboard'], { replaceUrl: true });
                return;

            } catch (err) {
                const message = err instanceof Error ? err.message : 'Authentication failed';
                // console.error('Auth verification failed', err);
                this.errorMessage.set(message);
                this.processing.set(false);
                this.cleanUrl();
                return;
            }
        }

        // Step 4: No code in URL - check if already authenticated from previous session
        if (this.auth.isAuthenticated()) {
            this.router.navigate(['/dashboard']);
        }
    }

    async onLogin(): Promise<void> {
        if (this.loading()) {
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        try {
            await this.auth.login();
        } catch (err) {
            console.error('Login initiation failed', err);
            this.loading.set(false);
            this.errorMessage.set('Could not start login. Please try again.');
        }
    }

    private cleanUrl(): void {
        // Remove ?code=xxx&state=xxx from URL without reloading
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.searchParams.delete('error');
        window.history.replaceState({}, document.title, url.pathname + url.search);
    }
}