import { Component } from '@angular/core';
import { SITE } from '../../data/site.config';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
    selector: 'app-method',
    imports: [RevealDirective],
    templateUrl: './method.component.html',
    styleUrl: './method.component.css'
})
export class MethodComponent {
    readonly site = SITE;
}
