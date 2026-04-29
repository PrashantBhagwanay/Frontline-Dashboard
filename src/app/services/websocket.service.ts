import { Injectable, inject, PLATFORM_ID, signal, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { authConfig } from '../config/auth.config';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
    private platformId = inject(PLATFORM_ID);
    private auth = inject(AuthService);
    private isBrowser: boolean;

    private ws: WebSocket | null = null;
    private heartbeatTimer: any = null;
    private reconnectTimer: any = null;
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;
    private readonly HEARTBEAT_INTERVAL = 30000;

    readonly connectionStatus = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
    readonly messages$ = new Subject<any>();

    constructor() {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    connect(siteId: string = authConfig.defaults.siteId): void {
        if (!this.isBrowser) return;

        const token = this.auth.getValidToken();
        if (!token) {
            console.warn('Cannot connect WebSocket: no valid token');
            return;
        }

        this.disconnect();

        this.connectionStatus.set('connecting');

        const url = `${authConfig.websocket.url}?token=${encodeURIComponent(token)}&siteId=${encodeURIComponent(siteId)}`;

        try {
            this.ws = new WebSocket(url);
        } catch (err) {
            console.error('Failed to create WebSocket', err);
            this.connectionStatus.set('disconnected');
            return;
        }

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.connectionStatus.set('connected');
            this.reconnectAttempts = 0;
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Heartbeat response - ignore
                if (data.action === 'pong') {
                    return;
                }

                // Push message to subscribers
                this.messages$.next(data);
            } catch (err) {
                console.error('Failed to parse WebSocket message', err);
            }
        };

        this.ws.onerror = (event) => {
            console.error('WebSocket error', event);
        };

        this.ws.onclose = (event) => {
            // console.warn(`WebSocket closed: code=${event.code}, reason=${event.reason}`);
            this.connectionStatus.set('disconnected');
            this.stopHeartbeat();

            // If closed due to auth (1008/4401 type codes), force logout
            if (event.code === 1008 || event.code === 4401 || event.code === 4001) {
                this.auth.forceLogout('Session invalid. Please login again.');
                return;
            }

            // Otherwise try reconnect
            this.attemptReconnect(siteId);
        };
    }

    disconnect(): void {
        this.stopHeartbeat();
        this.stopReconnect();

        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }

        this.connectionStatus.set('disconnected');
    }

    send(payload: any): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ action: 'ping' }));
            }
        }, this.HEARTBEAT_INTERVAL);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    private attemptReconnect(siteId: string): void {
        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            // console.error('Max reconnect attempts reached');
            return;
        }

        // Check token validity before attempting reconnect
        if (!this.auth.getValidToken()) {
            // console.warn('Token expired, cannot reconnect WebSocket');
            this.auth.forceLogout('Session expired.');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        // console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.connect(siteId);
        }, delay);
    }

    private stopReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    ngOnDestroy(): void {
        this.disconnect();
        this.messages$.complete();
    }
}