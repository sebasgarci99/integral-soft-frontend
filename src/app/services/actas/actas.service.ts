import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { Acta, ResponsableSST, InstanciaParaActa } from '../../interfaces/acta';

interface ApiResponse<T> {
    msg: string;
    state: 'OK' | 'NO_OK';
    body: T;
}

@Injectable({ providedIn: 'root' })
export class ActasService {
    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/actas/';
    }

    private async getHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    private async getBody(extra: any = {}): Promise<any> {
        const idUser = await this.secureStorage.getItem('idUser');
        const idEmpresa = await this.secureStorage.getItem('idEmpresa');
        return {
            id_usuario: Number(idUser),
            id_empresa: Number(idEmpresa),
            ...extra
        };
    }

    async getCatalogos(): Promise<Observable<{ indicadores: any[]; categoriasPendientes: any[]; categoriasPriorizacion: any[] }>> {
        const headers = await this.getHeaders();
        const body = await this.getBody();
        return this.http.post<ApiResponse<any>>(this.urlApp + this.urlAppAPI + 'catalogos', body, { headers })
            .pipe(map(r => r.body));
    }

    async getResponsables(): Promise<Observable<ResponsableSST[]>> {
        const headers = await this.getHeaders();
        const body = await this.getBody();
        return this.http.post<ApiResponse<ResponsableSST[]>>(this.urlApp + this.urlAppAPI + 'responsables', body, { headers })
            .pipe(map(r => r.body || []));
    }

    async crearResponsable(data: ResponsableSST): Promise<Observable<ApiResponse<ResponsableSST>>> {
        const headers = await this.getHeaders();
        const body = await this.getBody(data);
        return this.http.post<ApiResponse<ResponsableSST>>(this.urlApp + this.urlAppAPI + 'responsables/crear', body, { headers });
    }

    async actualizarResponsable(data: ResponsableSST): Promise<Observable<ApiResponse<ResponsableSST>>> {
        const headers = await this.getHeaders();
        const body = await this.getBody(data);
        return this.http.post<ApiResponse<ResponsableSST>>(this.urlApp + this.urlAppAPI + 'responsables/actualizar', body, { headers });
    }

    async inactivarResponsable(id_responsable: number): Promise<Observable<ApiResponse<ResponsableSST>>> {
        const headers = await this.getHeaders();
        const body = await this.getBody({ id_responsable });
        return this.http.post<ApiResponse<ResponsableSST>>(this.urlApp + this.urlAppAPI + 'responsables/inactivar', body, { headers });
    }

    async getInstancias(fecha_inicio: string, fecha_fin: string): Promise<Observable<InstanciaParaActa[]>> {
        const headers = await this.getHeaders();
        const body = await this.getBody({ fecha_inicio, fecha_fin });
        return this.http.post<ApiResponse<InstanciaParaActa[]>>(this.urlApp + this.urlAppAPI + 'instancias', body, { headers })
            .pipe(map(r => r.body || []));
    }

    async crearActa(acta: Acta): Promise<Observable<ApiResponse<{ id_acta: number }>>> {
        const headers = await this.getHeaders();
        const body = await this.getBody(acta);
        return this.http.post<ApiResponse<{ id_acta: number }>>(this.urlApp + this.urlAppAPI + 'crear', body, { headers });
    }

    async actualizarActa(acta: Acta): Promise<Observable<ApiResponse<{ id_acta: number }>>> {
        const headers = await this.getHeaders();
        const body = await this.getBody(acta);
        return this.http.post<ApiResponse<{ id_acta: number }>>(this.urlApp + this.urlAppAPI + 'actualizar', body, { headers });
    }

    async getActaById(id_acta: number): Promise<Observable<Acta>> {
        const headers = await this.getHeaders();
        const body = await this.getBody({ id: id_acta });
        return this.http.post<ApiResponse<Acta>>(this.urlApp + this.urlAppAPI + 'obtener', body, { headers })
            .pipe(map(r => r.body));
    }

    async getActasPorCliente(id_cliente: number): Promise<Observable<Acta[]>> {
        const headers = await this.getHeaders();
        const body = await this.getBody({ id_cliente });
        return this.http.post<ApiResponse<Acta[]>>(this.urlApp + this.urlAppAPI + 'por-cliente', body, { headers })
            .pipe(map(r => r.body || []));
    }

    async getUltimaActaCliente(id_cliente: number): Promise<Observable<Acta>> {
        const headers = await this.getHeaders();
        const body = await this.getBody({ id_cliente });
        return this.http.post<ApiResponse<Acta>>(this.urlApp + this.urlAppAPI + 'ultima-por-cliente', body, { headers })
            .pipe(map(r => r.body));
    }

    async cerrarActa(id_acta: number): Promise<Observable<ApiResponse<any>>> {
        const headers = await this.getHeaders();
        const body = await this.getBody({ id_acta });
        return this.http.post<ApiResponse<any>>(this.urlApp + this.urlAppAPI + 'cerrar', body, { headers });
    }

    async descargarDocx(id_acta: number): Promise<Observable<Blob>> {
        const headers = await this.getHeaders();
        const body = await this.getBody({ id_acta });
        return this.http.post(this.urlApp + this.urlAppAPI + 'descargar-docx', body, { headers, responseType: 'blob' });
    }

    async descargarPdf(id_acta: number): Promise<Observable<Blob>> {
        const headers = await this.getHeaders();
        const body = await this.getBody({ id_acta });
        return this.http.post(this.urlApp + this.urlAppAPI + 'descargar-pdf', body, { headers, responseType: 'blob' });
    }

    async enviarActa(id_acta: number, correo_destino?: string): Promise<Observable<ApiResponse<any>>> {
        const headers = await this.getHeaders();
        const body = await this.getBody({ id_acta, correo_destino });
        return this.http.post<ApiResponse<any>>(this.urlApp + this.urlAppAPI + 'enviar', body, { headers });
    }

    async getHistorial(id_acta: number): Promise<Observable<any[]>> {
        const headers = await this.getHeaders();
        const body = await this.getBody({ id_acta });
        return this.http.post<ApiResponse<any[]>>(this.urlApp + this.urlAppAPI + 'historial', body, { headers })
            .pipe(map(r => r.body || []));
    }
}
