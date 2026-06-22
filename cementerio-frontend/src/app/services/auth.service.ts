import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface AuthResponse {
  token: string;
  id: number;
  rol: string;
  esTemporal: boolean;
  cementerioId: number | null;
  cementerioNombre: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8081/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  login(correo: string, contrasena: string): Observable<AuthResponse> {
    sessionStorage.setItem('user_email', correo);
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { correo, contrasena });
  }

  setSession(res: AuthResponse): void {
    sessionStorage.setItem('jwt_token', res.token);
    sessionStorage.setItem('user_id', res.id.toString());
    sessionStorage.setItem('user_rol', res.rol);
    sessionStorage.setItem('es_temporal', res.esTemporal ? 'true' : 'false');
    if (res.cementerioId != null) {
      sessionStorage.setItem('cementerio_id', res.cementerioId.toString());
    } else {
      sessionStorage.removeItem('cementerio_id');
    }
    if (res.cementerioNombre) {
      sessionStorage.setItem('cementerio_nombre', res.cementerioNombre);
    } else {
      sessionStorage.removeItem('cementerio_nombre');
    }
  }

  getUserId(): number | null {
    const id = sessionStorage.getItem('user_id');
    return id ? parseInt(id) : null;
  }

  getUserRole(): string | null {
    return sessionStorage.getItem('user_rol');
  }

  getCementerioId(): number | null {
    const id = sessionStorage.getItem('cementerio_id');
    return id ? parseInt(id) : null;
  }

  getCementerioNombre(): string | null {
    return sessionStorage.getItem('cementerio_nombre');
  }

  getToken(): string | null {
    return sessionStorage.getItem('jwt_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}