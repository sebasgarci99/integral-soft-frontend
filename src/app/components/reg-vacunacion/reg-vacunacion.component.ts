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
 
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { ConfirmationService, MenuItem, MessageService, SelectItem } from 'primeng/api';
import { SignatureCanvasComponent } from '../../utils/signature-canvas.component';
import { PacientesService } from '../../services/pacientes/pacientes.service';
import { RegVacunacionService } from '../../services/reg_vacunacion/reg-vacunacion.service';
import { ConsentimientoService } from '../../services/documentos/consentimiento.service';

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
        Tag
    ],
    templateUrl: './reg-vacunacion.component.html',
    styleUrl: './reg-vacunacion.component.css',
    providers: [MessageService, ConfirmationService]
})
export class RegVacunacionComponent implements OnInit{
[x: string]: any;
    pacientes: any[] = [];
    historicoVacunas: any[] = [];
    historicoConsentimientos: any[] = [];

    dialogVacunas: boolean = false;
    dialogConsentimientos: boolean = false;

    constructor(
        private pacientesService: PacientesService,
        private regVacunacionService: RegVacunacionService,
        private consentimientoService: ConsentimientoService
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
        // abrir formulario de registro de vacunación
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

    async generarPDFConsentimiento(consentimiento: any) {
        if (!consentimiento.f_procesar_datos_consentimiento) {
            console.error("No hay HTML para generar el PDF");
            return;
        }

        const hiddenDiv = document.createElement("div");
        hiddenDiv.style.position = "fixed";
        hiddenDiv.style.left = "-9999px";
        hiddenDiv.style.top = "0";
        hiddenDiv.style.width = "800px";
        hiddenDiv.innerHTML = consentimiento.f_procesar_datos_consentimiento;
        document.body.appendChild(hiddenDiv);

        try {

            // 🔥 SOLUCIÓN: remover imágenes inválidas
            const imgs = hiddenDiv.querySelectorAll("img");
            imgs.forEach(img => {
                if (!img.src || img.src === "data:image/jpeg;base64," || img.src.trim() === "") {
                    console.warn("Imagen inválida eliminada:", img);
                    img.remove();
                }
            });

            const canvas = await html2canvas(hiddenDiv, { scale: 2 });
            const pdf = new jsPDF("p", "pt", "letter");

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const margin = 20;
            const imgWidth = pdfWidth - margin * 2;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = margin;

            const imgData = canvas.toDataURL("image/png");

            pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - margin * 2);

            while (heightLeft > 0) {
                pdf.addPage();
                position = margin - (imgHeight - heightLeft);
                pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
                heightLeft -= (pdfHeight - margin * 2);
            }

            pdf.save(`Consentimiento_${consentimiento.id}.pdf`);

        } catch (err) {
            console.error("Error generando PDF:", err);
        } finally {
            document.body.removeChild(hiddenDiv);
        }
    }


}
