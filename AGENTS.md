# PAUTAS PARA AGENTES - Frontend (rh-soft)

Agentes de codificación para el frontend Angular 19. Código consistente, mantenible y alta calidad.

## 1. Comandos

```bash
npm start                     # ng serve (http://localhost:4200)
npm run build                 # ng build (producción)
npm run watch                 # ng build --watch --configuration development
npm test                      # Karma + Jasmine (todos los tests)
ng test --include='**/pacientes.component.spec.ts'  # Test unitario
```

## 2. Estructura del Proyecto

```
rh-soft/ (frontend Angular 19)
├── src/app/
│   ├── components/       # Componentes por módulo
│   ├── interfaces/       # TypeScript interfaces
│   ├── services/         # Servicios HTTP
│   ├── utils/            # Guards y utilities
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── src/enviroments/      # Configuración por ambiente
└── angular.json
```

**Backend:** `C:\Users\sebas\Desktop\proyectos\ws-rh-soft` (API Node.js en puerto 3000)

## 3. Tecnologías

- **Framework:** Angular 19 (standalone components)
- **UI:** PrimeNG 19, PrimeIcons, PrimeFlex
- **Styling:** Bootstrap 5, Bootstrap Icons
- **State/HTTP:** RxJS 7.x
- **Charts:** Chart.js
- **Alerts:** SweetAlert2
- **Export:** jsPDF, xlsx, file-saver
- **Signatures:** signature_pad

## 4. Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos | kebab-case | `clientes.component.ts` |
| Componentes | PascalCase | `ClientesComponent` |
| Servicios | PascalCase + Service | `ClienteService` |
| Interfaces | PascalCase | `Cliente`, `ClienteResponse` |
| Métodos/Variables | camelCase | `cargarClientes()`, `displayDialog` |

## 5. TypeScript Strict Mode

- `noImplicitOverride`, `noPropertyAccessFromIndexSignature`
- `noImplicitReturns`, `noFallthroughCasesInSwitch`
- `strictInjectionParameters`, `strictInputAccessModifiers`
- `strictTemplates` (Angular compiler options)

## 6. Orden de Importaciones

```typescript
import { Component, OnInit } from '@angular/core';           // 1. Angular core
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'; // 2. Angular forms
import { SidebarComponent } from '../sidebar/sidebar.component'; // 3. Componentes locales
import { ClienteService } from '../../services/cliente/cliente.service'; // 4. Servicios
import { Cliente } from '../../interfaces/cliente';          // 5. Interfaces
import { MessageService } from 'primeng/api';                 // 6. PrimeNG API
import { CommonModule } from '@angular/common';               // 7. Angular common
import { TableModule } from 'primeng/table';                  // 8. PrimeNG modules
```

## 7. Patrón de Componente

```typescript
@Component({
    selector: 'app-mi-componente',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent, TableModule, DialogModule, ButtonModule],
    templateUrl: './mi-componente.component.html',
    styleUrl: './mi-componente.component.css',
    providers: [MessageService, ConfirmationService]
})
export class MiComponente implements OnInit {
    listaData: MiInterface[] = [];
    displayDialog = false;
    isEdit = false;
    formData: Partial<MiInterface> = {};

    constructor(private miService: MiService, private messageService: MessageService) {}

    ngOnInit(): void { this.cargarData(); }

    cargarData(): void {
        this.miService.obtenerData().subscribe({
            next: (res) => { if (res.state === 'OK') this.listaData = res.body; },
            error: (err) => { console.error(err); this.messageService.add({severity:'error', summary:'Error', detail:'Error al cargar'}); }
        });
    }

    crearActualizar(): void {
        const obs = this.isEdit ? this.miService.actualizar(this.formData) : this.miService.crear(this.formData);
        obs.subscribe({ next: (res) => { if (res.state === 'OK') { this.messageService.add({severity:'success', summary:'Éxito'}); this.displayDialog = false; this.cargarData(); }}});
    }

    eliminar(item: MiInterface): void {
        this.confirmationService.confirm({ message: '¿Eliminar?', accept: () => this.miService.eliminar(item).subscribe({next: () => this.cargarData()}) });
    }
}
```

## 8. Patrón de Servicio

```typescript
@Injectable({ providedIn: 'root' })
export class MiService {
    private urlApp = enviroment.endpoint;
    private urlAppAPI = 'api/recurso/';

    constructor(private http: HttpClient) {}

    private getAuthHeaders(): HttpHeaders {
        return new HttpHeaders().set('authorization', `Bearer ${localStorage.getItem('token')}`);
    }

    private getBody() { return { id_usuario: Number(localStorage.getItem('idUser')), id_empresa: Number(localStorage.getItem('idEmpresa')) }; }

    obtenerData(): Observable<MiInterface[]> {
        return this.http.post<MiInterfaceResponse>(this.urlApp + this.urlAppAPI + 'getData', this.getBody(), { headers: this.getAuthHeaders() })
            .pipe(map(response => response.body || []));
    }

    crear(data: Partial<MiInterface>): Observable<MiInterfaceResponse> {
        return this.http.post<MiInterfaceResponse>(this.urlApp + this.urlAppAPI + 'crear', {...this.getBody(), ...data}, { headers: this.getAuthHeaders() });
    }
}
```

## 9. Interfaces

```typescript
export interface MiInterface { id: number; campo_uno: string; estado?: string; }
export interface MiInterfaceResponse { msg: string; state: 'OK' | 'NO_OK'; body: MiInterface[] | MiInterface | null; }
```

## 10. Routing

```typescript
export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'mi-modulo', component: MiComponente, canActivate: [authGuard] },
    { path: '**', redirectTo: '/login' }
];
```
- Paths en minúsculas con guiones bajos (`reg_vacunacion`, `cuentas-cobro`)
- Rutas protegidas con `canActivate: [authGuard]`

## 11. Manejo de Errores y Estilo

- `try...catch` para síncrono, `catchError` para observables
- Mensajes con PrimeNG Toast o SweetAlert2
- **Eliminar `console.log()` antes de commitear**
- Comentarios solo para lógica compleja; eliminar código comentado
- PrimeNG modules importados en array `imports` de cada componente standalone
