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
import { VacunasComponent } from './components/vacunas/vacunas.component';
import { PacientesComponent } from './components/pacientes/pacientes.component';
import { RegVacunacionComponent } from './components/reg-vacunacion/reg-vacunacion.component';
import { ReportesVacunacionComponent } from './components/reportes-vacunacion/reportes-vacunacion.component';
import { RegTemperaturaComponent } from './components/reg-temperatura/reg-temperatura.component';

export const routes: Routes = [
    {
        path: '', redirectTo: '/login', pathMatch: 'full'
    },
    {
        path: 'login', component: LoginComponent
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
    },
    {
        path: 'vacunas', component: VacunasComponent, canActivate: [
            authGuard
        ]
    },
    {
        path: 'pacientes', component: PacientesComponent, canActivate: [
            authGuard
        ]
    },
    {
        path: 'reg_vacunacion', component: RegVacunacionComponent, canActivate: [
            authGuard
        ]
    },
    {
        path: 'reportes_vacunacion', component: ReportesVacunacionComponent, canActivate: [
            authGuard
        ]
    },
    {
        path: 'reg_temperatura', component: RegTemperaturaComponent, canActivate: [
            authGuard
        ]
    }
];

