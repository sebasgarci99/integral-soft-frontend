import { Routes } from '@angular/router';
import { GestionUsuarioComponent } from './components/pqrs/gestion-usuario/gestion-usuario.component';
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
import { ActasComponent } from './components/actas/actas.component';
import { ActaFormularioComponent } from './components/actas/acta-formulario/acta-formulario.component';
import { ResponsablesSstComponent } from './components/actas/responsables-sst/responsables-sst.component';
import { GestionPacientesComponent } from './components/gestion-pacientes/gestion-pacientes.component';
import { EquiposComponent } from './components/equipos/equipos.component';
import { InventarioComponent } from './components/inventario/inventario.component';
import { ProductosComponent } from './components/inventario/productos/productos.component';
import { MovimientosComponent } from './components/inventario/movimientos/movimientos.component';
import { KardexComponent } from './components/inventario/kardex/kardex.component';
import { StockComponent } from './components/inventario/stock/stock.component';
import { ConfiguracionComponent } from './components/inventario/configuracion/configuracion.component';
import { ReporteProductosComponent } from './components/inventario/reporte-productos/reporte-productos.component';
import { ProgramacionPacientesComponent } from './components/programacion-pacientes/programacion-pacientes.component';
import { PropiedadesHorizontalesComponent } from './components/pqrs/propiedades-horizontales/propiedades-horizontales.component';
import { SeguimientoPqrsComponent } from './components/pqrs/seguimiento-pqrs/seguimiento-pqrs.component';
import { AlertasPqrsComponent } from './components/pqrs/alertas-pqrs/alertas-pqrs.component';
import { ReportesPqrsComponent } from './components/pqrs/reportes-pqrs/reportes-pqrs.component';
import { CalculoEmpleadoComponent } from './components/calculo-empleado/calculo-empleado.component';

export const routes: Routes = [
    { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
    { path: 'pqrs/gestion_usuario', component: GestionUsuarioComponent },
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
            { path: 'actas', component: ActasComponent },
            { path: 'actas/nueva', component: ActaFormularioComponent },
            { path: 'actas/editar/:id', component: ActaFormularioComponent },
            { path: 'actas/responsables', component: ResponsablesSstComponent },
            { path: 'info-usuario', component: InfoUsuarioComponent },
            { path: 'gestion_pacientes', component: GestionPacientesComponent },
            { path: 'equipos', component: EquiposComponent },
            { path: 'inventario', component: InventarioComponent },
            { path: 'inventario/productos', component: ProductosComponent },
            { path: 'inventario/movimientos', component: MovimientosComponent },
            { path: 'inventario/kardex', component: KardexComponent },
            { path: 'inventario/stock', component: StockComponent },
            { path: 'inventario/configuracion', component: ConfiguracionComponent },
            { path: 'inventario/reporte-productos', component: ReporteProductosComponent },
            { path: 'programacion_pacientes', component: ProgramacionPacientesComponent },
            { path: 'pqrs/propiedades', component: PropiedadesHorizontalesComponent },
            { path: 'pqrs/seguimiento', component: SeguimientoPqrsComponent },
            { path: 'pqrs/alertas', component: AlertasPqrsComponent },
            { path: 'pqrs/reportes', component: ReportesPqrsComponent },
            { path: 'calculo_empleado', component: CalculoEmpleadoComponent },
        ]
    }
];
