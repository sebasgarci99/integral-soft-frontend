import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { enviroment } from '../../../enviroments/enviroment';
import { Vacunas } from '../../interfaces/vacunas';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RegVacunacionService {

    private urlApp : string;
    private urlAppAPI : string;

    constructor(private http: HttpClient) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/reg_vacunacion/'
    }

    // ================================
    // GET - obtener vacunas
    // ================================
    obtenerVacunasPaciente(id_paciente:number): Observable<Vacunas[]> {
        let token = localStorage.getItem('token');
        let idUser = localStorage.getItem('idUser');

        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);
        let body = { id_paciente };

        return this.http.post<any>(
            this.urlApp + this.urlAppAPI + 'getRegVacunacionxPaciente',
            body,
            { headers: headersWS }
            ).pipe(
                map((response: { body: Vacunas[]; }) => response.body as Vacunas[])
            );
    }

}
