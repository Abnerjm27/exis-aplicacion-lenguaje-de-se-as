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
    const isEmail = id.includes('@');
    return { id, username: id, legacyKey: isEmail ? id.split('@')[0] : id, isEmail };
  }

  validateIdentifier(raw, mode = 'login') {
    const { id, isEmail } = this.normalizeIdentifier(raw);
    if (mode === 'register') {
      if (!id || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) {
        return 'Ingresa un correo electrónico válido.';
      }
      return '';
    }
    if (id.length < 2) return 'Ingresa un correo electrónico o usuario válido (mínimo 2 caracteres).';
    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id)) return 'El correo electrónico no tiene un formato válido.';
    return '';
  }

  validatePassword(pwd) {
    if (!pwd || pwd.length < 4) return 'La contraseña debe tener al menos 4 caracteres.';
    return '';
  }

  async #hash(text) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    const input = `manitas-lsc:${String(text || '')}`;
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b1;
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ (code + i), 0x85ebca6b) >>> 0;
    }
    return `fallback-h2:${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
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

  getProfile(identifier) {
    const profiles = this.#readProfiles();
    const raw = String(identifier || '').trim().toLowerCase();
    if (profiles[raw]) return profiles[raw];
    const { username, legacyKey } = this.normalizeIdentifier(raw);
    return profiles[username] || profiles[legacyKey] || null;
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
    const labelBase = id.includes('@') ? id.split('@')[0] : username;
    const cleanDisplay = (displayName || '').trim() || (labelBase.charAt(0).toUpperCase() + labelBase.slice(1));
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
    const { username, legacyKey } = this.normalizeIdentifier(identifier);
    let profiles = this.#readProfiles();
    let storageKey = profiles[username] ? username : (profiles[legacyKey] ? legacyKey : null);
    let profile = storageKey ? profiles[storageKey] : null;

    if (!profile) {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data && data.users) ? data.users : [];
          const remoteMatch = list.find(u => {
            const uName = String(u && u.username || '').trim().toLowerCase();
            return uName === username || uName === legacyKey;
          });
          if (remoteMatch) {
            storageKey = remoteMatch.username;
            profiles = this.#readProfiles();
            profiles[storageKey] = remoteMatch;
            this.#writeProfiles(profiles);
            profile = remoteMatch;
          }
        }
      } catch (e) { /* servidor opcional */ }
    }

    if (!profile) {
      return { ok: false, error: 'No encontramos esa cuenta en este navegador. Crea una cuenta nueva.' };
    }
    if (profile.passwordHash) {
      const hashed = await this.#hash(password);
      if (hashed !== profile.passwordHash) {
        return { ok: false, error: 'Contraseña incorrecta. Inténtalo de nuevo.' };
      }
    }
    this.setActive(storageKey || profile.username);
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
