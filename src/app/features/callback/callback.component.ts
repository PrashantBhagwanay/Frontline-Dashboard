import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-callback',
    templateUrl: './callback.component.html'
})
export class CallbackComponent implements OnInit {
    private auth = inject(AuthService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    readonly errorMessage = signal<string | null>(null);

    async ngOnInit(): Promise<void> {
        try {
            const params = this.route.snapshot.queryParamMap;
            const code = params.get('code');
            const returnedState = params.get('state');
            const errorParam = params.get('error');

            if (errorParam) {
                throw new Error(`Cognito error: ${errorParam}`);
            }

            if (!code) {
                throw new Error('Authorization code missing in callback URL');
            }

            if (!this.auth.validateState(returnedState)) {
                throw new Error('OAuth state mismatch');
            }

            await this.auth.exchangeCodeForToken(code);

            // Clean the URL and route to dashboard
            this.router.navigate(['/dashboard'], { replaceUrl: true });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Authentication failed';
            console.error(message, err);
            this.errorMessage.set(message);
        }
    }

    goToLogin(): void {
        this.router.navigate(['/']);
    }
}