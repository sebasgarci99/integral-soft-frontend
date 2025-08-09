// src/app/services/consultorio.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Consultorio, ConsultoriosResponse } from '../../interfaces/consultorio';

import { enviroment } from '../../../enviroments/enviroment';


@Injectable({ providedIn: 'root' })
export class ConsultorioService {

    private urlApp : string;
    private urlAppAPI : string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/consultorio/'
    }

    obtenerDatosConsultorios(): Observable<Consultorio[]> {
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');
        
        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`)
        let body = {
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

    crearConsultorio(data: Consultorio): Observable<Consultorio> {

        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');
        let idEmpresa = localStorage.getItem('idEmpresa');
        
        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`)

        let body = {
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

        return this.http.post<Consultorio>(
            this.urlApp+this.urlAppAPI+'crear_actualizar_consultorio', 
            body,
            {
                headers : headersWS,
            }
        );
    }

    actualizarConsultorio(id: number, data: Partial<Consultorio>): Observable<Consultorio> {
        
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');
        let idEmpresa = localStorage.getItem('idEmpresa');
        
        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`)

        let body = {
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

        return this.http.post<Consultorio>(
            this.urlApp+this.urlAppAPI+'crear_actualizar_consultorio', 
            body,
            {
                headers : headersWS,
            }
        );
    }

    borrarConsultorio(id: number): Observable<void> {
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');
        
        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`)

        let body = {
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
