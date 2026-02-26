import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('eastbox_token', token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem('eastbox_token');
  }
};

export const initializeAuthFromStorage = () => {
  const token = localStorage.getItem('eastbox_token');
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
  return token;
};
