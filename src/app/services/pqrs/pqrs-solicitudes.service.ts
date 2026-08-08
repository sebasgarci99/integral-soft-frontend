import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { ApiResponse, SolicitudPqrs } from '../../interfaces/pqrs';

@Injectable({ providedIn: 'root' })
export class PqrsSolicitudesService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/pqrs/solicitudes/';
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

    async listarSolicitudesPorPropiedad(id_propiedad_horizontal: number): Promise<Observable<ApiResponse<any[]>>> {
        return this.post<ApiResponse<any[]>>('listarSolicitudesPorPropiedad', { id_propiedad_horizontal });
    }

    async obtenerDetalleSolicitud(id_solicitud_pqrs: number): Promise<Observable<ApiResponse<SolicitudPqrs>>> {
        return this.post<ApiResponse<SolicitudPqrs>>('obtenerDetalleSolicitud', { id_solicitud_pqrs });
    }

    async categorizarSolicitud(id_solicitud_pqrs: number, id_categoria: number, notificar_usuario: boolean): Promise<Observable<ApiResponse<SolicitudPqrs>>> {
        return this.post<ApiResponse<SolicitudPqrs>>('categorizarSolicitud', { id_solicitud_pqrs, id_categoria, notificar_usuario });
    }

    async registrarAvance(id_solicitud_pqrs: number, descripcion: string, avanza_a_finalizacion: boolean, archivos: any[] = [], notificar_usuario: boolean = false): Promise<Observable<ApiResponse<any>>> {
        return this.post<ApiResponse<any>>('registrarAvance', { id_solicitud_pqrs, descripcion, avanza_a_finalizacion, archivos, notificar_usuario });
    }

    async finalizarSolicitud(id_solicitud_pqrs: number, resumen_finalizacion: string, archivos: any[] = [], notificar_usuario: boolean = false): Promise<Observable<ApiResponse<SolicitudPqrs>>> {
        return this.post<ApiResponse<SolicitudPqrs>>('finalizarSolicitud', { id_solicitud_pqrs, resumen_finalizacion, archivos, notificar_usuario });
    }

    async subirArchivo(id_solicitud_pqrs: number, archivo: any, id_avance_pqrs?: number): Promise<Observable<ApiResponse<any>>> {
        return this.post<ApiResponse<any>>('subirArchivo', { id_solicitud_pqrs, id_avance_pqrs, ...archivo });
    }
}
