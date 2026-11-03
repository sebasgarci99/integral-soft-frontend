import { Component } from '@angular/core';
import { SITE } from '../../data/site.config';
import { RevealDirective } from '../../directives/reveal.directive';
import { Tilt3dDirective } from '../../directives/tilt-3d.directive';

@Component({
    selector: 'app-software',
    imports: [RevealDirective, Tilt3dDirective],
    templateUrl: './software.component.html',
    styleUrl: './software.component.css'
})
export class SoftwareComponent {
    readonly site = SITE;
}
