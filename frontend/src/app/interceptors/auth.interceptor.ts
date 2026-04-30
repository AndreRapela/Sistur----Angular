import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authUser = authService.getUser();

  if (authUser?.token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${authUser.token}`
      }
    });
    return next(authReq);
  }
  
  return next(req);
};
