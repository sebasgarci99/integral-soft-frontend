import PostalMime from 'postal-mime';

export type TipoPqrEml = 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA';

export interface EmlAdjunto {
    archivo_base64: string;
    nombre_original: string;
    mime_type: string;
    tipo_archivo: 'DOCUMENTO';
    peso_bytes: number;
}

export interface EmlParseado {
    nombre_solicitante: string;
    email_solicitante: string;
    asunto: string;
    cuerpo: string;
    tipo_pqr: TipoPqrEml;
    adjuntos: EmlAdjunto[];
    eml_base64: string;
    eml_nombre: string;
}

export interface ResultadoEml {
    datos: EmlParseado;
    excedeAdjuntos: boolean;
    pesoAdjuntos: number;
}

export const TAMANO_MAXIMO_ADJUNTOS_BYTES = 4 * 1024 * 1024;

const base64AUint8 = (base64: string): Uint8Array => {
    const limpio = base64.includes(',') ? base64.split(',')[1] : base64;
    const bin = atob(limpio);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
};

const arrayBufferABase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    const trozo = 0x8000;
    let binario = '';
    for (let i = 0; i < bytes.length; i += trozo) {
        const sub = bytes.subarray(i, i + trozo);
        let parte = '';
        for (let j = 0; j < sub.length; j++) {
            parte += String.fromCharCode(sub[j]);
        }
        binario += parte;
    }
    return btoa(binario);
};

export const calcularPesoBase64 = (base64: string): number => {
    const limpio = base64.includes(',') ? base64.split(',')[1] : base64;
    const padding = limpio.endsWith('==') ? 2 : limpio.endsWith('=') ? 1 : 0;
    return Math.floor((limpio.length * 3) / 4) - padding;
};

export const base64AFile = (base64: string, nombre: string, mimeType: string): File => {
    const bytes = base64AUint8(base64);
    return new File([bytes], nombre || 'adjunto', { type: mimeType || 'application/octet-stream' });
};

const textoDesdeHtml = (html: string): string => {
    const contenedor = document.createElement('div');
    contenedor.innerHTML = html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n');
    return (contenedor.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
};

const detectarTipoPqr = (texto: string): TipoPqrEml => {
    const t = texto.toLowerCase();
    if (t.includes('queja')) return 'QUEJA';
    if (t.includes('reclamo')) return 'RECLAMO';
    if (t.includes('sugerencia')) return 'SUGERENCIA';
    return 'PETICION';
};

const normalizarNombre = (name: string, email: string): string => {
    const nombre = (name || '').trim();
    if (nombre) return nombre;
    const local = (email || '').split('@')[0] || '';
    return local.replace(/[._-]+/g, ' ').trim();
};

export const parsearEml = async (file: File): Promise<ResultadoEml> => {
    const buffer = await file.arrayBuffer();
    const emlBase64 = arrayBufferABase64(buffer);
    const email = await PostalMime.parse(buffer, { attachmentEncoding: 'base64' });

    const from = email.from as { name?: string; address?: string } | undefined;
    const emailSolicitante = (from?.address || '').trim();
    const nombreSolicitante = normalizarNombre(from?.name || '', emailSolicitante);

    const cuerpo = (email.text && email.text.trim()) || (email.html ? textoDesdeHtml(email.html) : '') || '';
    const asunto = (email.subject || '').trim();

    const adjuntos: EmlAdjunto[] = [];
    let pesoAdjuntos = 0;

    for (const adj of email.attachments || []) {
        const nombre = adj.filename || 'adjunto';
        const mime = adj.mimeType || 'application/octet-stream';
        let base64 = '';

        if (typeof adj.content === 'string') {
            base64 = adj.content.includes(',') ? adj.content.split(',')[1] : adj.content;
        } else if (adj.content instanceof ArrayBuffer) {
            base64 = arrayBufferABase64(adj.content);
        } else if (adj.content) {
            base64 = arrayBufferABase64((adj.content as Uint8Array).buffer as ArrayBuffer);
        }

        if (!base64) continue;

        const peso = calcularPesoBase64(base64);
        pesoAdjuntos += peso;
        adjuntos.push({
            archivo_base64: base64,
            nombre_original: nombre,
            mime_type: mime,
            tipo_archivo: 'DOCUMENTO',
            peso_bytes: peso
        });
    }

    return {
        datos: {
            nombre_solicitante: nombreSolicitante,
            email_solicitante: emailSolicitante,
            asunto,
            cuerpo,
            tipo_pqr: detectarTipoPqr(`${asunto} ${cuerpo}`),
            adjuntos,
            eml_base64: emlBase64,
            eml_nombre: file.name || 'solicitud.eml'
        },
        excedeAdjuntos: pesoAdjuntos > TAMANO_MAXIMO_ADJUNTOS_BYTES,
        pesoAdjuntos
    };
};
