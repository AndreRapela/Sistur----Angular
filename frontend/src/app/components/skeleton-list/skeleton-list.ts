import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="skeleton-grid">
      <div *ngFor="let item of [1,2,3,4]" class="p-4 border-round border-1 surface-border surface-card mb-4">
        <p-skeleton width="100%" height="150px" styleClass="mb-3"></p-skeleton>
        <div class="flex justify-content-between mb-3">
          <p-skeleton width="40%" height="2rem"></p-skeleton>
          <p-skeleton width="15%" height="1rem"></p-skeleton>
        </div>
        <p-skeleton width="75%" height="1rem" styleClass="mb-2"></p-skeleton>
        <p-skeleton width="60%" height="1rem"></p-skeleton>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-grid { display: grid; gap: 1rem; }
  `]
})
export class SkeletonListComponent {}
