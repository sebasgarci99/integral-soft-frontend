import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { Equipo } from '../../interfaces/equipo';
import { Sede } from '../../interfaces/sede';
import { Area } from '../../interfaces/area';

@Injectable({
    providedIn: 'root'
})
export class EquipoService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/equipo/';
    }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    // ==============================
    // GET - listar equipos de la empresa
    // ==============================
    obtenerEquipos(): Observable<Equipo[]> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getEquipos',
            {},
            { headers: this.getHeaders() }
        ).pipe(map(r => r.body as Equipo[]));
    }

    // ==============================
    // GET - listar equipos por sede
    // ==============================
    obtenerEquiposBySede(id_sede: number): Observable<Equipo[]> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getEquiposBySede',
            { id_sede },
            { headers: this.getHeaders() }
        ).pipe(map(r => r.body as Equipo[]));
    }

    // ==============================
    // POST - crear equipo
    // ==============================
    crearEquipo(data: Equipo): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearEquipo',
            data,
            { headers: this.getHeaders() }
        );
    }

    // ==============================
    // POST - editar equipo
    // ==============================
    editarEquipo(data: Equipo): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'editarEquipo',
            data,
            { headers: this.getHeaders() }
        );
    }

    // ==============================
    // POST - inactivar equipo
    // ==============================
    inactivarEquipo(id_equipo: number): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'inactivarEquipo',
            { id_equipo },
            { headers: this.getHeaders() }
        );
    }

    // ==============================
    // Sedes (para el CRUD)
    // ==============================
    obtenerSedes(): Observable<Sede[]> {
        return this.http.post<any>(
            this.urlApp + 'api/sede/getSedesByEmpresa',
            {},
            { headers: this.getHeaders() }
        ).pipe(map(r => r.body as Sede[]));
    }

    // ==============================
    // Áreas (para el CRUD)
    // ==============================
    obtenerAreas(id_sede: number): Observable<Area[]> {
        return this.http.post<any>(
            this.urlApp + 'api/area/getAreasBySede',
            { id_sede },
            { headers: this.getHeaders() }
        ).pipe(map(r => r.body as Area[]));
    }
}
