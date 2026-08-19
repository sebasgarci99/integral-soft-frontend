import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    const loadingService = inject(LoadingService);
    const url = req.url.toLowerCase();

    const excluirDeLoader = url.includes('api/usuario/login') || url.includes('api/usuario/getinfouser');

    if (excluirDeLoader) {
        return next(req);
    }

    loadingService.show();
    return next(req).pipe(finalize(() => loadingService.hide()));
};
