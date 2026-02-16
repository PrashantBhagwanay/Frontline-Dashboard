import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

const finalUrl = 'https://d3irwj23ouzur5.cloudfront.net';
// const finalUrl = 'https://mingle-ionapi.eu1.inforcloudsuite.com';

@Injectable({ providedIn: 'root' })
export class DashboardService {


    private url =
        `${finalUrl}/SKYL46J6XGTUT24N_TST/WM/wmwebservice_rest/SKYL46J6XGTUT24N_TST_COBALTMERRYCROW_TST_SCE_PRD_0_wmwhse1/exports`;

    constructor(private http: HttpClient) { }

    getDashboard() {

        const headers = new HttpHeaders({
            username: 'XXXX'
        });

        const params = new HttpParams()
            .set('type', 'SNSUPUSERDB')
            .set('updatestatus', '9')
            .set('pollersearchstatus', '9')
            .set('transmitflagtouse', 'TRANSMITFLAG')
            .set('eventcategory', 'E')
            .set('restrictrowsto', '1')
            .set('asjson', 'true')
            .set('generatemessages', 'true');

        return this.http.get<any[]>(this.url, { headers, params });
    }
}
