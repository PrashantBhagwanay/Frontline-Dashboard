import {
    Component,
    OnInit,
    OnDestroy,
    NgZone,
    Inject,
    PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';

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
}

interface Warehouse {
    name: string;
    topStats: {
        totalUnits: number;
        unitsOnWave: number;
        boxes: number;
    };
    stats: {
        totalUnits: number;
        releasedUnits: number;
        pickedUnits: number;
        packedUnits: number;
        shippedUnits: number;
        totalBoxes: number;
        pickedBoxes: number;
        packedBoxes: number;
        shippedBoxes: number;
    };
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

    private refreshSub!: Subscription;
    private timerId: any;
    private isBrowser: boolean;

    constructor(
        private zone: NgZone,
        private dashboardService: DashboardService,
        private authService: AuthService,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngOnInit(): void {
        if (!this.isBrowser) return;

        this.loadDashboard();
        this.refreshSub = interval(15 * 60 * 1000).subscribe(() => {
            this.loadDashboard(true);
        });
    }

    ngOnDestroy(): void {
        clearTimeout(this.timerId);
        clearInterval(this.statusTimer);
        this.refreshSub?.unsubscribe();
    }

    callDashboardApi() {
        this.dashboardService.getDashboard().subscribe({
            next: (res) => {
                const row = res?.[0];
                if (row?.jsonMessage) {
                    const parsed = JSON.parse(row.jsonMessage);
                    this.mapBackendData(parsed);
                }
                this.loading = false;
                this.isFirstLoad = false;
            },
            error: (err) => {
                console.error('Dashboard API failed', err);
                this.loading = false;
                this.isFirstLoad = false;
            }
        });
    }


    loadDashboard(silent = false) {
        if (this.isFirstLoad && !silent) {
            this.loading = true;
        }

        const token = this.authService.getValidToken();

      
        if (!token) {
            this.authService.getToken().subscribe({
                next: () => {
                  
                    this.callDashboardApi();
                },
                error: () => {
                 
                    this.loading = false;
                    this.isFirstLoad = false;
                    console.error('Auth failed');
                }
            });
            return;
        }

      
        this.callDashboardApi();
    }


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

            const totals = waves.reduce((a, b) => {
                // UNITS
                a.totalUnits += b.totalUnits;
                a.releasedUnits += b.releasedUnits;
                a.pickedUnits += b.pickedUnits;
                a.packedUnits += b.packedUnits;
                a.shippedUnits += b.shippedUnits;

                // BOXES ✅ FIX
                a.totalBoxes += b.totalBoxes;
                a.pickedBoxes += b.pickedBoxes;
                a.packedBoxes += b.packedBoxes;
                a.shippedBoxes += b.shippedBoxes;

                return a;
            }, {
                totalUnits: 0,
                releasedUnits: 0,
                pickedUnits: 0,
                packedUnits: 0,
                shippedUnits: 0,

                totalBoxes: 0,     // 👈 IMPORTANT
                pickedBoxes: 0,
                packedBoxes: 0,
                shippedBoxes: 0 
            });


            return {
                name: hub.HubName,
                topStats: {
                    totalUnits: owner?.TotalUnits?.TotalOrderQty || 0,
                    unitsOnWave: owner?.UnitsOnWave?.TotalWaveQty || 0,
                    boxes: totals.totalBoxes
                },
                stats: {
                    ...totals,
                },
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

        // if (uph === 0) return '--';
        if (pickers === 0 || uph === 0) {
            return '--';
        }

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
        // this.autoMode = false;
        // clearTimeout(this.timerId);
        // this.activeIndex = index;
        // this.pageIndex = Math.floor(index / this.VISIBLE_COUNT);
    }

    get visibleWarehouses() {
        const start = this.pageIndex * this.VISIBLE_COUNT;
        return this.warehouses.slice(start, start + this.VISIBLE_COUNT);
    }

    get activeWarehouse() {
        return this.warehouses[this.activeIndex];
    }

    get activeTopStats() {
        return this.activeWarehouse?.topStats;
    }
}
