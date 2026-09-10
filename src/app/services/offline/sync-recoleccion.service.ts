import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { enviroment } from '../../../enviroments/enviroment';
import { SecureStorageService } from '../secure-storage.service';
import { OfflineDbService } from './offline-db.service';
import { NetworkService } from './network.service';

const TIMEOUT_ENVIO_MS = 8000;
const INTERVALO_SINCRONIZACION_MS = 60000;

@Injectable({ providedIn: 'root' })
export class SyncRecoleccionService {

    private readonly urlCrear = `${enviroment.endpoint}api/reg_recoleccion/crear_actualizar_reg_recoleccion`;
    private iniciado = false;
    private sincronizando = false;
    private intervalo: ReturnType<typeof setInterval> | null = null;

    private readonly pendientesSubject = new BehaviorSubject<number>(0);
    readonly pendientes$: Observable<number> = this.pendientesSubject.asObservable();

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
    async enviarPayload(payload: Record<string, unknown>): Promise<boolean> {
        try {
            const token = await this.secureStorage.getItem('token');
            if (!token) { return false; }

            const headers = new HttpHeaders()
                .set('authorization', `Bearer ${token}`)
                .set('x-offline-sync', '1');

            const respuesta: any = await firstValueFrom(
                this.http.post(this.urlCrear, payload, { headers }).pipe(timeout(TIMEOUT_ENVIO_MS))
            );

            return respuesta?.state === 'OK';
        } catch {
            return false;
        }
    }

    /** Vacía la cola uno a uno. Ante el primer fallo se detiene y se reintenta luego. */
    async sincronizarPendientes(): Promise<void> {
        if (this.sincronizando) { return; }
        this.sincronizando = true;

        try {
            if (!this.network.estaOnline) { return; }

            const calidad = await this.network.medirCalidadRed();
            if (calidad === 'MALA') { return; }

            const pendientes = await this.offlineDb.obtenerPendientes();

            for (const item of pendientes) {
                const enviado = await this.enviarPayload(item.payload);

                if (!enviado) {
                    item.intentos += 1;
                    item.estado = 'PENDIENTE';
                    item.ultimo_error = 'Sin respuesta del servidor';
                    await this.offlineDb.actualizarOutbox(item);
                    break;
                }

                await this.offlineDb.eliminarDelOutbox(item.id_local);
            }
        } finally {
            this.sincronizando = false;
            await this.actualizarContador();
        }
    }
}
