
var SESSION_KEYS = {
  token: 'tippseite.token',
  expiresAt: 'tippseite.expiresAt',
  userId: 'tippseite.userId',
  username: 'tippseite.username'
};

function saveSession(tokenAnswer) {
  sessionStorage.setItem(SESSION_KEYS.token, tokenAnswer.token);
  sessionStorage.setItem(SESSION_KEYS.expiresAt, tokenAnswer.expiresAt);
  sessionStorage.setItem(SESSION_KEYS.userId, String(tokenAnswer.user.id));
  sessionStorage.setItem(SESSION_KEYS.username, tokenAnswer.user.username);
}

function getToken() {
  return sessionStorage.getItem(SESSION_KEYS.token);
}

function getUserId() {
  var id = sessionStorage.getItem(SESSION_KEYS.userId);
  return id === null ? null : Number(id);
}

function getUsername() {
  return sessionStorage.getItem(SESSION_KEYS.username);
}

function clearSession() {
  Object.keys(SESSION_KEYS).forEach(function (name) {
    sessionStorage.removeItem(SESSION_KEYS[name]);
  });
}

function isLoggedIn() {
  var token = getToken();
  var expiresAt = Date.parse(sessionStorage.getItem(SESSION_KEYS.expiresAt));
  if (!token || isNaN(expiresAt)) {
    return false;
  }
  if (expiresAt <= Date.now()) {
    clearSession();
    return false;
  }
  return true;
}

function requireLogin() {
  if (isLoggedIn()) {
    return true;
  }
  redirectToLogin();  
  return false;
}