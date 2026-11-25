import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { ClienteService } from '../../../../services/cliente/cliente.service';
import { SgSstEstandaresService } from '../../../../services/sg-sst-estandares/sg-sst-estandares.service';
import { SecureStorageService } from '../../../../services/secure-storage.service';
import { Cliente } from '../../../../interfaces/cliente';
import {
    SgsstExtintor,
    SgsstRegistro,
    SgsstRegistroPayload,
    SgsstResponsable
} from '../../../../interfaces/sgsst-estandar-registro';
import {
    CARGO_INSPECTOR_DEFAULT,
    CRITERIOS_EXTINTOR,
    CriterioExtintor,
    GRUPOS_CRITERIOS,
    OBSERVACIONES_DEFAULT,
    TIPOS_EXTINTOR,
    VALORES_CRITERIO,
    crearCriteriosDefault
} from '../../../../data/sgsst-extintores';
import { procesarImagenEvidencia } from '../../../../utils/image-compress.util';

interface FormularioInspeccion {
    mesISO: string;
    fecha: string;
    inspector: string;
    cargo: string;
    ciudad: string;
    direccion: string;
    telefono: string;
    observaciones: string;
    estado: 'borrador' | 'cerrada';
    id_responsable_sst: number | null;
    firma_base64: string | null;
    extintores: SgsstExtintor[];
}

@Component({
    selector: 'app-sgsst-inspeccion-extintores-formulario',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, DropdownModule],
    templateUrl: './inspeccion-extintores-formulario.component.html',
    styleUrls: ['./inspeccion-extintores-formulario.component.css', '../acciones-soft.css'],
    providers: [MessageService]
})
export class InspeccionExtintoresFormularioComponent implements OnInit, OnDestroy {

    @ViewChild('firmaCanvas') firmaCanvas?: ElementRef<HTMLCanvasElement>;

    readonly pasos = ['Datos', 'Extintores', 'Observaciones', 'Revisión'];
    readonly tiposExtintor = TIPOS_EXTINTOR;
    readonly valoresCriterio = VALORES_CRITERIO;
    readonly gruposCriterios = GRUPOS_CRITERIOS;
    readonly criterios = CRITERIOS_EXTINTOR;
    readonly unidades = [
        { label: 'LB', value: 'LB' },
        { label: 'KG', value: 'KG' }
    ];

    grupoId = '';
    opcionId = '';
    idRegistro: number | null = null;
    idCliente = 0;
    cliente: Cliente | null = null;
    responsables: SgsstResponsable[] = [];
    responsableSeleccionadoId: number | null = null;

    paso = 1;
    cargando = false;
    guardando = false;
    intentoGuardar = false;
    procesandoFoto = false;
    modoFirma: 'guardada' | 'dibujar' = 'guardada';
    colapsados = new Set<number>();

    form: FormularioInspeccion = this.formularioVacio();

    private sub = new Subscription();
    private firmaInicializada = false;
    private dibujando = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private clienteService: ClienteService,
        private estandaresService: SgSstEstandaresService,
        private secureStorage: SecureStorageService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        window.scrollTo({ top: 0 });
        this.sub.add(
            combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, query]) => {
                this.grupoId = params.get('grupoId') || '';
                this.opcionId = params.get('opcionId') || '';
                const idRegistro = Number(params.get('idRegistro')) || 0;
                const queryCliente = Number(query.get('cliente')) || 0;
                const guardado = Number(localStorage.getItem('sgsst_idCliente')) || 0;
                const idCliente = queryCliente || guardado;

                if (!this.grupoId || !this.opcionId || !idCliente) {
                    this.volverAlHub();
                    return;
                }

                if (this.idCliente === idCliente && this.idRegistro === (idRegistro || null) && this.cliente) {
                    return;
                }

                this.idCliente = idCliente;
                this.idRegistro = idRegistro || null;
                this.cargar();
            })
        );
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    get nombreCliente(): string {
        return this.cliente?.nombre_razon_social || 'Cliente';
    }

    get responsableActual(): SgsstResponsable | null {
        return this.responsables.find(responsable => responsable.id_responsable === this.responsableSeleccionadoId) || null;
    }

    get responsablesOpciones(): { id: number; label: string }[] {
        return this.responsables.map(responsable => ({
            id: responsable.id_responsable,
            label: responsable.profesion ? `${responsable.nombre} — ${responsable.profesion}` : responsable.nombre
        }));
    }

    get totalFotos(): number {
        return this.form.extintores.filter(extintor => !!extintor.foto).length;
    }

    get faltantesFoto(): number {
        return this.form.extintores.length - this.totalFotos;
    }

    get pesoTotal(): number {
        return this.form.extintores.reduce((total, extintor) => total + (extintor.foto?.peso_bytes || 0), 0);
    }

    get esNuevo(): boolean {
        return !this.idRegistro;
    }

    private formularioVacio(): FormularioInspeccion {
        return {
            mesISO: this.mesActualISO(),
            fecha: this.hoyISO(),
            inspector: '',
            cargo: CARGO_INSPECTOR_DEFAULT,
            ciudad: '',
            direccion: '',
            telefono: '',
            observaciones: OBSERVACIONES_DEFAULT,
            estado: 'borrador',
            id_responsable_sst: null,
            firma_base64: null,
            extintores: [this.crearExtintor()]
        };
    }

    private crearExtintor(): SgsstExtintor {
        return {
            tipo: 'Multipropósito',
            ubicacion: '',
            capacidad: '10',
            unidad: 'LB',
            fecha_proxima_recarga: '',
            proveedor: '',
            criterios: crearCriteriosDefault(),
            foto: null,
            foto_nueva: false
        };
    }

    private async cargar(): Promise<void> {
        this.cargando = true;
        try {
            const clientesObs = await this.clienteService.obtenerDatosClientes();
            const clientes = await firstValueFrom(clientesObs);
            this.cliente = (clientes || []).find(cliente => cliente.id_cliente === this.idCliente) || null;
            if (!this.cliente) {
                this.volverAlHub();
                return;
            }

            const responsablesObs = await this.estandaresService.getResponsables();
            this.responsables = (await firstValueFrom(responsablesObs)) || [];

            if (this.idRegistro) {
                const registroObs = await this.estandaresService.getRegistro(this.idRegistro);
                const registro = await firstValueFrom(registroObs);
                this.aplicarRegistro(registro);
            } else {
                await this.iniciarNuevoFormulario();
            }
        } catch {
            Swal.fire('Error', 'No se pudo cargar la inspección.', 'error');
        } finally {
            this.cargando = false;
        }
    }

    private async iniciarNuevoFormulario(): Promise<void> {
        const idUsuario = Number(await this.secureStorage.getItem('idUser')) || 0;
        const responsable = this.responsables.find(item => item.id_usuario && item.id_usuario === idUsuario)
            || this.responsables[0]
            || null;

        const extintores = await this.obtenerExtintoresPrevios();

        this.form = {
            ...this.formularioVacio(),
            ciudad: this.cliente?.ciudad || '',
            direccion: this.cliente?.direccion || '',
            telefono: this.cliente?.telefono || '',
            id_responsable_sst: responsable?.id_responsable ?? null,
            firma_base64: responsable?.firma_base64 || null,
            extintores
        };
        this.responsableSeleccionadoId = responsable?.id_responsable ?? null;
        this.modoFirma = this.form.firma_base64 ? 'guardada' : 'dibujar';
        this.paso = 1;
        this.intentoGuardar = false;
        this.colapsados = new Set<number>();
        for (let i = 1; i < extintores.length; i++) {
            this.colapsados.add(i);
        }
    }

    private async obtenerExtintoresPrevios(): Promise<SgsstExtintor[]> {
        try {
            const observable = await this.estandaresService.getRegistros(this.idCliente);
            const registros = (await firstValueFrom(observable)) || [];
            const conExtintores = registros.filter(registro => (registro.total_extintores || 0) > 0);
            if (conExtintores.length === 0) return [this.crearExtintor()];

            const elegido = conExtintores.find(registro => registro.estado === 'cerrada') || conExtintores[0];
            const cantidad = Math.max(1, elegido.total_extintores || 1);

            if (!elegido.id_registro) {
                return Array.from({ length: cantidad }, () => this.crearExtintor());
            }

            const detalleObs = await this.estandaresService.getRegistro(elegido.id_registro);
            const detalle = await firstValueFrom(detalleObs);
            const previos = detalle?.extintores || [];

            if (previos.length === 0) {
                return Array.from({ length: cantidad }, () => this.crearExtintor());
            }

            return previos.map(previo => ({
                ...this.crearExtintor(),
                tipo: previo.tipo || 'Multipropósito',
                ubicacion: previo.ubicacion || '',
                capacidad: previo.capacidad || '10',
                unidad: previo.unidad || 'LB'
            }));
        } catch {
            return [this.crearExtintor()];
        }
    }

    private aplicarRegistro(registro: SgsstRegistro): void {
        const extintores = (registro.extintores || []).map(extintor => ({
            id_extintor: extintor.id_extintor,
            tipo: extintor.tipo || '',
            ubicacion: extintor.ubicacion || '',
            capacidad: extintor.capacidad || '',
            unidad: extintor.unidad || 'LB',
            fecha_proxima_recarga: extintor.fecha_proxima_recarga || '',
            proveedor: extintor.proveedor || '',
            criterios: { ...crearCriteriosDefault(), ...(extintor.criterios || {}) },
            foto: extintor.foto ? { ...extintor.foto } : null,
            foto_nueva: false
        }));

        this.form = {
            mesISO: registro.mes_registro || this.mesActualISO(),
            fecha: registro.fecha_inspeccion || this.hoyISO(),
            inspector: registro.nombre_inspector || '',
            cargo: registro.cargo_inspector || CARGO_INSPECTOR_DEFAULT,
            ciudad: registro.ciudad || '',
            direccion: registro.direccion || '',
            telefono: registro.telefono || '',
            observaciones: registro.observaciones || OBSERVACIONES_DEFAULT,
            estado: registro.estado === 'cerrada' ? 'cerrada' : 'borrador',
            id_responsable_sst: registro.id_responsable_sst ?? null,
            firma_base64: registro.firma_base64 || null,
            extintores: extintores.length > 0 ? extintores : [this.crearExtintor()]
        };
        this.responsableSeleccionadoId = this.form.id_responsable_sst;
        this.modoFirma = this.form.firma_base64 ? 'guardada' : 'dibujar';
        this.paso = 1;
        this.intentoGuardar = false;
        this.colapsados.clear();
    }

    onResponsableChange(id: number | null): void {
        this.responsableSeleccionadoId = id ? Number(id) : null;
        this.form.id_responsable_sst = this.responsableSeleccionadoId;
        const responsable = this.responsableActual;
        this.form.firma_base64 = responsable?.firma_base64 || null;
        this.modoFirma = this.form.firma_base64 ? 'guardada' : 'dibujar';
        this.firmaInicializada = false;
        if (this.paso === 3 && this.modoFirma === 'dibujar') {
            this.inicializarFirma();
        }
    }

    irPaso(paso: number): void {
        if (paso > this.paso) {
            if (this.paso === 1 && !this.validarPaso1()) return;
            if (this.paso === 2 && this.form.extintores.length === 0) {
                this.messageService.add({ severity: 'warn', summary: 'Extintores', detail: 'Agrega al menos un extintor.' });
                return;
            }
            if (this.paso === 2) {
                this.intentoGuardar = true;
                const invalidos = this.validarExtintores();
                if (invalidos.length > 0) {
                    const primero = invalidos[0];
                    this.enfocarExtintor(primero.indice, primero.campo);
                    Swal.fire('Faltan datos', primero.mensaje, 'warning');
                    return;
                }
                if (this.faltantesFoto > 0) {
                    this.messageService.add({ severity: 'warn', summary: 'Fotos', detail: `Faltan ${this.faltantesFoto} foto(s) de extintor.` });
                }
            }
        }
        this.paso = Math.max(1, Math.min(4, paso));
        this.firmaInicializada = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (this.paso === 3 && this.modoFirma === 'dibujar') {
            this.inicializarFirma();
        }
    }

    campoInvalido(extintor: SgsstExtintor, campo: 'tipo' | 'ubicacion' | 'capacidad'): boolean {
        if (!this.intentoGuardar) return false;
        return !String(extintor[campo] ?? '').trim();
    }

    private validarExtintores(): { indice: number; campo: string; mensaje: string }[] {
        const errores: { indice: number; campo: string; mensaje: string }[] = [];
        this.form.extintores.forEach((extintor, indice) => {
            if (!String(extintor.tipo || '').trim()) {
                errores.push({ indice, campo: 'tipo', mensaje: `Extintor #${indice + 1}: falta el tipo.` });
            }
            if (!String(extintor.ubicacion || '').trim()) {
                errores.push({ indice, campo: 'ubicacion', mensaje: `Extintor #${indice + 1}: falta la ubicación.` });
            }
            if (!String(extintor.capacidad || '').trim()) {
                errores.push({ indice, campo: 'capacidad', mensaje: `Extintor #${indice + 1}: falta la capacidad.` });
            }
        });
        return errores;
    }

    private enfocarExtintor(indice: number, campo: string): void {
        this.paso = 2;
        this.colapsados.delete(indice);
        setTimeout(() => {
            const contenedor = document.querySelector(`[data-testid="extintor-${indice}"]`);
            const campoEl = document.querySelector(`[data-testid="extintor-${indice}-${campo}"]`) as HTMLElement | null;
            contenedor?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const input = campoEl?.querySelector('input, textarea, .p-dropdown') as HTMLElement | null;
            input?.focus?.();
        }, 100);
    }

    private validarPaso1(): boolean {
        if (!this.form.mesISO || !this.form.fecha || !this.form.inspector.trim()
            || !this.form.cargo.trim() || !this.form.ciudad.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Datos incompletos',
                detail: 'Completa mes, fecha, inspector, cargo y ciudad.'
            });
            return false;
        }
        return true;
    }

    agregarExtintor(): void {
        this.form.extintores.push(this.crearExtintor());
        this.colapsados.clear();
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
    }

    eliminarExtintor(indice: number): void {
        this.form.extintores.splice(indice, 1);
        this.colapsados.clear();
    }

    estaColapsado(indice: number): boolean {
        return this.colapsados.has(indice);
    }

    toggleExtintor(indice: number): void {
        if (this.colapsados.has(indice)) {
            this.colapsados.delete(indice);
        } else {
            this.colapsados.add(indice);
        }
    }

    setCriterio(extintor: SgsstExtintor, criterio: CriterioExtintor, valor: string): void {
        extintor.criterios[criterio.key] = valor;
    }

    claseValor(valor: string): string {
        if (valor === 'N/A') return 'na';
        return valor.toLowerCase();
    }

    criteriosDeGrupo(grupo: string): CriterioExtintor[] {
        return this.criterios.filter(criterio => criterio.grupo === grupo);
    }

    async onFoto(event: Event, extintor: SgsstExtintor): Promise<void> {
        const input = event.target as HTMLInputElement;
        const archivo = input.files && input.files[0];
        input.value = '';
        if (!archivo) return;

        if (archivo.size > 15 * 1024 * 1024) {
            this.messageService.add({ severity: 'error', summary: 'Imagen muy pesada', detail: 'La imagen original supera 15 MB.' });
            return;
        }
        if (['image/jpeg', 'image/png', 'image/webp'].indexOf(archivo.type) === -1) {
            this.messageService.add({ severity: 'error', summary: 'Formato no permitido', detail: 'Usa JPG, PNG o WebP.' });
            return;
        }

        this.procesandoFoto = true;
        try {
            const procesada = await procesarImagenEvidencia(archivo, {
                maxLado: 1280,
                calidad: 0.55,
                thumbWidth: 200,
                thumbCalidad: 0.45
            });

            if (procesada.pesoBytes > 1024 * 1024) {
                this.messageService.add({ severity: 'error', summary: 'Imagen muy pesada', detail: 'La imagen comprimida supera 1 MB.' });
                return;
            }

            extintor.foto = {
                archivo_base64: procesada.base64,
                thumb_base64: procesada.thumbBase64,
                mime_type: procesada.mimeType,
                peso_bytes: procesada.pesoBytes,
                nombre_original: archivo.name
            };
            extintor.foto_nueva = true;
            this.messageService.add({
                severity: 'success',
                summary: 'Foto comprimida',
                detail: `Peso final: ${this.formatearPeso(procesada.pesoBytes)}`
            });
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar la imagen.' });
        } finally {
            this.procesandoFoto = false;
        }
    }

    eliminarFoto(extintor: SgsstExtintor): void {
        extintor.foto = null;
        extintor.foto_nueva = false;
    }

    rutaImagen(extintor: SgsstExtintor): string {
        if (!extintor.foto) return '';
        return `data:${extintor.foto.mime_type || 'image/jpeg'};base64,${extintor.foto.archivo_base64}`;
    }

    firmarEnPantalla(): void {
        this.modoFirma = 'dibujar';
        this.form.firma_base64 = null;
        this.firmaInicializada = false;
        this.inicializarFirma();
    }

    usarFirmaGuardada(): void {
        const responsable = this.responsableActual;
        if (!responsable?.firma_base64) return;
        this.form.firma_base64 = responsable.firma_base64;
        this.modoFirma = 'guardada';
    }

    limpiarFirma(): void {
        this.form.firma_base64 = null;
        const canvas = this.firmaCanvas?.nativeElement;
        if (!canvas) return;
        const contexto = canvas.getContext('2d');
        if (!contexto) return;
        contexto.save();
        contexto.setTransform(1, 0, 0, 1, 0, 0);
        contexto.clearRect(0, 0, canvas.width, canvas.height);
        contexto.restore();
    }

    private inicializarFirma(): void {
        setTimeout(() => {
            const canvas = this.firmaCanvas?.nativeElement;
            if (!canvas || this.firmaInicializada) return;
            this.firmaInicializada = true;

            const rect = canvas.getBoundingClientRect();
            const ratio = window.devicePixelRatio || 1;
            canvas.width = Math.max(1, Math.round(rect.width * ratio));
            canvas.height = Math.max(1, Math.round(rect.height * ratio));
            const contexto = canvas.getContext('2d');
            if (!contexto) return;
            contexto.scale(ratio, ratio);
            contexto.lineWidth = 2.2;
            contexto.lineCap = 'round';
            contexto.lineJoin = 'round';
            contexto.strokeStyle = '#0f172a';

            if (this.form.firma_base64) {
                const imagen = new Image();
                imagen.onload = () => contexto.drawImage(imagen, 0, 0, rect.width, rect.height);
                imagen.src = this.form.firma_base64;
            }

            const posicion = (evento: PointerEvent): { x: number; y: number } => {
                const actual = canvas.getBoundingClientRect();
                return { x: evento.clientX - actual.left, y: evento.clientY - actual.top };
            };

            canvas.onpointerdown = (evento: PointerEvent) => {
                this.dibujando = true;
                const punto = posicion(evento);
                contexto.beginPath();
                contexto.moveTo(punto.x, punto.y);
                evento.preventDefault();
            };

            canvas.onpointermove = (evento: PointerEvent) => {
                if (!this.dibujando) return;
                const punto = posicion(evento);
                contexto.lineTo(punto.x, punto.y);
                contexto.stroke();
                evento.preventDefault();
            };

            const terminar = () => {
                if (!this.dibujando) return;
                this.dibujando = false;
                this.form.firma_base64 = canvas.toDataURL('image/png');
            };

            canvas.onpointerup = terminar;
            canvas.onpointerleave = terminar;
            canvas.onpointercancel = terminar;
        }, 60);
    }

    async guardar(estado: 'borrador' | 'cerrada', luegoPdf = false): Promise<void> {
        if (this.guardando) return;
        if (!this.validarPaso1()) {
            this.paso = 1;
            return;
        }

        this.intentoGuardar = true;
        const invalidos = this.validarExtintores();
        if (invalidos.length > 0) {
            const primero = invalidos[0];
            this.enfocarExtintor(primero.indice, primero.campo);
            Swal.fire('Faltan datos', primero.mensaje, 'warning');
            return;
        }
        if (this.form.extintores.length === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Extintores', detail: 'Agrega al menos un extintor.' });
            this.paso = 2;
            return;
        }
        if (estado === 'cerrada') {
            const sinFoto = this.form.extintores.findIndex(extintor => !extintor.foto);
            if (sinFoto >= 0) {
                this.enfocarExtintor(sinFoto, 'foto');
                Swal.fire('Fotos obligatorias', `Falta la foto del extintor #${sinFoto + 1}.`, 'warning');
                return;
            }
        }

        const payload: SgsstRegistroPayload = {
            id_registro: this.idRegistro || undefined,
            id_cliente: this.idCliente,
            mes_registro: this.form.mesISO,
            fecha_inspeccion: this.form.fecha,
            nombre_inspector: this.form.inspector.trim(),
            cargo_inspector: this.form.cargo.trim(),
            ciudad: this.form.ciudad.trim(),
            direccion: this.form.direccion.trim(),
            telefono: this.form.telefono.trim(),
            observaciones: this.form.observaciones,
            id_responsable_sst: this.form.id_responsable_sst,
            firma_base64: this.form.firma_base64,
            estado,
            extintores: this.form.extintores.map(extintor => ({
                id_extintor: extintor.id_extintor,
                tipo: extintor.tipo,
                ubicacion: extintor.ubicacion,
                capacidad: extintor.capacidad,
                unidad: extintor.unidad,
                fecha_proxima_recarga: extintor.fecha_proxima_recarga || null,
                proveedor: extintor.proveedor || '',
                criterios: { ...extintor.criterios },
                foto: extintor.foto_nueva && extintor.foto
                    ? {
                        archivo_base64: extintor.foto.archivo_base64,
                        thumb_base64: extintor.foto.thumb_base64 || null,
                        mime_type: extintor.foto.mime_type || 'image/jpeg',
                        nombre_original: extintor.foto.nombre_original || null
                    }
                    : null
            }))
        };

        this.guardando = true;
        try {
            if (this.idRegistro) {
                const observable = await this.estandaresService.actualizarRegistro(payload);
                await firstValueFrom(observable);
            } else {
                const observable = await this.estandaresService.crearRegistro(payload);
                const respuesta = await firstValueFrom(observable);
                this.idRegistro = respuesta.body?.id_registro || null;
            }

            this.form.estado = estado;

            if (luegoPdf && this.idRegistro) {
                await this.descargarPdf(this.idRegistro);
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Borrador guardado y PDF generado.' });
                return;
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Guardado',
                detail: estado === 'cerrada' ? 'Inspección cerrada correctamente.' : 'Borrador guardado correctamente.'
            });
            this.volverLista();
        } catch (error) {
            console.error('Error al guardar la inspección:', error);
            const err = error as any;
            const mensaje = err?.error?.msg || 'No se pudo guardar la inspección.';
            const extintor = Number(err?.error?.extintor);
            const campo = err?.error?.campo;
            if (extintor > 0 && campo) {
                this.enfocarExtintor(extintor - 1, campo);
            } else {
                this.paso = 2;
            }
            Swal.fire('No se pudo guardar', mensaje, 'error');
        } finally {
            this.guardando = false;
        }
    }

    async verPdf(): Promise<void> {
        if (!this.idRegistro) {
            await this.guardar('borrador', true);
            return;
        }
        await this.descargarPdf(this.idRegistro);
    }

    private async descargarPdf(idRegistro: number): Promise<void> {
        try {
            const observable = await this.estandaresService.generarPdf(idRegistro);
            const blob = await firstValueFrom(observable);
            const url = URL.createObjectURL(blob);
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = `Inspeccion_Extintores_${(this.form.fecha || '').replace(/-/g, '') || idRegistro}.pdf`;
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);
            URL.revokeObjectURL(url);
        } catch {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF.' });
        }
    }

    volverLista(): void {
        this.router.navigate(
            ['/gestion-sg-sst/estandares', this.grupoId, this.opcionId],
            { queryParams: { cliente: this.idCliente } }
        );
    }

    volverAlHub(): void {
        this.router.navigate(['/gestion-sg-sst/sg-sst']);
    }

    hallazgos(extintor: SgsstExtintor): string {
        const total = Object.values(extintor.criterios).filter(valor => valor === 'R' || valor === 'M').length;
        return total > 0 ? `${total} hallazgo(s)` : 'Sin hallazgos';
    }

    formatearPeso(bytes?: number | null): string {
        if (!bytes) return '0 KB';
        if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
        return `${Math.round(bytes / 1024)} KB`;
    }

    private hoyISO(): string {
        const hoy = new Date();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        return `${hoy.getFullYear()}-${mes}-${dia}`;
    }

    private mesActualISO(): string {
        const hoy = new Date();
        return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    }
}
