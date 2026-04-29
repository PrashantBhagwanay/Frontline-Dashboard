import {
    Component,
    OnInit,
    OnDestroy,
    NgZone,
    Inject,
    PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';

import mockData from '../../../assets/mock/dashboard-data.json';

interface Wave {
    name: string;
    totalUnits: number;
    releasedUnits: number;
    pickedUnits: number;
    packedUnits: number;
    shippedUnits: number;
    totalBoxes: number;
    pickedBoxes: number;
    packedBoxes: number;
    shippedBoxes: number;
    [key: string]: number | string;
}

interface TopStats {
    totalUnits: number;
    unitsOnWave: number;
    boxes: number;
    [key: string]: number;
}

interface WarehouseStats {
    totalUnits: number;
    releasedUnits: number;
    pickedUnits: number;
    packedUnits: number;
    shippedUnits: number;
    totalBoxes: number;
    pickedBoxes: number;
    packedBoxes: number;
    shippedBoxes: number;
    [key: string]: number;
}

interface Warehouse {
    name: string;
    topStats: TopStats;
    stats: WarehouseStats;
    waves: Wave[];
}

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {

    warehouses: Warehouse[] = [];

    activeIndex = 0;
    VISIBLE_COUNT = 3;
    pageIndex = 0;

    loading = false;
    isFirstLoad = true;

    autoMode = true;
    AUTO_DELAY = 60000;

    statusView: 'UNIT' | 'BOX' = 'UNIT';
    private statusTimer: any;

    lastRefreshedTime = '';
    currentDate = '';

    pickRateStats = {
        target: 0,
        current: 0,
        eta: '--'
    };

    // ── Dynamic config arrays ──────────────────────────────────────────────

    topStatCards = [
        { label: 'Total Units', key: 'totalUnits', bg: 'bg-slate-100', textColor: 'text-slate-900' },
        { label: 'Units on Wave', key: 'unitsOnWave', bg: 'bg-green-100', textColor: 'text-green-800' },
        { label: 'Boxes', key: 'boxes', bg: 'bg-yellow-100', textColor: 'text-yellow-800' },
    ];

    hubTiles = [
        { label: 'TOTAL (Unit)', key: 'totalUnits', bg: 'bg-slate-50' },
        { label: 'RELEASED (Unit)', key: 'releasedUnits', bg: 'bg-slate-50' },
        { label: 'PICKED (Unit)', key: 'pickedUnits', bg: 'bg-green-50' },
        { label: 'PACKED (Unit)', key: 'packedUnits', bg: 'bg-yellow-50' },
        { label: 'SHIPPED (Unit)', key: 'shippedUnits', bg: 'bg-purple-50' },
        { label: 'TOTAL BOX', key: 'totalBoxes', bg: 'bg-blue-50' },
        { label: 'PICKED BOX', key: 'pickedBoxes', bg: 'bg-green-50' },
        { label: 'PACKED BOX', key: 'packedBoxes', bg: 'bg-yellow-50' },
        { label: 'SHIPPED BOX', key: 'shippedBoxes', bg: 'bg-purple-50' },
    ];

    unitTableCols = [
        { label: 'Total', key: 'totalUnits', cls: 'font-bold' },
        { label: 'Released', key: 'releasedUnits', cls: '' },
        { label: 'Picked', key: 'pickedUnits', cls: 'font-bold text-green-700' },
        { label: 'Packed', key: 'packedUnits', cls: 'font-bold text-yellow-700' },
        { label: 'Shipped', key: 'shippedUnits', cls: 'font-bold text-purple-700' },
    ];

    boxTableCols = [
        { label: 'Total', key: 'totalBoxes', cls: 'font-bold' },
        { label: 'Picked', key: 'pickedBoxes', cls: 'font-bold text-green-700' },
        { label: 'Packed', key: 'packedBoxes', cls: 'font-bold text-yellow-700' },
        { label: 'Shipped', key: 'shippedBoxes', cls: 'font-bold text-purple-700' },
    ];

    // ──────────────────────────────────────────────────────────────────────

    private wsSub!: Subscription;
    private expiryCheckTimer: any;
    private timerId: any;
    private isBrowser: boolean;

    constructor(
        private zone: NgZone,
        private authService: AuthService,
        private wsService: WebSocketService,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    async ngOnInit(): Promise<void> {
        if (!this.isBrowser) return;

        await this.handleCognitoRedirect();

        if (!this.authService.getValidToken()) {
            this.authService.forceLogout('Please login to continue.');
            return;
        }

        this.loading = true;
        this.mapBackendData(mockData);
        this.loading = false;
        this.isFirstLoad = false;

        this.connectWebSocket();
        this.startExpiryWatcher();
    }

    ngOnDestroy(): void {
        clearTimeout(this.timerId);
        clearInterval(this.statusTimer);
        clearTimeout(this.expiryCheckTimer);
        this.wsSub?.unsubscribe();
        this.wsService.disconnect();
    }

    onLogout(): void {
        this.authService.logout();
    }

    // --- Auth handling ---

    private async handleCognitoRedirect(): Promise<void> {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const errorParam = url.searchParams.get('error');

        if (errorParam) {
            console.error('Cognito error:', errorParam);
            this.cleanUrl();
            return;
        }

        if (!code) return;

        try {
            if (!this.authService.validateState(returnedState)) {
                throw new Error('OAuth state mismatch');
            }

            // console.log('Exchanging code for token...');
            await this.authService.exchangeCodeForToken(code);
            // console.log('Token received and stored');

            this.cleanUrl();
        } catch (err) {
            // console.error('Token exchange failed:', err);
            this.cleanUrl();
            this.authService.forceLogout('Login failed. Please try again.');
        }
    }

    private cleanUrl(): void {
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.searchParams.delete('error');
        window.history.replaceState({}, document.title, url.pathname + url.search);
    }

    // --- Token expiry watcher ---

    private startExpiryWatcher(): void {
        const checkInterval = 30 * 1000;

        this.expiryCheckTimer = setInterval(() => {
            if (this.authService.isTokenExpired()) {
                // console.warn('Token expired - redirecting to login');
                clearInterval(this.expiryCheckTimer);
                this.wsService.disconnect();
                this.authService.forceLogout('Your session has expired. Please login again.');
            }
        }, checkInterval);
    }

    // --- WebSocket ---

    private connectWebSocket(): void {
        this.wsService.connect();

        this.wsSub = this.wsService.messages$.subscribe({
            next: (data) => {
                // console.log('Dashboard update received via WebSocket', data);
                this.handleWebSocketMessage(data);
            },
            error: (err) => {
                console.error('WebSocket stream error', err);
            }
        });
    }

    private handleWebSocketMessage(data: any): void {
        if (data?.message?.SuperUserDB) {
            this.mapBackendData(data.message);
            return;
        }

        if (data?.SuperUserDB) {
            this.mapBackendData(data);
            return;
        }

        if (data?.jsonMessage) {
            try {
                const parsed = typeof data.jsonMessage === 'string'
                    ? JSON.parse(data.jsonMessage)
                    : data.jsonMessage;
                this.handleWebSocketMessage(parsed);
            } catch (err) {
                console.error('Failed to parse WS payload', err);
            }
        }
    }

    // --- Data mapping ---

    mapBackendData(res: any) {
        const owner = res?.SuperUserDB?.Owner ?? {};

        this.lastRefreshedTime = owner.AsOnDatetime || '--';
        this.currentDate = owner.AsOnDatetime
            ? new Date(owner.AsOnDatetime).toDateString()
            : '--';

        this.pickRateStats.target = owner?.PickStats?.TargetRate || 0;
        this.pickRateStats.current = owner?.PickStats?.TotalPickedQty || 0;
        this.pickRateStats.eta = this.calculateETA(owner?.PickStats);

        this.warehouses = (owner.Hubs || []).map((hub: any) => {
            const waves: Wave[] = (hub.HubSummary || []).map((w: any) => {
                const d = w.HubDetail;
                return {
                    name: d.DepotName,
                    totalUnits: d.DepotTotalUnits || 0,
                    releasedUnits: d.DepotReleased || 0,
                    pickedUnits: d.DepotPicked || 0,
                    packedUnits: d.DepotPacked || 0,
                    shippedUnits: d.HubShipped?.DepotShipped || 0,
                    totalBoxes: d.DepotTotalBoxes || 0,
                    pickedBoxes: d.DepotPickedBoxes || 0,
                    packedBoxes: d.DepotPackedBoxes || 0,
                    shippedBoxes: d.HubShipped?.DepotShipped || 0
                };
            });

            const totals: WarehouseStats = waves.reduce((a, b) => {
                a.totalUnits += b.totalUnits as number;
                a.releasedUnits += b.releasedUnits as number;
                a.pickedUnits += b.pickedUnits as number;
                a.packedUnits += b.packedUnits as number;
                a.shippedUnits += b.shippedUnits as number;
                a.totalBoxes += b.totalBoxes as number;
                a.pickedBoxes += b.pickedBoxes as number;
                a.packedBoxes += b.packedBoxes as number;
                a.shippedBoxes += b.shippedBoxes as number;
                return a;
            }, {
                totalUnits: 0, releasedUnits: 0, pickedUnits: 0, packedUnits: 0, shippedUnits: 0,
                totalBoxes: 0, pickedBoxes: 0, packedBoxes: 0, shippedBoxes: 0
            });

            return {
                name: hub.HubName,
                topStats: {
                    totalUnits: owner?.TotalUnits?.TotalOrderQty || 0,
                    unitsOnWave: owner?.UnitsOnWave?.TotalWaveQty || 0,
                    boxes: totals.totalBoxes
                },
                stats: { ...totals },
                waves
            };
        });

        this.startAutoCycle();
        this.startStatusToggle();
    }

    calculateETA(pickStats: any): string {
        if (!pickStats || !this.lastRefreshedTime) return '--';

        const pending = pickStats?.ETAStats?.QtyPending || 0;
        const pickers = pickStats?.ETAStats?.ActivePickerCount || 1;
        const uph = pickStats?.UPHPerPerson || 1;

        if (pickers === 0 || uph === 0) return '--';

        const minutes = Math.round(pending / (pickers * uph) * 60);
        const base = new Date(this.lastRefreshedTime);
        base.setMinutes(base.getMinutes() + minutes);

        const h = base.getHours().toString().padStart(2, '0');
        const m = base.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    startStatusToggle() {
        clearInterval(this.statusTimer);
        this.statusTimer = setInterval(() => {
            this.statusView = this.statusView === 'UNIT' ? 'BOX' : 'UNIT';
        }, 10000);
    }

    startAutoCycle() {
        if (!this.autoMode || this.warehouses.length === 0) return;

        this.zone.runOutsideAngular(() => {
            this.timerId = setTimeout(() => {
                this.zone.run(() => {
                    this.activeIndex = (this.activeIndex + 1) % this.warehouses.length;
                    this.pageIndex = Math.floor(this.activeIndex / this.VISIBLE_COUNT);
                });
                this.startAutoCycle();
            }, this.AUTO_DELAY);
        });
    }

    selectWarehouse(index: number) {
        // disabled
    }

    get visibleWarehouses() {
        const start = this.pageIndex * this.VISIBLE_COUNT;
        return this.warehouses.slice(start, start + this.VISIBLE_COUNT);
    }

    get activeWarehouse(): Warehouse {
        return this.warehouses[this.activeIndex];
    }

    get activeTopStats(): TopStats {
        return this.activeWarehouse?.topStats;
    }

    get activeTableCols() {
        return this.statusView === 'UNIT' ? this.unitTableCols : this.boxTableCols;
    }
}