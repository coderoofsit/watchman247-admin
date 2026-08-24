const API_BASE_URL = 'http://localhost:8000/api/v1';

export const getAuthToken = () => localStorage.getItem('admin_token');
export const setAuthToken = (token) => localStorage.setItem('admin_token', token);
export const removeAuthToken = () => localStorage.removeItem('admin_token');

export const getAdminUser = () => {
  const user = localStorage.getItem('admin_user');
  return user ? JSON.parse(user) : null;
};
export const setAdminUser = (user) => localStorage.setItem('admin_user', JSON.stringify(user));
export const removeAdminUser = () => localStorage.removeItem('admin_user');

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = new Headers();
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  
  if (!(options.body instanceof FormData)) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...Object.fromEntries(headers.entries()),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // If unauthorized, clear admin token and reload if not on login
      if (window.location.pathname !== '/login') {
        removeAuthToken();
        removeAdminUser();
        window.location.replace('/login');
      }
    }
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};
