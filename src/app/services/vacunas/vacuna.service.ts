// src/app/services/consultorio.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Vacunas } from '../../interfaces/vacunas';

import { enviroment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class VacunaService {

    private urlApp : string;
    private urlAppAPI : string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/vacunas/'
    }

    // ================================
    // GET - obtener vacunas
    // ================================
    obtenerVacunas(): Observable<Vacunas[]> {
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        let body = { id_usuario: Number(idUser) };

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
    crearVacuna(data: Vacunas): Observable<any> {
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');
        let idEmpresa = localStorage.getItem('idEmpresa');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        let body = {
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
    actualizarVacuna(id: number, data: Partial<Vacunas>): Observable<any> {
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');
        let idEmpresa = localStorage.getItem('idEmpresa');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        let body = {
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
    borrarVacuna(id: number): Observable<any> {
        let token = localStorage.getItem('token');
        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        let body = { id_vacuna: Number(id) };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'eliminar_vacunas',
            body,
            { headers: headersWS }
        );
    }

    // ================================
    // GET - obtener laboratorios
    // ================================
    obtenerLaboratorios(): Observable<any[]> {
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        let body = { id_usuario: Number(idUser) };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getLaboratorios',
            body,
            { headers: headersWS }
            ).pipe(
                map(response => response.body as any[])
            );
    }
}
