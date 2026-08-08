import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { ApiResponse, AlertaConfigPqrs } from '../../interfaces/pqrs';

@Injectable({ providedIn: 'root' })
export class PqrsAlertasService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/pqrs/alertas/';
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

    async listarAlertasPorPropiedad(id_propiedad_horizontal: number): Promise<Observable<ApiResponse<AlertaConfigPqrs[]>>> {
        return this.post<ApiResponse<AlertaConfigPqrs[]>>('listarAlertasPorPropiedad', { id_propiedad_horizontal });
    }

    async guardarAlerta(data: Partial<AlertaConfigPqrs>): Promise<Observable<ApiResponse<AlertaConfigPqrs>>> {
        return this.post<ApiResponse<AlertaConfigPqrs>>('guardarAlerta', data);
    }

    async inactivarAlerta(id_alerta_config: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('inactivarAlerta', { id_alerta_config });
    }

    async inicializarAlertasPorDefecto(id_propiedad_horizontal: number): Promise<Observable<ApiResponse<AlertaConfigPqrs[]>>> {
        return this.post<ApiResponse<AlertaConfigPqrs[]>>('inicializarAlertasPorDefecto', { id_propiedad_horizontal });
    }
}
