
var DEFAULT_TARGET = 'html/groups/Groups.html';
var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Erlaubt nur Pfade auf unserer eigenen Seite (kein "//host", kein "https://...").
function getSafeRedirect() {
  var requested = new URLSearchParams(window.location.search).get('redirect');
  if (!requested || requested.charAt(0) !== '/' || requested.charAt(1) === '/' || requested.charAt(1) === '\\') {
    return null;
  }
  try {
    var url = new URL(requested, window.location.origin);
    if (url.origin !== window.location.origin) {
      return null;
    }
    return url.pathname + url.search + url.hash;
  } catch (e) {
    return null;
  }
}

function goToTarget() {
  var target = getSafeRedirect();
  window.location.replace(target !== null ? target : getSiteRoot() + DEFAULT_TARGET);
}

// Gibt eine Fehlermeldung zurück oder null, wenn die Eingaben passen.
function validateLogon(email, password) {
  if (email === '') {
    return 'Bitte gib deine E-Mail-Adresse ein.';
  }
  if (!EMAIL_PATTERN.test(email)) {
    return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  }
  if (password === '') {
    return 'Bitte gib dein Passwort ein.';
  }
  return null;
}

$(function () {
  // Wer schon eingeloggt ist, braucht die Login-Seite nicht.
  if (isLoggedIn()) {
    goToTarget();
    return;
  }
  // nach der Registrierung: Hinweis anzeigen
  if (new URLSearchParams(window.location.search).get('registered') === '1') {
    showSuccess('#page-alert', 'Konto angelegt, bitte anmelden.');
  }

  $('#logon-form').on('submit', function (event) {
    event.preventDefault();

    var email = $('#email').val().trim();
    var password = $('#password').val();   // Passwort nie verändern oder trimmen

    var problem = validateLogon(email, password);
    if (problem !== null) {
      showError('#page-alert', { message: problem });
      return;
    }

    $('#page-alert').hide();
    var $button = $('#logon-button').prop('disabled', true);

    apiRequest('POST', '/auth', { email: email, password: password })
      .then(function (answer) {
        saveSession(answer);
        goToTarget();
      })
      .catch(function (err) {
        showError('#page-alert', err);
        $button.prop('disabled', false);
      });
  });
});