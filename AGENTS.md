# PAUTAS PARA AGENTES - Frontend (rh-soft)

Este documento contiene las pautas para los "agentes de codificación" que trabajan en este proyecto frontend Angular. El objetivo es asegurar que el código sea consistente, fácil de mantener y de alta calidad.

## 1. Comandos de Compilación y Pruebas

```bash
npm start                     # ng serve (desarrollo en http://localhost:4200)
npm run build                 # ng build (producción)
npm run watch                 # ng build --watch --configuration development
npm test                     # Karma + Jasmine
```

## 2. Estructura del Proyecto

```
rh-soft/
├── src/
│   ├── app/
│   │   ├── components/       # Componentes por módulo (cada uno en su carpeta)
│   │   ├── interfaces/       # TypeScript interfaces
│   │   ├── services/        # Servicios HTTP (cada uno en su carpeta)
│   │   ├── utils/           # Guards y utilities
│   │   ├── app.component.ts  # Componente raíz
│   │   ├── app.config.ts    # Configuración de la app
│   │   └── app.routes.ts    # Rutas centralizadas
│   ├── enviroments/          # Configuración por ambiente
│   ├── styles.css            # Estilos globales
│   └── main.ts               # Punto de entrada
├── angular.json
├── package.json
└── tsconfig.json
```

## 3. Módulos (Componentes)

| Módulo | Descripción |
|--------|-------------|
| `actividades` | Gestión de actividades |
| `archivos-cobro` | Archivos de cuentas de cobro |
| `clientes` | Gestión de clientes |
| `consultorios` | Configuración de consultorios |
| `cuentas-cobro` | Cuentas de cobro con periodicidad |
| `home` | Dashboard principal |
| `login` | Autenticación de usuarios |
| `navbar` | Barra de navegación superior |
| `pacientes` | Gestión de pacientes |
| `reg-recoleccion` | Registro de recolección |
| `reg-temperatura` | Registro de temperatura |
| `reg-vacunacion` | Registro de vacunación |
| `reportes` | Reportes y gráficos |
| `reportes-vacunacion` | Reportes de vacunación |
| `sidebar` | Menú lateral de navegación |
| `vacunas` | Catálogo de vacunas |

## 4. Tecnologías

- **Framework:** Angular 19 (standalone components)
- **UI Library:** PrimeNG 19
- **Icons:** PrimeIcons
- **Styling:** PrimeFlex, Bootstrap 5, Bootstrap Icons
- **Charts:** Chart.js
- **HTTP:** RxJS 7.x
- **Alerts:** SweetAlert2
- **Export:** jsPDF, xlsx, file-saver
- **Signatures:** signature_pad

## 5. Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos | kebab-case | `clientes.component.ts` |
| Componentes | PascalCase | `ClientesComponent` |
| Servicios | PascalCase + Service | `ClienteService` |
| Interfaces | PascalCase | `Cliente`, `ClienteResponse` |
| Métodos | camelCase | `cargarClientes()` |
| Variables | camelCase | `displayDialog`, `formData` |
| HTML/CSS | kebab-case | `clientes.component.html` |

## 6. Strict Mode Configuration

- `noImplicitOverride`: Todos los miembros que sobreescriben deben tener `override`
- `noPropertyAccessFromIndexSignature`: Acceder solo a propiedades definidas
- `noImplicitReturns`: Todos los paths deben retornar un valor
- `noFallthroughCasesInSwitch`: No fallthrough en switch
- `strictInjectionParameters`: Parámetros DI correctamente tipados
- `strictInputAccessModifiers`: Inputs requieren modificadores de acceso
- `strictTemplates`: Templates con type checking estricto

## 7. Orden de Importaciones

```typescript
// 1. Angular core
import { Component, OnInit } from '@angular/core';

// 2. Angular forms/routing
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// 3. Componentes locales
import { SidebarComponent } from '../sidebar/sidebar.component';

// 4. Servicios locales
import { ClienteService } from '../../services/cliente/cliente.service';

// 5. Interfaces locales
import { Cliente } from '../../interfaces/cliente';

// 6. PrimeNG API
import { MessageService, ConfirmationService } from 'primeng/api';

// 7. Angular common
import { CommonModule } from '@angular/common';

// 8. PrimeNG modules
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
```

## 8. Patrón de Componente CRUD

### Estructura de Componente

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { MiService } from '../../services/mi-service';
import { MiInterface } from '../../interfaces/mi-interface';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
    selector: 'app-mi-componente',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        SidebarComponent,
        TableModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        ToastModule,
        ConfirmDialogModule
    ],
    templateUrl: './mi-componente.component.html',
    styleUrl: './mi-componente.component.css',
    providers: [MessageService, ConfirmationService]
})
export class MiComponente implements OnInit {
    listaData: MiInterface[] = [];
    displayDialog = false;
    isEdit = false;
    formData: Partial<MiInterface> = {};

    constructor(
        private miService: MiService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.cargarData();
    }

    cargarData(): void {
        this.miService.obtenerData().subscribe({
            next: (res) => {
                if (res.state === 'OK') {
                    this.listaData = res.body;
                }
            },
            error: (err) => {
                console.error('Error al cargar:', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la información'
                });
            }
        });
    }

    abrirDialogCrear(): void {
        this.isEdit = false;
        this.formData = {};
        this.displayDialog = true;
    }

    abrirDialogEditar(item: MiInterface): void {
        this.isEdit = true;
        this.formData = { ...item };
        this.displayDialog = true;
    }

    crearActualizar(): void {
        if (this.isEdit) {
            this.miService.actualizar(this.formData).subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Registro actualizado correctamente'
                        });
                        this.displayDialog = false;
                        this.cargarData();
                    }
                }
            });
        } else {
            this.miService.crear(this.formData).subscribe({
                next: (res) => {
                    if (res.state === 'OK') {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Registro creado correctamente'
                        });
                        this.displayDialog = false;
                        this.cargarData();
                    }
                }
            });
        }
    }

    eliminar(item: MiInterface): void {
        this.confirmationService.confirm({
            message: '¿Está seguro de eliminar este registro?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.miService.eliminar(item).subscribe({
                    next: (res) => {
                        if (res.state === 'OK') {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Registro eliminado'
                            });
                            this.cargarData();
                        }
                    }
                });
            }
        });
    }
}
```

### Template HTML

```html
<app-sidebar></app-sidebar>

<div class="container">
    <h2>Título del Módulo</h2>
    
    <div class="mb-3">
        <p-button label="Nuevo" icon="pi pi-plus" (onClick)="abrirDialogCrear()"></p-button>
    </div>

    <p-table [value]="listaData" [paginator]="true" [rows]="10" 
             [globalFilterFields]="['campo1', 'campo2']" responsiveLayout="scroll">
        <ng-template pTemplate="header">
            <tr>
                <th>Campo 1</th>
                <th>Campo 2</th>
                <th>Acciones</th>
            </tr>
        </ng-template>
        <ng-template pTemplate="body" let-item>
            <tr>
                <td>{{ item.campo1 }}</td>
                <td>{{ item.campo2 }}</td>
                <td>
                    <p-button icon="pi pi-pencil" [text]="true" 
                              (onClick)="abrirDialogEditar(item)"></p-button>
                    <p-button icon="pi pi-trash" [text]="true" severity="danger"
                              (onClick)="eliminar(item)"></p-button>
                </td>
            </tr>
        </ng-template>
    </p-table>
</div>

<p-dialog header="{{ isEdit ? 'Editar' : 'Nuevo' }}" [(visible)]="displayDialog" 
          [modal]="true" [style]="{ width: '30rem' }">
    <div class="p-fluid">
        <div class="field">
            <label for="campo1">Campo 1 *</label>
            <input pInputText id="campo1" [(ngModel)]="formData.campo1" />
        </div>
        <div class="field">
            <label for="campo2">Campo 2</label>
            <input pInputText id="campo2" [(ngModel)]="formData.campo2" />
        </div>
    </div>
    <ng-template pTemplate="footer">
        <p-button label="Cancelar" severity="secondary" (onClick)="displayDialog = false"></p-button>
        <p-button label="Guardar" (onClick)="crearActualizar()"></p-button>
    </ng-template>
</p-dialog>

<p-toast></p-toast>
<p-confirmDialog></p-confirmDialog>
```

## 9. Patrón de Servicio HTTP

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { enviroment } from '../../../enviroments/enviroment';
import { MiInterface, MiInterfaceResponse } from '../../interfaces/mi-interface';

@Injectable({ providedIn: 'root' })
export class MiService {
    private urlApp = enviroment.endpoint;
    private urlAppAPI = 'api/recurso/';

    constructor(private http: HttpClient) {}

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('token');
        return new HttpHeaders().set('authorization', `Bearer ${token}`);
    }

    private getBody(): { id_usuario: number; id_empresa: number } {
        return {
            id_usuario: Number(localStorage.getItem('idUser')),
            id_empresa: Number(localStorage.getItem('idEmpresa'))
        };
    }

    obtenerData(): Observable<MiInterface[]> {
        return this.http.post<MiInterfaceResponse>(
            this.urlApp + this.urlAppAPI + 'getData',
            this.getBody(),
            { headers: this.getAuthHeaders() }
        ).pipe(
            map(response => response.body || [])
        );
    }

    crear(data: Partial<MiInterface>): Observable<MiInterfaceResponse> {
        return this.http.post<MiInterfaceResponse>(
            this.urlApp + this.urlAppAPI + 'crear',
            { ...this.getBody(), ...data },
            { headers: this.getAuthHeaders() }
        );
    }

    actualizar(data: Partial<MiInterface>): Observable<MiInterfaceResponse> {
        return this.http.post<MiInterfaceResponse>(
            this.urlApp + this.urlAppAPI + 'actualizar',
            { ...this.getBody(), ...data },
            { headers: this.getAuthHeaders() }
        );
    }

    eliminar(item: MiInterface): Observable<MiInterfaceResponse> {
        return this.http.post<MiInterfaceResponse>(
            this.urlApp + this.urlAppAPI + 'eliminar',
            { ...this.getBody(), id: item.id },
            { headers: this.getAuthHeaders() }
        );
    }
}
```

## 10. Estructura de Interfaces

```typescript
export interface MiInterface {
    id: number;
    campo_uno: string;
    campo_dos: number;
    estado?: string;
    fecha_creacion?: Date;
}

export interface MiInterfaceResponse {
    msg: string;
    state: 'OK' | 'NO_OK';
    body: MiInterface[] | MiInterface | null;
}
```

## 11. Routing

```typescript
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { MiComponente } from './components/mi-componente/mi-componente.component';
import { authGuard } from './utils/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'home', component: HomeComponent, canActivate: [authGuard] },
    { path: 'mi-modulo', component: MiComponente, canActivate: [authGuard] },
    { path: '**', redirectTo: '/login' }
];
```

**Reglas:**
- Paths en minúsculas (ej: `reg_vacunacion`, `cuentas-cobro`)
- Rutas protegidas con `canActivate: [authGuard]`
- Login es pública (sin guard)
- Default redirect a `/login`

## 12. Auth Guard

```typescript
import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
    const token = localStorage.getItem('token');
    
    if (token) {
        return true;
    } else {
        window.location.href = '/login';
        return false;
    }
};
```

## 13. Environment

```typescript
// enviroment.ts (desarrollo)
export const enviroment = {
    production: false,
    endpoint: 'http://localhost:3000/'
};

// enviroment.prod.ts (producción)
export const enviroment = {
    production: true,
    endpoint: 'https://api.tu-dominio.com/'
};
```

## 14. Manejo de Errores

- Usar `try...catch` para código síncrono
- Usar `catchError` de RxJS para observables
- Registrar errores con `console.error()`
- Mostrar mensajes amigables con PrimeNG Toast o SweetAlert2
- **Eliminar `console.log()` antes de commitear**

## 15. Comentarios

- Agregar comentarios para lógica de negocio compleja
- No comentar código obvio
- Usar `//` para una línea, `/** ... */` para múltiples
- Eliminar código comentado antes de commitear

## 16. Librerías Comunes

- **PDF:** `jspdf` + `jspdf-autotable`
- **Excel:** `xlsx` (SheetJS)
- **Archivos:** `file-saver`
- **Diálogos:** SweetAlert2 (`Swal.fire()`)
- **Gráficos:** `chart.js` vía PrimeNG ChartModule
- **Iconos:** PrimeIcons, FontAwesome (`fa-solid fa-*`)
- **Firmas:** `signature_pad`

## 17. PrimeNG - Módulos Comunes

Importar en el array `imports` de cada componente standalone:

- TableModule, PaginatorModule
- DialogModule, ConfirmDialogModule
- ButtonModule, InputTextModule, TextareaModule
- ToastModule, DropdownModule
- CalendarModule, ChartModule
- StepsModule, TabViewModule, TabMenuModule
- FloatLabelModule, InputNumberModule
- FileUploadModule, ProgressSpinnerModule
