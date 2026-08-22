import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CalculoEmpleadoResponse, DatosCalculoEmpleado, ResultadoCalculoEmpleado } from '../../interfaces/calculo-empleado';
import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';

@Injectable({ providedIn: 'root' })
export class CalculoEmpleadoService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient, private secureStorage: SecureStorageService) {
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/calculo_empleado/';
    }

    async calcular(datos: DatosCalculoEmpleado): Promise<Observable<ResultadoCalculoEmpleado>> {
        const token = await this.secureStorage.getItem('token');
        const headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`);

        return this.http.post<CalculoEmpleadoResponse>(
            this.urlApp + this.urlAppAPI + 'calcular',
            datos,
            { headers: headersWS }
        ).pipe(
            map(response => response.body)
        );
    }
}
