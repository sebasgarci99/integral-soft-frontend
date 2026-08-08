import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { MenuService } from '../../services/menu/menu.service';
import { TokenMonitorService } from '../../services/token-monitor.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterOutlet, SidebarComponent, TopbarComponent],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {

    @ViewChild(SidebarComponent) sidebar: SidebarComponent | undefined;

    constructor(
        private menuService: MenuService,
        private tokenMonitor: TokenMonitorService
    ) {}

    ngOnInit(): void {
        this.menuService.cargarModulos();
        this.tokenMonitor.start();
    }

    ngOnDestroy(): void {
        this.tokenMonitor.stop();
    }

    abrirSidebar(): void {
        this.sidebar?.abrirSidebar();
    }
}
