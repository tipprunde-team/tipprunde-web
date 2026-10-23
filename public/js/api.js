// Live-URL des Core-Service, einzige Stelle zum Ändern bei der Server-Anbindung (22.10.)
var LIVE_API_BASE_URL = 'https://tipprunde-rest-b06734b76aad.herokuapp.com/api';
var LOCAL_API_BASE_URL = 'http://localhost:8080/api';

// Seiten von diesen Hosts nutzen das lokale Backend ('' steht für file://)
var LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]', ''];

function isLocalEnvironment() {
  return LOCAL_HOSTNAMES.indexOf(window.location.hostname) !== -1;
}

var API_BASE_URL = isLocalEnvironment() ? LOCAL_API_BASE_URL : LIVE_API_BASE_URL;

// In der Konsole sieht man, welches Backend gerade benutzt wird
console.info('[api] Environment: ' + (isLocalEnvironment() ? 'local' : 'live') +
  ', API base URL: ' + API_BASE_URL);
if (API_BASE_URL.indexOf('TODO-') !== -1) {
  console.warn('[api] Live API URL is still a placeholder. Set LIVE_API_BASE_URL in api.js.');
}

var API_LOADING_DELAY_MS = 800;
var API_TIMEOUT_MS = 15000;

var MSG_NETWORK = 'Der Server ist nicht erreichbar. Bitte prüfe deine Verbindung und versuche es später noch einmal.';
var MSG_TIMEOUT = 'Der Server antwortet zu langsam. Bitte versuche es später noch einmal.';
var MSG_UNKNOWN = 'Es ist ein unerwarteter Fehler aufgetreten.';


var pendingRequests = 0;
var loadingTimer = null;

function startLoading() {
  pendingRequests++;
  if (pendingRequests === 1) {
    loadingTimer = setTimeout(function () {
      var $indicator = $('#loading-indicator');
      if ($indicator.length === 0) {
        $indicator = $('<div id="loading-indicator" role="status" aria-live="polite">Lädt …</div>');
        $('body').append($indicator);
      }
      $indicator.show();
    }, API_LOADING_DELAY_MS);
  }
}

function stopLoading() {
  pendingRequests = Math.max(0, pendingRequests - 1);
  if (pendingRequests === 0) {
    clearTimeout(loadingTimer);
    loadingTimer = null;
    $('#loading-indicator').hide();
  }
}

function buildApiError(xhr, textStatus) {
  if (xhr.status === 0) {
    return {
      status: 0,
      code: textStatus === 'timeout' ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: textStatus === 'timeout' ? MSG_TIMEOUT : MSG_NETWORK
    };
  }
  var backendError = xhr.responseJSON && xhr.responseJSON.error;
  return {
    status: xhr.status,
    code: (backendError && backendError.code) || 'UNKNOWN_ERROR',
    message: (backendError && backendError.message) || (MSG_UNKNOWN + ' (Status ' + xhr.status + ')')
  };
}

function getSiteRoot() {
  return document.body.getAttribute('data-root') || './';
}

function isLogonPage() {
  return /\/Logon\.html$/i.test(window.location.pathname);
}

function redirectToLogin() {
  var current = window.location.pathname + window.location.search;
  window.location.replace(
    getSiteRoot() + 'html/auth/Logon.html?redirect=' + encodeURIComponent(current)
  );
}

function apiRequest(method, path, body) {
  return new Promise(function (resolve, reject) {
    var options = {
      url: API_BASE_URL + path,
      method: method,
      dataType: 'json',
      timeout: API_TIMEOUT_MS,
      headers: {}
    };

    var token = typeof getToken === 'function' ? getToken() : null;
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }

    if (body !== undefined && body !== null) {
      options.contentType = 'application/json; charset=utf-8';
      options.data = JSON.stringify(body);
    }

    startLoading();
    $.ajax(options)
      .done(function (data) {
        resolve(data);
      })
      .fail(function (xhr, textStatus) {
        var err = buildApiError(xhr, textStatus);
        if (err.status === 401 && !isLogonPage()) {
          if (typeof clearSession === 'function') {
            clearSession();
          }
          redirectToLogin();
        }
        reject(err);
      })
      .always(stopLoading);
  });
}

function showError(selector, err) {
  var message = (err && err.message) ? err.message : MSG_UNKNOWN;
  $(selector)
    .removeClass('alert-success')
    .addClass('alert alert-error')
    .attr('role', 'alert')
    .text(message)
    .show();
}

function showSuccess(selector, text) {
  $(selector)
    .removeClass('alert-error')
    .addClass('alert alert-success')
    .attr('role', 'status')
    .text(text)
    .show();
}