
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { authState } from '@angular/fire/auth';
import { UserRole, User } from '../models/user.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const auth = inject(Auth);
    const firestore = inject(Firestore);
    const router = inject(Router);

    return authState(auth).pipe(
      switchMap(user => {
        if (!user) {
          router.navigate(['/login']);
          return of(false);
        }

        return from(getDoc(doc(firestore, `users/${user.uid}`))).pipe(
          map(userDoc => {
            if (!userDoc.exists()) {
              router.navigate(['/login']);
              return false;
            }

            const userData = userDoc.data() as User;
            
            if (allowedRoles.includes(userData.rol)) {
              return true;
            }

            // Redirigir al dashboard correcto según rol
            switch (userData.rol) {
              case 'estudiante':
                router.navigate(['/dashboard-alumno']);
                break;
              case 'coordinador':
                router.navigate(['/dashboard-coordinador']);
                break;
              case 'admin':
                router.navigate(['/dashboard-admin']);
                break;
            }
            return false;
          })
        );
      })
    );
  };
};