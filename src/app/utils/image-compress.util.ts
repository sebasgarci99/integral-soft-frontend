export interface ImagenComprimida {
    dataUrl: string;
    base64: string;
    mimeType: string;
    pesoBytes: number;
    thumbBase64: string;
}

export interface OpcionesCompresion {
    maxWidth?: number;
    calidad?: number;
    thumbWidth?: number;
    thumbCalidad?: number;
}

const limpiarBase64 = (dataUrl: string): string => {
    const indice = dataUrl.indexOf('base64,');
    return indice >= 0 ? dataUrl.slice(indice + 7) : dataUrl;
};

const calcularPeso = (base64: string): number => Math.floor((base64.length * 3) / 4);

const cargarImagen = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
            img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        reader.readAsDataURL(file);
    });
};

const redimensionar = (img: HTMLImageElement, maxWidth: number, calidad: number): string => {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, maxWidth / img.width);
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el contexto de dibujo.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', calidad);
};

/**
 * Comprime una imagen a JPEG devolviendo el data URL completo.
 * Mantiene la firma histórica usada en los módulos PQRS.
 */
export const comprimirImagen = (file: File, calidad = 0.7, maxWidth = 1200): Promise<string> => {
    return cargarImagen(file).then(img => redimensionar(img, maxWidth, calidad));
};

/**
 * Procesa una imagen para evidencias: devuelve la imagen comprimida, su base64,
 * una miniatura para galerías y el peso estimado en bytes.
 */
export const procesarImagenEvidencia = async (
    file: File,
    opciones: OpcionesCompresion = {}
): Promise<ImagenComprimida> => {
    const {
        maxWidth = 1600,
        calidad = 0.6,
        thumbWidth = 240,
        thumbCalidad = 0.5
    } = opciones;

    const img = await cargarImagen(file);
    const dataUrl = redimensionar(img, maxWidth, calidad);
    const thumbDataUrl = redimensionar(img, thumbWidth, thumbCalidad);
    const base64 = limpiarBase64(dataUrl);
    const thumbBase64 = limpiarBase64(thumbDataUrl);

    return {
        dataUrl,
        base64,
        mimeType: 'image/jpeg',
        pesoBytes: calcularPeso(base64),
        thumbBase64
    };
};
