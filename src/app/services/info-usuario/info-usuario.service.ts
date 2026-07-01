import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { enviroment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class InfoUsuarioService {

    private urlApp = enviroment.endpoint;
    private urlAppAPI = 'api/usuario_info/';

    constructor(private http: HttpClient) {}

    private getAuthHeaders() {
        return new HttpHeaders().set('authorization', `Bearer ${localStorage.getItem('token')}`);
    }

    getFullUserInfo(): Observable<any> {
        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getFullUserInfo`,
            {},
            { headers: this.getAuthHeaders() }
        ).pipe(map(resp => resp.body));
    }

    updateUserInfo(data: { nombre?: string; apellido?: string; foto_perfil?: string; firma_digital?: string }): Observable<any> {
        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}updateUserInfo`,
            data,
            { headers: this.getAuthHeaders() }
        );
    }

    updateInfoAdicional(data: { nombre_completo?: string; numero_documento?: string; banco?: string; tipo_cuenta?: string; numero_cuenta?: string }): Observable<any> {
        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}updateInfoAdicional`,
            data,
            { headers: this.getAuthHeaders() }
        );
    }

    updateCorreoSmtp(data: { correo_electronico?: string; password?: string; host?: string; puerto?: number; servicio?: string }): Observable<any> {
        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}updateCorreoSmtp`,
            data,
            { headers: this.getAuthHeaders() }
        );
    }
}
