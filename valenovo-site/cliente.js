(() => {
  const login = document.querySelector('#login-screen');
  const dashboard = document.querySelector('#dashboard');
  const form = document.querySelector('#login-form');
  const error = document.querySelector('#form-error');
  const logout = document.querySelector('#logout');
  const company = document.querySelector('#client-company');
  const config = window.VALENOVO_AUTH_CONFIG;

  if (!config || !window.supabase) {
    error.textContent = 'Não foi possível iniciar o acesso seguro. Tente novamente dentro de momentos.';
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });

  const showLogin = () => {
    dashboard.hidden = true;
    login.hidden = false;
  };

  const showDashboard = async user => {
    const { data } = await client
      .from('client_profiles')
      .select('company_name')
      .eq('id', user.id)
      .maybeSingle();
    company.textContent = data?.company_name || user.user_metadata?.company_name || 'Cliente Valenovo';
    login.hidden = true;
    dashboard.hidden = false;
  };

  const restoreSession = async () => {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) await showDashboard(session.user);
    else showLogin();
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'A validar acesso…';

    const { error: signInError } = await client.auth.signInWithPassword({
      email: form.elements.email.value.trim(),
      password: form.elements.password.value
    });

    submit.disabled = false;
    submit.innerHTML = 'Entrar na área de cliente <span>↗</span>';
    if (signInError) {
      error.textContent = 'E-mail ou palavra-passe inválidos.';
      return;
    }
    await restoreSession();
  });

  logout.addEventListener('click', async () => {
    await client.auth.signOut();
    form.reset();
    showLogin();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  client.auth.onAuthStateChange((_event, session) => {
    if (!session) showLogin();
  });

  restoreSession();
})();
