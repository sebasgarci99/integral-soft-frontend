import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, switchMap, catchError, throwError } from 'rxjs';
import { SecureStorageService } from '../services/secure-storage.service';
import { LoginService } from '../services/login/login.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    if (req.url.includes('renovar-token') || req.url.includes('login')) {
        return next(req);
    }

    return next(req).pipe(
        catchError((error) => {
            if (error.status === 401) {
                const secureStorage = inject(SecureStorageService);
                const loginService = inject(LoginService);
                const router = inject(Router);

                return from(secureStorage.getItem('token')).pipe(
                    switchMap((token) => {
                        if (!token) {
                            router.navigate(['/login']);
                            return throwError(() => error);
                        }
                        return loginService.renovarToken(token).pipe(
                            switchMap((res: any) => {
                                if (res?.token) {
                                    secureStorage.setItem('token', res.token);
                                    const newReq = req.clone({
                                        headers: req.headers.set('authorization', `Bearer ${res.token}`)
                                    });
                                    return next(newReq);
                                }
                                secureStorage.removeItem('token');
                                router.navigate(['/login']);
                                return throwError(() => error);
                            }),
                            catchError(() => {
                                secureStorage.removeItem('token');
                                router.navigate(['/login']);
                                return throwError(() => error);
                            })
                        );
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
