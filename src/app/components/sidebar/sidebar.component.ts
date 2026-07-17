import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MenuService } from '../../services/menu/menu.service';
import { ModuloPadre, Modulo } from '../../interfaces/modulo';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterModule, CommonModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {

    logo: string | null | undefined;
    nombreCompleto: string = '';
    idRol: string = '';
    modulosAgrupados: ModuloPadre[] = [];
    modulosDirectos: Modulo[] = [];
    currentRoute: string = '';

    private subs: Subscription[] = [];

    constructor(
        private router: Router,
        private menuService: MenuService
    ) {}

    ngOnInit(): void {
        this.currentRoute = this.router.url;

        this.subs.push(
            this.router.events.pipe(
                filter(event => event instanceof NavigationEnd)
            ).subscribe((event: any) => {
                this.currentRoute = event.urlAfterRedirects || event.url;
            }),
            this.menuService.getModulosAgrupados().subscribe(grupos => {
                this.modulosAgrupados = grupos;
            }),
            this.menuService.getModulosDirectos().subscribe(directos => {
                this.modulosDirectos = directos;
            }),
            this.menuService.datosUsuario$.subscribe(data => {
                if (!data || !data.nombre_completo) return;
                this.nombreCompleto = data.nombre_completo;
                this.idRol = data.id_rol;

                if (data.id_usuario != localStorage.getItem('idUser')) {
                    localStorage.setItem('idUser', data.id_usuario);
                }
                if (data.id_rol != localStorage.getItem('idRol')) {
                    localStorage.setItem('idRol', data.id_rol);
                }
                if (data.id_empresa != localStorage.getItem('idEmpresa')) {
                    localStorage.setItem('idEmpresa', data.id_empresa);
                }

                setTimeout(() => {
                    this.logo = 'data:image/png;base64,' + data.blob_foto_perfil;
                }, 200);
            })
        );
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
    }

    cerrarSesion(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('idUser');
        localStorage.removeItem('idEmpresa');
        localStorage.removeItem('idRol');
        this.menuService.limpiar();
        this.router.navigate(['/login']);
    }

    isGrupoActivo(grupo: ModuloPadre): boolean {
        return grupo.hijos.some(h => h.ruta && this.currentRoute.startsWith(h.ruta));
    }

    isGrupoAbierto(grupo: ModuloPadre): boolean {
        return this.isGrupoActivo(grupo);
    }

    getGrupoId(nombre: string): string {
        return 'grupo-' + nombre.replace(/\s+/g, '-');
    }
}
