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

    /** Crea un nuevo valor (queda en el histórico) (solo rol 1). */
    async crearValor(valorKg: number, fechaVigencia: string, observacion: string | null): Promise<Observable<any>> {
        const headers = await this.getAuthHeaders();

        const body = {
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
}
