import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

// Libreria de PRIME NG
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
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
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: CustomAura,
                options: {
                    darkModeSelector: false || 'none'
                }
            }
        }),
        provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor]))
    ]
};
