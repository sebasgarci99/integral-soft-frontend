export function insertarTextoPredefinido(
    resumen: string | null | undefined,
    textoPredefinido: string | null | undefined
): string {
    const texto = String(textoPredefinido || '').trim();
    const actual = String(resumen || '');
    if (!texto) return actual;
    if (!actual.trim()) return texto;
    return `${texto}\n${'-'.repeat(40)}\n\n${actual}`;
}
