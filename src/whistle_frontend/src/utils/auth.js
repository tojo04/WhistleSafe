export async function createAuthClient() {
  return {
    _isAuth: false,
    _principal: null
  };
}

export async function login(authClient) {
  return new Promise((resolve) => {
    authClient._isAuth = true;
    authClient._principal = {
      toString: () => 'council-member-principal-abc123'
    };
    setTimeout(() => resolve(true), 500);
  });
}

export async function logout(authClient) {
  authClient._isAuth = false;
  authClient._principal = null;
}

export async function getIdentity(authClient) {
  return {
    getPrincipal: () => authClient._principal
  };
}

export async function getPrincipal(authClient) {
  return authClient._principal;
}

export async function isAuthenticated(authClient) {
  return authClient._isAuth;
}
