import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { Sede } from '../../interfaces/sede';
import { Area } from '../../interfaces/area';
import { Equipo } from '../../interfaces/equipo';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({
    providedIn: 'root'
})
export class RegistroTemperaturaService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/reg_temperatura/';
    }

    private async getHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    private async getBodyBase(): Promise<Record<string, unknown>> {
        const [idUser, idEmpresa] = await Promise.all([
            this.secureStorage.getItem('idUser'),
            this.secureStorage.getItem('idEmpresa')
        ]);
        return {
            id_usuario: Number(idUser),
            id_empresa: Number(idEmpresa)
        };
    }

    // ==============================
    // Sedes
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
    // Áreas
    // ==============================
    async obtenerAreas(id_sede: number): Promise<Observable<Area[]>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + 'api/area/getAreasBySede',
            { id_sede },
            { headers }
        ).pipe(map(r => r.body as Area[]));
    }

    // ==============================
    // Equipos
    // ==============================
    async obtenerEquiposBySede(id_sede: number): Promise<Observable<Equipo[]>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + 'api/equipo/getEquiposBySede',
            { id_sede },
            { headers }
        ).pipe(map(r => r.body as Equipo[]));
    }

    // ==============================
    // GET - listar registros
    // ==============================
    async obtenerRegistros(id_sede?: number, id_equipo?: number): Promise<Observable<any[]>> {
        const headers = await this.getHeaders();
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
            { headers }
        ).pipe(map(response => response.body as any[]));
    }

    // ==============================
    // POST - crear registro
    // ==============================
    async crearRegistro(data: any): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearRegistroTemperatura',
            data,
            { headers }
        );
    }

    // ==============================
    // POST - editar registro
    // ==============================
    async editarRegistro(data: any): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'editarRegistroTemperatura',
            data,
            { headers }
        );
    }

    // ==============================
    // DELETE - eliminar registro
    // ==============================
    async eliminarRegistro(id_registro: number): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'eliminarRegistroTemperatura',
            { id_registro },
            { headers }
        );
    }
}
