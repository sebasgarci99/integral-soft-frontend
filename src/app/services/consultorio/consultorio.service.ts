// src/app/services/consultorio.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable, timeout } from 'rxjs';
import { Consultorio, ConsultoriosResponse } from '../../interfaces/consultorio';

import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { OfflineDbService } from '../offline/offline-db.service';

const CONSULTORIOS_CACHE_KEY = 'consultorios_raw';
const TIMEOUT_CONSULTORIOS_MS = 6000;


@Injectable({ providedIn: 'root' })
export class ConsultorioService {

    private urlApp : string;
    private urlAppAPI : string;

    constructor(
        private http: HttpClient,
        private secureStorage: SecureStorageService,
        private offlineDb: OfflineDbService
    ) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/consultorio/'
    }

    /**
     * Obtiene los consultorios desde el servidor y los deja en caché local.
     * Si no hay red, devuelve la última copia cacheada (para operar offline).
     */
    async obtenerConsultoriosConCache(): Promise<Consultorio[]> {
        const cache = await this.offlineDb.obtenerCache<Consultorio[]>(CONSULTORIOS_CACHE_KEY);

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return cache || [];
        }

        try {
            const obs = await this.obtenerDatosConsultorios();
            const data = await firstValueFrom(obs.pipe(timeout(TIMEOUT_CONSULTORIOS_MS)));

            if (Array.isArray(data)) {
                await this.offlineDb.guardarCache(CONSULTORIOS_CACHE_KEY, data);
                return data;
            }

            return cache || [];
        } catch {
            return cache || [];
        }
    }

    /** Precarga los consultorios en la caché local (útil justo después del login). */
    async precachearConsultorios(): Promise<void> {
        await this.obtenerConsultoriosConCache();
    }

    async obtenerDatosConsultorios(): Promise<Observable<Consultorio[]>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');
        
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = {
            id_usuario : Number(idUser)
        };

        return this.http.post<ConsultoriosResponse>(
            this.urlApp+this.urlAppAPI+'getConsultorios',
            body,
            {
                headers : headersWS,
            }
        ).pipe(
            map( response => response.body )
        ); 
    }

    async crearConsultorio(data: Consultorio): Promise<Observable<any>> {

        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');
        const idEmpresa = await this.secureStorage.getItem('idEmpresa');
        
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            id_consultorio: data.id,
            codigo : data.codigo,
            descripcion : data.descripcion,
            nombre_representante : data.nombre_representante,
            info_recoleccion : data.info_recoleccion,
            piso_ubicacion : data.piso_ubicacion,
            // aforo : data.aforo,
            aforo : null,
            correo : data.correo,
            estado : 'A',
            id_usuario: idUser,
            id_empresa: idEmpresa,
            tipo: data.tipo ?? 'Consultorio'
        };

        return this.http.post<any>(
            this.urlApp+this.urlAppAPI+'crear_actualizar_consultorio', 
            body,
            {
                headers : headersWS,
            }
        );
    }

    async validarEmailCambio(idConsultorio: number | null | undefined, nuevoCorreo: string): Promise<Observable<any>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');
        const idEmpresa = await this.secureStorage.getItem('idEmpresa');
        
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            id_consultorio: idConsultorio ?? null,
            nuevo_correo: nuevoCorreo,
            id_usuario: Number(idUser),
            id_empresa: Number(idEmpresa)
        };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'validar_email',
            body,
            {
                headers: headersWS,
            }
        );
    }

    async actualizarConsultorio(id: number, data: Partial<Consultorio>, autorizarCambioEmail: boolean = false): Promise<Observable<any>> {
        
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');
        const idEmpresa = await this.secureStorage.getItem('idEmpresa');
        
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            id_consultorio: data.id,
            codigo : data.codigo,
            descripcion : data.descripcion,
            nombre_representante : data.nombre_representante,
            info_recoleccion : data.info_recoleccion,
            piso_ubicacion : data.piso_ubicacion,
            // aforo : data.aforo,
            aforo : null,
            correo : data.correo,
            estado : 'A',
            id_usuario: idUser,
            id_empresa: idEmpresa,
            autorizar_cambio_email: autorizarCambioEmail,
            tipo: data.tipo ?? 'Consultorio'
        };

        return this.http.post<any>(
            this.urlApp+this.urlAppAPI+'crear_actualizar_consultorio', 
            body,
            {
                headers : headersWS,
            }
        );
    }

    async borrarConsultorio(id: number): Promise<Observable<void>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');
        
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            id_consultorio : Number(id)
        };

        return this.http.post<void>(
            this.urlApp+this.urlAppAPI+'eliminar_consultorio',
            body,
            {
                headers : headersWS,
            }
        ); 
    }
}
