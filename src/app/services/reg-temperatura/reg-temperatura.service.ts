import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { Sede } from '../../interfaces/sede';
import { Area } from '../../interfaces/area';
import { Equipo } from '../../interfaces/equipo';

@Injectable({
    providedIn: 'root'
})
export class RegistroTemperaturaService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/reg_temperatura/';
    }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    private getBodyBase(): Record<string, unknown> {
        return {
            id_usuario: Number(localStorage.getItem('idUser')),
            id_empresa: Number(localStorage.getItem('idEmpresa'))
        };
    }

    // ==============================
    // Sedes
    // ==============================
    obtenerSedes(): Observable<Sede[]> {
        return this.http.post<any>(
            this.urlApp + 'api/sede/getSedesByEmpresa',
            {},
            { headers: this.getHeaders() }
        ).pipe(map(r => r.body as Sede[]));
    }

    // ==============================
    // Áreas
    // ==============================
    obtenerAreas(id_sede: number): Observable<Area[]> {
        return this.http.post<any>(
            this.urlApp + 'api/area/getAreasBySede',
            { id_sede },
            { headers: this.getHeaders() }
        ).pipe(map(r => r.body as Area[]));
    }

    // ==============================
    // Equipos
    // ==============================
    obtenerEquiposBySede(id_sede: number): Observable<Equipo[]> {
        return this.http.post<any>(
            this.urlApp + 'api/equipo/getEquiposBySede',
            { id_sede },
            { headers: this.getHeaders() }
        ).pipe(map(r => r.body as Equipo[]));
    }

    // ==============================
    // GET - listar registros
    // ==============================
    obtenerRegistros(id_sede?: number, id_equipo?: number): Observable<any[]> {
        const body: Record<string, unknown> = {};
        if (id_sede) {
            body['id_sede'] = id_sede;
        }
        if (id_equipo) {
            body['id_equipo'] = id_equipo;
        }

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getRegistrosTemperatura',
            body,
            { headers: this.getHeaders() }
        ).pipe(map(response => response.body as any[]));
    }

    // ==============================
    // POST - crear registro
    // ==============================
    crearRegistro(data: any): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearRegistroTemperatura',
            data,
            { headers: this.getHeaders() }
        );
    }

    // ==============================
    // POST - editar registro
    // ==============================
    editarRegistro(data: any): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'editarRegistroTemperatura',
            data,
            { headers: this.getHeaders() }
        );
    }

    // ==============================
    // DELETE - eliminar registro
    // ==============================
    eliminarRegistro(id_registro: number): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'eliminarRegistroTemperatura',
            { id_registro },
            { headers: this.getHeaders() }
        );
    }
}
