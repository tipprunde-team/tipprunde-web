// auth-nav.js - Benutzername und Abmelden im Header (#nav-user)

// Abmelden: Server informieren, Sitzung auf jeden Fall löschen
function logout() {
  apiRequest('DELETE', '/auth')
    .catch(function () {
      // Fehler egal, die Sitzung wird trotzdem gelöscht
    })
    .then(function () {
      clearSession();
      window.location.replace(getSiteRoot() + 'html/auth/Logoff.html');
    });
}

// Name vom Server holen, bis dahin steht der Name aus der Sitzung da
function refreshUsername($name) {
  apiRequest('GET', '/users/me')
    .then(function (me) {
      if (me && me.username) {
        $name.text(me.username);
      }
    })
    .catch(function () {
      // Endpoint noch nicht da oder Fehler: Name aus der Sitzung bleibt
    });
}

// Platzhalter #nav-user füllen
function renderNavUser() {
  var $slot = $('#nav-user');
  if (!$slot.length) {
    return;
  }
  $slot.empty();

  if (isLoggedIn()) {
    var $name = $('<span class="nav-username">').text(getUsername());
    var $button = $('<button type="button" class="btn" id="logout-button">Abmelden</button>');

    $button.on('click', function () {
      $button.prop('disabled', true);   // kein Doppelklick
      logout();
    });

    $slot.append($name, $button);
    refreshUsername($name);
  } else {
    $slot.append(
      $('<a class="btn btn-primary">')
        .attr('href', getSiteRoot() + 'html/auth/Logon.html')
        .text('Anmelden')
    );
  }
}

// erst ausführen, wenn layout.js den Header gebaut hat
$(function () {
  if (window.LAYOUT_READY) {
    renderNavUser();
  } else {
    $(document).one('layout:ready', renderNavUser);
  }
});