import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import {
    SgsstRegistro,
    SgsstRegistroPayload,
    SgsstResponsable
} from '../../interfaces/sgsst-estandar-registro';

interface ApiResponse<T> {
    msg: string;
    state: 'OK' | 'NO_OK';
    body: T;
}

@Injectable({ providedIn: 'root' })
export class SgSstEstandaresService {

    private urlApp: string;
    private urlAppAPI = 'api/sg-sst/estandares/';

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
    }

    private async getHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    private async getBody(): Promise<{ id_usuario: number; id_empresa: number }> {
        const idUser = await this.secureStorage.getItem('idUser');
        const idEmpresa = await this.secureStorage.getItem('idEmpresa');
        return { id_usuario: Number(idUser), id_empresa: Number(idEmpresa) };
    }

    private async post<T>(endpoint: string, extraBody: Record<string, unknown> = {}): Promise<Observable<T>> {
        const headers = await this.getHeaders();
        const base = await this.getBody();
        return this.http.post<T>(
            this.urlApp + this.urlAppAPI + endpoint,
            { ...base, ...extraBody },
            { headers }
        );
    }

    private async postBlob(endpoint: string, extraBody: Record<string, unknown> = {}): Promise<Observable<Blob>> {
        const headers = await this.getHeaders();
        const base = await this.getBody();
        return this.http.post(
            this.urlApp + this.urlAppAPI + endpoint,
            { ...base, ...extraBody },
            { headers, responseType: 'blob' }
        );
    }

    async getResponsables(): Promise<Observable<SgsstResponsable[]>> {
        const observables = await this.post<ApiResponse<SgsstResponsable[]>>('responsables');
        return observables.pipe(map(respuesta => respuesta.body || []));
    }

    async getRegistros(idCliente: number): Promise<Observable<SgsstRegistro[]>> {
        const observables = await this.post<ApiResponse<SgsstRegistro[]>>('getRegistros', { id_cliente: idCliente });
        return observables.pipe(map(respuesta => respuesta.body || []));
    }

    async getRegistro(idRegistro: number): Promise<Observable<SgsstRegistro>> {
        const observables = await this.post<ApiResponse<SgsstRegistro>>('getRegistro', { id_registro: idRegistro });
        return observables.pipe(map(respuesta => respuesta.body));
    }

    async crearRegistro(payload: SgsstRegistroPayload): Promise<Observable<ApiResponse<{ id_registro: number }>>> {
        return this.post<ApiResponse<{ id_registro: number }>>('crearRegistro', payload as unknown as Record<string, unknown>);
    }

    async actualizarRegistro(payload: SgsstRegistroPayload): Promise<Observable<ApiResponse<{ id_registro: number }>>> {
        return this.post<ApiResponse<{ id_registro: number }>>('actualizarRegistro', payload as unknown as Record<string, unknown>);
    }

    async subirEvidenciaExtintor(payload: Record<string, unknown>): Promise<Observable<ApiResponse<{ id_evidencia: number }>>> {
        return this.post<ApiResponse<{ id_evidencia: number }>>('subirEvidenciaExtintor', payload);
    }

    async eliminarEvidenciaExtintor(idExtintor: number): Promise<Observable<ApiResponse<null>>> {
        return this.post<ApiResponse<null>>('eliminarEvidenciaExtintor', { id_extintor: idExtintor });
    }

    async cerrarRegistro(idRegistro: number): Promise<Observable<ApiResponse<{ id_registro: number }>>> {
        return this.post<ApiResponse<{ id_registro: number }>>('cerrarRegistro', { id_registro: idRegistro });
    }

    async eliminarRegistro(idRegistro: number): Promise<Observable<ApiResponse<null>>> {
        return this.post<ApiResponse<null>>('eliminarRegistro', { id_registro: idRegistro });
    }

    async generarPdf(idRegistro: number): Promise<Observable<Blob>> {
        return this.postBlob('generarPdf', { id_registro: idRegistro });
    }
}
