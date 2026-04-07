# AGENTS.md

This document provides instructions for AI agents working in this repository.

## Project Overview

This is an Angular 19 application (RH-Soft) - a healthcare/medical records management system. It uses:
- Angular 19 with TypeScript (standalone components)
- PrimeNG UI components
- Bootstrap 5 + Bootstrap Icons
- Chart.js for visualizations
- jsPDF + jspdf-autotable for PDF generation
- xlsx for Excel exports
- file-saver for file downloads
- SweetAlert2 for dialogs
- Signature Pad for digital signatures
- RxJS for reactive state management

## Build, Lint, and Test

### Build

```bash
npm run build              # Production build to dist/
ng build --configuration development  # Development build
```

### Lint

```bash
ng lint
```

### Test

```bash
npm run test                # Run all tests
ng test --include='src/app/components/pacientes/pacientes.component.spec.ts'  # Single component test
ng test --include='src/app/services/pacientes/pacientes.service.spec.ts'       # Single service test
```

### Development Server

```bash
npm start                   # Start dev server (default: http://localhost:4200)
```

## Project Structure

```
src/app/
├── components/     # Feature components (kebab-case directories)
│   ├── pacientes/
│   ├── consultas/
│   └── ...
├── interfaces/     # TypeScript interfaces (PascalCase, singular names)
├── services/       # Angular services (PascalCase)
├── utils/          # Guards, utilities, shared components
└── app.config.ts   # Application configuration
```

## Code Style

### General Principles

- Angular 19 project with TypeScript strict mode enabled
- No Prettier/ESLint - follow existing code style and use 4-space indentation
- Avoid `any` type unless absolutely necessary

### Strict Mode Configuration

- `noImplicitOverride`: All overriding members must have the `override` keyword
- `noPropertyAccessFromIndexSignature`: Access only defined properties
- `noImplicitReturns`: All code paths must return a value if function has return type
- `noFallthroughCasesInSwitch`: No fallthrough cases in switch statements
- `strictInjectionParameters`: DI parameters must be correctly typed
- `strictInputAccessModifiers`: Component inputs require access modifiers
- `strictTemplates`: Templates have strict type checking

### Naming Conventions

| Type              | Convention          | Example                          |
|-------------------|---------------------|----------------------------------|
| Components        | PascalCase          | `PacientesComponent`             |
| Services          | PascalCase          | `LoginService`                   |
| Interfaces        | PascalCase          | `Pacientes`, `LoginInterface`    |
| Component files   | kebab-case          | `pacientes.component.ts`        |
| Template files    | kebab-case          | `pacientes.component.html`       |
| Style files       | kebab-case          | `pacientes.component.css`        |
| Variables         | camelCase           | `currentUser`, `pacientesList`   |
| Methods/Functions | camelCase           | `cargarPacientes()`, `onSubmit()`|
| Constants         | camelCase           | `localEspaniol`                  |
| CSS classes       | kebab-case          | `btn-primary`, `text-center`     |

### Imports Order

Organize imports with blank lines between groups:

1. Angular core (`@angular/core`, `@angular/common`)
2. Angular features (`@angular/forms`, `@angular/router`)
3. Third-party (`rxjs`, `primeng/*`)
4. Application-level (`../../services/...`, `../../interfaces/...`)

### Component Guidelines

- Use standalone components
- Define inputs with `@Input()` decorator (required by strictInputAccessModifiers)
- Use constructor injection or `inject()` for DI
- Implement `OnInit` if using `ngOnInit()`
- Use signal-based bindings where appropriate
- Keep template logic minimal; extract to methods

```typescript
@Component({
    selector: 'app-pacientes',
    imports: [CommonModule, FormsModule, TableModule, ...],
    templateUrl: './pacientes.component.html',
    styleUrl: './pacientes.component.css',
    providers: [MessageService]
})
export class PacientesComponent implements OnInit {
    pacientes: Pacientes[] = [];
    
    constructor(private pacientesService: PacientesService) {}
    
    ngOnInit(): void {
        this.cargarPacientes();
    }
}
```

### Service Guidelines

- Use `@Injectable({ providedIn: 'root' })` for app-wide singletons
- Return proper types (prefer `Observable<T>` for HTTP)
- Use BehaviorSubject for reactive state
- Handle HTTP errors with RxJS `catchError`

```typescript
@Injectable({ providedIn: 'root' })
export class PacientesService {
    private currentUserData = new BehaviorSubject<any>({});
    
    getPacientes(): Observable<Pacientes[]> {
        return this.http.get<Pacientes[]>(`${this.url}/pacientes`).pipe(
            catchError(error => {
                console.error('Error fetching pacientes:', error);
                return throwError(() => error);
            })
        );
    }
}
```

### Template Guidelines

- Use Angular control flow (`@if`, `@for`, `@switch`) over `*ngIf`/`*ngFor`
- Use two-way binding with `[(ngModel)]` or signal-based bindings
- Keep templates readable; extract logic to component methods

### Error Handling

- Use `try...catch` for code that might throw
- Use RxJS `catchError` for observables
- Log errors with `console.error()`
- Display user-friendly messages via PrimeNG Toast or SweetAlert2
- Remove `console.log()` before committing

### Comments

- Add comments for complex business logic
- Do not comment obvious code
- Use `//` for single-line, `/** ... */` for multi-line
- Remove commented-out code before committing

### PrimeNG Usage

Key components: TableModule, PaginatorModule, DialogModule, ConfirmDialogModule, ButtonModule, InputTextModule, ToastModule, CalendarModule, DropdownModule, ChartModule, StepsModule, TabViewModule.

Import in component's `imports` array for standalone components.

### Common Libraries

- PDF: `jspdf` + `jspdf-autotable`
- Excel: `xlsx` (SheetJS)
- File saving: `file-saver`
- Dialogs: `SweetAlert2` (Swal.fire())
- Charts: `chart.js` via PrimeNG ChartModule
- Icons: PrimeIcons, FontAwesome (`fa-solid fa-*`)
- Signatures: `signature_pad`
