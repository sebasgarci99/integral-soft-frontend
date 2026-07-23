import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { enviroment } from '../../../enviroments/enviroment';
import { Vacunas } from '../../interfaces/vacunas';
import { map, Observable } from 'rxjs';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({
    providedIn: 'root'
})
export class RegVacunacionService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/reg_vacunacion/'
    }

    // ================================
    // GET - obtener vacunas
    // ================================
    async obtenerVacunasPaciente(id_paciente: number): Promise<Observable<Vacunas[]>> {
        const token = await this.secureStorage.getItem('token');

        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body = { id_paciente };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getRegVacunacionxPaciente',
            body,
            { headers: headersWS }
        ).pipe(
            map((response: { body: Vacunas[]; }) => response.body as Vacunas[])
        );
    }

    // ================================
    // POST - crear o actualizar registro de vacunación
    // ================================
    async crearActualizarRegVacunacion(data: any): Promise<Observable<any>> {
        const token = await this.secureStorage.getItem('token');
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'crearActualizarRegVacunacion',
            data,
            { headers: headersWS }
        ).pipe(
            map((response: any) => response.body)
        );
    }

    async inactivarRegVacunacion(id_vacunacion: number): Promise<Observable<any>> {
        const token = await this.secureStorage.getItem('token');
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'inactivarRegVacunacion',
            { id_vacunacion },
            { headers: headersWS }
        ).pipe(
            map((response: any) => response.body)
        );
    }

}
