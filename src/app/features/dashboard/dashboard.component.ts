// import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
// import { CommonModule } from '@angular/common';

// interface Wave {
//     name: string;
//     released: number;
//     picked: number;
//     packed: number;
//     shipped: number;
// }

// interface Warehouse {
//     name: string;

//     topStats: {
//         totalUnits: number;
//         unitsOnWave: number;
//         boxes: number;
//     };

//     stats: {
//         totalUnits: number;
//         released: number;
//         picked: number;
//         packed: number;
//         shipped: number;
//     };

//     waves: Wave[];
// }

// interface DashboardApiResponse {
//     lastRefreshedTime: string;
//     currentDate: string;
//     warehouses: Warehouse[];
// }

// @Component({
//     selector: 'app-dashboard',
//     standalone: true,
//     imports: [CommonModule],
//     templateUrl: './dashboard.component.html'
// })
// export class DashboardComponent implements OnInit, OnDestroy {

//     constructor(private zone: NgZone) { }

//     // ================= API RESPONSE (MOCK) =================
//     apiResponse: DashboardApiResponse = {
//         lastRefreshedTime: '14:35',
//         currentDate: '01 February 2026',
//         warehouses: [
//             {
//                 name: 'Birmingham',
//                 topStats: { totalUnits: 12000, unitsOnWave: 9000, boxes: 399 },
//                 stats: { totalUnits: 4000, released: 3000, picked: 500, packed: 200, shipped: 300 },
//                 waves: [{ name: 'Newcastle', released: 450, picked: 120, packed: 45, shipped: 30 }]
//             },
//             {
//                 name: 'Newport',
//                 topStats: { totalUnits: 9000, unitsOnWave: 7000, boxes: 280 },
//                 stats: { totalUnits: 3500, released: 2800, picked: 420, packed: 180, shipped: 250 },
//                 waves: [{ name: 'Cardiff', released: 520, picked: 130, packed: 48, shipped: 35 }]
//             },
//             {
//                 name: 'Hemel',
//                 topStats: { totalUnits: 7000, unitsOnWave: 5000, boxes: 190 },
//                 stats: { totalUnits: 2500, released: 2000, picked: 360, packed: 150, shipped: 210 },
//                 waves: [{ name: 'Luton', released: 410, picked: 105, packed: 40, shipped: 30 }]
//             },
//             {
//                 name: 'Leicester',
//                 topStats: { totalUnits: 8200, unitsOnWave: 6400, boxes: 260 },
//                 stats: { totalUnits: 2800, released: 2200, picked: 390, packed: 170, shipped: 240 },
//                 waves: [{ name: 'Derby', released: 390, picked: 110, packed: 42, shipped: 28 }]
//             },
//             {
//                 name: 'Nottingham',
//                 topStats: { totalUnits: 7600, unitsOnWave: 6000, boxes: 230 },
//                 stats: { totalUnits: 2700, released: 2100, picked: 370, packed: 160, shipped: 220 },
//                 waves: [{ name: 'Mansfield', released: 360, picked: 100, packed: 38, shipped: 26 }]
//             },
//             {
//                 name: 'Coventry',
//                 topStats: { totalUnits: 6800, unitsOnWave: 5200, boxes: 210 },
//                 stats: { totalUnits: 2400, released: 1900, picked: 340, packed: 145, shipped: 200 },
//                 waves: [{ name: 'Rugby', released: 340, picked: 95, packed: 35, shipped: 24 }]
//             }
//         ]
//     };

//     // ================= STATE =================
//     warehouses: Warehouse[] = [];
//     lastRefreshedTime = '';
//     currentDate = '';

//     activeIndex = 0;

//     // 🔹 show only 3 hubs at a time
//     VISIBLE_COUNT = 3;
//     pageIndex = 0;

//     // 🔹 auto rotate
//     autoMode = true;
//     AUTO_DELAY = 3000;
//     private timerId: any;

//     ngOnInit(): void {
//         this.warehouses = this.apiResponse.warehouses;
//         this.lastRefreshedTime = this.apiResponse.lastRefreshedTime;
//         this.currentDate = this.apiResponse.currentDate;

//         this.startAutoCycle();
//     }

//     ngOnDestroy(): void {
//         clearTimeout(this.timerId);
//     }

//     // ================= AUTO ROTATE =================
//     startAutoCycle() {
//         if (!this.autoMode || this.warehouses.length === 0) return;

//         this.zone.runOutsideAngular(() => {
//             this.timerId = setTimeout(() => {
//                 this.zone.run(() => {
//                     this.activeIndex = (this.activeIndex + 1) % this.warehouses.length;
//                     this.pageIndex = Math.floor(this.activeIndex / this.VISIBLE_COUNT);
//                 });
//                 this.startAutoCycle();
//             }, this.AUTO_DELAY);
//         });
//     }

//     // ================= MANUAL CLICK =================
//     selectWarehouse(index: number) {
//         this.autoMode = false;
//         clearTimeout(this.timerId);
//         this.activeIndex = index;
//         this.pageIndex = Math.floor(index / this.VISIBLE_COUNT);
//     }

//     // ================= HELPERS =================
//     get visibleWarehouses(): Warehouse[] {
//         const start = this.pageIndex * this.VISIBLE_COUNT;
//         return this.warehouses.slice(start, start + this.VISIBLE_COUNT);
//     }

//     get activeWarehouse(): Warehouse {
//         return this.warehouses[this.activeIndex];
//     }

//     get activeTopStats() {
//         return this.activeWarehouse.topStats;
//     }
// }





// import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { HttpClient, HttpClientModule } from '@angular/common/http';

// interface Wave {
//     name: string;
//     released: number;
//     picked: number;
//     packed: number;
//     shipped: number;
// }

// interface Warehouse {
//     name: string;

//     topStats: {
//         totalUnits: number;
//         unitsOnWave: number;
//         boxes: number;
//     };

//     stats: {
//         totalUnits: number;
//         released: number;
//         picked: number;
//         packed: number;
//         shipped: number;
//     };

//     waves: Wave[];
// }

// @Component({
//     selector: 'app-dashboard',
//     standalone: true,
//     imports: [CommonModule, HttpClientModule],
//     templateUrl: './dashboard.component.html'
// })
// export class DashboardComponent implements OnInit, OnDestroy {

//     constructor(
//         private zone: NgZone,
//         private http: HttpClient
//     ) { }

//     // ================= STATE =================
//     warehouses: Warehouse[] = [];
//     lastRefreshedTime = '';
//     currentDate = '';

//     activeIndex = 0;

//     // 🔹 show only 3 hubs at a time
//     VISIBLE_COUNT = 3;
//     pageIndex = 0;

//     // 🔹 auto rotate
//     autoMode = true;
//     AUTO_DELAY = 10000;
//     private timerId: any;

//     // ================= INIT =================
//     ngOnInit(): void {
//         this.fetchDashboardFromJson();
//     }

//     ngOnDestroy(): void {
//         clearTimeout(this.timerId);
//     }

//     // ================= FETCH JSON =================
//     fetchDashboardFromJson() {
//         this.http.get<any>('/assets/mock/dashboard-data.json')
//             .subscribe(res => {
//                 this.mapBackendData(res);
//             });
//     }

//     // ================= BACKEND → DASHBOARD MAPPING =================
//     mapBackendData(res: any) {

//         const owner = res.SuperUserDB.Owner;

//         this.lastRefreshedTime = owner.AsOnDatetime;
//         this.currentDate = new Date(owner.AsOnDatetime).toDateString();

//         this.warehouses = owner.Hubs.map((hub: any) => {

//             const waves: Wave[] = hub.HubSummary.map((w: any) => ({
//                 name: w.HubDetail.DepotName,
//                 released: w.HubDetail.DepotReleased,
//                 picked: w.HubDetail.DepotPicked,
//                 packed: w.HubDetail.DepotPacked,
//                 shipped: w.HubDetail.DepotPacked // backend me shipped nahi, fallback
//             }));

//             const totalUnits = hub.HubSummary.reduce(
//                 (sum: number, w: any) => sum + w.HubDetail.DepotTotalUnits, 0
//             );

//             const totalBoxes = hub.HubSummary.reduce(
//                 (sum: number, w: any) => sum + w.HubDetail.DepotTotalBoxes, 0
//             );

//             const totalPicked = hub.HubSummary.reduce(
//                 (sum: number, w: any) => sum + w.HubDetail.DepotPicked, 0
//             );

//             const totalPacked = hub.HubSummary.reduce(
//                 (sum: number, w: any) => sum + w.HubDetail.DepotPacked, 0
//             );

//             return {
//                 name: hub.HubName,

//                 topStats: {
//                     totalUnits: owner.TotalUnits.TotalOrderQty,
//                     unitsOnWave: owner.UnitsOnWave.TotalWaveQty,
//                     boxes: totalBoxes
//                 },

//                 stats: {
//                     totalUnits,
//                     released: 0,
//                     picked: totalPicked,
//                     packed: totalPacked,
//                     shipped: totalPacked
//                 },

//                 waves
//             };
//         });

//         this.activeIndex = 0;
//         this.pageIndex = 0;
//         this.startAutoCycle();
//     }

//     // ================= AUTO ROTATE =================
//     startAutoCycle() {
//         if (!this.autoMode || this.warehouses.length === 0) return;

//         this.zone.runOutsideAngular(() => {
//             this.timerId = setTimeout(() => {
//                 this.zone.run(() => {
//                     this.activeIndex = (this.activeIndex + 1) % this.warehouses.length;
//                     this.pageIndex = Math.floor(this.activeIndex / this.VISIBLE_COUNT);
//                 });
//                 this.startAutoCycle();
//             }, this.AUTO_DELAY);
//         });
//     }

//     // ================= MANUAL CLICK =================
//     selectWarehouse(index: number) {
//         this.autoMode = false;
//         clearTimeout(this.timerId);
//         this.activeIndex = index;
//         this.pageIndex = Math.floor(index / this.VISIBLE_COUNT);
//     }

//     // ================= HELPERS =================
//     get visibleWarehouses(): Warehouse[] {
//         const start = this.pageIndex * this.VISIBLE_COUNT;
//         return this.warehouses.slice(start, start + this.VISIBLE_COUNT);
//     }

//     get activeWarehouse(): Warehouse {
//         return this.warehouses[this.activeIndex];
//     }

//     get activeTopStats() {
//         return this.activeWarehouse?.topStats;
//     }
// }











// import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { interval, Subscription } from 'rxjs';
// import { DashboardService } from '../../services/dashboard.service';
// import { AuthService } from '../../services/auth.service';

// import { Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';


// interface Wave {
//     name: string;
//     released: number;
//     picked: number;
//     packed: number;
//     shipped: number;
// }

// interface Warehouse {
//     name: string;
//     topStats: {
//         totalUnits: number;
//         unitsOnWave: number;
//         boxes: number;
//     };
//     stats: {
//         totalUnits: number;
//         released: number;
//         picked: number;
//         packed: number;
//         shipped: number;
//     };
//     waves: Wave[];
// }

// @Component({
//     selector: 'app-dashboard',
//     standalone: true,
//     imports: [CommonModule],
//     templateUrl: './dashboard.component.html'
// })
// export class DashboardComponent implements OnInit, OnDestroy {

//     warehouses: Warehouse[] = [];
//     lastRefreshedTime = '';
//     currentDate = '';

//     activeIndex = 0;
//     VISIBLE_COUNT = 3;
//     pageIndex = 0;

//     loading = false;


//     autoMode = true;
//     AUTO_DELAY = 10000;
//     private timerId: any;
//     private refreshSub!: Subscription;
//     private isBrowser: boolean;

//     constructor(
//         private zone: NgZone,
//         private dashboardService: DashboardService,
//         private authService: AuthService,
//          @Inject(PLATFORM_ID) platformId: Object
//     ) {
//         this.isBrowser = isPlatformBrowser(platformId);
//      }

//     ngOnInit(): void {

//         if (!this.isBrowser) return;

//         this.loadDashboard();

//         // ⏱ refresh every 15 min
//         this.refreshSub = interval(15 * 60 * 1000).subscribe(() => {
//             this.loadDashboard();
//         });
//     }

//     ngOnDestroy(): void {
//         clearTimeout(this.timerId);
//         this.refreshSub?.unsubscribe();
//     }

//     loadDashboard() {

//         this.loading = true;

//         this.authService.getToken().subscribe({
//             next: () => {

//                 const token = this.authService.getStoredToken();
//                 if (!token) {
//                     this.loading = false;
//                     return;
//                 }

//                 this.dashboardService.getDashboard(token).subscribe({
//                     next: (res) => {
//                         const row = res?.[0];
//                         if (row?.jsonMessage) {
//                             const parsed = JSON.parse(row.jsonMessage);
//                             this.mapBackendData(parsed);
//                         }
//                         this.loading = false; // ✅ STOP LOADER
//                     },
//                     error: () => {
//                         this.loading = false; // ✅ STOP LOADER ON ERROR
//                     }
//                 });
//             },
//             error: () => {
//                 this.loading = false; // ✅ STOP LOADER ON ERROR
//             }
//         });
//     }



//     mapBackendData(res: any) {
//         const owner = res.SuperUserDB.Owner;

//         this.lastRefreshedTime = owner.AsOnDatetime;
//         this.currentDate = new Date(owner.AsOnDatetime).toDateString();

//         this.warehouses = owner.Hubs.map((hub: any) => {

//             const waves: Wave[] = hub.HubSummary.map((w: any) => ({
//                 name: w.HubDetail.DepotName,
//                 released: w.HubDetail.DepotReleased,
//                 picked: w.HubDetail.DepotPicked,
//                 packed: w.HubDetail.DepotPacked,
//                 shipped: w.HubDetail.DepotPacked
//             }));

//             const totalUnits = hub.HubSummary.reduce(
//                 (s: number, w: any) => s + w.HubDetail.DepotTotalUnits, 0
//             );

//             const totalBoxes = hub.HubSummary.reduce(
//                 (s: number, w: any) => s + w.HubDetail.DepotTotalBoxes, 0
//             );

//             const totalPicked = hub.HubSummary.reduce(
//                 (s: number, w: any) => s + w.HubDetail.DepotPicked, 0
//             );

//             const totalPacked = hub.HubSummary.reduce(
//                 (s: number, w: any) => s + w.HubDetail.DepotPacked, 0
//             );

//             return {
//                 name: hub.HubName,
//                 topStats: {
//                     totalUnits: owner.TotalUnits.TotalOrderQty,
//                     unitsOnWave: owner.UnitsOnWave.TotalWaveQty,
//                     boxes: totalBoxes
//                 },
//                 stats: {
//                     totalUnits,
//                     released: 0,
//                     picked: totalPicked,
//                     packed: totalPacked,
//                     shipped: totalPacked
//                 },
//                 waves
//             };
//         });

//         this.activeIndex = 0;
//         this.pageIndex = 0;
//         this.startAutoCycle();
//     }

//     startAutoCycle() {
//         if (!this.autoMode || this.warehouses.length === 0) return;

//         this.zone.runOutsideAngular(() => {
//             this.timerId = setTimeout(() => {
//                 this.zone.run(() => {
//                     this.activeIndex = (this.activeIndex + 1) % this.warehouses.length;
//                     this.pageIndex = Math.floor(this.activeIndex / this.VISIBLE_COUNT);
//                 });
//                 this.startAutoCycle();
//             }, this.AUTO_DELAY);
//         });
//     }

//     selectWarehouse(index: number) {
//         this.autoMode = false;
//         clearTimeout(this.timerId);
//         this.activeIndex = index;
//         this.pageIndex = Math.floor(index / this.VISIBLE_COUNT);
//     }

//     get visibleWarehouses() {
//         const start = this.pageIndex * this.VISIBLE_COUNT;
//         return this.warehouses.slice(start, start + this.VISIBLE_COUNT);
//     }

//     get activeWarehouse() {
//         return this.warehouses[this.activeIndex];
//     }

//     get activeTopStats() {
//         return this.activeWarehouse?.topStats;
//     }
// }





import { Component, OnInit, OnDestroy, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';

interface Wave {
    name: string;
    released: number;
    picked: number;
    packed: number;
    shipped: number;
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
        released: number;
        picked: number;
        packed: number;
        shipped: number;
    };
    waves: Wave[];
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {

    warehouses: Warehouse[] = [];
    lastRefreshedTime = '';
    currentDate = '';

    activeIndex = 0;
    VISIBLE_COUNT = 3;
    pageIndex = 0;

    loading = false;

    autoMode = true;
    AUTO_DELAY = 10000;
    private timerId: any;
    private refreshSub!: Subscription;
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

        // ⏱ refresh every 15 min
        this.refreshSub = interval(15 * 60 * 1000).subscribe(() => {
            this.loadDashboard();
        });
    }

    ngOnDestroy(): void {
        clearTimeout(this.timerId);
        this.refreshSub?.unsubscribe();
    }

    // 🔥 CLEAN FLOW: Token → Interceptor → API
    loadDashboard() {
        this.loading = true;

        this.authService.getToken().subscribe({
            next: () => {
                this.dashboardService.getDashboard().subscribe({
                    next: (res) => {
                        const row = res?.[0];
                        if (row?.jsonMessage) {
                            const parsed = JSON.parse(row.jsonMessage);
                            this.mapBackendData(parsed);
                        }
                        this.loading = false;
                    },
                    error: () => {
                        this.loading = false;
                    }
                });
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    mapBackendData(res: any) {
        const owner = res.SuperUserDB.Owner;

        this.lastRefreshedTime = owner.AsOnDatetime;
        this.currentDate = new Date(owner.AsOnDatetime).toDateString();

        this.warehouses = owner.Hubs.map((hub: any) => {

            const waves: Wave[] = hub.HubSummary.map((w: any) => ({
                name: w.HubDetail.DepotName,
                released: w.HubDetail.DepotReleased,
                picked: w.HubDetail.DepotPicked,
                packed: w.HubDetail.DepotPacked,
                shipped: w.HubDetail.DepotPacked
            }));

            const totalUnits = hub.HubSummary.reduce(
                (s: number, w: any) => s + w.HubDetail.DepotTotalUnits, 0
            );

            const totalBoxes = hub.HubSummary.reduce(
                (s: number, w: any) => s + w.HubDetail.DepotTotalBoxes, 0
            );

            const totalPicked = hub.HubSummary.reduce(
                (s: number, w: any) => s + w.HubDetail.DepotPicked, 0
            );

            const totalPacked = hub.HubSummary.reduce(
                (s: number, w: any) => s + w.HubDetail.DepotPacked, 0
            );

            return {
                name: hub.HubName,
                topStats: {
                    totalUnits: owner.TotalUnits.TotalOrderQty,
                    unitsOnWave: owner.UnitsOnWave.TotalWaveQty,
                    boxes: totalBoxes
                },
                stats: {
                    totalUnits,
                    released: 0,
                    picked: totalPicked,
                    packed: totalPacked,
                    shipped: totalPacked
                },
                waves
            };
        });

        this.activeIndex = 0;
        this.pageIndex = 0;
        this.startAutoCycle();
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
        this.autoMode = false;
        clearTimeout(this.timerId);
        this.activeIndex = index;
        this.pageIndex = Math.floor(index / this.VISIBLE_COUNT);
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
