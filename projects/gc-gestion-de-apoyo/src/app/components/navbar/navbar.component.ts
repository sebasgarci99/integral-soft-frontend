import { Component, HostListener } from '@angular/core';
import { SITE } from '../../data/site.config';

@Component({
    selector: 'app-navbar',
    imports: [],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.css'
})
export class NavbarComponent {
    readonly site = SITE;
    scrolled = false;
    menuAbierto = false;

    @HostListener('window:scroll')
    onScroll(): void {
        this.scrolled = window.scrollY > 24;
    }

    @HostListener('window:resize')
    onResize(): void {
        if (window.innerWidth > 900) {
            this.menuAbierto = false;
        }
    }

    toggleMenu(): void {
        this.menuAbierto = !this.menuAbierto;
    }

    cerrarMenu(): void {
        this.menuAbierto = false;
    }
}
