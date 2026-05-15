import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CuentaCobro, CuentasCobroResponse } from '../../interfaces/cuenta-cobro';
import { enviroment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class CuentasCobroService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/cuentas_cobro/';
    }

    obtenerCuentasCobro(): Observable<CuentaCobro[]> {
        const token = localStorage.getItem('token');
        const idUser = localStorage.getItem('idUser');
        const idEmpresa = localStorage.getItem('idEmpresa');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = {
            id_usuario: Number(idUser),
            id_empresa: Number(idEmpresa)
        };

        return this.http.post<CuentasCobroResponse>(
            this.urlApp + this.urlAppAPI + 'GetCuentasdeCobro',
            body,
            { headers: headersWS }
        ).pipe(
            map(response => response.body || [])
        );
    }

    crearCuentaCobro(data: any): Observable<any> {
        const token = localStorage.getItem('token');
        const idUser = localStorage.getItem('idUser');
        const idEmpresa = localStorage.getItem('idEmpresa');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            id_cliente: data.id_cliente,
            descripcion_servicio: data.descripcion_servicio,
            valor_cobrar: data.valor_cobrar,
            fecha_emision: data.fecha_emision,
            configurar_periodicidad: data.configurar_periodicidad,
            periodicidad: data.periodicidad,
            dia_del_mes: data.dia_del_mes,
            hora_ejecucion: data.hora_ejecucion,
            id_usuario: idUser,
            id_empresa: idEmpresa,
            aplica_archivos_adjuntos: data.aplica_archivos_adjuntos
        };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearCuentaDeCobro',
            body,
            { headers: headersWS }
        );
    }

    inactivarCuentaCobro(id: number): Observable<any> {
        const token = localStorage.getItem('token');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = {
            id: Number(id)
        };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'inactivarCuentaDeCobro',
            body,
            { headers: headersWS }
        );
    }

    generarDocumento(id: number): Observable<any> {
        const token = localStorage.getItem('token');
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'generarDocumento',
            { id: id },
            { headers: headersWS, responseType: 'text' as 'json' }
        );
    }

    generarPdf(id: number): void {
        return;
    }

    actualizarCuentaCobro(data: any): Observable<any> {
        const token = localStorage.getItem('token');
        const idUser = localStorage.getItem('idUser');
        const idEmpresa = localStorage.getItem('idEmpresa');
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            id_cuenta_cobro: data.id_cuenta_cobro,
            descripcion_servicio: data.descripcion_servicio,
            valor_cobrar: data.valor_cobrar,
            fecha_emision: data.fecha_emision,
            id_usuario: idUser,
            id_empresa: idEmpresa
        };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'actualizarCuentaDeCobro',
            body,
            { headers: headersWS }
        );
    }

    reenviarCuentaCobro(idCuentaCobro: number): Observable<any> {
        const token = localStorage.getItem('token');
        const idUser = localStorage.getItem('idUser');
        const idEmpresa = localStorage.getItem('idEmpresa');
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'reenviarCuentaDeCobro',
            { id_cuenta_cobro: idCuentaCobro, id_usuario: idUser, id_empresa: idEmpresa },
            { headers: headersWS }
        );
    }

    actualizarConfigPeriodicidad(data: any): Observable<any> {
        const token = localStorage.getItem('token');
        const idUser = localStorage.getItem('idUser');
        const idEmpresa = localStorage.getItem('idEmpresa');
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            id_cuenta_cobro: data.id_cuenta_cobro,
            periodicidad: data.periodicidad,
            dia_del_mes: data.dia_del_mes,
            hora_ejecucion: data.hora_ejecucion,
            aplica_archivos_adjuntos: data.aplica_archivos_adjuntos,
            activo: true,
            id_usuario: idUser,
            id_empresa: idEmpresa
        };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'actualizarConfigPeriodicidad',
            body,
            { headers: headersWS }
        );
    }

    obtenerLogTareas(idCuentaCobro: number): Observable<any> {
        const token = localStorage.getItem('token');
        const idUser = localStorage.getItem('idUser');
        const idEmpresa = localStorage.getItem('idEmpresa');
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getLogTareasCuentaCobro',
            { id_cuenta_cobro: idCuentaCobro, id_usuario: idUser, id_empresa: idEmpresa },
            { headers: headersWS }
        ).pipe(
            map(response => {
                if (response && response.body) {
                    return Array.isArray(response.body) ? response.body : [response.body];
                }
                return [];
            })
        );
    }
}
