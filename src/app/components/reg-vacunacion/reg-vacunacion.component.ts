import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';

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
import { Tag } from 'primeng/tag';
import { MultiSelect } from 'primeng/multiselect';
import { RadioButton } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { AccordionModule } from 'primeng/accordion';
import { ProgressSpinner } from 'primeng/progressspinner';

import { of } from 'rxjs';
import { jsPDF } from "jspdf";

import { ConfirmationService, MenuItem, MessageService, SelectItem } from 'primeng/api';
import { SignatureCanvasComponent } from '../../utils/signature-canvas.component';

import { PacientesService } from '../../services/pacientes/pacientes.service';
import { RegVacunacionService } from '../../services/reg_vacunacion/reg-vacunacion.service';
import { ConsentimientoService } from '../../services/documentos/consentimiento.service';
import { VacunaService } from '../../services/vacunas/vacuna.service';

@Component({
    selector: 'app-reg-vacunacion',
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
        SignatureCanvasComponent,
        Tag,
        MultiSelect,
        RadioButton,
        CheckboxModule,
        AccordionModule,
        ProgressSpinner
    ],
    templateUrl: './reg-vacunacion.component.html',
    styleUrl: './reg-vacunacion.component.css',
    providers: [MessageService, ConfirmationService]
})
export class RegVacunacionComponent implements OnInit {

    @ViewChild('firmaPad') firmaPad!: SignatureCanvasComponent;
    @ViewChild('firmaPadFull') firmaPadFull!: SignatureCanvasComponent;

    fullscreen = false;

    historicoGrupos: any[] = [];
    historicoActiveIndex: number[] = [];
    modoEdicion: boolean = false;
    idVacunacionEditando: number | null = null;

    pacientes: any[] = [];
    historicoVacunas: any[] = [];
    historicoConsentimientos: any[] = [];

    dialogVacunas: boolean = false;
    dialogConsentimientos: boolean = false;
    loader: boolean = false;

    dialogCrearVacuna: boolean = false;
    selectedPaciente: any = null;
    listaVacunas: any[] = [];
    vacunasSeleccionadas: any[] = [];

    formSubmitted = false;
    firmaOK = false;

    formData = {
        fecha_registro: new Date(),
        vacunas: [] as {
            id_vacuna: number;
            nombre_vacuna: string;
            dosis: number;
            cant_dosis_max: number;
            aplica_refuerzo: boolean;
            es_refuerzo: boolean;
        }[],
        aplica_acudiente: "N",
        acudiente: "",
        num_doc_acudiente: "",
        firma: null as string | null,
        vacunacion_empresa: "N",
        empresa_entidad: "",
        orden_remision: ""
    };

    constructor(
        private pacientesService: PacientesService,
        private regVacunacionService: RegVacunacionService,
        private consentimientoService: ConsentimientoService,
        private vacunaService: VacunaService,
        private confirmService: ConfirmationService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.cargarPacientes();
    }

    // Cargar solo pacientes activos
    cargarPacientes() {
        this.pacientesService.obtenerPacientesVacunacion().subscribe(data => {
            this.pacientes = data.filter(e => e.estado == 'A');
        });
    }

    crearRegistroVacunacion(paciente: any) {
        this.modoEdicion = false;
        this.idVacunacionEditando = null;
        this.selectedPaciente = paciente;
        this.dialogCrearVacuna = true;
        this.formSubmitted = false;
        this.firmaOK = false;

        this.formData = {
            fecha_registro: new Date(),
            vacunas: [] as {
                id_vacuna: number;
                nombre_vacuna: string;
                dosis: number;
                cant_dosis_max: number;
                aplica_refuerzo: boolean;
                es_refuerzo: boolean;
            }[],
            aplica_acudiente: "N",
            acudiente: "",
            num_doc_acudiente: "",
            firma: null,
            vacunacion_empresa: "N",
            empresa_entidad: "",
            orden_remision: ""
        };

        // Reiniciamos la componente de firma y refrescamos la imagen
        setTimeout(() => {
            this.firmaPad.reinitPad();
            this.firmaPadFull.refresh();
        }, 100);

        this.cargarVacunas();
    }

    cargarVacunas() {
        this.vacunaService.obtenerVacunas().subscribe((data) => {
            this.listaVacunas = data.filter(e => e.estado == 'A');
        });
    }

    abrirHistoricoVacunas(paciente: any) {
        this.selectedPaciente = paciente;
        this.regVacunacionService.obtenerVacunasPaciente(paciente.id_paciente).subscribe(data => {
            this.historicoVacunas = data;
            this.historicoGrupos = this.agruparPorVacunacion(data);
            this.historicoActiveIndex = this.historicoGrupos.map((_, i) => i);
            this.dialogVacunas = true;
        });
    }

    abrirHistoricoConsentimientos(paciente: any) {
        this.consentimientoService.obtenerConsentimientosPaciente(paciente.id_paciente).subscribe(data => {
            this.historicoConsentimientos = data;
            this.dialogConsentimientos = true;
        });
    }

    private agruparPorVacunacion(data: any[]): any[] {
        const grupos = new Map<number, any>();
        for (const item of data) {
            if (!grupos.has(item.id_vacunacion)) {
                grupos.set(item.id_vacunacion, {
                    id_vacunacion: item.id_vacunacion,
                    fecha_registro: item.fecha_registro,
                    empresa_entidad: item.empresa_entidad,
                    orden_remision: item.orden_remision,
                    vacunacion_empresa: item.vacunacion_empresa,
                    aplica_acudiente: item.aplica_acudiente,
                    acudiente: item.acudiente,
                    num_documento_acudiente: item.num_documento_acudiente,
                    vacunas: []
                });
            }
            grupos.get(item.id_vacunacion).vacunas.push(item);
        }
        return Array.from(grupos.values()).sort((a, b) => b.id_vacunacion - a.id_vacunacion);
    }

    editarRegistro(grupo: any) {
        this.modoEdicion = true;
        this.idVacunacionEditando = grupo.id_vacunacion;

        this.formData.fecha_registro = this.parseFechaHistorico(grupo.fecha_registro);
        this.formData.aplica_acudiente = grupo.aplica_acudiente === true || grupo.aplica_acudiente === 'S' ? 'S' : 'N';
        this.formData.acudiente = grupo.acudiente || '';
        this.formData.num_doc_acudiente = grupo.num_documento_acudiente || '';
        this.formData.vacunacion_empresa = grupo.vacunacion_empresa === true || grupo.vacunacion_empresa === 'S' ? 'S' : 'N';
        this.formData.empresa_entidad = grupo.empresa_entidad || '';
        this.formData.orden_remision = grupo.orden_remision || '';
        this.formData.firma = null;
        this.formSubmitted = false;
        this.firmaOK = false;

        this.vacunaService.obtenerVacunas().subscribe(data => {
            this.listaVacunas = data.filter(e => e.estado == 'A');

            this.vacunasSeleccionadas = grupo.vacunas.map((v: any) =>
                this.listaVacunas.find((lv: any) => lv.id === v.id_vacuna)
            ).filter(Boolean);

            this.formData.vacunas = grupo.vacunas.map((v: any) => {
                const esRefuerzo = v.dosis_aplicada === 'refuerzo';
                return {
                    id_vacuna: v.id_vacuna,
                    nombre_vacuna: v.nombre_vacuna,
                    dosis: esRefuerzo ? 'refuerzo' : Number(v.dosis_aplicada),
                    cant_dosis_max: v.cantidad_dosis,
                    aplica_refuerzo: false,
                    es_refuerzo: esRefuerzo
                } as any;
            });
        });

        this.dialogCrearVacuna = true;

        setTimeout(() => {
            this.firmaPad.reinitPad();
            this.firmaPadFull.refresh();
        }, 100);
    }

    private parseFechaHistorico(fechaStr: string): Date {
        if (!fechaStr) return new Date();
        const partes = fechaStr.split(' ');
        const fechaPartes = partes[0].split('/');
        const horaPartes = (partes[1] || '00:00:00').split(':');
        return new Date(
            Number(fechaPartes[2]),
            Number(fechaPartes[1]) - 1,
            Number(fechaPartes[0]),
            Number(horaPartes[0]),
            Number(horaPartes[1]),
            Number(horaPartes[2] || 0)
        );
    }

    generarPDF(consent: any) {
        const html$ = consent.f_procesar_datos_consentimiento
            ? of(consent.f_procesar_datos_consentimiento)
            : this.consentimientoService.obtenerHtmlConsentimiento(consent.id_vacunacion);

        this.loader = true;
        html$.subscribe({
            next: (html: string) => {
                const doc = new jsPDF({
                    unit: 'pt',
                    format: 'letter',
                });

                const div = document.createElement('div');
                div.innerHTML = html;
                div.style.width = "600px";
                document.body.appendChild(div);

                const margins = { top: 35, bottom: 35, left: 35, right: 35 };

                doc.html(div, {
                    x: margins.left,
                    y: margins.top,
                    html2canvas: { scale: 0.9 },
                    autoPaging: 'text',
                    callback: (doc) => {
                        doc.save(`ConsentimientoInformado_${consent.id_consentimiento}.pdf`);
                        document.body.removeChild(div);
                        this.loader = false;
                    }
                });
            },
            error: () => {
                this.messageService.add({ severity: "error", summary: "Error", detail: "Error al generar el PDF" });
                this.loader = false;
            }
        });
    }

    // Guarda solo la firma en base64
    guardarFirma(): void {
        if (this.firmaPad && !this.firmaPad.isEmpty()) {
            // Obtiene solo el base64 (sin el prefijo data:image/png;base64)
            this.formData.firma = this.firmaPad.toDataBase64();
            console.log('Base64 puro:', this.formData.firma);

            // Si necesitas reconstruir el dataURL completo después:
            const fullDataUrl = `data:image/png;base64,${this.formData.firma}`;
            this.firmaOK = true;
        }
    }

    guardarFirmaFull(): void {
        if (this.firmaPadFull && !this.firmaPadFull.isEmpty()) {
            this.formData.firma = this.firmaPadFull.toDataBase64();
            this.firmaPad.fromDataBase64(this.firmaPadFull.toDataBase64());
            this.firmaOK = true;
            this.fullscreen = false;
        }
    }

    botonGuardarHabilitado() {
        if (this.formData.vacunas.length === 0) return false;
        if (this.formData.vacunas.some(v => !v.es_refuerzo && v.dosis > v.cant_dosis_max)) return false;
        if (!this.modoEdicion && !this.formData.firma) return false;

        if (this.formData.aplica_acudiente === "S") {
            if (!this.formData.acudiente || !this.formData.num_doc_acudiente)
                return false;
        }

        if (this.formData.vacunacion_empresa === "S") {
            if (!this.formData.empresa_entidad || !this.formData.orden_remision)
                return false;
        }

        return true;
    }

    confirmarGuardar() {
        this.formSubmitted = true;

        if (!this.botonGuardarHabilitado()) return;

        const vacunasNombres = this.formData.vacunas
            .map(v => `${v.nombre_vacuna} - ${this.obtenerTextoDosis(v.dosis, v.cant_dosis_max)}`)
            .join(', ');

        this.confirmService.confirm({
            message: this.modoEdicion
                ? `¿Confirmas que deseas actualizar el registro con las vacunas: <b>${vacunasNombres}</b>?`
                : `¿Confirmas que deseas registrar las vacunas: <b>${vacunasNombres}</b>?`,
            header: this.modoEdicion ? "Confirmar actualización" : "Confirmar registro",
            icon: "fa fa-check",
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => this.guardarRegistro()
        });
    }

    guardarRegistro() {
        const payload: Record<string, unknown> = {
            id_paciente: this.selectedPaciente.id_paciente,
            fecha_registro: this.obtenerFechaHoraActualFormatoIso(this.formData.fecha_registro),
            aplica_acudiente: this.formData.aplica_acudiente === "S",
            acudiente: this.formData.aplica_acudiente === "S" ? this.formData.acudiente : null,
            num_documento_acudiente: this.formData.aplica_acudiente === "S" ? this.formData.num_doc_acudiente : null,
            estado: "A",
            vacunas_aplicadas: this.formData.vacunas.map(v => ({
                id_vacuna: v.id_vacuna,
                dosis_aplicada: v.es_refuerzo ? 'refuerzo' : v.dosis
            })),
            vacunacion_empresa: this.formData.vacunacion_empresa,
            empresa_entidad: this.formData.vacunacion_empresa === "S" ? this.formData.empresa_entidad : null,
            orden_remision: this.formData.vacunacion_empresa === "S" ? this.formData.orden_remision : null
        };

        if (this.modoEdicion) {
            payload['id_vacunacion'] = this.idVacunacionEditando;
        } else {
            payload['firma_usuario_acudiente'] = this.formData.firma;
        }

        this.loader = true;
        this.regVacunacionService.crearActualizarRegVacunacion(payload).subscribe({
            next: (e) => {
                this.messageService.add({ severity: "success", summary: "OK", detail: "Registro de vacunación guardado correctamente" });
                if(!this.modoEdicion) {
                    this.generarPDF(e)
                }
                this.dialogCrearVacuna = false;
                this.dialogConsentimientos = false;
                this.dialogVacunas = false;
                this.loader = false;
                this.cargarPacientes();
            },
            error: (e) => {
                console.log(e);
                this.messageService.add({ severity: "error", summary: "Error", detail: "Error al guardar" });
                this.loader = false;
            }
        });
    }

    openFullscreen() {
        this.fullscreen = true;

        setTimeout(() => {
            if (this.firmaPadFull) {
                // No es necesario setear .style.width/height manualmente si usamos el CSS de arriba
                this.firmaPadFull.refresh();
            }
        }, 150); // Un margen de tiempo para que la animación de la modal termine
    }

    closeFullscreen() {
        this.fullscreen = false;
        setTimeout(() => this.firmaPad.reinitPad());
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

    onVacunasChange(event: any) {
        const seleccionadas = event.value;

        this.formData.vacunas = seleccionadas.map((v: any) => {
            const existente = this.formData.vacunas.find(
                x => x.id_vacuna === v.id
            );

            return existente ?? {
                id_vacuna: v.id,
                nombre_vacuna: v.nombre_vacuna,
                dosis: v.cantidad_dosis == 1 ? 1 : v.dosis,
                cant_dosis_max: v.cantidad_dosis,
                aplica_refuerzo: v.aplica_refuerzo ?? false,
                es_refuerzo: false
            };
        });
    }

    onRefuerzoChange(vacuna: any) {
        if (vacuna.es_refuerzo) {
            vacuna.dosis = 'refuerzo' as any;
        } else {
            vacuna.dosis = 1;
        }
    }

    private transformarDosis(dosis: any, esRefuerzo: boolean): number | string {
        if (esRefuerzo && dosis === 'refuerzo') {
            return 'refuerzo';
        }
        return Number(dosis);
    }

    obtenerTextoDosis(dosis: number | string, cant_dosis_max: number): string {
        if (dosis === 'refuerzo') {
            return 'Refuerzo';
        }

        const dosisNum = Number(dosis);
        switch (dosisNum) {
            case 1: return cant_dosis_max == 1 ? 'única dosis' : 'primera dosis';
            case 2: return 'segunda dosis';
            case 3: return 'tercera dosis';
            case 4: return 'cuarta dosis';
            case 5: return 'quinta dosis';
            case 6: return 'sexta dosis';
            case 7: return 'septima dosis';
            case 8: return 'octava dosis';
            case 9: return 'novena dosis';
            case 10: return 'decima dosis';
            default: return `${dosis}ª dosis`;
        }
    }

    resetFormularioVacunacion() {
        this.modoEdicion = false;
        this.idVacunacionEditando = null;
        this.formSubmitted = false;
        this.firmaOK = false;

        this.formData = {
            fecha_registro: new Date(),
            vacunas: [],
            aplica_acudiente: 'N',
            acudiente: '',
            num_doc_acudiente: '',
            firma: null,
            vacunacion_empresa: "N",
            empresa_entidad: "",
            orden_remision: ""
        };

        this.vacunasSeleccionadas = [];
        this.selectedPaciente = null;

        // Limpia la firma
        if (this.firmaPad) {
            this.firmaPad.clear();
        }
    }

}
