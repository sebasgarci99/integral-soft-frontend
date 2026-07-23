import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { GestionPaciente, GestionPacienteResponse } from '../../interfaces/gestion-pacientes';
import { ProcedimientoRiesgo } from '../../interfaces/gestion-pacientes';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({
    providedIn: 'root'
})
export class GestionPacientesService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/gestion_pacientes/';
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

    async obtenerPacientes(): Promise<Observable<GestionPaciente[]>> {
        const headers = await this.getAuthHeaders();
        const body = await this.getBaseBody();
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'getPacientes',
            body,
            { headers }
        ).pipe(
            map(response => (response.body as GestionPaciente[]) || [])
        );
    }

    async obtenerPaciente(idPaciente: number): Promise<Observable<{ paciente: GestionPaciente; historico: any[] }>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        const body = { ...baseBody, id_paciente: idPaciente };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'getPacienteById',
            body,
            { headers }
        ).pipe(
            map(response => (response.body as any) || { paciente: {}, historico: [] })
        );
    }

    async crearPaciente(data: GestionPaciente): Promise<Observable<GestionPacienteResponse>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        const body = { ...baseBody, ...data };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'crearPaciente',
            body,
            { headers }
        );
    }

    async actualizarPaciente(data: GestionPaciente): Promise<Observable<GestionPacienteResponse>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        const body = { ...baseBody, ...data };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'actualizarPaciente',
            body,
            { headers }
        );
    }

    async inactivarPaciente(id_paciente: number): Promise<Observable<GestionPacienteResponse>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        const body = { ...baseBody, id_paciente: Number(id_paciente) };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'inactivarPaciente',
            body,
            { headers }
        );
    }

    async obtenerTiposConsentimiento(): Promise<Observable<any[]>> {
        const headers = await this.getAuthHeaders();
        const body = await this.getBaseBody();
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'getTiposConsentimiento',
            body,
            { headers }
        ).pipe(
            map(response => (response.body as any[]) || [])
        );
    }

    async enviarBorrador(id_paciente: number, id_cita: number, tipo_consentimiento: string, correo_destino: string, funcion_borrador: string): Promise<Observable<GestionPacienteResponse>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        const body = { ...baseBody, id_paciente, id_cita, tipo_consentimiento, correo_destino, funcion_borrador };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'enviarBorrador',
            body,
            { headers }
        );
    }

    async generarConsentimiento(id_paciente: number, id_cita: number, tipo_consentimiento: string, datos: any, firma_digital_paciente: string, funcion_pdf: string): Promise<Observable<GestionPacienteResponse>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        const body = { ...baseBody, id_paciente, id_cita, tipo_consentimiento, datos, firma_digital_paciente, funcion_pdf };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'generarConsentimiento',
            body,
            { headers }
        );
    }

    async obtenerConsentimientos(id_paciente: number): Promise<Observable<any[]>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        const body = { ...baseBody, id_paciente };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'getConsentimientos',
            body,
            { headers }
        ).pipe(
            map(response => (response.body as any[]) || [])
        );
    }

    async reenviarConsentimiento(id_consentimiento: number, correo_destino: string): Promise<Observable<GestionPacienteResponse>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        const body = { ...baseBody, id_consentimiento, correo_destino };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'reenviarConsentimiento',
            body,
            { headers }
        );
    }

    async descargarConsentimientoById(id_consentimiento: number): Promise<Observable<GestionPacienteResponse>> {
        const headers = await this.getAuthHeaders();
        const baseBody = await this.getBaseBody();
        const body = { ...baseBody, id_consentimiento };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'descargarConsentimientoById',
            body,
            { headers }
        );
    }

    async obtenerProcedimientosRiesgos(): Promise<Observable<ProcedimientoRiesgo[]>> {
        const headers = await this.getAuthHeaders();
        const body = await this.getBaseBody();
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'getProcedimientosRiesgos',
            body,
            { headers }
        ).pipe(
            map(response => (response.body as ProcedimientoRiesgo[]) || [])
        );
    }
}
