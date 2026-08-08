import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { ApiResponse } from '../../interfaces/pqrs';

@Injectable({ providedIn: 'root' })
export class PqrsReportesService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/pqrs/reportes/';
    }

    private async getHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    private async getBody(): Promise<{ id_usuario: number; id_empresa: number }> {
        const idUser = await this.secureStorage.getItem('idUser');
        const idEmpresa = await this.secureStorage.getItem('idEmpresa');
        return { id_usuario: Number(idUser), id_empresa: Number(idEmpresa) };
    }

    private async post<T>(endpoint: string, extraBody: Record<string, unknown> = {}): Promise<Observable<T>> {
        const headers = await this.getHeaders();
        const base = await this.getBody();
        return this.http.post<T>(
            this.urlApp + this.urlAppAPI + endpoint,
            { ...base, ...extraBody },
            { headers }
        );
    }

    async generarReporte(id_propiedad_horizontal: number | null, fecha_inicio: string, fecha_fin: string, estado?: string): Promise<Observable<ApiResponse<any[]>>> {
        const body: Record<string, unknown> = { fecha_inicio, fecha_fin };
        if (id_propiedad_horizontal) body['id_propiedad_horizontal'] = id_propiedad_horizontal;
        if (estado) body['estado'] = estado;
        return this.post<ApiResponse<any[]>>('generarReporte', body);
    }
}
