import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import {
    HcApiResponse,
    HcAuditoriaPrivada,
    HcDatosPrivadosResponse,
    HcHistoriaDetalle,
    HcHistoriaPacienteResponse,
    HcPermisos,
    HcRegistroPayload,
    HcSolicitudOtp,
    HcVerificacionOtp
} from '../../interfaces/historias-clinicas';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({ providedIn: 'root' })
export class HistoriasClinicasService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/historias_clinicas/';
    }

    private async getAuthHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    private async getBaseBody(): Promise<Record<string, unknown>> {
        const [idUser, idEmpresa] = await Promise.all([
            this.secureStorage.getItem('idUser'),
            this.secureStorage.getItem('idEmpresa')
        ]);
        return {
            id_usuario: Number(idUser),
            id_empresa: Number(idEmpresa)
        };
    }

    async obtenerPermisos(): Promise<Observable<HcPermisos>> {
        const headers = await this.getAuthHeaders();
        const body = await this.getBaseBody();
        return this.http.post<HcApiResponse<HcPermisos>>(
            this.urlApp + this.urlAppAPI + 'getPermisos',
            body,
            { headers }
        ).pipe(map(response => response.body));
    }

    async obtenerHistoriasPaciente(idPaciente: number): Promise<Observable<HcHistoriaPacienteResponse>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<HcHistoriaPacienteResponse>>(
            this.urlApp + this.urlAppAPI + 'getHistoriasPaciente',
            { ...baseBody, id_paciente: idPaciente },
            { headers }
        ).pipe(map(response => response.body));
    }

    async obtenerHistoriaById(idHistoria: number): Promise<Observable<HcHistoriaDetalle>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<HcHistoriaDetalle>>(
            this.urlApp + this.urlAppAPI + 'getHistoriaById',
            { ...baseBody, id_historia: idHistoria },
            { headers }
        ).pipe(map(response => response.body));
    }

    async crearRegistro(data: HcRegistroPayload): Promise<Observable<HcApiResponse<{ id_historia: number }>>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<{ id_historia: number }>>(
            this.urlApp + this.urlAppAPI + 'crearRegistro',
            { ...baseBody, ...data },
            { headers }
        );
    }

    async actualizarRegistro(idHistoria: number, data: Partial<HcRegistroPayload>): Promise<Observable<HcApiResponse<{ id_historia: number }>>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<{ id_historia: number }>>(
            this.urlApp + this.urlAppAPI + 'actualizarRegistro',
            { ...baseBody, id_historia: idHistoria, ...data },
            { headers }
        );
    }

    async finalizarRegistro(idHistoria: number): Promise<Observable<HcApiResponse<{ id_historia: number; hash_integridad: string }>>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<{ id_historia: number; hash_integridad: string }>>(
            this.urlApp + this.urlAppAPI + 'finalizarRegistro',
            { ...baseBody, id_historia: idHistoria },
            { headers }
        );
    }

    async anularRegistro(idHistoria: number, motivoAnulacion: string): Promise<Observable<HcApiResponse<{ id_historia: number }>>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<{ id_historia: number }>>(
            this.urlApp + this.urlAppAPI + 'anularRegistro',
            { ...baseBody, id_historia: idHistoria, motivo_anulacion: motivoAnulacion },
            { headers }
        );
    }

    async crearNotaCorreccion(idHistoriaOrigen: number, motivo: string): Promise<Observable<HcApiResponse<{ id_historia: number }>>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<{ id_historia: number }>>(
            this.urlApp + this.urlAppAPI + 'crearNotaCorreccion',
            { ...baseBody, id_historia_origen: idHistoriaOrigen, motivo },
            { headers }
        );
    }

    async solicitarAccesoPrivado(idPaciente: number, idHistoria?: number | null): Promise<Observable<HcApiResponse<HcSolicitudOtp>>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<HcSolicitudOtp>>(
            this.urlApp + this.urlAppAPI + 'solicitarAccesoPrivado',
            { ...baseBody, id_paciente: idPaciente, id_historia: idHistoria || null },
            { headers }
        );
    }

    async verificarAccesoPrivado(idOtp: number, codigo: string): Promise<Observable<HcApiResponse<HcVerificacionOtp>>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<HcVerificacionOtp>>(
            this.urlApp + this.urlAppAPI + 'verificarAccesoPrivado',
            { ...baseBody, id_otp: idOtp, codigo },
            { headers }
        );
    }

    async obtenerDatosPrivados(idPaciente: number, idHistoria: number | null, accessToken: string): Promise<Observable<HcDatosPrivadosResponse>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<HcDatosPrivadosResponse>>(
            this.urlApp + this.urlAppAPI + 'getDatosPrivados',
            { ...baseBody, id_paciente: idPaciente, id_historia: idHistoria || null, access_token: accessToken },
            { headers }
        ).pipe(map(response => response.body));
    }

    async guardarDatosPrivados(idPaciente: number, idHistoria: number, accessToken: string, datos: Record<string, unknown>): Promise<Observable<HcApiResponse<{ id_historia: number }>>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<{ id_historia: number }>>(
            this.urlApp + this.urlAppAPI + 'guardarDatosPrivados',
            { ...baseBody, id_paciente: idPaciente, id_historia: idHistoria, access_token: accessToken, datos },
            { headers }
        );
    }

    async obtenerAuditoriaPrivada(idPaciente: number): Promise<Observable<HcAuditoriaPrivada[]>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post<HcApiResponse<HcAuditoriaPrivada[]>>(
            this.urlApp + this.urlAppAPI + 'getAuditoriaPrivada',
            { ...baseBody, id_paciente: idPaciente },
            { headers }
        ).pipe(map(response => response.body || []));
    }

    async generarPdfHistoria(idHistoria: number, tipo: 'PUBLICO' | 'PRIVADO', accessToken?: string): Promise<Observable<Blob>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        return this.http.post(
            this.urlApp + this.urlAppAPI + 'generarPdfHistoria',
            { ...baseBody, id_historia: idHistoria, tipo, access_token: accessToken || null },
            { headers, responseType: 'blob' }
        ) as Observable<Blob>;
    }
}
