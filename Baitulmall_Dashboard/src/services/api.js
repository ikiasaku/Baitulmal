import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1';

// Ensure /v1 prefix if missing
if (rawUrl && !rawUrl.includes('/v1')) {
    rawUrl = rawUrl.replace(/\/$/, '') + '/api/v1';
}

const BASE_URL = rawUrl ? (rawUrl.replace(/\/$/, '') + '/') : 'http://127.0.0.1:8001/api/v1/';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Interceptor to add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor for global error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized (Expired token)
        if (error.response?.status === 401) {
            console.warn("Session expired or unauthorized. Logging out...");
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');

            // Avoid infinite redirect loop
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login?expired=true';
            }
        }

        // Global error logging for production monitoring (simulated)
        if (error.response?.status >= 500) {
            console.error("Critical Server Error:", error.response.data);
        }

        return Promise.reject(error);
    }
);

export default api;
