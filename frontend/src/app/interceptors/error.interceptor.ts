import { ToastService } from '../services/toast.service';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(ToastService);
  const authService = inject(AuthService);
  const router = inject(Router);
  const authEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/google');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (authEndpoint) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        messageService.add({
          severity: 'warn',
          summary: 'Sessão expirada',
          detail: 'Sua sessão expirou. Faça login novamente para continuar.'
        });
        authService.logout(false);
        router.navigate(['/login']);
        return throwError(() => error);
      }

      let errorMessage = 'Ocorreu um erro inesperado.';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Erro: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = error.error?.message || `Código do erro: ${error.status}`;
      }

      messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: errorMessage,
      });

      return throwError(() => error);
    })
  );
};
