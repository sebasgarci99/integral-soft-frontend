import { Component } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { BrandsComponent } from './components/brands/brands.component';
import { ServicesComponent } from './components/services/services.component';
import { MethodComponent } from './components/method/method.component';
import { AboutComponent } from './components/about/about.component';
import { SoftwareComponent } from './components/software/software.component';
import { ContactComponent } from './components/contact/contact.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
    selector: 'app-root',
    imports: [
        NavbarComponent,
        HeroComponent,
        BrandsComponent,
        ServicesComponent,
        MethodComponent,
        AboutComponent,
        SoftwareComponent,
        ContactComponent,
        FooterComponent
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {}
