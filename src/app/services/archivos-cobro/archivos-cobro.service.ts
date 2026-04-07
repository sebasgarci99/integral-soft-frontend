import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class ArchivosCobroService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/cuentas_cobro/archivos/';
    }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    crearTipoArchivoAdjunto(data: any): Observable<any> {
        const body = {
            nombre_tipo: data.nombre_tipo,
            descripcion: data.descripcion
        };
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearTipoArchivoAdjunto',
            body,
            { headers: this.getHeaders() }
        );
    }

    actualizarTipoArchivoAdjunto(id: number, data: any): Observable<any> {
        const body = {
            id: id,
            nombre_tipo: data.nombre_tipo,
            descripcion: data.descripcion
        };
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'actualizarTipoArchivoAdjunto',
            body,
            { headers: this.getHeaders() }
        );
    }

    subirArchivoAdjunto(data: any): Observable<any> {
        const body = {
            id_tipo_archivo: data.id_tipo_archivo,
            archivo_base64: data.archivo_base64,
            nombre_original: data.nombre_original,
            mime_type: data.mime_type
        };
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'subirArchivoAdjunto',
            body,
            { headers: this.getHeaders() }
        );
    }

    getTiposArchivosAdjuntos(): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'GetTiposArchivosAdjuntos',
            {},
            { headers: this.getHeaders() }
        );
    }

    getArchivosAdjuntos(): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'GetArchivosAdjuntos',
            {},
            { headers: this.getHeaders() }
        );
    }

    inactivarTipoArchivoAdjunto(id: number): Observable<any> {
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'inactivarTipoArchivoAdjunto',
            { id: id },
            { headers: this.getHeaders() }
        );
    }

    descargarArchivo(idArchivo: number): Observable<Blob> {
        return this.http.post(
            this.urlApp + this.urlAppAPI + 'descargarArchivo',
            { id_archivo: idArchivo },
            {
                headers: this.getHeaders(),
                responseType: 'blob'
            }
        );
    }
}
