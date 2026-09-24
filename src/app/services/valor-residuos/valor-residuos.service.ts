import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { enviroment } from '../../../enviroments/enviroment';
import { ValorResiduo } from '../../interfaces/valor-residuo';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({ providedIn: 'root' })
export class ValorResiduosService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/valor_residuos/';
    }

    private async getAuthHeaders(): Promise<HttpHeaders> {
        const token = await this.secureStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    /** Histórico de valores de la empresa (solo rol 1). */
    async obtenerValores(): Promise<Observable<ValorResiduo[]>> {
        const headers = await this.getAuthHeaders();

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getValoresResiduos`,
            {},
            { headers }
        ).pipe(
            map(resp => resp.body || [])
        );
    }

    /** Valor vigente actual (solo rol 1). */
    async obtenerValorVigente(): Promise<Observable<ValorResiduo | null>> {
        const headers = await this.getAuthHeaders();

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getValorResiduoVigente`,
            {},
            { headers }
        ).pipe(
            map(resp => resp.body || null)
        );
    }

    /** Valores vigentes por objetivo (grupo/corriente) (solo rol 1). */
    async obtenerValoresVigentes(): Promise<Observable<ValorResiduo[]>> {
        const headers = await this.getAuthHeaders();

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getValoresVigentes`,
            {},
            { headers }
        ).pipe(
            map(resp => resp.body || [])
        );
    }

    /** Crea un nuevo valor para un grupo o corriente (queda en el histórico) (solo rol 1). */
    async crearValor(
        tipoObjetivo: 'grupo' | 'corriente',
        claveObjetivo: string,
        valorKg: number,
        fechaVigencia: string,
        observacion: string | null
    ): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();

        const body = {
            tipo_objetivo: tipoObjetivo,
            clave_objetivo: claveObjetivo,
            valor_kg: valorKg,
            fecha_vigencia: fechaVigencia,
            observacion: observacion
        };

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}crearValorResiduo`,
            body,
            { headers }
        );
    }

    /** Actualiza un valor existente (solo rol 1). */
    async actualizarValor(
        idValor: number,
        valorKg: number,
        fechaVigencia: string,
        observacion: string | null
    ): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();

        const body = {
            id_valor: idValor,
            valor_kg: valorKg,
            fecha_vigencia: fechaVigencia,
            observacion: observacion
        };

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}actualizarValorResiduo`,
            body,
            { headers }
        );
    }

    /** Inactiva (elimina lógicamente) un valor (solo rol 1). */
    async inactivarValor(idValor: number): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}inactivarValorResiduo`,
            { id_valor: idValor },
            { headers }
        );
    }
}
