# AGENTS.md

This document provides instructions for AI agents working in this repository.

## Project Overview

This is an Angular 19 application (RH-Soft) - a healthcare/medical records management system. It uses:
- Angular 19 with TypeScript
- PrimeNG UI components
- Bootstrap 5 for styling
- Chart.js for visualizations
- jsPDF for PDF generation

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
ng test --include=src/app/components/your-component/your-component.spec.ts  # Single test file
```

### Development Server

```bash
npm start                   # Start dev server (default: http://localhost:4200)
```

## Code Style

### General Principles

- This is an Angular project using TypeScript with strict mode enabled.
- Since there is no Prettier or ESLint configuration, pay close attention to the existing code style and maintain consistency.
- Use 4-space indentation for TypeScript and HTML files.

### Project Structure

```
src/app/
├── components/     # Feature components (PascalCase directory names)
├── interfaces/      # TypeScript interfaces (PascalCase, singular names)
├── services/        # Angular services (PascalCase)
├── utils/           # Utility functions and constants
└── app.config.ts    # Application configuration
```

### Naming Conventions

| Type              | Convention          | Example                          |
|-------------------|---------------------|----------------------------------|
| Components        | PascalCase          | `PacientesComponent`             |
| Services          | PascalCase          | `LoginService`                   |
| Interfaces        | PascalCase          | `LoginInterface`, `Pacientes`    |
| Component files   | kebab-case          | `pacientes.component.ts`         |
| Template files    | kebab-case          | `pacientes.component.html`       |
| Style files       | kebab-case          | `pacientes.component.css`        |
| Variables         | camelCase           | `currentUser`, `pacientesList`   |
| Methods/Functions | camelCase           | `cargarPacientes()`, `onSubmit()`|
| Constants         | camelCase           | `localEspaniol`                  |
| CSS classes       | kebab-case          | `btn-primary`, `text-center`     |

### TypeScript Guidelines

- **Types**: Use types wherever possible. Avoid `any` unless absolutely necessary.
- **Interfaces**: Define interfaces for all data structures in `src/app/interfaces/`.
- **Strict Mode**: The project has strict mode enabled with these rules:
  - `noImplicitOverride`: All overriding members must have the `override` keyword.
  - `noPropertyAccessFromIndexSignature`: Access only defined properties.
  - `noImplicitReturns`: All code paths must return a value if the function has a return type.
  - `noFallthroughCasesInSwitch`: No fallthrough cases in switch statements.
- **Angular Strict Mode**:
  - `strictInjectionParameters`: Dependency injection parameters must be correctly typed.
  - `strictInputAccessModifiers`: Component inputs require access modifiers.
  - `strictTemplates`: Templates have strict type checking.

### Imports

Organize imports in this order:

1. Angular core modules (e.g., `@angular/core`, `@angular/common`)
2. Angular features (e.g., `@angular/forms`, `@angular/router`)
3. Third-party libraries (e.g., `rxjs`, `primeng/*`)
4. Application-level modules and services (e.g., `../../services/...`, `../../interfaces/...`)
5. Relative imports for current feature module

Group imports with a blank line between groups. Example:

```typescript
import { Component } from '@angular/core';
import { OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';

import { PacientesService } from '../../services/pacientes/pacientes.service';
import { Pacientes } from '../../interfaces/pacientes';
```

### Error Handling

- Use `try...catch` blocks for code that might throw errors (e.g., HTTP requests).
- Use RxJS `catchError` operator for handling errors in observables.
- Log errors to console for debugging using `console.error()`.
- Display user-friendly error messages via PrimeNG toast messages.
- Use `console.log()` sparingly and only for debugging; remove before committing.

### Component Guidelines

- Use standalone components (Angular 19 default).
- Define component inputs with `@Input()` decorator (required due to `strictInputAccessModifiers`).
- Use the `inject()` function for dependency injection where appropriate, or constructor injection.
- Always implement `OnInit` interface if using `ngOnInit()` lifecycle hook.
- Template logic should be minimal; move complex logic to component methods.

### Service Guidelines

- Mark services with `@Injectable({ providedIn: 'root' })` for app-wide singletons.
- Use proper return types for methods (prefer `Observable<T>` for HTTP calls).
- Use BehaviorSubject for reactive state management.

### Comments

- Add comments to explain complex business logic or non-obvious decisions.
- Do not add comments for obvious code.
- Use `//` for single-line comments and `/** ... */` for multi-line documentation.
- Remove commented-out code before committing.

### Template Guidelines

- Use Angular control flow syntax (`@if`, `@for`, `@switch`) over structural directives (`*ngIf`, `*ngFor`) when possible.
- Use two-way binding with `[(ngModel)]` or signal-based bindings.
- Keep templates readable; extract complex logic to component methods.
