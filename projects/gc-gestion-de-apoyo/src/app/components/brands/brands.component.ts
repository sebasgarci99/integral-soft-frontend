import { Component } from '@angular/core';
import { SITE } from '../../data/site.config';
import { RevealDirective } from '../../directives/reveal.directive';
import { Tilt3dDirective } from '../../directives/tilt-3d.directive';

@Component({
    selector: 'app-brands',
    imports: [RevealDirective, Tilt3dDirective],
    templateUrl: './brands.component.html',
    styleUrl: './brands.component.css'
})
export class BrandsComponent {
    readonly site = SITE;
}
