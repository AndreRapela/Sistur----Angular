import { Directive, ElementRef, Input, OnInit, inject } from '@angular/core';

/**
 * Directive for lazy-loading images
 * Usage: <img appLazyLoad [src]="imageUrl" [placeholder]="placeholderUrl">
 */
@Directive({
  selector: '[appLazyLoad]',
  standalone: true
})
export class LazyLoadDirective implements OnInit {
  @Input() set appLazyLoad(src: string) {
    this.src = src;
  }
  src: string = '';

  private el = inject(ElementRef);

  ngOnInit() {
    if (!this.src) return;

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = this.src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    // Set a low-quality placeholder while loading
    const img = this.el.nativeElement as HTMLImageElement;
    if (!img.src) {
      img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3C/svg%3E`;
    }
    img.classList.add('lazy-loading');

    observer.observe(img);
  }
}
