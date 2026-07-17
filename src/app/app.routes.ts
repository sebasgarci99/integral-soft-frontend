import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component';
import { authGuard } from './utils/auth.guard';
import { HomeComponent } from './components/home/home.component';
import { ConsultoriosComponent } from './components/consultorios/consultorios.component';
import { RegRecoleccionComponent } from './components/reg-recoleccion/reg-recoleccion.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { VacunasComponent } from './components/vacunas/vacunas.component';
import { PacientesComponent } from './components/pacientes/pacientes.component';
import { RegVacunacionComponent } from './components/reg-vacunacion/reg-vacunacion.component';
import { ReportesVacunacionComponent } from './components/reportes-vacunacion/reportes-vacunacion.component';
import { RegTemperaturaComponent } from './components/reg-temperatura/reg-temperatura.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { CuentasCobroComponent } from './components/cuentas-cobro/cuentas-cobro.component';
import { ActividadesComponent } from './components/actividades/actividades.component';
import { ArchivosCobroComponent } from './components/archivos-cobro/archivos-cobro.component';
import { InfoUsuarioComponent } from './components/info-usuario/info-usuario.component';
import { GestionPacientesComponent } from './components/gestion-pacientes/gestion-pacientes.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'home', component: HomeComponent },
            { path: 'consultorios', component: ConsultoriosComponent },
            { path: 'reg_recoleccion', component: RegRecoleccionComponent },
            { path: 'reportes', component: ReportesComponent },
            { path: 'vacunas', component: VacunasComponent },
            { path: 'pacientes', component: PacientesComponent },
            { path: 'reg_vacunacion', component: RegVacunacionComponent },
            { path: 'reportes_vacunacion', component: ReportesVacunacionComponent },
            { path: 'reg_temperatura', component: RegTemperaturaComponent },
            { path: 'clientes', component: ClientesComponent },
            { path: 'cuentas_cobro', component: CuentasCobroComponent },
            { path: 'actividades', component: ActividadesComponent },
            { path: 'archivos_cobro', component: ArchivosCobroComponent },
            { path: 'info-usuario', component: InfoUsuarioComponent },
            { path: 'gestion_pacientes', component: GestionPacientesComponent },
        ]
    }
];
