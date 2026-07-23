// src/app/services/consultorio.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Vacunas } from '../../interfaces/vacunas';

import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({
  providedIn: 'root'
})
export class VacunaService {

    private urlApp : string;
    private urlAppAPI : string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/vacunas/'
    }

    // ================================
    // GET - obtener vacunas
    // ================================
    async obtenerVacunas(): Promise<Observable<Vacunas[]>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = { id_usuario: Number(idUser) };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getVacunas',
            body,
            { headers: headersWS }
            ).pipe(
                map(response => response.body as Vacunas[])
            );
    }

    // ================================
    // POST/PUT - crear vacuna
    // ================================
    async crearVacuna(data: Vacunas): Promise<Observable<any>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');
        const idEmpresa = await this.secureStorage.getItem('idEmpresa');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            id_vacuna: data.id,
            nombre_vacuna: data.nombre_vacuna,
            presentacion_comercial: data.presentacion_comercial,
            principio_activo: data.principio_activo,
            concentracion: data.concentracion,
            unidad_medida: data.unidad_medida,
            fecha_lote: data.fecha_lote,
            fecha_vencimiento: data.fecha_vencimiento,
            id_laboratorio: data.id_laboratorio,
            registro_sanitario: data.registro_sanitario,
            cantidad_dosis: data.cantidad_dosis,
            aplica_refuerzo: data.aplica_refuerzo,
            estado: 'A',
            id_usuario: idUser,
            id_empresa: idEmpresa
        };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crear_actualizar_vacunas',
            body,
            { headers: headersWS }
        );
    }

    // ================================
    // PUT - actualizar vacuna
    // ================================
    async actualizarVacuna(id: number, data: Partial<Vacunas>): Promise<Observable<any>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');
        const idEmpresa = await this.secureStorage.getItem('idEmpresa');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            id_vacuna: id,
            nombre_vacuna: data.nombre_vacuna,
            presentacion_comercial: data.presentacion_comercial,
            principio_activo: data.principio_activo,
            concentracion: data.concentracion,
            unidad_medida: data.unidad_medida,
            fecha_lote: data.fecha_lote,
            fecha_vencimiento: data.fecha_vencimiento,
            id_laboratorio: data.id_laboratorio,
            registro_sanitario: data.registro_sanitario,
            cantidad_dosis: data.cantidad_dosis,
            aplica_refuerzo: data.aplica_refuerzo,
            estado: data.estado ?? 'A',
            id_usuario: idUser,
            id_empresa: idEmpresa
        };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crear_actualizar_vacunas',
            body,
            { headers: headersWS }
        );
    }

    // ================================
    // DELETE (lógico) - marcar vacuna como inactiva
    // ================================
    async borrarVacuna(id: number): Promise<Observable<any>> {
        const token = await this.secureStorage.getItem('token');
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = { id_vacuna: Number(id) };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'eliminar_vacunas',
            body,
            { headers: headersWS }
        );
    }

    // ================================
    // GET - obtener laboratorios
    // ================================
    async obtenerLaboratorios(): Promise<Observable<any[]>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = { id_usuario: Number(idUser) };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getLaboratorios',
            body,
            { headers: headersWS }
            ).pipe(
                map(response => response.body as any[])
            );
    }
}
