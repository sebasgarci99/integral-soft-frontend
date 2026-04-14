import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Cliente, ClientesResponse } from '../../interfaces/cliente';

import { enviroment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class ClienteService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/clientes/'
    }

    obtenerDatosClientes(): Observable<Cliente[]> {
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');
        let idEmpresa = localStorage.getItem('idEmpresa');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`)
        let body = {
            id_usuario: Number(idUser),
            id_empresa: Number(idEmpresa)
        };

        return this.http.post<ClientesResponse>(
            this.urlApp + this.urlAppAPI + 'getClientes',
            body,
            {
                headers: headersWS,
            }
        ).pipe(
            map(response => response.body)
        );
    }

    crearCliente(data: Cliente): Observable<any> {

        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');
        let idEmpresa = localStorage.getItem('idEmpresa');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`)

        let body = {
            nombre_razon_social: data.nombre_razon_social,
            nombre_comercial: data.nombre_comercial,
            tipo_identificacion: data.tipo_identificacion,
            numero_identificacion: data.numero_identificacion,
            telefono: data.telefono,
            pais: data.pais,
            ciudad: data.ciudad,
            direccion: data.direccion,
            correo_electronico: data.correo_electronico,
            nombre_contacto: data.nombre_contacto,
            comentarios_observaciones: data.comentarios_observaciones,
            estado: 'A',
            id_usuario: idUser,
            id_empresa: idEmpresa
        };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearCliente',
            body,
            {
                headers: headersWS,
            }
        );
    }

    actualizarCliente(id: number, data: Partial<Cliente>): Observable<any> {

        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');
        let idEmpresa = localStorage.getItem('idEmpresa');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`)

        let body = {
            id_cliente: data.id_cliente,
            nombre_razon_social: data.nombre_razon_social,
            nombre_comercial: data.nombre_comercial,
            tipo_identificacion: data.tipo_identificacion,
            numero_identificacion: data.numero_identificacion,
            telefono: data.telefono,
            pais: data.pais,
            ciudad: data.ciudad,
            direccion: data.direccion,
            correo_electronico: data.correo_electronico,
            nombre_contacto: data.nombre_contacto,
            comentarios_observaciones: data.comentarios_observaciones,
            estado: data.estado || 'A',
            id_usuario: idUser,
            id_empresa: idEmpresa
        };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'actualizarCliente',
            body,
            {
                headers: headersWS,
            }
        );
    }

    borrarCliente(id: number): Observable<void> {
        let token = localStorage.getItem('token');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`)

        let body = {
            id_cliente: Number(id)
        };

        return this.http.post<void>(
            this.urlApp + this.urlAppAPI + 'eliminarCliente',
            body,
            {
                headers: headersWS,
            }
        );
    }
}
