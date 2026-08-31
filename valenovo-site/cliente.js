(() => {
  const login = document.querySelector('#login-screen');
  const dashboard = document.querySelector('#dashboard');
  const form = document.querySelector('#login-form');
  const error = document.querySelector('#form-error');
  const logout = document.querySelector('#logout');
  const company = document.querySelector('#client-company');
  const config = window.VALENOVO_AUTH_CONFIG;
  let authenticatedUser = null;

  if (!config || !window.supabase) {
    error.textContent = 'Não foi possível iniciar o acesso seguro. Tente novamente dentro de momentos.';
    return;
  }

  // A network request that never settles leaves a submit button frozen in a
  // browser. Bound all Supabase fetches so the interface always recovers.
  const fetchWithTimeout = (url, options = {}) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => {
      window.clearTimeout(timeout);
    });
  };

  const client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    global: { fetch: fetchWithTimeout }
  });

  const showLogin = () => {
    // An INITIAL_SESSION / stale restore can resolve after a successful sign-in.
    // Never allow it to put an authenticated visitor back onto the login card.
    if (authenticatedUser) return;
    dashboard.hidden = true;
    login.hidden = false;
  };

  const showDashboard = user => {
    authenticatedUser = user;
    login.hidden = true;
    dashboard.hidden = false;

    // The authenticated session is enough to open the workspace. Fetch the
    // display name afterwards, so a slow profile query can never leave a
    // successful login apparently stuck on the form.
    company.textContent = user.user_metadata?.company_name || 'Cliente Valenovo';
    client
        .from('client_profiles')
        .select('company_name')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.company_name) company.textContent = data.company_name;
        })
        .catch(() => {});
  };

  const restoreSession = async () => {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) showDashboard(session.user);
      else showLogin();
    } catch (_) {
      showLogin();
    }
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.textContent = '';
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'A validar acesso…';

    try {
      const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
        email: form.elements.email.value.trim(),
        password: form.elements.password.value
      });

      if (signInError) {
        error.textContent = 'E-mail ou palavra-passe inválidos.';
        return;
      }
      if (signInData.user) {
        showDashboard(signInData.user);
      } else {
        // A valid response without a user is not a usable login. Do not leave
        // the interface silently on the same form.
        error.textContent = 'Não foi possível confirmar a sessão. Tente novamente.';
      }
    } catch (_) {
      error.textContent = 'O acesso demorou demasiado a responder. Verifique a ligação e tente novamente.';
    } finally {
      submit.disabled = false;
      submit.innerHTML = 'Entrar na área de cliente <span>↗</span>';
    }
  });

  logout.addEventListener('click', async () => {
    await client.auth.signOut();
    authenticatedUser = null;
    form.reset();
    showLogin();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  client.auth.onAuthStateChange((event, session) => {
    // Some browsers complete the auth state change before the original submit
    // promise resolves. This is the earliest reliable point to open the area.
    if (session?.user) showDashboard(session.user);
    else if (event === 'SIGNED_OUT') {
      authenticatedUser = null;
      showLogin();
    }
  });

  restoreSession();
})();
