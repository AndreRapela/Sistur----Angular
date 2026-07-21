import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    const loader = document.getElementById('initial-loader');
    if (!loader) {
      return;
    }

    requestAnimationFrame(() => {
      loader.style.opacity = '0';
      window.setTimeout(() => loader.remove(), 180);
    });
  })
  .catch((err) => console.error(err));
