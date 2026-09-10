import { Injectable } from '@angular/core';

import { enviroment } from '../../../enviroments/enviroment';

export type CalidadRed = 'BUENA' | 'MEDIA' | 'MALA';

const PROBE_TIMEOUT_MS = 2500;
const UMBRAL_BUENA_MS = 1200;

@Injectable({ providedIn: 'root' })
export class NetworkService {

    get estaOnline(): boolean {
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    /**
     * Determina la calidad de la red antes de enviar.
     * Usa Network Information API cuando está disponible; si no, un probe ligero.
     * MALA implica que se debe encolar sin intentar el envío directo.
     */
    async medirCalidadRed(): Promise<CalidadRed> {
        if (!this.estaOnline) { return 'MALA'; }

        const connection = (navigator as any).connection
            || (navigator as any).mozConnection
            || (navigator as any).webkitConnection;

        if (connection) {
            const effectiveType = connection.effectiveType as string | undefined;
            const downlink = connection.downlink as number | undefined;
            const rtt = connection.rtt as number | undefined;

            if (effectiveType === 'slow-2g' || effectiveType === '2g') { return 'MALA'; }
            if (downlink !== undefined && downlink < 0.5) { return 'MALA'; }
            if (rtt !== undefined && rtt > 1000) { return 'MALA'; }

            if (effectiveType === '3g') { return 'MEDIA'; }
            if (downlink !== undefined && downlink < 2) { return 'MEDIA'; }
            if (rtt !== undefined && rtt > 400) { return 'MEDIA'; }

            return 'BUENA';
        }

        return this.probeHttp();
    }

    private async probeHttp(): Promise<CalidadRed> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
        const inicio = Date.now();

        try {
            const respuesta = await fetch(enviroment.endpoint, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal
            });

            if (!respuesta.ok) { return 'MALA'; }

            const ms = Date.now() - inicio;
            if (ms < UMBRAL_BUENA_MS) { return 'BUENA'; }
            if (ms < PROBE_TIMEOUT_MS) { return 'MEDIA'; }
            return 'MALA';
        } catch {
            return 'MALA';
        } finally {
            clearTimeout(timer);
        }
    }
}
