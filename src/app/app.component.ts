import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Integral-soft';

  constructor(private loadingService: LoadingService) {}

  get mostrarLoader(): boolean {
    if (!this.loadingService.isLoading()) return false;
    const tieneLoaderLocal = !!document.querySelector(
      '.uiverse-loader-overlay, .uiverse-loader-overlay-fullscreen, .loading-overlay, .overlay'
    );
    return !tieneLoaderLocal;
  }
}
