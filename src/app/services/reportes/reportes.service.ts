// src/app/services/recoleccion.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { enviroment } from '../../../enviroments/enviroment';
import { GraficaUsuario } from '../../interfaces/GraficaUsuario';
import { ReporteGraficasResponse } from '../../interfaces/ReporteGraficasResponse';

@Injectable({
    providedIn: 'root'
})
export class ReportesService {

    private urlApp: string;
    private urlAppAPI: string;
    private urlAppAPI_enviarMail: string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/reportes/';
        this.urlAppAPI_enviarMail = 'api/enviarmail/';
    }

    /* ─────────────────────────────────────────────
       LISTAR (GET) ─ getReportTotalizado
   ───────────────────────────────────────────── */
    obtenerReporteTotalizado(
        fechaInicio: Date,
        fechaFin: Date,
        consultorio: number | null
    ): Observable<any[]> {

        const token = localStorage.getItem('token');
        const idUser = localStorage.getItem('idUser');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = {
            id_usuario: Number(idUser),
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            consultorio: consultorio
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
        fechaInicio: Date,
        fechaFin: Date,
        consultorio: number | null
    ): Observable<any[]> {

        const token = localStorage.getItem('token');
        const idUser = localStorage.getItem('idUser');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = {
            id_usuario: Number(idUser),
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            consultorio: consultorio
        };

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getReportDetallado`,
            body,
            { headers }
        ).pipe(
            map(resp => resp.body)
        );
    }

    /* ─────────────────────────────────────────────
       LISTAR (GET) ─ getResumenMes (graficas)
   ───────────────────────────────────────────── */
    obtenerReporteResumenMes(): Observable<any> {
        const token = localStorage.getItem('token');
        const idUser = localStorage.getItem('idUser');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = {
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

    /* ─────────────────────────────────────────────
        LISTAR (GET) ─ getResumenMesActual (graficas)
    ───────────────────────────────────────────── */
    obtenerReporteResumenMesActual(): Observable<any> {
        const token = localStorage.getItem('token');
        const idUser = localStorage.getItem('idUser');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = {
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

    /* ─────────────────────────────────────────────
        LISTAR (GET) ─ getResumenMesActualConsultorios (graficas)
    ───────────────────────────────────────────── */
    obtenerReporteResumenMesActualConsultorio(): Observable<any> {
        const token = localStorage.getItem('token');
        const idUser = localStorage.getItem('idUser');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = {
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

    /* ─────────────────────────────────────────────
        LISTAR (GET) ─ enviarReporteCorreosConsultorios
    ───────────────────────────────────────────── */
    enviarReporteCorreosConsultorios(
        fechaInicio: Date,
        fechaFin: Date,
        consultorio: number | null,
        tipoReporte: String
    ): Observable<any> {
        const token = localStorage.getItem('token');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            consultorio: consultorio,
            tipo_reporte: tipoReporte
        };

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI_enviarMail}sendReportes`,
            body,
            { headers }
        );
    }

    /* ─────────────────────────────────────────────
        LISTAR (GET) ─ getReporteGraficaxUsuario
    ───────────────────────────────────────────── */
    obtenerReportesxUsuario(): Observable<GraficaUsuario[]> {

        const token = localStorage.getItem('token')

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = {};

        return this.http.post<ReporteGraficasResponse>(
            `${this.urlApp}${this.urlAppAPI}getReporteGraficaxUsuario`,
            body,
            { headers }
        ).pipe(
            map(resp => resp.body.graficas)
        );
    }
}
