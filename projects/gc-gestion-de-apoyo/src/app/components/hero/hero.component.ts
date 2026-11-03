import {
    AfterViewInit,
    Component,
    ElementRef,
    NgZone,
    OnDestroy,
    ViewChild
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SITE } from '../../data/site.config';

gsap.registerPlugin(ScrollTrigger);

@Component({
    selector: 'app-hero',
    imports: [],
    templateUrl: './hero.component.html',
    styleUrl: './hero.component.css'
})
export class HeroComponent implements AfterViewInit, OnDestroy {
    readonly site = SITE;
    readonly whatsappPrincipal = SITE.contacts[0].whatsappUrl;

    @ViewChild('escena', { static: true })
    private escenaRef!: ElementRef<HTMLCanvasElement>;

    private renderer?: THREE.WebGLRenderer;
    private escena?: THREE.Scene;
    private camara?: THREE.PerspectiveCamera;
    private mundo?: THREE.Group;
    private nucleo?: THREE.Group;
    private anillos: THREE.Mesh[] = [];
    private estrellas: THREE.Points[] = [];
    private entorno?: THREE.Texture;
    private inicio = 0;
    private frameId = 0;
    private objetivo = { x: 0, y: 0 };
    private suavizado = { x: 0, y: 0 };
    private resizeObserver?: ResizeObserver;
    private animaciones: gsap.core.Tween[] = [];
    private reducido = false;
    private animando = false;

    constructor(private readonly ngZone: NgZone) {}

    ngAfterViewInit(): void {
        this.reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.ngZone.runOutsideAngular(() => this.iniciarEscena());
    }

    ngOnDestroy(): void {
        this.animando = false;
        cancelAnimationFrame(this.frameId);
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('resize', this.onResize);
        this.resizeObserver?.disconnect();

        for (const animacion of this.animaciones) {
            animacion.scrollTrigger?.kill();
            animacion.kill();
        }

        this.escena?.traverse((objeto) => {
            if (objeto instanceof THREE.Mesh || objeto instanceof THREE.Points) {
                objeto.geometry.dispose();
                const materiales = Array.isArray(objeto.material)
                    ? objeto.material
                    : [objeto.material];
                for (const material of materiales) {
                    material.dispose();
                }
            }
        });

        this.entorno?.dispose();
        this.renderer?.dispose();
        this.renderer?.forceContextLoss();
    }

    private iniciarEscena(): void {
        const canvas = this.escenaRef.nativeElement;
        const contenedor = canvas.parentElement;

        if (!contenedor || contenedor.clientWidth === 0 || contenedor.clientHeight === 0) {
            return;
        }

        try {
            this.renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance'
            });
        } catch {
            canvas.classList.add('hero__canvas--oculto');
            return;
        }

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(contenedor.clientWidth, contenedor.clientHeight, false);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.12;

        this.escena = new THREE.Scene();

        const pmrem = new THREE.PMREMGenerator(this.renderer);
        const entornoEscena = new RoomEnvironment();
        this.entorno = pmrem.fromScene(entornoEscena, 0.04).texture;
        this.escena.environment = this.entorno;
        entornoEscena.dispose();
        pmrem.dispose();

        this.camara = new THREE.PerspectiveCamera(
            42,
            contenedor.clientWidth / contenedor.clientHeight,
            0.1,
            100
        );
        this.camara.position.set(0, 0.1, 6.4);

        this.mundo = new THREE.Group();
        if (window.innerWidth < 720) {
            this.mundo.scale.setScalar(0.68);
            this.mundo.position.y = 0.35;
        }
        this.escena.add(this.mundo);

        this.inicio = performance.now();

        this.construirLuces();
        this.construirNucleo();
        this.construirParticulas();

        window.addEventListener('pointermove', this.onPointerMove, { passive: true });
        window.addEventListener('resize', this.onResize, { passive: true });
        document.addEventListener('visibilitychange', this.onVisibilityChange);

        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.onResize());
            this.resizeObserver.observe(contenedor);
        }

        if (this.reducido) {
            this.render();
            return;
        }

        this.configurarScroll();
        this.animando = true;
        this.frameId = requestAnimationFrame(this.animar);
    }

    private construirLuces(): void {
        if (!this.escena) {
            return;
        }

        const ambiente = new THREE.AmbientLight(0xffffff, 1.8);
        this.escena.add(ambiente);

        const luzPrincipal = new THREE.DirectionalLight(0xffffff, 3.2);
        luzPrincipal.position.set(4, 5, 6);
        this.escena.add(luzPrincipal);

        const luzAzul = new THREE.PointLight(0x1877c9, 18, 14);
        luzAzul.position.set(-4, 2, 4);
        this.escena.add(luzAzul);

        const luzVerde = new THREE.PointLight(0x2f8f46, 14, 14);
        luzVerde.position.set(4, -2, 3);
        this.escena.add(luzVerde);
    }

    private construirNucleo(): void {
        if (!this.mundo) {
            return;
        }

        const esMovil = window.innerWidth < 720;
        const grupo = new THREE.Group();

        const esfera = new THREE.Mesh(
            new THREE.SphereGeometry(1.42, esMovil ? 32 : 64, esMovil ? 32 : 64),
            new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                metalness: 0.04,
                roughness: 0.08,
                transmission: 0.94,
                thickness: 1.1,
                ior: 1.42,
                clearcoat: 1,
                clearcoatRoughness: 0.12,
                iridescence: 0.75,
                iridescenceIOR: 1.32,
                iridescenceThicknessRange: [120, 460],
                envMapIntensity: 1.35,
                transparent: true
            })
        );
        grupo.add(esfera);

        const malla = new THREE.Mesh(
            new THREE.IcosahedronGeometry(1.43, esMovil ? 2 : 3),
            new THREE.MeshBasicMaterial({
                color: 0x0b4f9c,
                wireframe: true,
                transparent: true,
                opacity: esMovil ? 0.12 : 0.18
            })
        );
        grupo.add(malla);

        const anilloAzul = new THREE.Mesh(
            new THREE.TorusGeometry(2.08, esMovil ? 0.028 : 0.034, 16, esMovil ? 120 : 220),
            new THREE.MeshStandardMaterial({
                color: 0x0b4f9c,
                metalness: 0.9,
                roughness: 0.18,
                emissive: 0x0b4f9c,
                emissiveIntensity: 0.18
            })
        );
        anilloAzul.rotation.set(Math.PI / 2.3, 0.25, 0.2);
        grupo.add(anilloAzul);
        this.anillos.push(anilloAzul);

        const anilloVerde = new THREE.Mesh(
            new THREE.TorusGeometry(2.08, esMovil ? 0.02 : 0.024, 16, esMovil ? 120 : 220),
            new THREE.MeshStandardMaterial({
                color: 0x2f8f46,
                metalness: 0.82,
                roughness: 0.22,
                emissive: 0x2f8f46,
                emissiveIntensity: 0.16
            })
        );
        anilloVerde.rotation.set(Math.PI / 1.85, -0.55, 0.85);
        grupo.add(anilloVerde);
        this.anillos.push(anilloVerde);

        const nucleoInterior = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.58, 1),
            new THREE.MeshStandardMaterial({
                color: 0x67b7f0,
                metalness: 0.55,
                roughness: 0.18,
                emissive: 0x1877c9,
                emissiveIntensity: 0.75
            })
        );
        grupo.add(nucleoInterior);

        this.nucleo = grupo;
        this.mundo.add(grupo);
    }

    private construirParticulas(): void {
        if (!this.escena || !this.mundo) {
            return;
        }

        const esMovil = window.innerWidth < 720;
        const cantidad = esMovil ? 240 : 620;

        for (const configuracion of [
            { color: 0x1877c9, cantidad, radio: 3.2, tamano: 0.028, opacidad: 0.55 },
            { color: 0x2f8f46, cantidad: Math.floor(cantidad * 0.55), radio: 4.2, tamano: 0.023, opacidad: 0.42 }
        ]) {
            const posiciones = new Float32Array(configuracion.cantidad * 3);

            for (let i = 0; i < configuracion.cantidad; i++) {
                const radio = configuracion.radio + Math.random() * 4.4;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                posiciones[i * 3] = radio * Math.sin(phi) * Math.cos(theta);
                posiciones[i * 3 + 1] = radio * Math.cos(phi) * 0.62;
                posiciones[i * 3 + 2] = radio * Math.sin(phi) * Math.sin(theta);
            }

            const geometria = new THREE.BufferGeometry();
            geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));

            const particulas = new THREE.Points(
                geometria,
                new THREE.PointsMaterial({
                    color: configuracion.color,
                    size: configuracion.tamano,
                    transparent: true,
                    opacity: configuracion.opacidad,
                    depthWrite: false
                })
            );

            this.estrellas.push(particulas);
            this.mundo.add(particulas);
        }
    }

    private configurarScroll(): void {
        if (!this.nucleo || !this.camara) {
            return;
        }

        const base = {
            trigger: '#inicio',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        };

        this.animaciones.push(
            gsap.to(this.nucleo.rotation, {
                y: Math.PI * 1.25,
                x: 0.4,
                ease: 'none',
                scrollTrigger: { ...base }
            })
        );

        this.animaciones.push(
            gsap.to(this.camara.position, {
                z: 8.2,
                y: 0.9,
                ease: 'none',
                scrollTrigger: { ...base }
            })
        );
    }

    private readonly animar = (): void => {
        if (!this.animando) {
            return;
        }

        this.frameId = requestAnimationFrame(this.animar);
        const tiempo = (performance.now() - this.inicio) / 1000;

        this.suavizado.x += (this.objetivo.x - this.suavizado.x) * 0.045;
        this.suavizado.y += (this.objetivo.y - this.suavizado.y) * 0.045;

        if (this.mundo) {
            this.mundo.rotation.x = this.suavizado.y * 0.12;
            this.mundo.rotation.y = this.suavizado.x * 0.18;
        }

        for (let i = 0; i < this.anillos.length; i++) {
            const anillo = this.anillos[i];
            anillo.rotation.z += 0.0011 * (i % 2 === 0 ? 1 : -1);
            anillo.rotation.y += 0.0006 * (i % 2 === 0 ? -1 : 1);
        }

        for (let i = 0; i < this.estrellas.length; i++) {
            this.estrellas[i].rotation.y = tiempo * (i === 0 ? 0.012 : -0.008);
        }

        if (this.nucleo) {
            this.nucleo.position.y = Math.sin(tiempo * 0.7) * 0.06;
        }

        this.render();
    };

    private readonly onPointerMove = (event: PointerEvent): void => {
        const canvas = this.escenaRef.nativeElement;
        const rect = canvas.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
            return;
        }

        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        this.objetivo.x = (x - 0.5) * 2;
        this.objetivo.y = (0.5 - y) * 2;
    };

    private readonly onResize = (): void => {
        const contenedor = this.escenaRef.nativeElement.parentElement;

        if (!contenedor || !this.renderer || !this.camara) {
            return;
        }

        const ancho = contenedor.clientWidth;
        const alto = contenedor.clientHeight;

        if (ancho === 0 || alto === 0) {
            return;
        }

        this.camara.aspect = ancho / alto;
        this.camara.updateProjectionMatrix();
        this.renderer.setSize(ancho, alto, false);

        if (this.reducido) {
            this.render();
        }
    };

    private readonly onVisibilityChange = (): void => {
        if (this.reducido) {
            return;
        }

        if (document.hidden) {
            this.animando = false;
            cancelAnimationFrame(this.frameId);
            return;
        }

        if (!this.animando) {
            this.animando = true;
            this.frameId = requestAnimationFrame(this.animar);
        }
    };

    private render(): void {
        if (this.renderer && this.escena && this.camara) {
            this.renderer.render(this.escena, this.camara);
        }
    }
}
