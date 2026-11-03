import { Component } from '@angular/core';
import { SITE } from '../../data/site.config';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
    selector: 'app-about',
    imports: [RevealDirective],
    templateUrl: './about.component.html',
    styleUrl: './about.component.css'
})
export class AboutComponent {
    readonly site = SITE;
    readonly carlos = SITE.contacts[0];
}
