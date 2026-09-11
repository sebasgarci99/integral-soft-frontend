import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { SyncRecoleccionService } from './services/offline/sync-recoleccion.service';

// Libreria de PRIME NG
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { definePreset, palette } from '@primeng/themes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './utils/auth.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';

const CustomAura = definePreset(Aura, {
    semantic: {
        primary: palette('#3da1b8')
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideAnimations(),
        providePrimeNG({
            theme: {
                preset: CustomAura,
                options: {
                    darkModeSelector: false || 'none'
                }
            },
            zIndex: {
                modal: 1400,
                overlay: 1200,
                menu: 1200,
                tooltip: 1300
            }
        }),
        provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor])),
        provideAppInitializer(() => {
            inject(SyncRecoleccionService).iniciar();
        })
    ]
};
