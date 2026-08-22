import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { FieldsetModule } from 'primeng/fieldset';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ClienteService } from '../../../services/cliente/cliente.service';
import { ActasService } from '../../../services/actas/actas.service';
import { Cliente } from '../../../interfaces/cliente';
import { Acta, ActaIndicador, ActaPendiente, ActaActividadRealizada, ActaPriorizacion, ResponsableSST, InstanciaParaActa, CatalogoIndicador } from '../../../interfaces/acta';

const FUNDAMENTO_DEFAULT = `Cumplimiento a requerimiento Normativo: Fundamento DUR 1072/2015 CAPÍTULO 6 SISTEMA DE GESTIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO Artículo 2.2.4.6.1. Objeto y campo de aplicación. El presente capítulo tiene por objeto definir las directrices de obligatorio cumplimiento para implementar el Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST), que deben ser aplicadas por todos los empleadores públicos y privados, los contratantes de personal bajo modalidad de contrato civil, comercial o administrativo, las organizaciones de economía solidaria y del sector cooperativo, las empresas de servicios temporales y tener cobertura sobre los trabajadores dependientes, contratistas, trabajadores cooperados y los trabajadores en misión.`;

const SISTEMAS = [
    { label: 'SG-SST', value: 'SG-SST' },
    { label: 'Otras actividades', value: 'OTRAS_ACTIVIDADES' },
    { label: 'Incidentes o accidentes de trabajo', value: 'INCIDENTES_ACCIDENTES' }
];

const PRIORIDADES = [
    { label: 'ALTA', value: 'ALTA' },
    { label: 'MEDIA', value: 'MEDIA' },
    { label: 'BAJA', value: 'BAJA' }
];

@Component({
    selector: 'app-acta-formulario',
    standalone: true,
    imports: [
        CommonModule, FormsModule, ButtonModule, InputTextModule, InputTextarea, InputNumberModule,
        DropdownModule, TableModule, DialogModule, CalendarModule, ToastModule, FieldsetModule, CardModule, DividerModule
    ],
    templateUrl: './acta-formulario.component.html',
    styleUrls: ['./acta-formulario.component.css'],
    providers: [MessageService]
})
export class ActaFormularioComponent implements OnInit {
    clientes: Cliente[] = [];
    clienteSeleccionado: Cliente | null = null;
    responsables: ResponsableSST[] = [];
    responsableSeleccionado: ResponsableSST | null = null;
    catalogosIndicadores: CatalogoIndicador[] = [];
    acta: Acta = this.actaVacia();
    fechaActa: Date | null = null;
    fechaInicio: Date = new Date();
    fechaFin: Date = new Date();
    instanciasDisponibles: InstanciaParaActa[] = [];
    mostrarDialogoActividades = false;
    gruposIndicadores: { nombre: string; items: ActaIndicador[] }[] = [];

    sistemas = SISTEMAS;
    prioridades = PRIORIDADES;

    constructor(
        private clienteService: ClienteService,
        private actasService: ActasService,
        private route: ActivatedRoute,
        private router: Router,
        private messageService: MessageService
    ) {}

    async ngOnInit(): Promise<void> {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state as any;
        const actaBase = state?.actaBase as Acta | undefined;
        const idClienteQuery = Number(this.route.snapshot.queryParamMap.get('id_cliente')) || undefined;
        const idActaRuta = Number(this.route.snapshot.paramMap.get('id')) || null;

        try {
            await this.cargarDatosBase();

            if (idActaRuta) {
                await this.cargarActa(idActaRuta);
            } else if (actaBase) {
                this.acta = {
                    ...actaBase,
                    id_acta: undefined,
                    estado: 'BORRADOR',
                    version: 1,
                    actividades_realizadas: (actaBase as any).actividadesRealizadas || actaBase.actividades_realizadas || [],
                    pendientes: actaBase.pendientes || [],
                    priorizaciones: actaBase.priorizaciones || []
                };
                this.clienteSeleccionado = this.clientes.find(c => c.id_cliente === actaBase.id_cliente) || null;
                if (this.acta.fecha_acta) this.fechaActa = new Date(this.acta.fecha_acta);
                this.inicializarIndicadores(this.catalogosIndicadores, this.acta.indicadores);
            } else {
                await this.procesarClienteInicial(idClienteQuery);
                this.inicializarIndicadores(this.catalogosIndicadores, []);
            }
        } catch (error) {
            console.error('Error inicializando formulario:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo inicializar el formulario' });
        }
    }

    private async cargarDatosBase(): Promise<void> {
        const [clientes, responsables, catalogos] = await Promise.all([
            new Promise<Cliente[]>((resolve) => {
                this.clienteService.obtenerDatosClientes().then(obs => obs.subscribe({
                    next: (data: Cliente[]) => resolve(data || []),
                    error: (err: unknown) => {
                        console.error('Error cargando clientes:', err);
                        resolve([]);
                    }
                }));
            }),
            (await this.actasService.getResponsables()).toPromise(),
            (await this.actasService.getCatalogos()).toPromise()
        ]);

        this.clientes = clientes;
        this.responsables = responsables || [];
        this.catalogosIndicadores = catalogos?.indicadores || [];
    }

    private async procesarClienteInicial(idClienteInicial: number | undefined): Promise<void> {
        const idCliente = idClienteInicial ?? this.acta.id_cliente;
        if (!idCliente) return;

        this.clienteSeleccionado = this.clientes.find(c => c.id_cliente === idCliente) || null;
        if (this.clienteSeleccionado) {
            this.acta.id_cliente = this.clienteSeleccionado.id_cliente;
            this.acta.empresa_nombre = this.acta.empresa_nombre || this.clienteSeleccionado.nombre_razon_social;
            this.acta.empresa_nit = this.acta.empresa_nit || this.clienteSeleccionado.numero_identificacion;
        }
    }

    actaVacia(): Acta {
        return {
            id_cliente: undefined,
            mes: this.mesActual(),
            fecha_acta: null,
            empresa_nombre: '',
            empresa_nit: '',
            numero_personal_orientadores: 0,
            numero_personal_mantenimiento: 0,
            empresa_arl: '',
            clasificacion_riesgo: '',
            responsable_nombre: '',
            responsable_cedula: '',
            responsable_profesion: '',
            responsable_licencia: '',
            responsable_arl: '',
            fundamento_legal: FUNDAMENTO_DEFAULT,
            objetivos: '',
            indicadores: [],
            pendientes: [],
            actividades_realizadas: [],
            priorizaciones: []
        };
    }

    mesActual(): string {
        const hoy = new Date();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        return `${mes}/${hoy.getFullYear()}`;
    }

    inicializarIndicadores(catalogos: any[], indicadoresExistentes?: ActaIndicador[]): void {
        this.gruposIndicadores = [];
        for (const cat of catalogos || []) {
            const items: ActaIndicador[] = [];
            for (let p = 1; p <= cat.numero_posiciones; p++) {
                const existente = (indicadoresExistentes || []).find(i => i.tipo_indicador === cat.codigo && i.posicion === p);
                items.push({
                    tipo_indicador: cat.codigo,
                    posicion: p,
                    numerador: existente?.numerador ?? null,
                    denominador: existente?.denominador ?? null,
                    porcentaje: existente?.porcentaje || '',
                    observaciones: existente?.observaciones || ''
                });
            }
            this.gruposIndicadores.push({ nombre: cat.nombre, items });
        }
    }

    async cargarActa(id: number): Promise<void> {
        try {
            const data = await lastValueFrom(await this.actasService.getActaById(id));
            this.acta = {
                ...data,
                actividades_realizadas: (data as any).actividadesRealizadas || data.actividades_realizadas || [],
                pendientes: data.pendientes || [],
                priorizaciones: data.priorizaciones || []
            };
            this.clienteSeleccionado = this.clientes.find(c => c.id_cliente === data.id_cliente) || null;
            if (this.acta.fecha_acta) this.fechaActa = new Date(this.acta.fecha_acta);
            this.responsableSeleccionado = this.responsables.find(r => r.id_responsable === this.acta.id_responsable) || null;
            this.inicializarIndicadores(this.catalogosIndicadores, this.acta.indicadores);
        } catch (error: unknown) {
            console.error('Error cargando acta:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el acta' });
        }
    }

    cambiarResponsable(): void {
        if (!this.responsableSeleccionado) return;
        this.acta.id_responsable = this.responsableSeleccionado.id_responsable;
        this.acta.responsable_nombre = this.responsableSeleccionado.nombre;
        this.acta.responsable_cedula = this.responsableSeleccionado.cedula || '';
        this.acta.responsable_profesion = this.responsableSeleccionado.profesion || '';
        this.acta.responsable_licencia = this.responsableSeleccionado.licencia || '';
        this.acta.responsable_arl = this.responsableSeleccionado.arl || '';
    }

    agregarPendiente(): void {
        this.acta.pendientes = this.acta.pendientes || [];
        this.acta.pendientes.push({ categoria: '', descripcion: '', prioridad: '', observaciones: '', orden: this.acta.pendientes.length + 1 });
    }

    eliminarPendiente(index: number): void {
        this.acta.pendientes?.splice(index, 1);
    }

    agregarActividadManual(): void {
        this.acta.actividades_realizadas = this.acta.actividades_realizadas || [];
        this.acta.actividades_realizadas.push({
            sistema: 'SG-SST',
            titulo_actividad: '',
            descripcion: '',
            observaciones_ejecucion: '',
            fecha_actividad: null,
            orden: this.acta.actividades_realizadas.length + 1
        });
    }

    eliminarActividad(index: number): void {
        this.acta.actividades_realizadas?.splice(index, 1);
    }

    async buscarInstancias(): Promise<void> {
        const fi = this.fechaInicio.toISOString().split('T')[0];
        const ff = this.fechaFin.toISOString().split('T')[0];
        try {
            const data = await lastValueFrom(await this.actasService.getInstancias(fi, ff));
            this.instanciasDisponibles = data;
            this.mostrarDialogoActividades = true;
        } catch (error: unknown) {
            console.error('Error buscando instancias:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron buscar las actividades' });
        }
    }

    agregarActividadDesdeInstancia(ins: InstanciaParaActa): void {
        this.acta.actividades_realizadas = this.acta.actividades_realizadas || [];
        this.acta.actividades_realizadas.push({
            id_instancia: ins.id_instancia,
            sistema: 'SG-SST',
            titulo_actividad: ins.actividad?.titulo || '',
            descripcion: `${ins.actividad?.titulo || ''}. ${ins.observaciones_ejecucion || ''}`,
            observaciones_ejecucion: ins.observaciones_ejecucion || '',
            fecha_actividad: ins.fecha,
            orden: this.acta.actividades_realizadas.length + 1
        });
    }

    agregarPriorizacion(): void {
        this.acta.priorizaciones = this.acta.priorizaciones || [];
        this.acta.priorizaciones.push({ categoria: '', descripcion: '', orden: this.acta.priorizaciones.length + 1 });
    }

    eliminarPriorizacion(index: number): void {
        this.acta.priorizaciones?.splice(index, 1);
    }

    prepararActaParaGuardar(): Acta | null {
        const idCliente = this.clienteSeleccionado?.id_cliente ?? this.acta.id_cliente;
        if (!idCliente || idCliente <= 0) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un cliente' });
            return null;
        }

        const indicadores: ActaIndicador[] = [];
        for (const grupo of this.gruposIndicadores) {
            for (const item of grupo.items) {
                indicadores.push(item);
            }
        }
        return {
            ...this.acta,
            id_cliente: idCliente,
            fecha_acta: this.fechaActa ? this.fechaActa.toISOString().split('T')[0] : null,
            indicadores,
            pendientes: this.acta.pendientes || [],
            actividades_realizadas: this.acta.actividades_realizadas || [],
            priorizaciones: this.acta.priorizaciones || []
        };
    }

    async guardar(): Promise<void> {
        const data = this.prepararActaParaGuardar();
        if (!data) return;

        try {
            if (this.acta.id_acta) {
                await lastValueFrom(await this.actasService.actualizarActa(data));
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Acta actualizada' });
            } else {
                const res = await lastValueFrom(await this.actasService.crearActa(data));
                this.acta.id_acta = res.body.id_acta;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Acta creada' });
            }
        } catch (error: unknown) {
            console.error('Error guardando acta:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el acta' });
        }
    }

    async cerrar(): Promise<void> {
        if (!this.acta.id_acta) return;
        try {
            await lastValueFrom(await this.actasService.cerrarActa(this.acta.id_acta));
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Acta cerrada' });
            this.router.navigate(['/actas']);
        } catch (error: unknown) {
            console.error('Error cerrando acta:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cerrar el acta' });
        }
    }

    async descargarDocx(): Promise<void> {
        if (!this.acta.id_acta) return;
        try {
            const blob = await lastValueFrom(await this.actasService.descargarDocx(this.acta.id_acta));
            this.descargarBlob(blob, `acta_${this.acta.id_acta}.docx`);
        } catch (error: unknown) {
            console.error('Error descargando DOCX:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el DOCX' });
        }
    }

    async descargarPdf(): Promise<void> {
        if (!this.acta.id_acta) return;
        try {
            const blob = await lastValueFrom(await this.actasService.descargarPdf(this.acta.id_acta));
            this.descargarBlob(blob, `acta_${this.acta.id_acta}.pdf`);
        } catch (error: unknown) {
            console.error('Error descargando PDF:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el PDF' });
        }
    }

    async enviar(): Promise<void> {
        if (!this.acta.id_acta) return;
        try {
            await lastValueFrom(await this.actasService.enviarActa(this.acta.id_acta));
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Acta enviada' });
        } catch (error: unknown) {
            console.error('Error enviando acta:', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el acta' });
        }
    }

    volver(): void {
        this.router.navigate(['/actas']);
    }

    private descargarBlob(blob: Blob, nombre: string): void {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
