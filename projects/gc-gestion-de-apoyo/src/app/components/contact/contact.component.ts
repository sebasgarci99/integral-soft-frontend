import { Component } from '@angular/core';
import { SITE } from '../../data/site.config';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
    selector: 'app-contact',
    imports: [RevealDirective],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.css'
})
export class ContactComponent {
    readonly site = SITE;
}
