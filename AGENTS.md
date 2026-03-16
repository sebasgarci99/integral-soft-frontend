# AGENTS.md

This document provides instructions for AI agents working in this repository.

## Build, Lint, and Test

### Build

To build the project, run:

```bash
npm run build
```

This will create a production build in the `dist/` directory. For a development build, use `ng build --configuration development`.

### Lint

To lint the code, run:

```bash
ng lint
```

This will check the code for style and quality issues.

### Test

To run all tests, use:

```bash
npm run test
```

To run a single test file, use the `--include` flag:

```bash
ng test --include=src/app/components/your-component/your-component.spec.ts
```

## Code Style

### General Principles

- This is an Angular project using TypeScript.
- Follow standard Angular and TypeScript best practices.
- Since there is no Prettier or ESLint configuration, pay close attention to the existing code style and maintain consistency.

### Naming Conventions

- **Components**: Use PascalCase for component class names (e.g., `MyComponent`).
- **Services**: Use PascalCase for service class names (e.g., `DataService`).
- **Files**: Use kebab-case for filenames (e.g., `my-component.component.ts`).
- **Variables**: Use camelCase for variables and functions (e.g., `let myVariable = ...`).
- **Interfaces**: Use PascalCase and prefix with `I` (e.g., `IUserData`).

### TypeScript

- **Types**: Use types wherever possible. Avoid using `any`.
- **Strict Mode**: The project has `strict` mode enabled in `tsconfig.json`. Adhere to the following rules:
    - `noImplicitOverride`: All overriding members must have an `override` keyword.
    - `noPropertyAccessFromIndexSignature`: Prevents accessing properties that are not explicitly defined.
    - `noImplicitReturns`: All code paths in a function must return a value if the function is typed to return something.
    - `noFallthroughCasesInSwitch`: Prevents fallthrough cases in switch statements.
- **Angular Strict Mode**: The project also has strict Angular compiler options enabled:
    - `strictInjectionParameters`: Ensures that dependency injection parameters are correctly typed.
    - `strictInputAccessModifiers`: Requires access modifiers for component inputs.
    - `strictTemplates`: Enables strict type checking in templates.

### Imports

Organize imports in the following order:

1.  External libraries (e.g., `@angular/core`, `rxjs`).
2.  Application-level modules and services (e.g., `src/app/core/services/...`).
3.  Relative imports for the current feature module.

### Error Handling

- Use `try...catch` blocks for code that might throw an error (e.g., HTTP requests).
- Use RxJS `catchError` operator for handling errors in observables.
- Log errors to the console for debugging, but avoid showing technical error details to the user.

### Comments

- Add comments to explain complex logic or business rules.
- Do not add comments for obvious code.
- Use `//` for single-line comments and `/** ... */` for multi-line comments and documentation.
