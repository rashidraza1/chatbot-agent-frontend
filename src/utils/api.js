const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = {
  async fetchWithAuth(endpoint, options = {}) {
    let token = localStorage.getItem('chat_token');

    // 1. If no token, fetch a guest token first
    if (!token && !endpoint.includes('/api/auth/guest')) {
      try {
        const guestRes = await fetch(`${API_BASE}/api/auth/guest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (guestRes.ok) {
          const data = await guestRes.json();
          token = data.token;
          localStorage.setItem('chat_token', token);
        }
      } catch (err) {
        console.error('Failed to fetch guest token:', err);
      }
    }

    // 2. Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 3. Make the main request
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    // 4. Handle 401 Unauthorized (e.g., expired token)
    if (response.status === 401 && !endpoint.includes('/api/auth/guest')) {
      localStorage.removeItem('chat_token');
      // Retry once by getting a new token? 
      // For now, let the caller handle the error or simple reload
    }

    return response;
  }
};

export default api;
