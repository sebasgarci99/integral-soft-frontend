import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({ providedIn: 'root' })
export class InfoUsuarioService {

    private urlApp = enviroment.endpoint;
    private urlAppAPI = 'api/usuario_info/';

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {}

    private async getAuthHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    async getFullUserInfo(): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getFullUserInfo`,
            {},
            { headers }
        ).pipe(map(resp => resp.body));
    }

    async updateUserInfo(data: { nombre?: string; apellido?: string; foto_perfil?: string; firma_digital?: string }): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}updateUserInfo`,
            data,
            { headers }
        );
    }

    async updateInfoAdicional(data: { nombre_completo?: string; numero_documento?: string; banco?: string; tipo_cuenta?: string; numero_cuenta?: string }): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}updateInfoAdicional`,
            data,
            { headers }
        );
    }

    async updateCorreoSmtp(data: { correo_electronico?: string; password?: string; host?: string; puerto?: number; servicio?: string }): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}updateCorreoSmtp`,
            data,
            { headers }
        );
    }
}
