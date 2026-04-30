import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para redirecionar usuários autenticados
 * Se o usuário está logado e tenta acessar /login ou /register,
 * ele é redirecionado para /home
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getUser();

  if (user) {
    return router.createUrlTree(['/home']);
  }

  return true;
};
