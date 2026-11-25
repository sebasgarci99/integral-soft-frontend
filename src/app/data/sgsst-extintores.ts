export interface CriterioExtintor {
    key: string;
    label: string;
    grupo: 'Manómetro' | 'Estado del extintor' | 'Condiciones de ubicación';
}

export const CRITERIOS_EXTINTOR: CriterioExtintor[] = [
    { key: 'lectura_manometro', label: 'Lectura del manómetro', grupo: 'Manómetro' },
    { key: 'cristal_manometro', label: 'Cristal del manómetro', grupo: 'Manómetro' },
    { key: 'pasador_seguridad', label: 'Pasador de seguridad', grupo: 'Estado del extintor' },
    { key: 'manguera', label: 'Manguera', grupo: 'Estado del extintor' },
    { key: 'boquilla', label: 'Boquilla', grupo: 'Estado del extintor' },
    { key: 'manija', label: 'Manija', grupo: 'Estado del extintor' },
    { key: 'instrucciones_uso', label: 'Instrucciones de uso', grupo: 'Estado del extintor' },
    { key: 'cilindro', label: 'Cilindro (corrosión u óxido)', grupo: 'Estado del extintor' },
    { key: 'pintura', label: 'Pintura', grupo: 'Estado del extintor' },
    { key: 'senalizacion', label: 'Señalización', grupo: 'Condiciones de ubicación' },
    { key: 'altura_150', label: 'A 150 cm del suelo', grupo: 'Condiciones de ubicación' },
    { key: 'estado_soporte', label: 'Estado del soporte', grupo: 'Condiciones de ubicación' },
    { key: 'acceso', label: 'Acceso', grupo: 'Condiciones de ubicación' },
    { key: 'visibilidad', label: 'Visibilidad', grupo: 'Condiciones de ubicación' }
];

export const GRUPOS_CRITERIOS: Array<'Manómetro' | 'Estado del extintor' | 'Condiciones de ubicación'> = [
    'Manómetro',
    'Estado del extintor',
    'Condiciones de ubicación'
];

export const VALORES_CRITERIO = ['B', 'R', 'M', 'N/A'];

export const TIPOS_EXTINTOR = ['Multipropósito', 'CO2', 'PQS', 'Agua', 'Espuma'];

export const CARGO_INSPECTOR_DEFAULT = 'Analista Administrativa';

export const OBSERVACIONES_DEFAULT =
    '* Se deberá mejorar aspectos de señalización según corresponda: Demarcación sobre el suelo o aviso.\n' +
    '* Todos los equipos de reacción ante una emergencia deberán estar libres de cualquier obstáculo que impida su uso correcto en el momento de una emergencia.\n' +
    '"Los extinguidores se colocarán en las proximidades de los lugares de mayor riesgo o peligro y en sitios que se encuentren libres de todo obstáculo que permita actuar rápidamente y sin dificultad." (Resolución 2400 de 1979 – artículo 221, Resolución 2400 de 1979 – artículo 396)';

export const crearCriteriosDefault = (): Record<string, string> => {
    const criterios: Record<string, string> = {};
    CRITERIOS_EXTINTOR.forEach(criterio => {
        criterios[criterio.key] = 'B';
    });
    return criterios;
};
