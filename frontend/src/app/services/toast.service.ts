import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  severity: 'success' | 'error' | 'info' | 'warn';
  summary: string;
  detail: string;
  id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  messages = signal<ToastMessage[]>([]);
  private idCounter = 0;

  add(message: { severity: 'success' | 'error' | 'info' | 'warn'; summary: string; detail: string }) {
    const id = this.idCounter++;
    const newMessage = { ...message, id };
    this.messages.update(msgs => [...msgs, newMessage]);

    setTimeout(() => {
      this.remove(id);
    }, 4000);
  }

  remove(id: number) {
    this.messages.update(msgs => msgs.filter(m => m.id !== id));
  }
}
