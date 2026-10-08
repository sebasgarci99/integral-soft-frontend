import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { ApiResponse } from '../../interfaces/pqrs';
import {
    BitacoraDiaria,
    BitacoraEvidencia,
    BitacoraNovedad,
    MantenimientoPayload
} from '../../interfaces/gestion-ph';

@Injectable({ providedIn: 'root' })
export class MantenimientosService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/mantenimientos/';
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

    // Bitácora de mantenimientos
    async getMantenimiento(fecha: string): Promise<Observable<ApiResponse<MantenimientoPayload>>> {
        return this.post<ApiResponse<MantenimientoPayload>>('getMantenimiento', { fecha });
    }

    async guardarMantenimiento(data: Partial<BitacoraDiaria> & { fecha: string; descripcion?: string | null }): Promise<Observable<ApiResponse<BitacoraDiaria>>> {
        return this.post<ApiResponse<BitacoraDiaria>>('guardarMantenimiento', { ...data });
    }

    async listarMantenimientos(fecha_inicio?: string, fecha_fin?: string): Promise<Observable<ApiResponse<BitacoraDiaria[]>>> {
        return this.post<ApiResponse<BitacoraDiaria[]>>('listarMantenimientos', { fecha_inicio, fecha_fin });
    }

    // Novedades
    async guardarNovedad(data: Partial<BitacoraNovedad> & { id_bitacora: number; descripcion: string }): Promise<Observable<ApiResponse<BitacoraNovedad>>> {
        return this.post<ApiResponse<BitacoraNovedad>>('guardarNovedad', { ...data });
    }

    async eliminarNovedad(id_novedad: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('eliminarNovedad', { id_novedad });
    }

    // Evidencias
    async subirEvidencia(data: {
        id_bitacora: number;
        archivo_base64: string;
        thumb_base64?: string;
        nombre_original?: string;
        mime_type?: string;
        descripcion?: string;
    }): Promise<Observable<ApiResponse<BitacoraEvidencia>>> {
        return this.post<ApiResponse<BitacoraEvidencia>>('subirEvidencia', { ...data });
    }

    async getEvidencias(id_bitacora: number): Promise<Observable<ApiResponse<BitacoraEvidencia[]>>> {
        return this.post<ApiResponse<BitacoraEvidencia[]>>('getEvidencias', { id_bitacora });
    }

    async eliminarEvidencia(id_evidencia: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('eliminarEvidencia', { id_evidencia });
    }
}
