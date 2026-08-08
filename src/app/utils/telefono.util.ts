export const normalizarTelefono = (telefono: string | null | undefined): string => {
    if (!telefono) return '';

    const limpio = String(telefono)
        .replace(/\s/g, '')
        .replace(/[\-\(\)\.]/g, '');

    if (limpio.startsWith('+')) {
        return limpio;
    }

    if (limpio.startsWith('57')) {
        return '+' + limpio;
    }

    return '+57' + limpio;
};
