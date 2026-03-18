import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container p-4 container-fluid pb-5">
      <header class="mb-5">
        <h1 class="premium-title">Fale Conosco</h1>
        <p class="text-muted">Estamos aqui para tornar sua estadia inesquecível</p>
      </header>
      
      <div class="row g-5">
        <div class="col-12 col-lg-5">
          <div class="contact-item mb-4 p-4 hover-lift shadow-sm border-0">
            <div class="icon-avatar bg-blue-50 mr-4">
              <i class="pi pi-phone text-primary"></i>
            </div>
            <div class="flex-grow-1">
              <span class="d-block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Telefone Central</span>
              <strong class="text-xl text-gray-800">(81) 3619-0888</strong>
            </div>
          </div>

          <div class="contact-item mb-4 p-4 hover-lift shadow-sm border-0 bg-whatsapp-gradient text-white">
            <div class="icon-avatar bg-white-transparent mr-4">
              <i class="pi pi-whatsapp"></i>
            </div>
            <div class="flex-grow-1">
              <span class="d-block text-xs font-bold opacity-80 uppercase tracking-widest mb-1">WhatsApp</span>
              <strong class="text-xl">Iniciar Conversa</strong>
            </div>
            <i class="pi pi-arrow-right ml-auto op-5"></i>
          </div>

          <div class="contact-item p-4 hover-lift shadow-sm border-0">
             <div class="icon-avatar bg-red-50 mr-4">
               <i class="pi pi-envelope text-red-500"></i>
             </div>
             <div class="flex-grow-1">
               <span class="d-block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">E-mail Suporte</span>
               <strong class="text-xl text-gray-800">ajuda@sistur.gov.br</strong>
             </div>
          </div>
        </div>

        <div class="col-12 col-lg-7">
          <div class="contact-form-card p-5 shadow-2xl border-0">
            <h3 class="form-title mb-4">Envie uma mensagem</h3>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <div class="input-wrapper">
                  <label>Seu Nome</label>
                  <input type="text" placeholder="Como podemos te chamar?" class="form-input-premium">
                </div>
              </div>
              <div class="col-12 col-md-6">
                <div class="input-wrapper">
                  <label>Seu E-mail</label>
                  <input type="email" placeholder="Para respondermos você" class="form-input-premium">
                </div>
              </div>
              <div class="col-12">
                <div class="input-wrapper">
                  <label>Mensagem</label>
                  <textarea placeholder="No que podemos ajudar hoje?" class="form-input-premium" rows="5"></textarea>
                </div>
              </div>
              <div class="col-12 mt-4">
                <button class="btn-primary-gradient w-100 py-3 rounded-xl font-bold text-lg shadow-lg">Enviar Mensagem</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .premium-title { font-weight: 950; font-size: 38px; color: var(--text-main); letter-spacing: -2px; }
    .contact-item { background: white; border-radius: 20px; display: flex; align-items: center; transition: all 0.3s; cursor: pointer; }
    .icon-avatar { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; i { font-size: 24px; } }
    .bg-blue-50 { background: #eff6ff; }
    .bg-red-50 { background: #fef2f2; }
    .bg-whatsapp-gradient { background: linear-gradient(135deg, #22c55e 0%, #15803d 100%); }
    .bg-white-transparent { background: rgba(255,255,255,0.2); color: white; }
    .mr-4 { margin-right: 1.5rem; }
    .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.06) !important; }
    
    .contact-form-card { background: white; border-radius: 32px; }
    .form-title { font-weight: 800; font-size: 24px; color: var(--text-main); }
    .input-wrapper { display: flex; flex-direction: column; gap: 8px; label { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; } }
    .form-input-premium { 
        width: 100%; padding: 15px; border-radius: 14px; border: 2px solid #f1f5f9; background: #f8fafc;
        outline: none; transition: all 0.2s; font-weight: 500;
        &:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(0, 119, 182, 0.1); }
    }
    .btn-primary-gradient { background: var(--primary); color: white; border: none; }
    .op-5 { opacity: 0.5; }
  `]
})
export class ContactComponent {}
