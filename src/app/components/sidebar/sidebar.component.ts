import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MenuService } from '../../services/menu/menu.service';
import { ModuloPadre, Modulo } from '../../interfaces/modulo';

import {
    trigger,
    transition,
    style,
    animate,
    query,
    stagger
} from '@angular/animations';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterModule, CommonModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css',
    animations: [
        trigger('listStagger', [
            transition(':enter', [
                query(':enter', [
                    style({ opacity: 0, transform: 'translateX(-32px)' }),
                    stagger(55, [
                        animate('420ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', style({ opacity: 1, transform: 'translateX(0)' }))
                    ])
                ], { optional: true })
            ])
        ]),
        trigger('expandCollapse', [
            transition(':enter', [
                style({ opacity: 0, height: '0px', overflow: 'hidden' }),
                animate('280ms ease-out', style({ opacity: 1, height: '*' }))
            ]),
            transition(':leave', [
                style({ opacity: 1, height: '*' }),
                animate('220ms ease-in', style({ opacity: 0, height: '0px', overflow: 'hidden' }))
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

    private touchStartX: number = 0;
    private subs: Subscription[] = [];
    private directosCargados: boolean = false;
    private gruposCargados: boolean = false;

    constructor(
        private router: Router,
        private menuService: MenuService
    ) {}

    ngOnInit(): void {
        this.currentRoute = this.router.url;
        this.cargarGruposAbiertos();

        this.subs.push(
            this.router.events.pipe(
                filter(event => event instanceof NavigationEnd)
            ).subscribe((event: any) => {
                this.currentRoute = event.urlAfterRedirects || event.url;
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

    isGrupoActivo(grupo: ModuloPadre): boolean {
        return grupo.hijos.some(h => {
            if (!h.ruta) return false;
            const ruta = h.ruta.startsWith('/') ? h.ruta : `/${h.ruta}`;
            return this.router.isActive(ruta, false);
        });
    }

    isGrupoAbierto(grupo: ModuloPadre): boolean {
        return this.gruposAbiertos.has(grupo.modulo) || this.isGrupoActivo(grupo);
    }

    toggleGrupo(grupo: ModuloPadre): void {
        if (this.gruposAbiertos.has(grupo.modulo)) {
            this.gruposAbiertos.delete(grupo.modulo);
        } else {
            this.gruposAbiertos.clear();
            this.gruposAbiertos.add(grupo.modulo);
        }
        this.guardarGruposAbiertos();
    }

    private cargarGruposAbiertos(): void {
        try {
            const guardados = localStorage.getItem(this.GRUPOS_ABIERTOS_KEY);
            if (guardados) {
                const nombres = JSON.parse(guardados) as string[];
                this.gruposAbiertos = new Set(nombres);
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

    onLinkHover(e: MouseEvent): void {
        const target = e.currentTarget as HTMLElement;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        target.style.setProperty('--hover-x', `${x}px`);
        target.style.setProperty('--hover-y', `${y}px`);
    }

    onLinkLeave(e: MouseEvent): void {
        const target = e.currentTarget as HTMLElement;
        if (!target) return;
        target.style.setProperty('--hover-x', '-999px');
        target.style.setProperty('--hover-y', '-999px');
    }
}
