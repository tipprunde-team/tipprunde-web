// register.js - Registrierungsseite

var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,30}$/;
var EMAIL_MAX = 254;
var PASSWORD_MIN = 8;
var PASSWORD_MAX = 72;

// prüft die Eingaben, gibt den Fehlertext zurück oder null
// (nur Komfort, das Backend prüft nochmal)
function validateRegister(email, username, password, password2) {
  if (email === '') {
    return 'Bitte gib deine E-Mail-Adresse ein.';
  }
  if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
    return 'Bitte gib eine gültige E-Mail-Adresse ein (höchstens 254 Zeichen).';
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Der Benutzername muss 3 bis 30 Zeichen lang sein und darf nur Buchstaben, Ziffern, _ . - enthalten.';
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return 'Das Passwort muss zwischen 8 und 72 Zeichen lang sein.';
  }
  if (password !== password2) {
    return 'Die beiden Passwörter stimmen nicht überein.';
  }
  return null;
}

// alle Meldungen ausblenden
function clearErrors() {
  $('#page-alert').hide();
  $('#email-error').text('').hide();
  $('#username-error').text('').hide();
}

// Meldung unter einem Feld anzeigen
function showFieldError(selector, message) {
  showError(selector, { message: message });
}

$(function () {
  // schon eingeloggt -> gleich zu den Gruppen
  if (isLoggedIn()) {
    window.location.replace(getSiteRoot() + 'html/groups/Groups.html');
    return;
  }

  $('#register-form').on('submit', function (event) {
    event.preventDefault();
    clearErrors();

    var email = $('#email').val().trim();
    var username = $('#username').val().trim();
    var password = $('#password').val();    // Passwort nicht trimmen
    var password2 = $('#password2').val();

    var problem = validateRegister(email, username, password, password2);
    if (problem !== null) {
      showError('#page-alert', { message: problem });
      return;
    }

    // Button sperren, damit nicht doppelt gesendet wird
    var $button = $('#register-button').prop('disabled', true);

    apiRequest('POST', '/users', { email: email, username: username, password: password })
      .then(function () {
        // Erfolg -> zum Login mit Hinweis
        window.location.replace('Logon.html?registered=1');
      })
      .catch(function (err) {
        if (err.code === 'EMAIL_TAKEN') {
          showFieldError('#email-error', err.message);
        } else if (err.code === 'USERNAME_TAKEN') {
          showFieldError('#username-error', err.message);
        } else {
          showError('#page-alert', err);   // z. B. VALIDATION_ERROR
        }
        $button.prop('disabled', false);
      });
  });
});