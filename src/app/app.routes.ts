import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

// Guards
import { authGuard } from './utils/auth.guard';
import { ConsultoriosComponent } from './components/consultorios/consultorios.component';
import { RegRecoleccionComponent } from './components/reg-recoleccion/reg-recoleccion.component';
import { ReportesComponent } from './components/reportes/reportes.component';

export const routes: Routes = [
    {
        path: '', redirectTo: '/login', pathMatch: 'full'
    },
    {
        path: 'login',  component: LoginComponent
    }, 
    {
        path: 'navbar', component: NavbarComponent, canActivate: [
            authGuard
        ]
    },
    {
        path: 'home', component: HomeComponent, canActivate: [
            authGuard
        ]
    },
    {
        path: 'menu', component: SidebarComponent, canActivate: [
            authGuard
        ]
    },
    {
        path: 'consultorios', component: ConsultoriosComponent, canActivate: [
            authGuard
        ]
    },
    {
        path: 'reg_recoleccion', component: RegRecoleccionComponent, canActivate: [
            authGuard
        ]
    },
    {
        path: 'reportes', component: ReportesComponent, canActivate: [
            authGuard
        ]
    }
];

