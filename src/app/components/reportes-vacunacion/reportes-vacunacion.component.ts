import { Component } from '@angular/core';
import { ReportePacienteVacuna, AnioGrupo, PacienteGrupo, VacunaDetalle } from '../../interfaces/ReportePacienteVacuna';
import { VacunacionAnioGrupo, VacunaGrupo, VacunacionDetalle } from '../../interfaces/ReporteVacunas';

import { ReportesService } from '../../services/reportes/reportes.service';

import { SidebarComponent } from "../sidebar/sidebar.component";

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { StepsModule } from 'primeng/steps';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FloatLabelModule } from 'primeng/floatlabel';

import { RadioButtonModule } from 'primeng/radiobutton';
import { AccordionModule } from 'primeng/accordion';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PacientesService } from '../../services/pacientes/pacientes.service';
import { VacunaService } from '../../services/vacunas/vacuna.service';

@Component({
    selector: 'app-reportes-vacunacion',
    imports: [
        CommonModule,
        FormsModule,
        SidebarComponent,
        /* PrimeNG */
        TableModule,
        DialogModule,
        StepsModule,
        CalendarModule,
        DropdownModule,
        InputTextModule,
        InputNumberModule,
        FloatLabelModule,
        ButtonModule,
        ToastModule,
        ConfirmDialogModule,
        AccordionModule,
        RadioButtonModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './reportes-vacunacion.component.html',
    styleUrl: './reportes-vacunacion.component.css'
})
export class ReportesVacunacionComponent {
    // Filtro paciente
    filtro = {
        fechaInicio: new Date(),
        fechaFin: new Date(),
        paciente: null
    };

    // Filtro de vacuinas
    filtroVac = {
        fechaInicio: new Date(),
        fechaFin: new Date(),
        vacuna: null
    };

    pacientes: any[] = [];
    reportePacientes: ReportePacienteVacuna[] = [];

    anioGrupos: AnioGrupo[] = [];

    expandedAnios: { [key: string]: boolean } = {};
    expandedPacientes: { [key: string]: boolean } = {};

    vacunas: any[] = []; // dropdown
    vacunacionAnios: VacunacionAnioGrupo[] = [];

    expandedVacAnios: { [key: string]: boolean } = {};
    expandedVacunas: { [key: string]: boolean } = {};

    constructor(
        private reportesService: ReportesService,
        private pacientesService: PacientesService,
        private VacunaService: VacunaService
    ) {
    }

    async ngOnInit(): Promise<void> {
        await this.obtenerPacientes();
        await this.obtenerVacunas();
    }

    async generarReportePacientes() {
        console.log(this.filtro);

        try {
            this.reportesService.obtenerReporteVacunacion(
                new Date(this.filtro.fechaInicio),
                new Date(this.filtro.fechaFin),
                this.filtro.paciente
            ).subscribe((data) => {

                const mapAnios = new Map<number, AnioGrupo>();

                data.forEach(item => {
                    const anio = Number(item.anio_vacunacion);

                    if (!mapAnios.has(anio)) {
                        mapAnios.set(anio, {
                            key: anio,
                            anio,
                            pacientes: []
                        });
                    }

                    const anioGrupo = mapAnios.get(anio)!;

                    let paciente = anioGrupo.pacientes.find(
                        p => p.documento === item.numero_documento
                    );

                    if (!paciente) {
                        paciente = {
                            key: `${anio}-${item.numero_documento}`,
                            nombreCompleto: item.nombre_paciente,
                            documento: item.numero_documento,
                            sexo: item.sexo,
                            telefono: item.telefono_contacto,
                            email: item.correo_electronico,
                            vacunas: []
                        };
                        anioGrupo.pacientes.push(paciente);
                    }

                    paciente.vacunas.push({
                        vacuna: item.nombre_vacuna,
                        fechaVacuna: new Date(item.fecha_vacunacion),
                        lote: item.lote_vacuna_aplicada,
                        dosis: item.dosis_aplicada,
                        edad: item.edad_vacuna
                    });
                });

                this.anioGrupos = Array.from(mapAnios.values())
                    .sort((a, b) => b.anio - a.anio);
            });
        } catch (e) {
            console.error(e)
        }
    }

    public obtenerFechaHoraActualFormatoIso(
        fecha: Date,
        hora?: Date // Opcional
    ): string {
        // Si el parametro de hora no se envia
        // tomamos el valor de la fecha
        hora = hora ?? fecha;

        // Construimos a pedal la fecha en formato ISO String
        // Ya que la función nativa nos cambia el UTC a 0
        let fechaActualConvertida: string =
            fecha.getFullYear()
            + '-' + String(fecha.getMonth() + 1).padStart(2, '0')
            + '-' + String(fecha.getDate()).padStart(2, '0')
            + 'T' +
            String(hora.getHours()).padStart(2, '0')
            + ':' + String(hora.getMinutes()).padStart(2, '0')
            + ':' + String(hora.getSeconds()).padStart(2, '0')
            ;

        return fechaActualConvertida;
    }

    async obtenerPacientes() {
        this.pacientesService.obtenerPacientes().subscribe(data => {
            this.pacientes = data.filter(e => e.estado === 'A').map(e => {
                return {
                    key: e.id_paciente,
                    nombreCompleto: `${e.nombres} ${e.apellidos}`,
                    documento: e.numero_documento,
                    sexo: e.sexo,
                    telefono: e.telefono_contacto,
                    email: e.correo_electronico
                };
            });
        });
    }

    async generarReporteVacunacion() {
        this.vacunacionAnios = [];
        this.expandedVacAnios = {};
        this.expandedVacunas = {};

        this.reportesService.obtenerReporteVacunasAplicadas(
            new Date(this.filtroVac.fechaInicio),
            new Date(this.filtroVac.fechaFin),
            this.filtroVac.vacuna
        ).subscribe(data => {

            const mapAnios = new Map<number, VacunacionAnioGrupo>();

            data.forEach(item => {

                const anio = Number(item.anio_vacunacion);

                // ================= AÑO =================
                if (!mapAnios.has(anio)) {
                    mapAnios.set(anio, {
                        anio,
                        vacunas: []
                    });
                }

                const anioGrupo = mapAnios.get(anio)!;

                // ================= VACUNA =================
                let vacuna = anioGrupo.vacunas.find(
                    v => v.nombre_vacuna === item.nombre_vacuna
                );

                if (!vacuna) {
                    vacuna = {
                        key: `${anio}-${item.nombre_vacuna}`,
                        nombre_vacuna: item.nombre_vacuna,
                        nombre_laboratorio: item.nombre_laboratorio,
                        cantidad_dosis_parametrizada: item.cantidad_dosis_parametrizada,
                        detalle: []
                    };
                    anioGrupo.vacunas.push(vacuna);
                }

                // ================= DETALLE =================
                vacuna.detalle.push({
                    mes_vacunacion: item.mes_vacunacion,
                    fecha_vacunacion: new Date(item.fecha_vacunacion),
                    lote_vacuna_aplicada: item.lote_vacuna_aplicada,
                    dosis_aplicada: item.dosis_aplicada
                });

            });

            this.vacunacionAnios = Array
                .from(mapAnios.values())
                .sort((a, b) => b.anio - a.anio);

        });
    }

    async obtenerVacunas() {
        this.VacunaService.obtenerVacunas().subscribe(data => {
            this.vacunas = data.filter(e => e.estado === 'A').map(e => {
                return {
                    key: e.id,
                    nombre_vacuna: e.nombre_vacuna
                };
            });
        });
    }

}
