import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({ providedIn: 'root' })
export class ActividadesService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/actividades/';
    }

    private async getHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    async getActividades(): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getActividades',
            {},
            { headers }
        );
    }

    async crearActividad(data: any): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearActividad',
            data,
            { headers }
        );
    }

    async actualizarActividad(data: any): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'actualizarActividad',
            data,
            { headers }
        );
    }

    async eliminarActividad(id: number): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'eliminarActividad',
            { id_actividad: id },
            { headers }
        );
    }

    async eliminarInstanciaActividad(id_instancia: number): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'eliminarInstanciaActividad',
            { id_instancia },
            { headers }
        );
    }

    async getActividadesCalendario(fecha_inicio: string, fecha_fin: string): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getActividadesCalendario',
            { fecha_inicio, fecha_fin },
            { headers }
        );
    }

    async getActividadesxUsuario(): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getActividadesxUsuario',
            {},
            { headers }
        );
    }

    async iniciarActividad(id_instancia: number, observaciones?: string): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'iniciarActividad',
            { id_instancia, observaciones },
            { headers }
        );
    }

    async finalizarActividad(id_instancia: number, observaciones?: string, evidencia?: any[], tipos_realizados?: number[]): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'finalizarActividad',
            { id_instancia, observaciones, evidencia, tipos_realizados },
            { headers }
        );
    }

    async cambiarFechaInstancia(id_instancia: number, nueva_fecha: string, nueva_hora?: string): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'cambiarFechaInstancia',
            { id_instancia, nueva_fecha, nueva_hora },
            { headers }
        );
    }

    async getCumplimiento(id_actividad?: number, fecha_inicio?: string, fecha_fin?: string, id_instancia?: number): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        const body: any = {};
        if (id_actividad) body.id_actividad = id_actividad;
        if (fecha_inicio) body.fecha_inicio = fecha_inicio;
        if (fecha_fin) body.fecha_fin = fecha_fin;
        if (id_instancia) body.id_instancia = id_instancia;

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getCumplimiento',
            body,
            { headers }
        );
    }

    async getTiposActividad(): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getTiposActividad',
            {},
            { headers }
        );
    }

    async crearTipoActividad(nombre: string, descripcion?: string): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearTipoActividad',
            { nombre, descripcion },
            { headers }
        );
    }

    async getUsuariosEmpresa(): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + 'api/usuario/getUsuarios',
            {},
            { headers }
        );
    }
}
