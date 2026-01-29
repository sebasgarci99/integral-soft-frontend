import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';

@Injectable({
    providedIn: 'root'
})
export class RegistroTemperaturaService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/reg_temperatura/'
    }

    // ==============================
    // GET - listar registros
    // ==============================
    obtenerRegistros(): Observable<any[]> {
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        let body = {};

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getRegistrosTemperatura',
            body,
            { headers: headersWS }
        ).pipe(
            map(response => response.body as any[])
        );
    }

    // ==============================
    // POST - crear registro
    // ==============================
    crearRegistro(data: any): Observable<any> {
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        let body = { id_usuario: Number(idUser), ...data };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearRegistroTemperatura',
            body,
            { headers: headersWS }
        );
    }

    // ==============================
    // DELETE - eliminar registro
    // ==============================
    eliminarRegistro(id_registro: number): Observable<any> {
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        let body = { id_usuario: Number(idUser), id_registro };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'eliminarRegistroTemperatura',
            body,
            { headers: headersWS }
        );
    }
}
