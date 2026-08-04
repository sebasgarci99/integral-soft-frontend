export const parseDateSinTimezone = (dateString: string | Date | null | undefined): Date | null => {
    if (!dateString) return null;
    if (dateString instanceof Date) return new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate());
    if (typeof dateString !== 'string') return null;

    const fechaLimpia = dateString.split('T')[0];
    const partes = fechaLimpia.split('-');
    if (partes.length !== 3) return null;

    const year = parseInt(partes[0], 10);
    const month = parseInt(partes[1], 10) - 1;
    const day = parseInt(partes[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    return new Date(year, month, day);
};

export const formatDateLocal = (date: Date | string | null | undefined): string | null => {
    if (!date) return null;
    const d = typeof date === 'string' ? parseDateSinTimezone(date) : date;
    if (!d) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
