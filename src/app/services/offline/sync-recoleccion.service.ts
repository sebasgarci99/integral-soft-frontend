import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { OfflineDbService, OutboxRecoleccion } from './offline-db.service';
import { NetworkService } from './network.service';

const TIMEOUT_ENVIO_MS = 8000;
const INTERVALO_SINCRONIZACION_MS = 60000;

const CAMPOS_NUMERICOS = [
    'aprovechables',
    'no_aprovechables',
    'biosanitarios',
    'cortopunzantes',
    'cortopunzantes_ng',
    'cortopunzantes_k',
    'anatomopatologicos',
    'farmacos',
    'chatarra_electronica',
    'pilas',
    'quimicos',
    'iluminarias',
    'aceites_usados',
    'toneres',
    'aprovechables_organicos',
    'de_animales',
    'corrosivos',
    'explosivos',
    'reactivos',
    'toxicos',
    'inflamables',
    'radioactivos',
    'bolsas_g',
    'bolsas_b',
    'bolsas_r',
    'bolsas_n',
    'dias_almacenamiento'
];

const CAMPOS_OPCIONALES = [
    'pret_usado',
    'tratamiento',
    'hora_roja',
    'hora_negra',
    'dotacion_perso_adecuada',
    'dotacion_pers_pseg_adecuada',
    'blob_firma'
];

export type FaseSync = 'inactivo' | 'internet' | 'servidor' | 'enviando' | 'completado' | 'error';

export interface EstadoSync {
    fase: FaseSync;
    mensaje: string;
    enviados: number;
    total: number;
    error: string | null;
}

export interface ResultadoEnvio {
    ok: boolean;
    motivo: string;
    permanente?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SyncRecoleccionService {

    private readonly urlCrear = `${enviroment.endpoint}api/reg_recoleccion/crear_actualizar_reg_recoleccion`;
    private iniciado = false;
    private sincronizando = false;
    private intervalo: ReturnType<typeof setInterval> | null = null;

    private readonly pendientesSubject = new BehaviorSubject<number>(0);
    readonly pendientes$: Observable<number> = this.pendientesSubject.asObservable();

    private readonly estadoSubject = new BehaviorSubject<EstadoSync>({
        fase: 'inactivo', mensaje: '', enviados: 0, total: 0, error: null
    });
    readonly estadoSync$: Observable<EstadoSync> = this.estadoSubject.asObservable();

    private readonly beforeUnloadHandler = (event: BeforeUnloadEvent): void => {
        if (this.pendientesSubject.value > 0) {
            event.preventDefault();
            event.returnValue = 'Hay registros de recolección pendientes de sincronizar.';
        }
    };

    constructor(
        private http: HttpClient,
        private secureStorage: SecureStorageService,
        private offlineDb: OfflineDbService,
        private network: NetworkService
    ) {}

    /** Registra los disparadores de sincronización (una sola vez). */
    iniciar(): void {
        if (this.iniciado) { return; }
        this.iniciado = true;

        window.addEventListener('online', () => this.sincronizarPendientes());
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') { this.sincronizarPendientes(); }
        });

        this.intervalo = setInterval(() => this.sincronizarPendientes(), INTERVALO_SINCRONIZACION_MS);

        // Avisa al cerrar/recargar la pestaña si quedan registros sin sincronizar.
        window.addEventListener('beforeunload', this.beforeUnloadHandler);

        this.sincronizarPendientes();
    }

    /** Consulta la cola y notifica el nuevo conteo de pendientes. */
    async actualizarContador(): Promise<number> {
        const total = await this.offlineDb.contarPendientes();
        this.pendientesSubject.next(total);
        return total;
    }

    /**
     * Envía un payload al backend. Devuelve true solo si el servidor confirmó
     * la operación. Un timeout NO significa fallo: el upsert por uuid_cliente
     * hace seguro el reintento.
     */
    async enviarPayload(payload: Record<string, unknown>): Promise<ResultadoEnvio> {
        let token: string | null = null;
        try {
            token = await this.secureStorage.getItem('token');
        } catch {
            token = null;
        }

        if (!token) {
            return {
                ok: false,
                motivo: 'No se pudo leer el token de sesión. La sesión puede haber expirado o el sitio no está sobre HTTPS.'
            };
        }

        try {
            const headers = new HttpHeaders()
                .set('authorization', `Bearer ${token}`)
                .set('x-offline-sync', '1');

            const respuesta: any = await firstValueFrom(
                this.http.post(this.urlCrear, payload, { headers }).pipe(timeout(TIMEOUT_ENVIO_MS))
            );

            if (respuesta?.state === 'OK') {
                return { ok: true, motivo: '' };
            }

            const detalle = typeof respuesta?.body === 'string'
                ? respuesta.body
                : respuesta?.msg;

            return {
                ok: false,
                motivo: detalle || 'El servidor rechazó el registro.',
                permanente: true
            };
        } catch (error) {
            const e = error as HttpErrorResponse;
            const nombreError = (error as any)?.name;
            const cuerpoError: any = (e as any)?.error;
            const detalle = typeof cuerpoError?.body === 'string'
                ? cuerpoError.body
                : cuerpoError?.msg;

            if (nombreError === 'TimeoutError' || e?.status === 0) {
                return { ok: false, motivo: 'Sin respuesta del servidor (tiempo de espera agotado).' };
            }
            if (e?.status === 401 || e?.status === 403) {
                return { ok: false, motivo: 'Sesión no válida o expirada. Vuelve a iniciar sesión.' };
            }
            if (e?.status === 429) {
                return { ok: false, motivo: 'Demasiadas solicitudes al servidor. Intenta de nuevo en unos minutos.' };
            }
            if (e?.status === 400 || e?.status === 409 || e?.status === 422) {
                return {
                    ok: false,
                    motivo: detalle || `El registro fue rechazado (HTTP ${e.status}).`,
                    permanente: true
                };
            }
            if (e?.status) {
                return { ok: false, motivo: detalle || `Error del servidor (HTTP ${e.status}).` };
            }

            return { ok: false, motivo: 'No se pudo conectar con el servidor.' };
        }
    }

    /**
     * Normaliza payloads creados por versiones anteriores de la app.
     * Algunos registros antiguos no traen "toneres" ni otros campos, y el
     * backend rechazaba el envío con error 500.
     */
    private normalizarPayload(item: OutboxRecoleccion): Record<string, unknown> {
        const payload: Record<string, unknown> = { ...(item.payload || {}) };
        const numero = (valor: unknown): number => {
            const n = Number(valor);
            return Number.isFinite(n) ? n : 0;
        };

        for (const campo of CAMPOS_NUMERICOS) {
            payload[campo] = numero(payload[campo]);
        }

        for (const campo of CAMPOS_OPCIONALES) {
            if (payload[campo] === undefined || payload[campo] === '') {
                payload[campo] = null;
            }
        }

        const idConsultorio = Number(payload['id_consultorio']);
        payload['id_consultorio'] = Number.isInteger(idConsultorio) && idConsultorio > 0
            ? idConsultorio
            : null;

        payload['uuid_cliente'] = item.uuid_cliente;
        payload['id_usuario'] = item.id_usuario || payload['id_usuario'] || 0;
        payload['id_empresa'] = item.id_empresa || payload['id_empresa'] || 0;

        return payload;
    }

    /** Vacía la cola uno a uno. Los errores de validación no bloquean los demás registros. */
    async sincronizarPendientes(): Promise<void> {
        if (this.sincronizando) { return; }
        this.sincronizando = true;

        try {
            this.emitir(
                'internet',
                this.network.estaOnline
                    ? 'Conexión a internet detectada.'
                    : 'Sin conexión a internet reportada por el dispositivo.'
            );

            const pendientes = await this.offlineDb.obtenerPendientes('asc');
            const total = pendientes.length;

            if (total === 0) {
                this.emitir('completado', 'No hay registros pendientes por sincronizar.', 0, 0);
                return;
            }

            this.emitir('servidor', 'Conectando con el servidor...', 0, total);

            let enviados = 0;
            let fallidos = 0;

            for (const item of pendientes) {
                this.emitir('enviando', `Enviando registro ${enviados + fallidos + 1} de ${total}...`, enviados, total);

                const payload = this.normalizarPayload(item);
                const resultado = await this.enviarPayload(payload);

                if (!resultado.ok) {
                    item.intentos += 1;
                    item.estado = 'PENDIENTE';
                    item.ultimo_error = resultado.motivo;
                    await this.offlineDb.actualizarOutbox(item);

                    if (resultado.permanente) {
                        fallidos++;
                        console.warn(`[Sync recolección] Registro ${item.uuid_cliente} rechazado: ${resultado.motivo}`);
                        continue;
                    }

                    this.emitir('error', resultado.motivo, enviados, total, resultado.motivo);
                    return;
                }

                await this.offlineDb.eliminarDelOutbox(item.id_local);
                enviados++;

                if (enviados + fallidos < total) {
                    this.emitir('enviando', `Enviando registro ${enviados + fallidos + 1} de ${total}...`, enviados, total);
                }
            }

            if (fallidos > 0) {
                this.emitir(
                    'error',
                    `Sincronización completada con ${fallidos} registro(s) con error. Los demás se enviaron correctamente.`,
                    enviados,
                    total,
                    `${fallidos} registro(s) requieren revisión.`
                );
            } else {
                this.emitir('completado', `Sincronización completada. ${enviados} registro(s) enviado(s).`, enviados, total);
            }
        } finally {
            this.sincronizando = false;
            await this.actualizarContador();
        }
    }

    /**
     * Descarga en un archivo JSON todos los registros de la cola local,
     * para no perder la información si no se pueden sincronizar.
     */
    async descargarPendientesJson(): Promise<number> {
        const items = await this.offlineDb.obtenerTodos();
        if (items.length === 0) { return 0; }

        const data = {
            generado_en: new Date().toISOString(),
            total: items.length,
            registros: items.map((i) => ({
                id_local: i.id_local,
                uuid_cliente: i.uuid_cliente,
                creado_en: i.creado_en,
                intentos: i.intentos,
                ultimo_error: i.ultimo_error,
                id_usuario: i.id_usuario,
                id_empresa: i.id_empresa,
                estado: i.estado,
                payload: i.payload
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');

        enlace.href = url;
        enlace.download = `recoleccion_pendientes_${this.marcaDeTiempo()}.json`;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);

        return items.length;
    }

    private emitir(fase: FaseSync, mensaje: string, enviados = 0, total = 0, error: string | null = null): void {
        this.estadoSubject.next({ fase, mensaje, enviados, total, error });
    }

    private marcaDeTiempo(): string {
        const d = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    }
}
