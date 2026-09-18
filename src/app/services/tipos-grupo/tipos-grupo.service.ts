import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { ApiResponse } from '../../interfaces/pqrs';
import { TipoGrupo } from '../../interfaces/gestion-ph';

@Injectable({ providedIn: 'root' })
export class TiposGrupoService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/tipos_grupo/';
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

    async getTiposGrupo(incluirInactivos = false): Promise<Observable<ApiResponse<TipoGrupo[]>>> {
        return this.post<ApiResponse<TipoGrupo[]>>('getTiposGrupo', { incluirInactivos });
    }

    async crearTipoGrupo(grupo: Partial<TipoGrupo>): Promise<Observable<ApiResponse<TipoGrupo>>> {
        return this.post<ApiResponse<TipoGrupo>>('crearTipoGrupo', { ...grupo });
    }

    async actualizarTipoGrupo(grupo: Partial<TipoGrupo> & { id_tipo_grupo: number }): Promise<Observable<ApiResponse<TipoGrupo>>> {
        return this.post<ApiResponse<TipoGrupo>>('actualizarTipoGrupo', { ...grupo });
    }

    async inactivarTipoGrupo(id_tipo_grupo: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('inactivarTipoGrupo', { id_tipo_grupo });
    }
}
