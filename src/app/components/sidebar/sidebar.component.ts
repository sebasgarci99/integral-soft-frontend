import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MenuService } from '../../services/menu/menu.service';
import { CommandPaletteService } from '../../services/command-palette/command-palette.service';
import { ModuloPadre, Modulo } from '../../interfaces/modulo';

import {
    trigger,
    transition,
    style,
    animate
} from '@angular/animations';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterModule, CommonModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css',
    animations: [
        trigger('expandCollapse', [
            transition(':enter', [
                style({ opacity: 0, height: '0px', overflow: 'hidden' }),
                animate('240ms ease-out', style({ opacity: 1, height: '*' }))
            ]),
            transition(':leave', [
                style({ opacity: 1, height: '*' }),
                animate('180ms ease-in', style({ opacity: 0, height: '0px', overflow: 'hidden' }))
            ])
        ])
    ]
})
export class SidebarComponent implements OnInit, OnDestroy {

    private readonly GRUPOS_ABIERTOS_KEY = 'sidebar_grupos_abiertos';

    @ViewChild('sidebarRef') sidebarRef!: ElementRef;

    modulosAgrupados: ModuloPadre[] = [];
    modulosDirectos: Modulo[] = [];
    currentRoute: string = '';
    sidebarAbierto: boolean = false;
    gruposAbiertos: Set<string> = new Set();
    menuCargado: boolean = false;

    esEscritorio = window.innerWidth >= 992;
    grupoFlyout: ModuloPadre | null = null;
    flyoutTop = 0;
    flyoutLeft = 280;

    private touchStartX: number = 0;
    private subs: Subscription[] = [];
    private directosCargados: boolean = false;
    private gruposCargados: boolean = false;

    constructor(
        private router: Router,
        private menuService: MenuService,
        private commandPalette: CommandPaletteService
    ) {}

    ngOnInit(): void {
        this.currentRoute = this.router.url;
        this.cargarGruposAbiertos();

        this.subs.push(
            this.router.events.pipe(
                filter(event => event instanceof NavigationEnd)
            ).subscribe((event: any) => {
                this.currentRoute = event.urlAfterRedirects || event.url;
                this.abrirGrupoActivo();
                this.cerrarFlyout();
                this.scrollAlActivo();
            }),
            this.menuService.getModulosAgrupados().subscribe(grupos => {
                this.modulosAgrupados = grupos;
                this.gruposCargados = true;
                this.verificarMenuCargado();
            }),
            this.menuService.getModulosDirectos().subscribe(directos => {
                this.modulosDirectos = directos;
                this.directosCargados = true;
                this.verificarMenuCargado();
            })
        );
    }

    ngOnDestroy(): void {
        this.subs.forEach(s => s.unsubscribe());
    }

    abrirBuscador(): void {
        this.commandPalette.abrir();
    }

    isGrupoActivo(grupo: ModuloPadre): boolean {
        return grupo.hijos.some(h => {
            if (!h.ruta) return false;
            const ruta = h.ruta.startsWith('/') ? h.ruta : `/${h.ruta}`;
            return this.router.isActive(ruta, false);
        });
    }

    isGrupoAbierto(grupo: ModuloPadre): boolean {
        if (this.esEscritorio) return false;
        return this.gruposAbiertos.has(grupo.modulo);
    }

    isGrupoFlyout(grupo: ModuloPadre): boolean {
        return this.grupoFlyout?.modulo === grupo.modulo;
    }

    onGrupoClick(grupo: ModuloPadre, event: MouseEvent): void {
        if (!this.esEscritorio) {
            this.toggleGrupo(grupo);
            return;
        }

        if (this.isGrupoFlyout(grupo)) {
            this.cerrarFlyout();
            return;
        }

        this.abrirFlyout(grupo, event.currentTarget as HTMLElement);
    }

    toggleGrupo(grupo: ModuloPadre): void {
        if (this.gruposAbiertos.has(grupo.modulo)) {
            this.gruposAbiertos.delete(grupo.modulo);
        } else {
            this.gruposAbiertos.clear();
            this.gruposAbiertos.add(grupo.modulo);
            this.scrollGrupoIntoView(grupo);
        }
        this.guardarGruposAbiertos();
    }

    cerrarFlyout(): void {
        this.grupoFlyout = null;
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        this.esEscritorio = window.innerWidth >= 992;
        if (!this.esEscritorio) {
            this.cerrarFlyout();
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.grupoFlyout) return;
        const target = event.target as HTMLElement;
        if (target.closest('.sidebar-flyout') || target.closest('.sidebar-group')) return;
        this.cerrarFlyout();
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        this.cerrarFlyout();
    }

    private abrirFlyout(grupo: ModuloPadre, elemento: HTMLElement): void {
        const rect = elemento.getBoundingClientRect();
        this.grupoFlyout = grupo;
        this.flyoutLeft = 280;
        this.flyoutTop = Math.max(12, Math.min(rect.top, window.innerHeight - 320));

        setTimeout(() => {
            const panel = document.querySelector('.sidebar-flyout') as HTMLElement | null;
            if (!panel) return;
            const altura = panel.offsetHeight;
            const maxTop = window.innerHeight - altura - 12;
            this.flyoutTop = Math.max(12, Math.min(this.flyoutTop, maxTop));
        }, 0);
    }

    private abrirGrupoActivo(): void {
        if (this.esEscritorio) return;
        const activo = this.modulosAgrupados.find(g => this.isGrupoActivo(g));
        if (!activo) { return; }
        if (this.gruposAbiertos.size === 1 && this.gruposAbiertos.has(activo.modulo)) { return; }
        this.gruposAbiertos.clear();
        this.gruposAbiertos.add(activo.modulo);
        this.guardarGruposAbiertos();
    }

    private cargarGruposAbiertos(): void {
        try {
            const guardados = localStorage.getItem(this.GRUPOS_ABIERTOS_KEY);
            if (guardados) {
                const nombres = JSON.parse(guardados) as string[];
                this.gruposAbiertos = new Set(nombres.slice(0, 1));
            }
        } catch (error) {
            this.gruposAbiertos = new Set();
        }
    }

    private guardarGruposAbiertos(): void {
        try {
            localStorage.setItem(this.GRUPOS_ABIERTOS_KEY, JSON.stringify([...this.gruposAbiertos]));
        } catch (error) {}
    }

    private verificarMenuCargado(): void {
        if (this.gruposCargados && this.directosCargados) {
            this.menuCargado = true;
            this.abrirGrupoActivo();
        }
    }

    private scrollAlActivo(): void {
        setTimeout(() => {
            const contenedor = this.sidebarRef?.nativeElement?.querySelector('.sidebar-nav-scroll');
            if (!contenedor) return;
            const activo = contenedor.querySelector('.sidebar-link.active');
            if (activo) {
                activo.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }, 100);
    }

    private scrollGrupoIntoView(grupo: ModuloPadre): void {
        setTimeout(() => {
            const elemento = document.getElementById(this.getGrupoId(grupo.modulo));
            elemento?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 260);
    }

    abrirSidebar(): void {
        this.sidebarAbierto = true;
    }

    cerrarSidebar(): void {
        this.sidebarAbierto = false;
    }

    cerrarSidebarMovil(): void {
        if (window.innerWidth < 992) {
            this.cerrarSidebar();
        }
    }

    @HostListener('touchstart', ['$event'])
    onTouchStart(e: TouchEvent): void {
        this.touchStartX = e.touches[0].clientX;
    }

    @HostListener('touchend', ['$event'])
    onTouchEnd(e: TouchEvent): void {
        if (window.innerWidth >= 992) return;
        const diffX = e.changedTouches[0].clientX - this.touchStartX;
        if (diffX > 80) {
            this.cerrarSidebar();
        }
    }

    getGrupoId(nombre: string): string {
        return 'grupo-' + nombre.replace(/\s+/g, '-');
    }

    trackByModulo(_: number, modulo: Modulo): number {
        return modulo.id_modulo;
    }

    trackByGrupo(_: number, grupo: ModuloPadre): string {
        return grupo.modulo;
    }
}
