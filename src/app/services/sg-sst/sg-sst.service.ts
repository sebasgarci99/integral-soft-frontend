import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { ApiResponse } from '../../interfaces/pqrs';
import { SecureStorageService } from '../secure-storage.service';
import {
    SgSstBitacora,
    SgSstBitacoraEvento,
    SgSstBitacoraPayload,
    SgSstDiaDiligenciado,
    SgSstEvidencia,
    SgSstGrupo,
    SgSstInstancia,
    SgSstPanel,
    SgSstReportePreview,
    SgSstResumen,
    SgSstSolicitudReapertura,
    SgSstTarea
} from '../../interfaces/sg-sst';

@Injectable({ providedIn: 'root' })
export class SgSstService {

    private urlApp: string;
    private urlAppAPI = 'api/sg-sst/';

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
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

    private async postBlob(endpoint: string, extraBody: Record<string, unknown> = {}): Promise<Observable<Blob>> {
        const headers = await this.getHeaders();
        const base = await this.getBody();
        return this.http.post(
            this.urlApp + this.urlAppAPI + endpoint,
            { ...base, ...extraBody },
            { headers, responseType: 'blob' }
        );
    }

    // Grupos
    async getGrupos(idCliente: number, incluirInactivos = false): Promise<Observable<ApiResponse<SgSstGrupo[]>>> {
        return this.post('getGrupos', { id_cliente: idCliente, incluirInactivos });
    }

    async crearGrupo(idCliente: number, grupo: Partial<SgSstGrupo>): Promise<Observable<ApiResponse<SgSstGrupo>>> {
        return this.post('crearGrupo', { id_cliente: idCliente, ...grupo });
    }

    async actualizarGrupo(idCliente: number, grupo: Partial<SgSstGrupo> & { id_tipo_grupo: number }): Promise<Observable<ApiResponse<SgSstGrupo>>> {
        return this.post('actualizarGrupo', { id_cliente: idCliente, ...grupo });
    }

    async inactivarGrupo(idCliente: number, idTipoGrupo: number): Promise<Observable<ApiResponse<string>>> {
        return this.post('inactivarGrupo', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo });
    }

    // Calendario y panel
    async getDiasDiligenciados(idCliente: number, idTipoGrupo: number, anio: number, mes: number): Promise<Observable<ApiResponse<SgSstDiaDiligenciado[]>>> {
        return this.post('getDiasDiligenciados', {
            id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, anio, mes
        });
    }

    async getPanelDia(idCliente: number, idTipoGrupo: number, fecha: string): Promise<Observable<ApiResponse<SgSstPanel>>> {
        return this.post('getPanelDia', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, fecha });
    }

    // Bitácora
    async getBitacora(idCliente: number, idTipoGrupo: number, fecha: string): Promise<Observable<ApiResponse<SgSstBitacoraPayload>>> {
        return this.post('getBitacora', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, fecha });
    }

    async guardarBitacora(idCliente: number, idTipoGrupo: number, data: Partial<SgSstBitacora>): Promise<Observable<ApiResponse<SgSstBitacora>>> {
        return this.post('guardarBitacora', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, ...data });
    }

    async guardarResumenParcial(
        idCliente: number,
        idTipoGrupo: number,
        fecha: string,
        resumen: string,
        idBitacora?: number
    ): Promise<Observable<ApiResponse<{ id_bitacora: number; resumen: string; estado: string; actualizado: string }>>> {
        return this.post('guardarResumenParcial', {
            id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, fecha, resumen, id_bitacora: idBitacora
        });
    }

    async cerrarBitacora(idCliente: number, idTipoGrupo: number, idBitacora: number): Promise<Observable<ApiResponse<SgSstBitacora>>> {
        return this.post('cerrarBitacora', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, id_bitacora: idBitacora });
    }

    async solicitarReapertura(idCliente: number, idTipoGrupo: number, idBitacora: number, motivo: string): Promise<Observable<ApiResponse<SgSstSolicitudReapertura>>> {
        return this.post('solicitarReapertura', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, id_bitacora: idBitacora, motivo });
    }

    async reabrirBitacora(idCliente: number, idTipoGrupo: number, idBitacora: number, motivo: string): Promise<Observable<ApiResponse<SgSstBitacora>>> {
        return this.post('reabrirBitacora', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, id_bitacora: idBitacora, motivo });
    }

    async getEventosBitacora(idCliente: number, idTipoGrupo: number, idBitacora: number): Promise<Observable<ApiResponse<SgSstBitacoraEvento[]>>> {
        return this.post('getEventosBitacora', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, id_bitacora: idBitacora });
    }

    async getSolicitudesReapertura(): Promise<Observable<ApiResponse<SgSstSolicitudReapertura[]>>> {
        return this.post('getSolicitudesReapertura', {});
    }

    async responderSolicitudReapertura(idSolicitud: number, decision: 'aprobar' | 'rechazar', motivoRespuesta?: string): Promise<Observable<ApiResponse<unknown>>> {
        return this.post('responderSolicitudReapertura', {
            id_solicitud: idSolicitud,
            decision,
            motivo_respuesta: motivoRespuesta || ''
        });
    }

    async generarResumen(idCliente: number, idTipoGrupo: number, fecha: string): Promise<Observable<ApiResponse<SgSstResumen>>> {
        return this.post('generarResumen', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, fecha });
    }

    // Evidencias
    async subirEvidencia(idCliente: number, idTipoGrupo: number, data: {
        id_bitacora: number;
        archivo_base64: string;
        thumb_base64?: string;
        nombre_original?: string;
        mime_type?: string;
        descripcion?: string;
    }): Promise<Observable<ApiResponse<SgSstEvidencia>>> {
        return this.post('subirEvidencia', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, ...data });
    }

    async getEvidencias(idCliente: number, idTipoGrupo: number, idBitacora: number): Promise<Observable<ApiResponse<SgSstEvidencia[]>>> {
        return this.post('getEvidencias', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, id_bitacora: idBitacora });
    }

    async eliminarEvidencia(idCliente: number, idTipoGrupo: number, idEvidencia: number): Promise<Observable<ApiResponse<string>>> {
        return this.post('eliminarEvidencia', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, id_evidencia: idEvidencia });
    }

    // To-Do
    async getTareas(idCliente: number, idTipoGrupo: number, fecha: string): Promise<Observable<ApiResponse<SgSstTarea[]>>> {
        return this.post('getTareas', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, fecha });
    }

    async crearTarea(idCliente: number, idTipoGrupo: number, titulo: string, fecha: string): Promise<Observable<ApiResponse<SgSstTarea>>> {
        return this.post('crearTarea', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, titulo, fecha });
    }

    async toggleTarea(idCliente: number, idTipoGrupo: number, idTarea: number, completada: boolean): Promise<Observable<ApiResponse<SgSstTarea>>> {
        return this.post('toggleTarea', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, id_tarea: idTarea, completada });
    }

    async eliminarTarea(idCliente: number, idTipoGrupo: number, idTarea: number): Promise<Observable<ApiResponse<string>>> {
        return this.post('eliminarTarea', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, id_tarea: idTarea });
    }

    // Programador
    async getProgramacion(idCliente: number, idTipoGrupo: number, fechaInicio: string, fechaFin: string): Promise<Observable<ApiResponse<SgSstInstancia[]>>> {
        return this.post('getProgramacion', {
            id_cliente: idCliente, id_tipo_grupo: idTipoGrupo,
            fecha_inicio: fechaInicio, fecha_fin: fechaFin
        });
    }

    async crearActividad(idCliente: number, idTipoGrupo: number, data: Record<string, unknown>): Promise<Observable<ApiResponse<{ instancias_generadas: number }>>> {
        return this.post('crearActividad', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, ...data });
    }

    async ejecutarActividad(idCliente: number, idTipoGrupo: number, data: {
        id_instancia: number;
        observaciones?: string;
        evidencias?: { tipo?: string; base64?: string; url?: string; descripcion?: string }[];
    }): Promise<Observable<ApiResponse<{ instancia: SgSstInstancia }>>> {
        return this.post('ejecutarActividad', { id_cliente: idCliente, id_tipo_grupo: idTipoGrupo, ...data });
    }

    // Reportes
    async getReportePreview(
        idCliente: number,
        idTipoGrupo: number | null,
        fechaInicio: string,
        fechaFin: string
    ): Promise<Observable<ApiResponse<SgSstReportePreview>>> {
        return this.post('reportes/preview', {
            id_cliente: idCliente,
            id_tipo_grupo: idTipoGrupo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
        });
    }

    async descargarReportePdf(
        idCliente: number,
        idTipoGrupo: number | null,
        fechaInicio: string,
        fechaFin: string
    ): Promise<Observable<Blob>> {
        return this.postBlob('reportes/pdf', {
            id_cliente: idCliente,
            id_tipo_grupo: idTipoGrupo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
        });
    }

    async descargarReporteDocx(
        idCliente: number,
        idTipoGrupo: number | null,
        fechaInicio: string,
        fechaFin: string
    ): Promise<Observable<Blob>> {
        return this.postBlob('reportes/docx', {
            id_cliente: idCliente,
            id_tipo_grupo: idTipoGrupo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
        });
    }
}
