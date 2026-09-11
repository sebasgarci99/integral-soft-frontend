import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { Menu, MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { MenuService } from '../../services/menu/menu.service';
import { SecureStorageService } from '../../services/secure-storage.service';
import { ConsultorioService } from '../../services/consultorio/consultorio.service';
import { EstadoSync, SyncRecoleccionService } from '../../services/offline/sync-recoleccion.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [CommonModule, RouterModule, ToolbarModule, MenuModule, ButtonModule, DialogModule],
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.css'
})
export class TopbarComponent implements OnInit, OnDestroy {

    @Output() abrirSidebar = new EventEmitter<void>();
    @ViewChild('menu') menu!: Menu;

    logo: string | undefined;
    nombreCompleto: string = '';
    idRol: string = '';
    rolUsuario: string = 'Usuario';
    items: MenuItem[] = [];

    // Panel de notificaciones + sincronización
    panelAbierto = false;
    pendientesCount = 0;
    notificacionesCount = 0;
    sincronizando = false;

    // Diálogo de estado de sincronización
    mostrarDialogoSync = false;
    estadoSync: EstadoSync = { fase: 'inactivo', mensaje: '', enviados: 0, total: 0, error: null };

    private subs: Subscription[] = [];

    constructor(
        private router: Router,
        private menuService: MenuService,
        private secureStorage: SecureStorageService,
        private syncRecoleccion: SyncRecoleccionService,
        private consultorioService: ConsultorioService
    ) {}

    get totalBadge(): number {
        return this.pendientesCount + this.notificacionesCount;
    }

    get syncEnProgreso(): boolean {
        return this.estadoSync.fase === 'internet'
            || this.estadoSync.fase === 'servidor'
            || this.estadoSync.fase === 'enviando';
    }

    get syncProgreso(): number {
        if (!this.estadoSync.total) { return 0; }
        return Math.round((this.estadoSync.enviados / this.estadoSync.total) * 100);
    }

    ngOnInit(): void {
        this.subs.push(
            this.menuService.datosUsuario$.subscribe(data => {
                if (!data || !data.nombre_completo) return;

                this.nombreCompleto = data.nombre_completo;
                this.idRol = data.id_rol;
                this.rolUsuario = this.obtenerNombreRol(data.id_rol);

                this.secureStorage.getItem('idUser').then(idUser => {
                    if (data.id_usuario != idUser) {
                        this.secureStorage.setItem('idUser', data.id_usuario);
                    }
                });
                this.secureStorage.getItem('idRol').then(idRol => {
                    if (data.id_rol != idRol) {
                        this.secureStorage.setItem('idRol', data.id_rol);
                    }
                });
                this.secureStorage.getItem('idEmpresa').then(idEmpresa => {
                    if (data.id_empresa != idEmpresa) {
                        this.secureStorage.setItem('idEmpresa', data.id_empresa);
                    }
                });

                setTimeout(() => {
                    this.logo = 'data:image/png;base64,' + data.blob_foto_perfil;
                }, 200);

                this.construirMenu();
            })
        );

        this.subs.push(
            this.syncRecoleccion.pendientes$.subscribe(total => {
                this.pendientesCount = total;
            })
        );

        this.subs.push(
            this.syncRecoleccion.estadoSync$.subscribe(estado => {
                this.estadoSync = estado;
            })
        );

        this.syncRecoleccion.actualizarContador();

        // Precarga la lista de consultorios para poder registrar recolecciones sin internet.
        this.consultorioService.precachearConsultorios();
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
    }

    onAbrirSidebar(): void {
        this.abrirSidebar.emit();
    }

    togglePanel(event: Event): void {
        event.stopPropagation();
        this.panelAbierto = !this.panelAbierto;

        if (this.panelAbierto) {
            this.syncRecoleccion.actualizarContador();
        }
    }

    cerrarPanel(): void {
        this.panelAbierto = false;
    }

    // Cierra el panel al hacer clic fuera de él
    @HostListener('document:click')
    onDocumentClick(): void {
        if (this.panelAbierto) { this.panelAbierto = false; }
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this.panelAbierto = false;
    }

    async sincronizarTodo(): Promise<void> {
        if (this.sincronizando) { return; }

        this.panelAbierto = false;
        this.mostrarDialogoSync = true;
        this.sincronizando = true;

        try {
            await this.syncRecoleccion.sincronizarPendientes();
            await this.syncRecoleccion.actualizarContador();
        } finally {
            this.sincronizando = false;
        }
    }

    async descargarJson(): Promise<void> {
        await this.syncRecoleccion.descargarPendientesJson();
    }

    async cerrarSesion(): Promise<void> {
        await this.syncRecoleccion.actualizarContador();

        if (this.pendientesCount > 0) {
            const resultado = await Swal.fire({
                icon: 'warning',
                title: '¿Cerrar sesión?',
                html: `Hay <b>${this.pendientesCount}</b> registro(s) pendiente(s) de sincronizar.`,
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: 'Sincronizar y cerrar',
                denyButtonText: 'Cerrar de todas formas',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#3da1b8',
                denyButtonColor: '#dc3545'
            });

            if (resultado.isDismissed) { return; }

            if (resultado.isConfirmed) {
                this.sincronizando = true;
                try {
                    await this.syncRecoleccion.sincronizarPendientes();
                    await this.syncRecoleccion.actualizarContador();
                } finally {
                    this.sincronizando = false;
                }

                if (this.pendientesCount > 0) {
                    const forzar = await Swal.fire({
                        icon: 'error',
                        title: 'Sincronización incompleta',
                        html: `Quedan <b>${this.pendientesCount}</b> registro(s) pendiente(s). ¿Cerrar sesión de todas formas?`,
                        showCancelButton: true,
                        confirmButtonText: 'Cerrar de todas formas',
                        cancelButtonText: 'Cancelar',
                        confirmButtonColor: '#dc3545'
                    });

                    if (!forzar.isConfirmed) { return; }
                }
            }
        }

        this.ejecutarCierreSesion();
    }

    private ejecutarCierreSesion(): void {
        this.secureStorage.removeItem('token');
        this.secureStorage.removeItem('idUser');
        this.secureStorage.removeItem('idEmpresa');
        this.secureStorage.removeItem('idRol');
        this.menuService.limpiar();
        this.router.navigate(['/login']);
    }

    private construirMenu(): void {
        this.items = [
            {
                label: 'Ajustes',
                icon: 'fa fa-cog',
                visible: this.idRol === '1',
                routerLink: '/info-usuario'
            },
            { separator: true, visible: this.idRol === '1' },
            {
                label: 'Cerrar sesión',
                icon: 'fa fa-sign-out',
                styleClass: 'menu-logout',
                command: () => this.cerrarSesion()
            }
        ];
    }

    private obtenerNombreRol(idRol: string): string {
        switch (idRol) {
            case '1': return 'Administrador';
            case '2': return 'Usuario';
            default: return 'Usuario';
        }
    }
}
