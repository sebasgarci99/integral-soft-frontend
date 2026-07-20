import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { GestionPaciente, GestionPacienteResponse } from '../../interfaces/gestion-pacientes';
import { ProcedimientoRiesgo } from '../../interfaces/gestion-pacientes';

@Injectable({
    providedIn: 'root'
})
export class GestionPacientesService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/gestion_pacientes/';
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    private getBaseBody(): { id_usuario: number; id_empresa: number } {
        return {
            id_usuario: Number(localStorage.getItem('idUser')),
            id_empresa: Number(localStorage.getItem('idEmpresa'))
        };
    }

    obtenerPacientes(): Observable<GestionPaciente[]> {
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'getPacientes',
            this.getBaseBody(),
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => (response.body as GestionPaciente[]) || [])
        );
    }

    obtenerPaciente(idPaciente: number): Observable<{ paciente: GestionPaciente; historico: any[] }> {
        const body = { ...this.getBaseBody(), id_paciente: idPaciente };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'getPacienteById',
            body,
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => (response.body as any) || { paciente: {}, historico: [] })
        );
    }

    crearPaciente(data: GestionPaciente): Observable<GestionPacienteResponse> {
        const body = { ...this.getBaseBody(), ...data };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'crearPaciente',
            body,
            { headers: this.getAuthHeaders() }
        );
    }

    actualizarPaciente(data: GestionPaciente): Observable<GestionPacienteResponse> {
        const body = { ...this.getBaseBody(), ...data };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'actualizarPaciente',
            body,
            { headers: this.getAuthHeaders() }
        );
    }

    inactivarPaciente(id_paciente: number): Observable<GestionPacienteResponse> {
        const body = { ...this.getBaseBody(), id_paciente: Number(id_paciente) };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'inactivarPaciente',
            body,
            { headers: this.getAuthHeaders() }
        );
    }

    obtenerTiposConsentimiento(): Observable<any[]> {
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'getTiposConsentimiento',
            this.getBaseBody(),
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => (response.body as any[]) || [])
        );
    }

    enviarBorrador(id_paciente: number, id_cita: number, tipo_consentimiento: string, correo_destino: string, funcion_borrador: string): Observable<GestionPacienteResponse> {
        const body = { ...this.getBaseBody(), id_paciente, id_cita, tipo_consentimiento, correo_destino, funcion_borrador };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'enviarBorrador',
            body,
            { headers: this.getAuthHeaders() }
        );
    }

    generarConsentimiento(id_paciente: number, id_cita: number, tipo_consentimiento: string, datos: any, firma_digital_paciente: string, funcion_pdf: string): Observable<GestionPacienteResponse> {
        const body = { ...this.getBaseBody(), id_paciente, id_cita, tipo_consentimiento, datos, firma_digital_paciente, funcion_pdf };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'generarConsentimiento',
            body,
            { headers: this.getAuthHeaders() }
        );
    }

    obtenerConsentimientos(id_paciente: number): Observable<any[]> {
        const body = { ...this.getBaseBody(), id_paciente };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'getConsentimientos',
            body,
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => (response.body as any[]) || [])
        );
    }

    reenviarConsentimiento(id_consentimiento: number, correo_destino: string): Observable<GestionPacienteResponse> {
        const body = { ...this.getBaseBody(), id_consentimiento, correo_destino };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'reenviarConsentimiento',
            body,
            { headers: this.getAuthHeaders() }
        );
    }

    descargarConsentimientoById(id_consentimiento: number): Observable<GestionPacienteResponse> {
        const body = { ...this.getBaseBody(), id_consentimiento };
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'descargarConsentimientoById',
            body,
            { headers: this.getAuthHeaders() }
        );
    }

    obtenerProcedimientosRiesgos(): Observable<ProcedimientoRiesgo[]> {
        return this.http.post<GestionPacienteResponse>(
            this.urlApp + this.urlAppAPI + 'getProcedimientosRiesgos',
            this.getBaseBody(),
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => (response.body as ProcedimientoRiesgo[]) || [])
        );
    }
}
