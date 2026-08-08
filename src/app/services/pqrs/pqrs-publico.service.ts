import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { ApiResponse, SolicitudPqrs } from '../../interfaces/pqrs';

@Injectable({ providedIn: 'root' })
export class PqrsPublicoService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/pqrs/publico/';
    }

    private post<T>(endpoint: string, body: Record<string, unknown> = {}): Observable<T> {
        return this.http.post<T>(
            this.urlApp + this.urlAppAPI + endpoint,
            body
        );
    }

    validarCodigo(codigo_acceso: string): Observable<ApiResponse<{ id_propiedad_horizontal: number; nombre: string; direccion: string; ubicacion_maps?: string }>> {
        return this.post<ApiResponse<any>>('validarCodigo', { codigo_acceso });
    }

    validarLimite(codigo_acceso: string, documento_solicitante: string): Observable<ApiResponse<{ puede_crear: boolean; pendientes: number; id_propiedad_horizontal: number }>> {
        return this.post<ApiResponse<any>>('validarLimite', { codigo_acceso, documento_solicitante });
    }

    crearSolicitud(data: Record<string, unknown>): Observable<ApiResponse<{ codigo_radicado: string; id_solicitud_pqrs: number }>> {
        return this.post<ApiResponse<any>>('crearSolicitud', data);
    }

    consultarSeguimiento(codigo_acceso: string, codigo_radicado?: string, documento_solicitante?: string): Observable<ApiResponse<SolicitudPqrs[]>> {
        const body: Record<string, unknown> = { codigo_acceso };
        if (codigo_radicado) body['codigo_radicado'] = codigo_radicado;
        if (documento_solicitante) body['documento_solicitante'] = documento_solicitante;
        return this.post<ApiResponse<SolicitudPqrs[]>>('seguimiento', body);
    }
}
