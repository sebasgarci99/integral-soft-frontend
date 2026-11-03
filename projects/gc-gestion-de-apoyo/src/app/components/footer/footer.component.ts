import { Component } from '@angular/core';
import { SITE } from '../../data/site.config';

@Component({
    selector: 'app-footer',
    imports: [],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.css'
})
export class FooterComponent {
    readonly site = SITE;
    readonly anio = new Date().getFullYear();
}
