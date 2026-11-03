import { execSync } from 'node:child_process';
import {
    cpSync,
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');

const mainBuild = join(projectRoot, 'dist', 'rh-soft', 'browser');
const landingBuild = join(projectRoot, 'dist', 'gc-gestion-de-apoyo', 'browser');
const deployTarget = join(projectRoot, 'dist', 'public_html');
const landingTarget = join(deployTarget, 'gc-gestion-de-apoyo');

const run = (command) => {
    console.log(`\n▶ ${command}`);
    execSync(command, { cwd: projectRoot, stdio: 'inherit' });
};

const ensureExists = (path, label) => {
    if (!existsSync(path)) {
        throw new Error(`No se encontró ${label}: ${path}`);
    }
};

const getBaseHref = (indexPath) => {
    const html = readFileSync(indexPath, 'utf8');
    return html.match(/<base href="([^"]+)"/)?.[1] ?? '(no definido)';
};

try {
    run('npx ng build rh-soft --configuration production');
    run('npx ng build gc-gestion-de-apoyo --configuration production');

    ensureExists(mainBuild, 'el build de rh-soft');
    ensureExists(landingBuild, 'el build de gc-gestion-de-apoyo');

    console.log('\n▶ Limpiando carpeta de despliegue');
    rmSync(deployTarget, { recursive: true, force: true });
    mkdirSync(deployTarget, { recursive: true });

    console.log('▶ Copiando aplicación principal');
    cpSync(mainBuild, deployTarget, { recursive: true });

    console.log('▶ Copiando landing de GC');
    cpSync(landingBuild, landingTarget, { recursive: true });

    const rootHtaccess = join(projectRoot, '.htaccess');
    ensureExists(rootHtaccess, 'el .htaccess raíz');
    copyFileSync(rootHtaccess, join(deployTarget, '.htaccess'));

    const landingHtaccess = join(landingBuild, '.htaccess');
    ensureExists(landingHtaccess, 'el .htaccess de la landing');
    copyFileSync(landingHtaccess, join(landingTarget, '.htaccess'));

    const requiredFiles = [
        ['app principal / index.html', join(deployTarget, 'index.html')],
        ['app principal / .htaccess', join(deployTarget, '.htaccess')],
        ['landing / index.html', join(landingTarget, 'index.html')],
        ['landing / .htaccess', join(landingTarget, '.htaccess')]
    ];

    for (const [label, path] of requiredFiles) {
        ensureExists(path, label);
    }

    const mainBaseHref = getBaseHref(join(deployTarget, 'index.html'));
    const landingBaseHref = getBaseHref(join(landingTarget, 'index.html'));

    if (landingBaseHref !== './') {
        console.warn(
            `\n⚠ La landing quedó con base href "${landingBaseHref}". ` +
                'Revisa la configuración de producción en angular.json.'
        );
    }

    console.log('\n✔ Build de despliegue listo');
    console.log(`  Carpeta: ${deployTarget}`);
    console.log(`  base href app principal: ${mainBaseHref}`);
    console.log(`  base href landing: ${landingBaseHref}`);
    console.log('\n  Estructura:');
    console.log('   /                     → app principal');
    console.log('   /gc-gestion-de-apoyo/ → landing GC');
    console.log('\n  Sube el contenido de dist/public_html a la carpeta public_html del host.');
    console.log('  Incluye los archivos ocultos .htaccess de la raíz y de la landing.');
} catch (error) {
    console.error('\n✖ Error generando el despliegue');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
}
