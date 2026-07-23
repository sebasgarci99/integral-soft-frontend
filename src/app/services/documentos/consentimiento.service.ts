import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { enviroment } from '../../../enviroments/enviroment';
import { map, Observable } from 'rxjs';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({
  providedIn: 'root'
})
export class ConsentimientoService {

    private urlApp : string;
    private urlAppAPI : string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/reg_vacunacion/'
    }

    // ================================
    // GET - obtener consentimientos x cliente
    // ================================
    async obtenerConsentimientosPaciente(id_paciente:number): Promise<Observable<any[]>> {
        const token = await this.secureStorage.getItem('token');
        const idUser = await this.secureStorage.getItem('idUser');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = { id_paciente };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getRegConsentimientosxPaciente',
            body,
            { headers: headersWS }
            ).pipe(
                map((response: { body: any[]; }) => response.body as any[])
            );
    }

    async obtenerHtmlConsentimiento(id_vacunacion: number): Promise<Observable<string>> {
        const token = await this.secureStorage.getItem('token');
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = { id_vacunacion };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getHtmlConsentimiento',
            body,
            { headers: headersWS }
        ).pipe(
            map((response: { body: { html: string } }) => response.body.html)
        );
    }
}
