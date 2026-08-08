import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { ApiResponse, PropiedadHorizontal, CategoriaPqrs } from '../../interfaces/pqrs';

@Injectable({ providedIn: 'root' })
export class PqrsPropiedadesService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/pqrs/';
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

    async getPropiedadesHorizontales(): Promise<Observable<ApiResponse<PropiedadHorizontal[]>>> {
        return this.post<ApiResponse<PropiedadHorizontal[]>>('propiedades/getPropiedadesHorizontales');
    }

    async crearPropiedadHorizontal(data: Partial<PropiedadHorizontal>): Promise<Observable<ApiResponse<PropiedadHorizontal>>> {
        return this.post<ApiResponse<PropiedadHorizontal>>('propiedades/crearPropiedadHorizontal', data);
    }

    async actualizarPropiedadHorizontal(data: Partial<PropiedadHorizontal>): Promise<Observable<ApiResponse<PropiedadHorizontal>>> {
        return this.post<ApiResponse<PropiedadHorizontal>>('propiedades/actualizarPropiedadHorizontal', data);
    }

    async inactivarPropiedadHorizontal(id_propiedad_horizontal: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('propiedades/inactivarPropiedadHorizontal', { id_propiedad_horizontal });
    }

    async renovarCodigoAcceso(id_propiedad_horizontal: number): Promise<Observable<ApiResponse<{ codigo_acceso: string }>>> {
        return this.post<ApiResponse<{ codigo_acceso: string }>>('propiedades/renovarCodigoAcceso', { id_propiedad_horizontal });
    }

    async getCategoriasPorPropiedad(id_propiedad_horizontal: number): Promise<Observable<ApiResponse<CategoriaPqrs[]>>> {
        return this.post<ApiResponse<CategoriaPqrs[]>>('categorias/getCategoriasPorPropiedad', { id_propiedad_horizontal });
    }

    async crearCategoria(data: Partial<CategoriaPqrs>): Promise<Observable<ApiResponse<CategoriaPqrs>>> {
        return this.post<ApiResponse<CategoriaPqrs>>('categorias/crearCategoria', data);
    }

    async actualizarCategoria(data: Partial<CategoriaPqrs>): Promise<Observable<ApiResponse<CategoriaPqrs>>> {
        return this.post<ApiResponse<CategoriaPqrs>>('categorias/actualizarCategoria', data);
    }

    async inactivarCategoria(id_categoria_pqrs: number): Promise<Observable<ApiResponse<string>>> {
        return this.post<ApiResponse<string>>('categorias/inactivarCategoria', { id_categoria_pqrs });
    }
}
