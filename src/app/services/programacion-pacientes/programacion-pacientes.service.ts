import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';

export interface CitaPaciente {
    id_cita?: number;
    id_paciente: number;
    nombre_paciente?: string;
    telefono_contacto?: string;
    correo_electronico?: string;
    fecha_cita: string | Date;
    hora_inicio: string;
    hora_fin?: string;
    duracion_minutos?: number;
    motivo?: string;
    tipo_cita?: string;
    estado_cita?: string;
    notificado_whatsapp?: boolean;
    fecha_notificacion_whatsapp?: string | Date;
}

export interface PacienteBusqueda {
    id_paciente: number;
    nombres: string;
    apellidos: string;
    numero_documento: string;
    telefono_contacto?: string;
    correo_electronico?: string;
    nombre_completo?: string;
}

export interface CrearCitaRequest {
    id_paciente: number;
    fecha_cita: string;
    hora_inicio: string;
    duracion_minutos: number;
    tipo_cita?: string;
    motivo?: string;
    enviar_correo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProgramacionPacientesService {
    private urlApp = enviroment.endpoint;
    private urlAppAPI = 'api/programacion_pacientes/';

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {}

    private async getAuthHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    private async getBaseBody(): Promise<Record<string, unknown>> {
        const [idUser, idEmpresa] = await Promise.all([
            this.secureStorage.getItem('idUser'),
            this.secureStorage.getItem('idEmpresa')
        ]);
        return { id_usuario: Number(idUser), id_empresa: Number(idEmpresa) };
    }

    async getCitasPacientes(fechaInicio?: string, fechaFin?: string): Promise<Observable<CitaPaciente[]>> {
        const headers = await this.getAuthHeaders();
        const body: Record<string, unknown> = await this.getBaseBody();
        if (fechaInicio) body['fecha_inicio'] = fechaInicio;
        if (fechaFin) body['fecha_fin'] = fechaFin;
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'getCitasPacientes', body, { headers })
            .pipe(map(r => r.body || []));
    }

    async getCitaById(idCita: number): Promise<Observable<CitaPaciente>> {
        const headers = await this.getAuthHeaders();
        const body: Record<string, unknown> = await this.getBaseBody();
        body['id_cita'] = idCita;
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'getCitaById', body, { headers })
            .pipe(map(r => r.body));
    }

    async getPacientesProgramacion(busqueda?: string): Promise<Observable<PacienteBusqueda[]>> {
        const headers = await this.getAuthHeaders();
        const body: Record<string, unknown> = await this.getBaseBody();
        if (busqueda) body['busqueda'] = busqueda;
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'getPacientesProgramacion', body, { headers })
            .pipe(map(r => r.body || []));
    }

    async crearPacienteRapido(data: any): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        const body = { ...data, ...(await this.getBaseBody()) };
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'crearPacienteRapido', body, { headers });
    }

    async crearCita(data: CrearCitaRequest): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        const body = { ...data, ...(await this.getBaseBody()) };
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'crearCita', body, { headers });
    }

    async actualizarCita(data: any): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        const body = { ...data, ...(await this.getBaseBody()) };
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'actualizarCita', body, { headers });
    }

    async cancelarCita(idCita: number): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        const body: Record<string, unknown> = await this.getBaseBody();
        body['id_cita'] = idCita;
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'cancelarCita', body, { headers });
    }

    async marcarCitaCumplida(idCita: number): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        const body: Record<string, unknown> = await this.getBaseBody();
        body['id_cita'] = idCita;
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'marcarCitaCumplida', body, { headers });
    }

    async enviarNotificacionCita(idCita: number, enviarCorreo: boolean): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        const body: Record<string, unknown> = await this.getBaseBody();
        body['id_cita'] = idCita;
        body['enviar_correo'] = enviarCorreo;
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'enviarNotificacionCita', body, { headers });
    }

    async obtenerPlantillaWhatsApp(): Promise<Observable<string>> {
        const headers = await this.getAuthHeaders();
        const body: Record<string, unknown> = await this.getBaseBody();
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'obtenerPlantillaWhatsApp', body, { headers })
            .pipe(map(r => r.body || ''));
    }

    async guardarPlantillaWhatsApp(plantilla: string): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        const body: Record<string, unknown> = await this.getBaseBody();
        body['plantilla'] = plantilla;
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'guardarPlantillaWhatsApp', body, { headers });
    }

    async registrarNotificacionWhatsApp(idCita: number): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();
        const body: Record<string, unknown> = await this.getBaseBody();
        body['id_cita'] = idCita;
        return this.http.post<any>(this.urlApp + this.urlAppAPI + 'registrarNotificacionWhatsApp', body, { headers });
    }
}
