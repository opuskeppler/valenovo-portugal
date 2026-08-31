(() => {
  const login = document.querySelector('#login-screen');
  const dashboard = document.querySelector('#dashboard');
  const form = document.querySelector('#login-form');
  const error = document.querySelector('#form-error');
  const sessionKey = 'valenovo-client-session';
  // Keep the proposal on the same published site so the client area never depends
  // on an expiring preview URL.
  const proposalUrl = '../escopo-estrategico.html';

  sessionStorage.removeItem(sessionKey);
  login.hidden = false;
  dashboard.hidden = true;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    if (email !== 'ayapitaya@ayapitaya.com.br' || password !== 'europa2026') {
      error.textContent = 'As credenciais indicadas não são válidas.';
      return;
    }
    sessionStorage.setItem(sessionKey, 'active');
    window.location.replace(proposalUrl);
  });

  document.querySelector('#logout').addEventListener('click', () => {
    sessionStorage.removeItem(sessionKey);
    dashboard.hidden = true;
    login.hidden = false;
    form.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
