// src/app/services/consultorio.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Consultorio, ConsultoriosResponse } from '../../interfaces/consultorio';

import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';


@Injectable({ providedIn: 'root' })
export class ConsultorioService {

    private urlApp : string;
    private urlAppAPI : string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/consultorio/'
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
            id_empresa: idEmpresa  
        };

        return this.http.post<any>(
            this.urlApp+this.urlAppAPI+'crear_actualizar_consultorio', 
            body,
            {
                headers : headersWS,
            }
        );
    }

    async actualizarConsultorio(id: number, data: Partial<Consultorio>): Promise<Observable<any>> {
        
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
            id_empresa: idEmpresa  
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
