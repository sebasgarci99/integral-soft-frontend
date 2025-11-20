import { Component  } from '@angular/core';
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
import { RadioButton } from 'primeng/radiobutton'

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
        RadioButton
    ],
    templateUrl: './reg-vacunacion.component.html',
    styleUrl: './reg-vacunacion.component.css',
    providers: [MessageService, ConfirmationService]
})
export class RegVacunacionComponent implements OnInit{

    @ViewChild('firmaPad') firmaPad!: SignatureCanvasComponent;
    @ViewChild('firmaPadFull') firmaPadFull!: SignatureCanvasComponent;

    fullscreen = false;

    pacientes: any[] = [];
    historicoVacunas: any[] = [];
    historicoConsentimientos: any[] = [];

    dialogVacunas: boolean = false;
    dialogConsentimientos: boolean = false;

    dialogCrearVacuna: boolean = false;
    selectedPaciente: any = null;
    listaVacunas: any[] = [];

    formSubmitted = false;
    firmaOK = false;

    formData = {
        vacunas: [] as number[],
        aplica_acudiente: "N",
        acudiente: "",
        num_doc_acudiente: "",
        firma: null as string | null
    };

    constructor(
        private pacientesService: PacientesService,
        private regVacunacionService: RegVacunacionService,
        private consentimientoService: ConsentimientoService,
        private vacunaService: VacunaService,
        private confirmService: ConfirmationService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.cargarPacientes();
    }

    // Cargar solo pacientes activos
    cargarPacientes() {
        this.pacientesService.obtenerPacientes().subscribe(data => {
            this.pacientes = data.filter(e => e.estado === 'A');
        });
    }

    crearRegistroVacunacion(paciente: any) {
        console.log(paciente)
        this.selectedPaciente = paciente;
        this.dialogCrearVacuna = true;
        this.formSubmitted = false;
        this.firmaOK = false;

        this.formData = {
            vacunas: [],
            aplica_acudiente: "N",
            acudiente: "",
            num_doc_acudiente: "",
            firma: null 
        };

        setTimeout(() => {
            this.firmaPad.reinitPad();
            this.firmaPad.canvasRef.nativeElement.width = 450;
            const c = this.firmaPad.canvasRef.nativeElement;
            console.log('Canvas size:', c.width, c.height, 'offset:', c.offsetWidth, c.offsetHeight);
        }, 100);

        this.cargarVacunas();
    }

    cargarVacunas() {
        this.vacunaService.obtenerVacunas().subscribe((data) => {
            this.listaVacunas = data.filter(e => e.estado == 'A');
        });
    }

    abrirHistoricoVacunas(paciente: any) {
        this.regVacunacionService.obtenerVacunasPaciente(paciente.id_paciente).subscribe(data => {
            this.historicoVacunas = data;
            this.dialogVacunas = true;
        });
    }

    abrirHistoricoConsentimientos(paciente: any) {
        this.consentimientoService.obtenerConsentimientosPaciente(paciente.id_paciente).subscribe(data => {
            this.historicoConsentimientos = data;
            this.dialogConsentimientos = true;
        });
    }

    async generarPDF(htmlString: any) {
        // Crear instancia con tamaño carta o A4
        const doc = new jsPDF({
            unit: 'pt',      // puntos (1/72 de pulgada)
            format: 'letter', // o 'a4'
        });

        // Creamos un contenedor temporal para renderizar el HTML
        const div = document.createElement('div');
        div.innerHTML = htmlString.f_procesar_datos_consentimiento;
        div.style.width = "600px"; // controla el ancho del PDF
        document.body.appendChild(div); // (necesario para permitir html2canvas)

        const margins = {
            top: 35,
            bottom: 35,
            left: 35,
            right: 35,
        };

        await doc.html(
            div, 
            {
                x: margins.left,
                y: margins.top,
                html2canvas: {
                    scale: 0.9, // evita que el contenido se desborde
                },
                autoPaging: 'text', // fuerza saltos de página automáticos
                callback: (doc) => {
                    doc.save(`ConsentimientoInformado_${htmlString.id_consentimiento}.pdf`); 
                    document.body.removeChild(div); //  limpiar
                }
            }
        );
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
        if(this.firmaPadFull && !this.firmaPadFull.isEmpty()) {
            this.formData.firma = this.firmaPadFull.toDataBase64();
            this.firmaPad.fromDataBase64(this.firmaPadFull.toDataBase64());
            this.firmaOK = true;
            this.fullscreen = false;
        }
    }

    botonGuardarHabilitado() {
        if (this.formData.vacunas.length === 0) return false;
        if (!this.formData.firma) return false;
        if (this.formData.aplica_acudiente === "S") {
            if (!this.formData.acudiente || !this.formData.num_doc_acudiente) return false;
        }
        return true;
    }

    confirmarGuardar() {
        this.formSubmitted = true;

        if (!this.botonGuardarHabilitado()) return;

        const vacunasNombres = this.listaVacunas
            .filter(v => this.formData.vacunas.includes(v.id))
            .map(v => v.nombre_vacuna)
            .join(", ");

        this.confirmService.confirm({
            message: `¿Confirmas que deseas registrar las vacunas: <b>${vacunasNombres}</b>?`,
            header: "Confirmar registro",
            icon: "fa fa-check",
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => this.guardarRegistro()
        });
    }

    async guardarRegistro() {
        const payload = {
            id_paciente: this.selectedPaciente.id_paciente,
            fecha_registro: new Date(),
            aplica_acudiente: this.formData.aplica_acudiente === "S",
            acudiente: this.formData.aplica_acudiente === "S" ? this.formData.acudiente : null,
            num_documento_acudiente: this.formData.aplica_acudiente === "S" ? this.formData.num_doc_acudiente : null,
            estado: "A",
            vacunas_aplicadas: [
                { id_vacuna: this.formData.vacunas }
            ],
            firma_usuario_acudiente: this.formData.firma
        };

        this.regVacunacionService.crearActualizarRegVacunacion(payload).subscribe({
            next: async (e) => {
                this.messageService.add({ severity: "success", summary: "OK", detail: "Registro de vacunación guardado correctamente" });
                await this.generarPDF(e)
                this.dialogCrearVacuna = false;
            },
            error: (e) => {
                console.log(e);
                this.messageService.add({ severity: "error", summary: "Error", detail: "Error al guardar" });
            }
        });
    }

    openFullscreen() {
        this.fullscreen = true;
        setTimeout(() => {
            this.firmaPadFull.reinitPad();
            this.firmaPadFull.canvasRef.nativeElement.style.height = '80vh';
        }, 200);
    }

    closeFullscreen() {
        this.fullscreen = false;
        setTimeout(() => this.firmaPad.reinitPad());
    }


}
