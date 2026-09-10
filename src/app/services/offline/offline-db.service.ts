import { Injectable } from '@angular/core';

const DB_NAME = 'rh_soft_offline';
const DB_VERSION = 1;
const STORE_OUTBOX = 'recoleccion_outbox';
const STORE_CACHE = 'cache';

export type EstadoOutbox = 'PENDIENTE' | 'ENVIANDO';

export interface OutboxRecoleccion {
    id_local: string;
    uuid_cliente: string;
    payload: Record<string, unknown>;
    estado: EstadoOutbox;
    intentos: number;
    ultimo_error: string | null;
    id_usuario: number;
    id_empresa: number;
    creado_en: string;
}

interface ItemCache {
    key: string;
    value: unknown;
}

@Injectable({ providedIn: 'root' })
export class OfflineDbService {

    private dbPromise: Promise<IDBDatabase> | null = null;

    private abrir(): Promise<IDBDatabase> {
        if (this.dbPromise) { return this.dbPromise; }

        this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
                    const store = db.createObjectStore(STORE_OUTBOX, { keyPath: 'id_local' });
                    store.createIndex('estado', 'estado', { unique: false });
                    store.createIndex('id_usuario', 'id_usuario', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORE_CACHE)) {
                    db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        return this.dbPromise;
    }

    private ejecutar<T>(store: string, modo: IDBTransactionMode, accion: (s: IDBObjectStore) => IDBRequest): Promise<T> {
        return this.abrir().then((db) => new Promise<T>((resolve, reject) => {
            const tx = db.transaction(store, modo);
            const request = accion(tx.objectStore(store));

            request.onsuccess = () => resolve(request.result as T);
            request.onerror = () => reject(request.error);
            tx.onerror = () => reject(tx.error);
        }));
    }

    /* ─────────────── Cola de recolección ─────────────── */

    async agregarAlOutbox(item: OutboxRecoleccion): Promise<void> {
        await this.ejecutar<void>(STORE_OUTBOX, 'readwrite', (s) => s.put(item));
    }

    async actualizarOutbox(item: OutboxRecoleccion): Promise<void> {
        await this.ejecutar<void>(STORE_OUTBOX, 'readwrite', (s) => s.put(item));
    }

    async eliminarDelOutbox(idLocal: string): Promise<void> {
        await this.ejecutar<void>(STORE_OUTBOX, 'readwrite', (s) => s.delete(idLocal));
    }

    async obtenerTodos(): Promise<OutboxRecoleccion[]> {
        const items = await this.ejecutar<OutboxRecoleccion[]>(STORE_OUTBOX, 'readonly', (s) => s.getAll());
        return items || [];
    }

    async obtenerPendientes(): Promise<OutboxRecoleccion[]> {
        const items = await this.obtenerTodos();
        return items
            .filter((i) => i.estado === 'PENDIENTE')
            .sort((a, b) => a.creado_en.localeCompare(b.creado_en));
    }

    async contarPendientes(): Promise<number> {
        const items = await this.obtenerTodos();
        return items.filter((i) => i.estado === 'PENDIENTE').length;
    }

    /* ─────────────── Caché auxiliar ─────────────── */

    async guardarCache(key: string, value: unknown): Promise<void> {
        await this.ejecutar<void>(STORE_CACHE, 'readwrite', (s) => s.put({ key, value } as ItemCache));
    }

    async obtenerCache<T>(key: string): Promise<T | null> {
        const item = await this.ejecutar<ItemCache | undefined>(STORE_CACHE, 'readonly', (s) => s.get(key));
        return item ? item.value as T : null;
    }
}
