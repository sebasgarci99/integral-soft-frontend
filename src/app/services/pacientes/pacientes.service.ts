import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({
    providedIn: 'root'
})
export class PacientesService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/pacientes/';
    }

    // ===========================================
    // GET - obtener todos los pacientes
    // ===========================================
    async obtenerPacientes(): Promise<Observable<any[]>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = { id_usuario: Number(idUser) };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getPacientes',
            body,
            { headers: headersWS }
        ).pipe(
            map(response => response.body as any[])
        );
    }

    // ===========================================
    // GET - obtener todos los pacientes del modulo de vacunacion. se añade la ultima fecha de registro de vac.
    // ===========================================
    async obtenerPacientesVacunacion(): Promise<Observable<any[]>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = { id_usuario: Number(idUser) };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getPacientesVacunacion',
            body,
            { headers: headersWS }
        ).pipe(
            map(response => response.body as any[])
        );
    }

    // ===========================================
    // POST - crear paciente
    // ===========================================
    async crearPaciente(data: any): Promise<Observable<any>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');
        const idEmpresa = await this.secureStorage.getItem('idEmpresa');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            // 1️⃣ Datos personales
            nombres: data.nombres,
            apellidos: data.apellidos,
            tipo_documento: data.tipo_documento,
            numero_documento: data.numero_documento,
            fecha_nacimiento: data.fecha_nacimiento,
            sexo: data.sexo,
            direccion_residencia: data.direccion_residencia,
            municipio_residencia: data.municipio_residencia,
            telefono_contacto: data.telefono_contacto,
            correo_electronico: data.correo_electronico,

            // 2️⃣ Antecedentes médicos
            enfermedades_actuales: data.enfermedades_actuales,
            uso_medicamentos: data.uso_medicamentos,
            esta_embarazada: data.esta_embarazada,
            esta_lactando: data.esta_lactando,
            reacciones_previas_vacunas: data.reacciones_previas_vacunas,
            alergias_graves: data.alergias_graves,
            tiene_enfermedad_actual: data.tiene_enfermedad_actual,
            es_alergico: data.es_alergico,
            tiene_fiebre_actual: data.tiene_fiebre_actual,
            padece_convulsiones: data.padece_convulsiones,
            reaccion_vacuna: data.reaccion_vacuna,
            tenido_vacuna_ultsemanas: data.tenido_vacuna_ultsemanas,

            // 3️⃣ Datos administrativos
            eps: data.eps,
            tipo_poblacion: data.tipo_poblacion,
            nombre_acompanante: data.nombre_acompanante,

            id_usuario: idUser,
            id_empresa: idEmpresa
        };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearPaciente',
            body,
            { headers: headersWS }
        );
    }

    // ===========================================
    // POST - actualizar paciente
    // ===========================================
    async actualizarPaciente(data: any): Promise<Observable<any>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');
        const idEmpresa = await this.secureStorage.getItem('idEmpresa');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            // 1️⃣ Datos personales
            id_paciente: data.id_paciente, // obligatorio
            // Los campos pueden venir parciales o completos
            nombres: data.nombres,
            apellidos: data.apellidos,
            tipo_documento: data.tipo_documento,
            numero_documento: data.numero_documento,
            fecha_nacimiento: data.fecha_nacimiento,
            sexo: data.sexo,
            direccion_residencia: data.direccion_residencia,
            municipio_residencia: data.municipio_residencia,
            telefono_contacto: data.telefono_contacto,
            correo_electronico: data.correo_electronico,
            estado: data.estado,

            // 2️⃣ Antecedentes médicos
            enfermedades_actuales: data.enfermedades_actuales,
            uso_medicamentos: data.uso_medicamentos,
            esta_embarazada: data.esta_embarazada,
            esta_lactando: data.esta_lactando,
            reacciones_previas_vacunas: data.reacciones_previas_vacunas,
            alergias_graves: data.alergias_graves,
            tiene_enfermedad_actual: data.tiene_enfermedad_actual,
            es_alergico: data.es_alergico,
            tiene_fiebre_actual: data.tiene_fiebre_actual,
            padece_convulsiones: data.padece_convulsiones,
            reaccion_vacuna: data.reaccion_vacuna,
            tenido_vacuna_ultsemanas: data.tenido_vacuna_ultsemanas,

            // 3️⃣ Datos administrativos
            eps: data.eps,
            tipo_poblacion: data.tipo_poblacion,
            nombre_acompanante: data.nombre_acompanante,

            id_usuario: idUser,
            id_empresa: idEmpresa
        };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'actualizarPaciente',
            body,
            { headers: headersWS }
        );
    }

    // ===========================================
    // DELETE (lógico) - eliminar paciente
    // ===========================================
    async borrarPaciente(id_paciente: number): Promise<Observable<any>> {
        const token = await this.secureStorage.getItem('token');
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = { id_paciente: Number(id_paciente) };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'eliminarPaciente',
            body,
            { headers: headersWS }
        );
    }
}
