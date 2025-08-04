// src/app/services/recoleccion.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { enviroment } from '../../../enviroments/enviroment';   // ↔ tu misma ruta
import { Recoleccion } from '../../interfaces/recoleccion';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient) {
        this.urlApp     = enviroment.endpoint;
        this.urlAppAPI  = 'api/reportes/';
    }

     /* ─────────────────────────────────────────────
        LISTAR (GET) ─ getReportTotalizado
    ───────────────────────────────────────────── */
    obtenerReporteTotalizado(
        fechaInicio:Date,
        fechaFin:Date,
        consultorio:number | null
    ): Observable<any[]> {

        const token   = localStorage.getItem('token');
        const idUser  = localStorage.getItem('idUser');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body    = { 
            id_usuario: Number(idUser),
            fecha_inicio : fechaInicio,
            fecha_fin : fechaFin,
            consultorio : consultorio
        };

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getReportTotalizado`,
            body,
            { headers }
        ).pipe(
            map(resp => resp.body)
        );
    }

     /* ─────────────────────────────────────────────
        LISTAR (GET) ─ getReportDetallado
    ───────────────────────────────────────────── */
    obtenerReporteDetallado(
        fechaInicio:Date,
        fechaFin:Date,
        consultorio:number | null
    ): Observable<any[]> {

        const token   = localStorage.getItem('token');
        const idUser  = localStorage.getItem('idUser');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body    = { 
            id_usuario: Number(idUser),
            fecha_inicio : fechaInicio,
            fecha_fin : fechaFin,
            consultorio : consultorio
        };

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getReportDetallado`,
            body,
            { headers }
        ).pipe(
            map(resp => resp.body)
        );
    }

    obtenerReporteResumenMes(): Observable<any> {
        const token   = localStorage.getItem('token');
        const idUser  = localStorage.getItem('idUser');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body    = { 
            id_usuario: Number(idUser)
        };

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getReporteMesGraficas`,
            body,
            { headers }
        ).pipe(
            map(resp => resp.body)
        );
    }

    obtenerReporteResumenMesActual(): Observable<any> {
        const token   = localStorage.getItem('token');
        const idUser  = localStorage.getItem('idUser');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body    = { 
            id_usuario: Number(idUser)
        };

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getReporteMesActualGraficas`,
            body,
            { headers }
        ).pipe(
            map(resp => resp.body)
        );
    }

    obtenerReporteResumenMesActualConsultorio(): Observable<any> {
        const token   = localStorage.getItem('token');
        const idUser  = localStorage.getItem('idUser');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body    = { 
            id_usuario: Number(idUser)
        };

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getReporteMesConsultorioGraficas`,
            body,
            { headers }
        ).pipe(
            map(resp => resp.body)
        );
    }
}
