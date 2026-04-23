import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'https://kalamiq.com/api';

console.log(API_URL)
const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
