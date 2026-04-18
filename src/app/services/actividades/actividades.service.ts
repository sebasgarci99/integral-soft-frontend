import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class ActividadesService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/actividades/';
    }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    getActividades(): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getActividades',
            {},
            { headers: this.getHeaders() }
        );
    }

    crearActividad(data: any): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearActividad',
            data,
            { headers: this.getHeaders() }
        );
    }

    actualizarActividad(data: any): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'actualizarActividad',
            data,
            { headers: this.getHeaders() }
        );
    }

    eliminarActividad(id: number): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'eliminarActividad',
            { id_actividad: id },
            { headers: this.getHeaders() }
        );
    }

    async getActividadesCalendario(fecha_inicio: string, fecha_fin: string): Promise<Observable<any>> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getActividadesCalendario',
            { fecha_inicio, fecha_fin },
            { headers: this.getHeaders() }
        );
    }

    getActividadesxUsuario(): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getActividadesxUsuario',
            {},
            { headers: this.getHeaders() }
        );
    }

    iniciarActividad(id_instancia: number, observaciones?: string): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'iniciarActividad',
            { id_instancia, observaciones },
            { headers: this.getHeaders() }
        );
    }

    finalizarActividad(id_instancia: number, observaciones?: string, evidencia?: any[], tipos_realizados?: number[]): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'finalizarActividad',
            { id_instancia, observaciones, evidencia, tipos_realizados },
            { headers: this.getHeaders() }
        );
    }

    cambiarFechaInstancia(id_instancia: number, nueva_fecha: string, nueva_hora?: string): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'cambiarFechaInstancia',
            { id_instancia, nueva_fecha, nueva_hora },
            { headers: this.getHeaders() }
        );
    }

    getCumplimiento(id_actividad?: number, fecha_inicio?: string, fecha_fin?: string): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getCumplimiento',
            { id_actividad, fecha_inicio, fecha_fin },
            { headers: this.getHeaders() }
        );
    }

    getTiposActividad(): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getTiposActividad',
            {},
            { headers: this.getHeaders() }
        );
    }

    crearTipoActividad(nombre: string, descripcion?: string): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearTipoActividad',
            { nombre, descripcion },
            { headers: this.getHeaders() }
        );
    }

    getUsuariosEmpresa(): Observable<any> {
        return this.http.post<any>(
            this.urlApp + 'api/usuario/getUsuarios',
            {},
            { headers: this.getHeaders() }
        );
    }
}
