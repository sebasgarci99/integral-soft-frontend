import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { MenuService } from '../../services/menu/menu.service';
import { CommandPaletteService } from '../../services/command-palette/command-palette.service';
import { Modulo, ModuloPadre } from '../../interfaces/modulo';

interface ResultadoBusqueda {
    id: string;
    label: string;
    breadcrumb: string;
    icono: string;
    ruta: string;
    busqueda: string;
}

@Component({
    selector: 'app-command-palette',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './command-palette.component.html',
    styleUrl: './command-palette.component.css'
})
export class CommandPaletteComponent implements OnInit, OnDestroy {

    @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;

    abierto = false;
    busqueda = '';
    resultados: ResultadoBusqueda[] = [];
    indice: ResultadoBusqueda[] = [];
    indiceSeleccionado = 0;

    private subs: Subscription[] = [];
    private scrollBloqueado = false;

    constructor(
        private menuService: MenuService,
        private commandPalette: CommandPaletteService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.subs.push(
            this.commandPalette.abierto$.subscribe(abierto => {
                this.abierto = abierto;
                if (abierto) {
                    this.alAbrir();
                } else {
                    this.alCerrar();
                }
            }),
            combineLatest([
                this.menuService.getModulosDirectos(),
                this.menuService.getModulosAgrupados()
            ]).subscribe(([directos, agrupados]) => {
                this.construirIndice(directos, agrupados);
                this.filtrar();
            })
        );
    }

    ngOnDestroy(): void {
        this.subs.forEach(sub => sub.unsubscribe());
        this.restaurarScroll();
    }

    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            this.commandPalette.toggle();
            return;
        }

        if (!this.abierto) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            this.cerrar();
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.moverSeleccion(1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.moverSeleccion(-1);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            this.seleccionarActual();
        }
    }

    onBackdropClick(): void {
        this.cerrar();
    }

    onBusquedaChange(): void {
        this.filtrar();
    }

    seleccionar(resultado: ResultadoBusqueda): void {
        if (!resultado.ruta) return;
        this.cerrar();
        this.router.navigate([resultado.ruta]);
    }

    trackByResultado(_: number, resultado: ResultadoBusqueda): string {
        return resultado.id;
    }

    cerrar(): void {
        this.commandPalette.cerrar();
    }

    private alAbrir(): void {
        this.busqueda = '';
        this.filtrar();
        this.indiceSeleccionado = 0;
        this.bloquearScroll();
        setTimeout(() => this.searchInputRef?.nativeElement.focus(), 30);
    }

    private alCerrar(): void {
        this.busqueda = '';
        this.indiceSeleccionado = 0;
        this.restaurarScroll();
    }

    private construirIndice(directos: Modulo[], agrupados: ModuloPadre[]): void {
        const resultados: ResultadoBusqueda[] = [];
        const vistos = new Set<string>();

        directos.forEach(modulo => {
            if (!modulo.ruta) return;
            const id = `directo-${modulo.id_modulo}`;
            if (vistos.has(id)) return;
            vistos.add(id);
            resultados.push({
                id,
                label: modulo.modulo,
                breadcrumb: '',
                icono: modulo.icono,
                ruta: modulo.ruta,
                busqueda: this.normalizar(`${modulo.modulo} ${modulo.ruta}`)
            });
        });

        agrupados.forEach(grupo => {
            grupo.hijos.forEach(hijo => {
                if (!hijo.ruta) return;
                const id = `hijo-${hijo.id_modulo}`;
                if (vistos.has(id)) return;
                vistos.add(id);
                resultados.push({
                    id,
                    label: hijo.modulo,
                    breadcrumb: grupo.modulo,
                    icono: hijo.icono,
                    ruta: hijo.ruta,
                    busqueda: this.normalizar(`${grupo.modulo} ${hijo.modulo} ${hijo.ruta}`)
                });
            });
        });

        this.indice = resultados.sort((a, b) => {
            const grupoA = a.breadcrumb || '';
            const grupoB = b.breadcrumb || '';
            if (grupoA !== grupoB) return grupoA.localeCompare(grupoB);
            return a.label.localeCompare(b.label);
        });
    }

    private filtrar(): void {
        const termino = this.normalizar(this.busqueda);
        if (!termino) {
            this.resultados = this.indice.slice();
        } else {
            this.resultados = this.indice.filter(resultado =>
                resultado.busqueda.includes(termino)
            );
        }
        if (this.indiceSeleccionado >= this.resultados.length) {
            this.indiceSeleccionado = Math.max(0, this.resultados.length - 1);
        }
    }

    private moverSeleccion(indice: number): void {
        if (this.resultados.length === 0) return;
        const nuevo = (this.indiceSeleccionado + indice + this.resultados.length) % this.resultados.length;
        this.indiceSeleccionado = nuevo;
        setTimeout(() => {
            document.querySelector('.command-result.selected')?.scrollIntoView({ block: 'nearest' });
        }, 0);
    }

    private seleccionarActual(): void {
        const resultado = this.resultados[this.indiceSeleccionado];
        if (resultado) this.seleccionar(resultado);
    }

    private normalizar(valor: string): string {
        return (valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    private bloquearScroll(): void {
        if (this.scrollBloqueado) return;
        this.scrollBloqueado = true;
        document.body.style.overflow = 'hidden';
    }

    private restaurarScroll(): void {
        if (!this.scrollBloqueado) return;
        this.scrollBloqueado = false;
        document.body.style.overflow = '';
    }
}
