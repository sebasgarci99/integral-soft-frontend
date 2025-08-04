import { Injectable } from '@angular/core';
import { LoginInterface } from '../../interfaces/loginInterface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, tap, map } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

    private urlApp : string;
    private urlAppAPI : string;

    currentUserLogin : BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    currentUserData : BehaviorSubject<any> = new BehaviorSubject<any>({});

    constructor(
        private http: HttpClient
    ) { 
        this.urlApp = enviroment.endpoint;
        this.urlAppAPI = 'api/usuario/'
    }

    // Metodo de inicio de sesión
    // Param: Credenciales como tipo de dato LoginInterface (interfaz)
    // Return: Observable
    login1(
        credenciales:LoginInterface
    ): Observable<any> {
        console.log(credenciales);
        return this.http.get('data.json').pipe(
        tap( 
            (dataUsuario ) => {
            this.currentUserData.next(dataUsuario);
            this.currentUserLogin.next(true);
            }
        )
        );
    }

    login(
        credenciales:LoginInterface
    ): Observable<any> {
        return this.http.post<any>(this.urlApp+this.urlAppAPI+'login', credenciales)
    }

    // Retornamos los datos del usuario 
    // empaquetados en el BehaviorSubject y usado como observable
    get userData():Observable<any> {
        return this.currentUserData.asObservable();
    }

    obtenerInformacionUsuario(): Observable<any[]> {
        let token = localStorage.getItem('token');
        // let idUser = localStorage.getItem('idUser');
        
        let headersWS = new HttpHeaders().set('authorization', `Bearer ${token}`)
        let body = {
            // id_usuario : Number(idUser)
        };

        return this.http.post<any>(
            this.urlApp+this.urlAppAPI+'getInfoUser',
            body,
            {
                headers : headersWS,
            }
        ).pipe(
            map( response => response.body )
        ); 
  }
}
