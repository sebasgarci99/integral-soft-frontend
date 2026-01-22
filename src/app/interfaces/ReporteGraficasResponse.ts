import { GraficaUsuario } from "./GraficaUsuario";

export interface ReporteGraficasResponse {
    msg: string;
    state: string;
    body: {
        graficas: GraficaUsuario[];
    };
}