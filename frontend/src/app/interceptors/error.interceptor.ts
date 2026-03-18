import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
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
        life: 5000 
      });

      return throwError(() => error);
    })
  );
};
