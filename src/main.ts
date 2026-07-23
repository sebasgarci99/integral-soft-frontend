import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { HttpClientModule } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';

// Libreria de PRIME NG
import 'primeicons/primeicons.css'; // Solo esto
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { definePreset, palette } from '@primeng/themes';

const CustomAura = definePreset(Aura, {
    semantic: {
        primary: palette('#007ec8')
    }
});

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    importProvidersFrom(HttpClientModule),
    provideAnimationsAsync(),
      providePrimeNG({
          theme: {
              preset: CustomAura,
              options: {
                    darkModeSelector: false || 'none'
                }
          }
      })
  ],
});
