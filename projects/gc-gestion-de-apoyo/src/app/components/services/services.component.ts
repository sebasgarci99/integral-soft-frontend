import { Component } from '@angular/core';
import { SITE } from '../../data/site.config';
import { RevealDirective } from '../../directives/reveal.directive';
import { Tilt3dDirective } from '../../directives/tilt-3d.directive';

@Component({
    selector: 'app-services',
    imports: [RevealDirective, Tilt3dDirective],
    templateUrl: './services.component.html',
    styleUrl: './services.component.css'
})
export class ServicesComponent {
    readonly site = SITE;
}
