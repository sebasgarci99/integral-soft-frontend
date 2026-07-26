import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SecureStorageService } from '../services/secure-storage.service';
import { LoginService } from '../services/login/login.service';
import { lastValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {

    const router = inject(Router);
    const secureStorage = inject(SecureStorageService);
    const loginService = inject(LoginService);
    const token = await secureStorage.getItem('token');

    if (!token) {
        return router.parseUrl('/login');
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;

        if (Date.now() >= exp) {
            try {
                const res: any = await lastValueFrom(loginService.renovarToken(token));
                if (res?.token) {
                    secureStorage.setItem('token', res.token);
                    return true;
                }
            } catch {
                // fallo renovacion
            }
            secureStorage.removeItem('token');
            return router.parseUrl('/login');
        }

        return true;
    } catch {
        secureStorage.removeItem('token');
        return router.parseUrl('/login');
    }
};
