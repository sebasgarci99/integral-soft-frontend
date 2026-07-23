import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { LoginService } from '../login/login.service';
import { Modulo, ModuloPadre } from '../../interfaces/modulo';

@Injectable({ providedIn: 'root' })
export class MenuService {
    private modulosSubject = new BehaviorSubject<Modulo[]>([]);
    modulos$ = this.modulosSubject.asObservable();
    private datosUsuarioSubject = new BehaviorSubject<any>({});
    datosUsuario$ = this.datosUsuarioSubject.asObservable();
    private cargado = false;

    constructor(private loginService: LoginService) {}

    async cargarModulos(): Promise<void> {
        if (this.cargado) return;
        (await this.loginService.obtenerInformacionUsuario()).subscribe({
            next: (data: any) => {
                const userData = data[0];
                this.modulosSubject.next(userData.modulos || []);
                this.datosUsuarioSubject.next(userData);
                this.cargado = true;
            }
        });
    }

    getModulosAgrupados(): Observable<ModuloPadre[]> {
        return this.modulos$.pipe(
            map(modulos => this.construirArbol(modulos))
        );
    }

    getModulosDirectos(): Observable<Modulo[]> {
        return this.modulos$.pipe(
            map(modulos => modulos.filter(m => !m.es_grupo && !m.id_padre))
        );
    }

    limpiar(): void {
        this.modulosSubject.next([]);
        this.datosUsuarioSubject.next({});
        this.cargado = false;
    }

    private construirArbol(modulos: Modulo[]): ModuloPadre[] {
        const padres = modulos.filter(m => m.es_grupo);
        return padres
            .sort((a, b) => a.orden - b.orden)
            .map(padre => ({
                modulo: padre.modulo,
                icono: padre.icono,
                hijos: modulos
                    .filter(h => h.id_padre === padre.id_modulo)
                    .sort((a, b) => a.orden - b.orden)
            }));
    }
}
