// login.js
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    console.log('[login.js] DOMContentLoaded');

    // Elements (safe queries)
    const modal = document.getElementById('authModal');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const signInBtn = document.getElementById('signInBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const form = document.getElementById('authForm');
    const msg = document.getElementById('formMessage');

    console.log('[login.js] elements present:', {
      modal: !!modal, getStartedBtn: !!getStartedBtn, signInBtn: !!signInBtn,
      closeModalBtn: !!closeModalBtn, form: !!form, msg: !!msg
    });

    // Modal helpers
    function openModal() {
      if (!modal) return console.warn('[login.js] openModal: modal not found');
      modal.classList.add('show');
      // autofocus first input
      const first = modal.querySelector('input, textarea, button');
      if (first) first.focus();
      console.log('[login.js] modal opened');
    }
    function closeModal() {
      if (!modal) return;
      modal.classList.remove('show');
      if (msg) { msg.textContent = ''; msg.style.color = ''; }
      console.log('[login.js] modal closed');
    }

    // Attach open/close handlers (if present)
    if (getStartedBtn) getStartedBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
    if (signInBtn) signInBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
    if (closeModalBtn) closeModalBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
    // Esc to close
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal && modal.classList.contains('show')) closeModal(); });

    // Form fields (IDs from your HTML)
    const byId = id => document.getElementById(id);
    const fullnameF = byId('fullname');
    const phoneF = byId('phone');
    const emailF = byId('email');
    const vehnoF = byId('vehno');
    const rcF = byId('rc');
    const dlF = byId('dl');
    const pwdF = byId('password');
    const pwd2F = byId('password2');

    console.log('[login.js] fields found:', {
      fullname: !!fullnameF, phone: !!phoneF, email: !!emailF, vehno: !!vehnoF,
      rc: !!rcF, dl: !!dlF, password: !!pwdF, password2: !!pwd2F
    });

    if (!form) {
      console.error('[login.js] auth form not found - aborting attach');
      return;
    }

    // Primary submit handler
    function handleSubmit(e) {
      if (e && e.preventDefault) e.preventDefault();
      console.log('[login.js] form submit fired');

      const getVal = el => el && el.value ? el.value.trim() : '';

      const fullname = getVal(fullnameF);
      const phone = getVal(phoneF);
      const email = getVal(emailF);
      const vehno = getVal(vehnoF);
      const rc = getVal(rcF);
      const dl = getVal(dlF);
      const password = getVal(pwdF);
      const password2 = getVal(pwd2F);

      // Basic validation
      if (!fullname || !phone || !email || !vehno || !password || !password2) {
        if (msg) { msg.style.color = 'crimson'; msg.textContent = 'Please fill all required fields.'; }
        console.warn('[login.js] missing fields');
        return;
      }
      if (password.length < 6) {
        if (msg) { msg.style.color = 'crimson'; msg.textContent = 'Password must be at least 6 characters.'; }
        console.warn('[login.js] password too short');
        return;
      }
      if (password !== password2) {
        if (msg) { msg.style.color = 'crimson'; msg.textContent = 'Passwords do not match.'; }
        console.warn('[login.js] passwords mismatch');
        return;
      }

      // Demo auth: localStorage
      let users = [];
      try { users = JSON.parse(localStorage.getItem('pm_users') || '[]'); } catch (err) { users = []; }

      const existing = users.find(u => (u.email && u.email.toLowerCase() === email.toLowerCase()) || (u.phone && u.phone === phone));

      if (existing) {
        if (existing.password !== password) {
          if (msg) { msg.style.color = 'crimson'; msg.textContent = 'Account exists but password is incorrect.'; }
          console.warn('[login.js] existing user wrong password');
          return;
        }
        // sign in existing
        localStorage.setItem('pm_current', JSON.stringify(existing));
        if (msg) { msg.style.color = 'green'; msg.textContent = 'Signed in — redirecting...'; }
        console.log('[login.js] signed in existing user -> redirecting to basic.html');
        setTimeout(() => { window.location.href = 'basic.html'; }, 500);
        return;
      }

      // register new user
      const newUser = { fullname, phone, email, vehno, rc, dl, password, created: Date.now() };
      users.push(newUser);
      try {
        localStorage.setItem('pm_users', JSON.stringify(users));
        localStorage.setItem('pm_current', JSON.stringify(newUser));
      } catch (err) {
        console.error('[login.js] localStorage error', err);
      }
      if (msg) { msg.style.color = 'green'; msg.textContent = 'Account created — redirecting...'; }
      console.log('[login.js] new user created -> redirecting to basic.html');
      setTimeout(() => { window.location.href = 'basic.html'; }, 500);
    }

    // Attach submit to form
    form.addEventListener('submit', handleSubmit);
    console.log('[login.js] submit handler attached to form');

    // Also attach to any button[type=submit] inside form (robust)
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', (ev) => {
        // clicking a submit button normally triggers 'submit', but some layouts use <button> without type
        if (!submitBtn.getAttribute('type') || submitBtn.getAttribute('type').toLowerCase() !== 'submit') {
          handleSubmit(ev);
        } // otherwise form submit will call handleSubmit
      });
      console.log('[login.js] attached click handler to submit button (if non-submit type)');
    }

    // Small UX helpers: phone/veh formatting
    if (phoneF) phoneF.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9+\-\(\) ]/g, ''); });
    if (vehnoF) vehnoF.addEventListener('input', (e) => { e.target.value = e.target.value.toUpperCase(); });

    console.log('[login.js] initialization complete');
  });
})();
