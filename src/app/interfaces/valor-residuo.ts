export interface ValorResiduo {
    id_valor: number;
    id_empresa: number;
    tipo_objetivo: 'grupo' | 'corriente' | null;
    clave_objetivo: string | null;
    valor_kg: number;
    fecha_vigencia: string;
    observacion: string | null;
    estado: string;
    id_usuario_creacion: number | null;
    createdAt?: string;
    updatedAt?: string;
}
