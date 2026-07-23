import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({ providedIn: 'root' })
export class ArchivosCobroService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/cuentas_cobro/archivos/';
    }

    private async getHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    async crearTipoArchivoAdjunto(data: any): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        const body = {
            nombre_tipo: data.nombre_tipo,
            descripcion: data.descripcion
        };
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearTipoArchivoAdjunto',
            body,
            { headers }
        );
    }

    async actualizarTipoArchivoAdjunto(id: number, data: any): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        const body = {
            id: id,
            nombre_tipo: data.nombre_tipo,
            descripcion: data.descripcion
        };
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'actualizarTipoArchivoAdjunto',
            body,
            { headers }
        );
    }

    async subirArchivoAdjunto(data: any): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        const body = {
            id_tipo_archivo: data.id_tipo_archivo,
            archivo_base64: data.archivo_base64,
            nombre_original: data.nombre_original,
            mime_type: data.mime_type
        };
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'subirArchivoAdjunto',
            body,
            { headers }
        );
    }

    async getTiposArchivosAdjuntos(): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'GetTiposArchivosAdjuntos',
            {},
            { headers }
        );
    }

    async getArchivosAdjuntos(): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'GetArchivosAdjuntos',
            {},
            { headers }
        );
    }

    async inactivarTipoArchivoAdjunto(id: number): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'inactivarTipoArchivoAdjunto',
            { id: id },
            { headers }
        );
    }

    async descargarArchivo(idArchivo: number): Promise<Observable<any>> {
        const headers = await this.getHeaders();
        return this.http.post(
            this.urlApp + this.urlAppAPI + 'descargarArchivo',
            { id_archivo: idArchivo },
            { headers }
        );
    }
}
