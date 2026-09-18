import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { ApiResponse } from '../../interfaces/pqrs';
import {
    AgendaTodo,
    BitacoraDiaria,
    BitacoraEvidencia,
    BitacoraNovedad,
    BitacoraPayload,
    ResumenBitacora
} from '../../interfaces/gestion-ph';

@Injectable({ providedIn: 'root' })
export class GestionPhService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/gestion_ph/';
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

    // Bitácora
    async getBitacora(fecha: string, id_tipo_grupo?: number | null): Promise<Observable<ApiResponse<BitacoraPayload>>> {
        return this.post<ApiResponse<BitacoraPayload>>('getBitacora', { fecha, id_tipo_grupo: id_tipo_grupo ?? null });
    }

    async guardarBitacora(data: Partial<BitacoraDiaria>): Promise<Observable<ApiResponse<BitacoraDiaria>>> {
        return this.post<ApiResponse<BitacoraDiaria>>('guardarBitacora', { ...data });
    }

    async cerrarBitacora(id_bitacora: number): Promise<Observable<ApiResponse<BitacoraDiaria>>> {
        return this.post<ApiResponse<BitacoraDiaria>>('cerrarBitacora', { id_bitacora });
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

    // To-Do
    async getTareas(fecha?: string, id_tipo_grupo?: number | null): Promise<Observable<ApiResponse<AgendaTodo[]>>> {
        return this.post<ApiResponse<AgendaTodo[]>>('getTareas', { fecha, id_tipo_grupo: id_tipo_grupo ?? null });
    }

    async crearTarea(titulo: string, fecha: string, id_tipo_grupo?: number | null): Promise<Observable<ApiResponse<AgendaTodo>>> {
        return this.post<ApiResponse<AgendaTodo>>('crearTarea', { titulo, fecha, id_tipo_grupo: id_tipo_grupo ?? null });
    }

    async toggleTarea(id_tarea: number, completada: boolean): Promise<Observable<ApiResponse<AgendaTodo>>> {
        return this.post<ApiResponse<AgendaTodo>>('toggleTarea', { id_tarea, completada });
    }

    async eliminarTarea(id_tarea: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('eliminarTarea', { id_tarea });
    }

    // Resumen
    async generarResumenBitacora(fecha: string, id_tipo_grupo?: number | null): Promise<Observable<ApiResponse<ResumenBitacora>>> {
        return this.post<ApiResponse<ResumenBitacora>>('generarResumenBitacora', { fecha, id_tipo_grupo: id_tipo_grupo ?? null });
    }
}
