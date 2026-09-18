const PALETA: Record<string, string> = {
    emerald: '#10b981',
    teal: '#0d9488',
    sky: '#0ea5e9',
    blue: '#3b82f6',
    purple: '#a855f7',
    violet: '#8b5cf6',
    amber: '#f59e0b',
    orange: '#f97316',
    rose: '#f43f5e',
    red: '#ef4444',
    slate: '#64748b',
    green: '#22c55e'
};

export const COLOR_GRUPO_DEFECTO = '#0d9488';

/**
 * Resuelve un color de grupo a un valor CSS válido.
 * Acepta hexadecimal directo o un token de la paleta del proyecto.
 */
export const resolverColorGrupo = (color?: string | null): string => {
    if (!color) return COLOR_GRUPO_DEFECTO;
    const valor = color.trim();
    if (valor.startsWith('#') || valor.startsWith('rgb')) return valor;
    return PALETA[valor.toLowerCase()] || COLOR_GRUPO_DEFECTO;
};
