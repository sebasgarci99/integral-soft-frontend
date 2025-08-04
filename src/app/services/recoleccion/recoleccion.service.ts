// src/app/services/recoleccion.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { enviroment } from '../../../enviroments/enviroment';   // ↔ tu misma ruta
import { Recoleccion } from '../../interfaces/recoleccion';

@Injectable({ providedIn: 'root' })
export class RecoleccionService {

    private urlApp: string;
    private urlAppAPI: string;

    constructor(private http: HttpClient) {
        this.urlApp     = enviroment.endpoint;              // ej. 'http://localhost:3000/'
        this.urlAppAPI  = 'api/reg_recoleccion/';           // se concatena después
    }

    /* ─────────────────────────────────────────────
        LISTAR (GET) ─ getRegistrosRecoleccion
        Devuelve todos los registros de recolección del usuario
    ───────────────────────────────────────────── */
    obtenerRegistrosRecoleccion(): Observable<Recoleccion[]> {

        const token   = localStorage.getItem('token');
        const idUser  = localStorage.getItem('idUser');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body    = { id_usuario: Number(idUser) };

        return this.http.post<any>(
            `${this.urlApp}${this.urlAppAPI}getRegistrosRecoleccion`,
            body,
            { headers }
        ).pipe(
            map(resp => resp.body)
        );
    }

    /* ─────────────────────────────────────────────
        CREAR  ─ crear_actualizar_reg_recoleccion
    ───────────────────────────────────────────── */
    crearRecoleccion(data: Recoleccion): Observable<Recoleccion> {

        const token   = localStorage.getItem('token');
        const idUser  = localStorage.getItem('idUser');
        const idEmpresa  = localStorage.getItem('idEmpresa');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            /* ───────── id + fecha ───────── */
            id_registropeso      : data.id_registropeso ?? null,
            fecha_registro       : toIsoLocal(data.fecha),

            /* ───────── claves foráneas ───────── */
            id_consultorio       : (data.consultorio as any) ?? null,

            /* ───────── Paso 1 ────────────────── */
            aprovechables        : data.aprovechablesBlanco       ?? 0,
            no_aprovechables     : data.noAprovechablesNegra      ?? 0,
            biosanitarios        : data.biosanitariosRoja         ?? 0,
            cortopunzantes_ng    : data.cortopunzantesNG          ?? 0,   
            cortopunzantes_k     : data.cortopunzantesK           ?? 0,
            anatomopatologicos   : data.anatomopatologicos        ?? 0,
            farmacos             : data.farmacos                  ?? 0,
            chatarra_electronica : data.chatarraElectronica       ?? 0,
            pilas                : data.pilas                     ?? 0,
            quimicos             : data.quimicos                  ?? 0,
            iluminarias          : data.iluminarias               ?? 0,
            aceites_usados       : data.aceitesUsados             ?? 0,

            /* ───────── Paso 2 ────────────────── */
            bolsas_g             : data.bolsasGuardianes          ?? 0,
            bolsas_v             : data.bolsasBlanco              ?? 0,
            bolsas_r             : data.bolsasRoja                ?? 0,
            pret_usado           : (data.pretratamiento  as any)?.value ?? data.pretratamiento,
            dias_almacenamiento  : data.almacenamientoDias        ?? 0,
            tratamiento          : (data.tratamiento     as any)?.value ?? data.tratamiento,
            hora_roja            : data.horaRoja != null ? toIsoLocal(data.horaRoja).substring(11, 19) : null,
            hora_negra           : data.horaNegra != null ? toIsoLocal(data.horaNegra).substring(11, 19) : null,

            /* ───────── Paso 3 ────────────────── */
            dotacion_perso_adecuada      : (data.dotacionGenerador as any)?.value ?? data.dotacionGenerador,
            dotacion_pers_pseg_adecuada  : (data.dotacionPseg      as any)?.value ?? data.dotacionPseg,
            blob_firma                   : data.firma ?? '',

            /* ───────── Auditoría ─────────────── */
            id_usuario          : idUser,
            id_empresa          : idEmpresa
        };

        console.log(body);

        return this.http.post<Recoleccion>(
            `${this.urlApp}${this.urlAppAPI}crear_actualizar_reg_recoleccion`,
            body,
            { headers }
        );
    }

    /* ─────────────────────────────────────────────
        ACTUALIZAR  ─ crear_actualizar_reg_recoleccion
        Basta con pasar el id y sólo las props a modificar
    ───────────────────────────────────────────── */
    actualizarRecoleccion(id: number, data: Partial<Recoleccion>): Observable<Recoleccion> {

        const token   = localStorage.getItem('token');
        const idUser  = localStorage.getItem('idUser');
        const idEmpresa = localStorage.getItem('idEmpresa');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);

        const body = {
            /* ───────── id + fecha ───────── */
            id_registropeso      : id ?? null,
            fecha_registro       : toIsoLocal(data.fecha),

            /* ───────── claves foráneas ───────── */
            id_consultorio       : (data.consultorio as any) ?? null,

            /* ───────── Paso 1 ────────────────── */
            aprovechables        : data.aprovechablesBlanco       ?? 0,
            no_aprovechables     : data.noAprovechablesNegra      ?? 0,
            biosanitarios        : data.biosanitariosRoja         ?? 0,
            cortopunzantes_ng    : data.cortopunzantesNG          ?? 0,   
            cortopunzantes_k     : data.cortopunzantesK           ?? 0,
            anatomopatologicos   : data.anatomopatologicos        ?? 0,
            farmacos             : data.farmacos                  ?? 0,
            chatarra_electronica : data.chatarraElectronica       ?? 0,
            pilas                : data.pilas                     ?? 0,
            quimicos             : data.quimicos                  ?? 0,
            iluminarias          : data.iluminarias               ?? 0,
            aceites_usados       : data.aceitesUsados             ?? 0,

            /* ───────── Paso 2 ────────────────── */
            bolsas_g             : data.bolsasGuardianes          ?? 0,
            bolsas_b             : data.bolsasBlanco              ?? 0,
            bolsas_n             : data.bolsasNegra               ?? 0,
            bolsas_r             : data.bolsasRoja                ?? 0,
            pret_usado           : (data.pretratamiento  as any) ?? data.pretratamiento,
            dias_almacenamiento  : data.almacenamientoDias        ?? 0,
            tratamiento          : (data.tratamiento     as any) ?? data.tratamiento,
            hora_roja            : data.horaRoja != null ? toIsoLocal(data.horaRoja).substring(11, 19) : null,
            hora_negra           : data.horaNegra != null ? toIsoLocal(data.horaNegra).substring(11, 19) : null,

            /* ───────── Paso 3 ────────────────── */
            dotacion_perso_adecuada      : (data.dotacionGenerador as any)?.value ?? data.dotacionGenerador,
            dotacion_pers_pseg_adecuada  : (data.dotacionPseg      as any)?.value ?? data.dotacionPseg,
            blob_firma                   : data.firma ?? '',

            /* ───────── Auditoría ─────────────── */
            id_usuario          : idUser,
            id_empresa          : idEmpresa
        };

        console.log(body);

        return this.http.post<Recoleccion>(
            `${this.urlApp}${this.urlAppAPI}crear_actualizar_reg_recoleccion`,
            body,
            { headers }
        );
    }

    /* ─────────────────────────────────────────────
        BORRAR  ─ eliminar_registro_recoleccion
    ───────────────────────────────────────────── */
    borrarRecoleccion(id: number): Observable<void> {

        const token   = localStorage.getItem('token');

        const headers = new HttpHeaders().set('authorization', `Bearer ${token}`);
        const body    = { id_registropeso: id };

        return this.http.post<void>(
            `${this.urlApp}${this.urlAppAPI}eliminar_registro_recoleccion`,
            body,
            { headers }
        );
    }
}

/**
 * Convierte una fecha a formato ISO 8601 local (YYYY-MM-DDTHH:mm:ss)
 * @param date - Fecha a convertir (puede ser null o undefined)
 * @returns String en formato ISO local o null si la entrada es null/undefined
 */
function toIsoLocal<T extends Date | null | undefined>(date: T): T extends Date ? string : null {
    if (!date) return null as any;
    
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}` as any;
}
