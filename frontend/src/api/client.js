import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true, // send HttpOnly cookie on every request
  headers: { 'Content-Type': 'application/json' },
});

// Global response interceptor — redirect to login on 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Avoid redirect loop on the login page itself
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default client;
