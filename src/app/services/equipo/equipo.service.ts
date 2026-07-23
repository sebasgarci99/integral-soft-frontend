import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { Equipo } from '../../interfaces/equipo';
import { Sede } from '../../interfaces/sede';
import { Area } from '../../interfaces/area';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({
    providedIn: 'root'
})
export class EquipoService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/equipo/';
    }

    private async getHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    // ==============================
    // GET - listar equipos de la empresa
    // ==============================
    async obtenerEquipos(): Promise<Observable<Equipo[]>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getEquipos',
            {},
            { headers }
        ).pipe(map(r => r.body as Equipo[]));
    }

    // ==============================
    // GET - listar equipos por sede
    // ==============================
    async obtenerEquiposBySede(id_sede: number): Promise<Observable<Equipo[]>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getEquiposBySede',
            { id_sede },
            { headers }
        ).pipe(map(r => r.body as Equipo[]));
    }

    // ==============================
    // POST - crear equipo
    // ==============================
    async crearEquipo(data: Equipo): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearEquipo',
            data,
            { headers }
        );
    }

    // ==============================
    // POST - editar equipo
    // ==============================
    async editarEquipo(data: Equipo): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'editarEquipo',
            data,
            { headers }
        );
    }

    // ==============================
    // POST - inactivar equipo
    // ==============================
    async inactivarEquipo(id_equipo: number): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'inactivarEquipo',
            { id_equipo },
            { headers }
        );
    }

    // ==============================
    // Sedes (para el CRUD)
    // ==============================
    async obtenerSedes(): Promise<Observable<Sede[]>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + 'api/sede/getSedesByEmpresa',
            {},
            { headers }
        ).pipe(map(r => r.body as Sede[]));
    }

    // ==============================
    // Áreas (para el CRUD)
    // ==============================
    async obtenerAreas(id_sede: number): Promise<Observable<Area[]>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + 'api/area/getAreasBySede',
            { id_sede },
            { headers }
        ).pipe(map(r => r.body as Area[]));
    }
}
