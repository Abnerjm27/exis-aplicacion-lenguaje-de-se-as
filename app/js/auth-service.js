/**
 * LSC Learn · Proyecto EXIS
 * auth-service.js - Servicio POO de cuentas locales (registro, login, sesión e invitado)
 * Responsabilidad única: persistencia y validación de perfiles. No toca el DOM.
 * Demo local: la contraseña se guarda como hash SHA-256 en el navegador, no es seguridad de servidor.
 */
window.__consoleErrors = window.__consoleErrors || [];
window.addEventListener('error', e => window.__consoleErrors.push(e.message || String(e)));
window.addEventListener('unhandledrejection', e => window.__consoleErrors.push(e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Rejection'));

class AuthService {
  #profilesKey = 'exis_profiles_Map_v1';
  #activeKey = 'exis_active_profile_v1';
  #pathUrl = 'index.html?screen=path';

  init() {}
  start() {}
  update() {}
  reset() {}
  destroy() {}

  get pathUrl() { return this.#pathUrl; }

  #readProfiles() {
    try {
      const raw = localStorage.getItem(this.#profilesKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  #writeProfiles(map) {
    localStorage.setItem(this.#profilesKey, JSON.stringify(map));
  }

  normalizeIdentifier(raw) {
    const id = String(raw || '').trim().toLowerCase();
    return { id, username: id.includes('@') ? id.split('@')[0] : id, isEmail: id.includes('@') };
  }

  validateIdentifier(raw) {
    const { id, isEmail } = this.normalizeIdentifier(raw);
    if (id.length < 2) return 'Ingresa un correo electrónico o usuario válido (mínimo 2 caracteres).';
    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) return 'El correo electrónico no tiene un formato válido.';
    return '';
  }

  validatePassword(pwd) {
    if (!pwd || pwd.length < 4) return 'La contraseña debe tener al menos 4 caracteres.';
    return '';
  }

  async #hash(text) {
    if (!(window.crypto && crypto.subtle)) return `plain:${text}`;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async #syncRemote(profile) {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
    } catch (e) { /* servidor opcional */ }
  }

  getProfile(username) {
    return this.#readProfiles()[username] || null;
  }

  listProfiles() {
    return Object.values(this.#readProfiles()).filter(p => p && p.username && p.username !== 'invitado');
  }

  getActiveUsername() {
    try { return localStorage.getItem(this.#activeKey) || ''; } catch (e) { return ''; }
  }

  setActive(username) {
    localStorage.setItem(this.#activeKey, username);
  }

  async register({ displayName, identifier, password }) {
    const { id, username } = this.normalizeIdentifier(identifier);
    const profiles = this.#readProfiles();
    if (profiles[username]) {
      return { ok: false, error: 'Ya existe una cuenta con ese correo o usuario. Inicia sesión.' };
    }
    const cleanDisplay = (displayName || '').trim() || (username.charAt(0).toUpperCase() + username.slice(1));
    const profile = {
      username,
      email: id.includes('@') ? id : `${username}@exis.edu.co`,
      displayName: cleanDisplay,
      passwordHash: await this.#hash(password),
      level: 'Principiante',
      xp: 0,
      streak: 1,
      masteredSigns: [],
      customPlans: [],
      examHistory: []
    };
    profiles[username] = profile;
    this.#writeProfiles(profiles);
    this.setActive(username);
    const { passwordHash, ...publicProfile } = profile;
    await this.#syncRemote(publicProfile);
    return { ok: true, profile };
  }

  async login({ identifier, password }) {
    const { username } = this.normalizeIdentifier(identifier);
    const profile = this.getProfile(username);
    if (!profile) {
      return { ok: false, error: 'No encontramos esa cuenta en este navegador. Crea una cuenta nueva.' };
    }
    if (profile.passwordHash) {
      const hashed = await this.#hash(password);
      if (hashed !== profile.passwordHash) {
        return { ok: false, error: 'Contraseña incorrecta. Inténtalo de nuevo.' };
      }
    }
    this.setActive(username);
    return { ok: true, profile };
  }

  async updateProfile(username, patch) {
    const profiles = this.#readProfiles();
    if (!profiles[username]) return null;
    profiles[username] = { ...profiles[username], ...patch };
    this.#writeProfiles(profiles);
    const { passwordHash, ...publicProfile } = profiles[username];
    await this.#syncRemote(publicProfile);
    return profiles[username];
  }

  enterAsGuest() {
    try { localStorage.setItem(this.#activeKey, 'invitado'); } catch (e) {}
    window.location.href = this.#pathUrl;
  }

  goToPath() {
    window.location.href = this.#pathUrl;
  }
}

window.AuthService = new AuthService();
