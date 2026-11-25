export function normalizarVinetas(texto: string | null | undefined): string {
    return String(texto || '')
        .split('\n')
        .map(linea => {
            const asterisco = linea.match(/^(\s*)\*\s*/);
            const guion = linea.match(/^(\s*)-\s+/);
            const coincidencia = asterisco || guion;
            if (!coincidencia) return linea;
            return `${coincidencia[1]}• ${linea.slice(coincidencia[0].length)}`;
        })
        .join('\n');
}

export function insertarTextoPredefinido(
    resumen: string | null | undefined,
    textoPredefinido: string | null | undefined
): string {
    const texto = normalizarVinetas(textoPredefinido).trim();
    const actual = String(resumen || '');
    if (!texto) return actual;
    if (!actual.trim()) return texto;
    return `${texto}\n${'-'.repeat(40)}\n\n${actual}`;
}
