import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import Swal from 'sweetalert2';
import { SecureStorageService } from '../services/secure-storage.service';

export const authGuard: CanActivateFn = async (route, state) => {

    const router = inject(Router);
    const secureStorage = inject(SecureStorageService);
    const token = await secureStorage.getItem('token');

    if (!token) {
        return router.parseUrl('/login');
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;

    if (Date.now() >= exp * 1000) {
        await Swal.fire({
            icon: 'error',
            title: 'Sesión expirada',
            text: 'Tu sesión ha caducado. Por favor, vuelve a iniciar sesión.',
            confirmButtonText: 'OK'
        });
        secureStorage.removeItem('token');
        return router.parseUrl('/login');
    }

    return true;
};
