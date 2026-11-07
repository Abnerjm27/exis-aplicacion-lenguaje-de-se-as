/**
 * LSC Learn · Proyecto EXIS
 * auth-page.js - Controlador POO de las páginas login.html y register.html
 * El modo se lee de <body data-auth-mode="login|register">.
 */
class AuthPageController {
  #mode;
  #submitting;
  #boundSubmit;

  constructor() {
    this.#mode = document.body.getAttribute('data-auth-mode') === 'register' ? 'register' : 'login';
    this.#submitting = false;
    this.#boundSubmit = this.#handleSubmit.bind(this);
  }

  init() {
    const form = document.getElementById('authForm');
    if (form) form.addEventListener('submit', this.#boundSubmit);

    const toggle = document.getElementById('btnTogglePassword');
    const pwd = document.getElementById('authPasswordInput');
    if (toggle && pwd) {
      toggle.addEventListener('click', () => {
        const hidden = pwd.type === 'password';
        pwd.type = hidden ? 'text' : 'password';
        toggle.textContent = hidden ? 'Ocultar' : 'Mostrar';
        toggle.setAttribute('aria-pressed', String(hidden));
      });
    }

    const guest = document.getElementById('btnAuthGuest');
    if (guest) guest.addEventListener('click', () => window.AuthService.enterAsGuest());

    this.#prefillLastUser();
    this.#renderSavedProfiles();
  }

  start() {
    const first = document.querySelector('#authForm input:not([type="hidden"])');
    if (first) first.focus();
  }

  update() { this.#renderSavedProfiles(); }

  reset() {
    const form = document.getElementById('authForm');
    if (form) form.reset();
    this.#showError('');
  }

  destroy() {
    const form = document.getElementById('authForm');
    if (form) form.removeEventListener('submit', this.#boundSubmit);
  }

  #showError(message) {
    const el = document.getElementById('authError');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('hidden', !message);
  }

  #prefillLastUser() {
    if (this.#mode !== 'login') return;
    const active = window.AuthService.getActiveUsername();
    const input = document.getElementById('authIdentifierInput');
    if (active && active !== 'invitado' && input && !input.value) input.value = active;
  }

  #renderSavedProfiles() {
    const bar = document.getElementById('savedProfilesQuickBar');
    const pills = document.getElementById('savedProfilesPills');
    if (!bar || !pills || this.#mode !== 'login') return;
    const profiles = window.AuthService.listProfiles().slice(0, 4);
    bar.classList.toggle('hidden', profiles.length === 0);
    pills.replaceChildren();
    profiles.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-spring px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold bg-slate-900 text-amber-300 border border-amber-500/30';
      btn.textContent = p.displayName || p.username;
      btn.addEventListener('click', () => {
        const input = document.getElementById('authIdentifierInput');
        if (input) input.value = p.username;
        const pwd = document.getElementById('authPasswordInput');
        if (pwd) pwd.focus();
      });
      pills.appendChild(btn);
    });
  }

  async #handleSubmit(e) {
    e.preventDefault();
    if (this.#submitting) return;
    const svc = window.AuthService;
    const identifier = document.getElementById('authIdentifierInput').value;
    const password = document.getElementById('authPasswordInput').value;
    const displayName = document.getElementById('authDisplayNameInput');

    const err = svc.validateIdentifier(identifier) || svc.validatePassword(password);
    if (err) return this.#showError(err);

    if (this.#mode === 'register') {
      const confirm = document.getElementById('authConfirmInput');
      if (confirm && confirm.value !== password) return this.#showError('Las contraseñas no coinciden.');
    }

    this.#showError('');
    this.#setBusy(true);
    const result = this.#mode === 'register'
      ? await svc.register({ displayName: displayName ? displayName.value : '', identifier, password })
      : await svc.login({ identifier, password });

    if (!result.ok) {
      this.#setBusy(false);
      return this.#showError(result.error);
    }
    window.location.href = this.#mode === 'register' ? 'onboarding.html' : svc.pathUrl;
  }

  #setBusy(busy) {
    this.#submitting = busy;
    const btn = document.getElementById('btnAuthSubmit');
    if (btn) {
      btn.disabled = busy;
      btn.classList.toggle('opacity-75', busy);
    }
  }
}

window.AuthPageController = new AuthPageController();
document.addEventListener('DOMContentLoaded', () => {
  window.AuthPageController.init();
  window.AuthPageController.start();
});
