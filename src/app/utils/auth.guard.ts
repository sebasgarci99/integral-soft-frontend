import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import Swal from 'sweetalert2';

export const authGuard: CanActivateFn = (route, state) => {

    const router = inject(Router);
    const token = localStorage.getItem('token');

    // 1ra validación: se confirma o valida si hay token
    if (!token) {
        // Redirige a /login si no hay token
        return router.parseUrl('/login');
    }

    // 2da validación. tOKEN EXPIRADO
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    // Validamos si la sesión del token expiro
    if(Date.now() >= exp * 1000) {
        // Token expirado
        Swal.fire({
            icon: 'error',
            title: 'Sesión expirada',
            text: 'Tu sesión ha caducado. Por favor, vuelve a iniciar sesión.',
            confirmButtonText: 'OK'
        }).then(() => {
            localStorage.removeItem('token');
            router.navigate(['/login']);
        });
    }


    // Permite la activación de la ruta
    return true;
};
