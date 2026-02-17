import { io } from "socket.io-client";

// In production, API is served from same domain/port
const isProd = import.meta.env.PROD;
const API_URL = import.meta.env.VITE_API_URL || (isProd ? '/api' : 'http://localhost:3001/api');
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isProd ? '/' : 'http://localhost:3001');

// Socket connection
const socket = io(SOCKET_URL);

// Helper for fetch requests
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Request failed');
  }

  return response.json();
};

export const base44 = {
  auth: {
    login: async (email, password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('token', data.token);
      return data.user;
    },
    register: async (email, password, data) => {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, data })
      });
    },
    me: async () => {
      try {
        const user = await request('/auth/me');
        // Flatten data for easier consumption
        return {
          ...user,
          ...(user.data || {}),
          // Ensure direct fields override data fields if collision
          hidden_sports: user.hidden_sports || [],
          accept_messages: user.accept_messages,
          role: user.role
        };
      } catch (e) {
        return null;
      }
    },
    updateMe: async (data) => {
      const user = await request('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
      return {
        ...user,
        ...(user.data || {}),
        hidden_sports: user.hidden_sports || [],
        accept_messages: user.accept_messages,
        role: user.role
      };
    },
    updatePassword: async (currentPassword, newPassword) => {
      return request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    },
    logout: () => {
      localStorage.removeItem('token');
      window.location.reload();
    },
    redirectToLogin: () => {
      // Basic redirect
      window.location.href = '/login';
    },
    approveUser: async (pendingUserId) => {
      return request('/auth/approve', {
        method: 'POST',
        body: JSON.stringify({ pendingUserId })
      });
    }
  },
  
  appLogs: {
    logUserInApp: async (pageName) => {
        // Placeholder implementation
        return Promise.resolve();
    }
  },
  
  entities: new Proxy({}, {
    get: (target, entityName) => {
      return {
        list: async (sort, limit) => {
          let items = await request(`/entities/${entityName}`);
          // Basic client-side sorting/limiting since our simple backend returns all
          if (sort) {
            const desc = sort.startsWith('-');
            const field = desc ? sort.substring(1) : sort;
            items.sort((a, b) => {
              if (a[field] < b[field]) return desc ? 1 : -1;
              if (a[field] > b[field]) return desc ? -1 : 1;
              return 0;
            });
          }
          if (limit) {
            items = items.slice(0, limit);
          }
          return items;
        },
        get: (id) => request(`/entities/${entityName}/${id}`),
        create: async (data) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/entities/${entityName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                 const error = await response.json().catch(() => ({}));
                 throw new Error(error.error || error.message || 'Create failed');
            }
            return response.json();
        },
        update: (id, data) => {
          const token = localStorage.getItem('token');
          return request(`/entities/${entityName}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(data)
          });
        },
        delete: async (id) => {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/entities/${entityName}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });
            
            if (!response.ok) {
                 // Check if it's a 404, which means it's already deleted or doesn't exist
                 if (response.status === 404) {
                     return { success: true, message: 'Entity already deleted' };
                 }
                 const error = await response.json().catch(() => ({}));
                 throw new Error(error.error || error.message || 'Delete failed');
            }
            return response.json();
        },
        filter: async (criteria) => {
          const items = await request(`/entities/${entityName}`);
          return items.filter(item => {
            return Object.entries(criteria).every(([key, value]) => item[key] === value);
          });
        },
        subscribe: (callback) => {
          const handler = (data) => {
            if (data.type === entityName) {
              // Convert socket event format to base44 format if needed
              callback({ type: 'update', id: data.id, data: data.data });
            }
          };
          socket.on('entity:update', handler);
          // Return unsubscribe function
          return () => socket.off('entity:update', handler);
        }
      };
    }
  }),

  integrations: {
    Core: {
      UploadFile: async (args) => {
        // Handle both { file } object (Base44 style) and direct file argument
        const file = args.file || args;
        
        if (!file) {
          throw new Error('No file provided');
        }

        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: formData
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Upload failed');
        }
        
        const data = await response.json();
        // Return in format expected by components: { file_url } or { url }
        return { file_url: data.url, url: data.url };
      }
    }
  },

    functions: {
    invoke: async (functionName, args) => {
      // Simulate server functions if needed, or route to special endpoints
      if (functionName === 'manageUser') {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}/auth/manage-user`, {
            method: 'POST',
            headers,
            body: JSON.stringify(args)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to manage user';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorJson.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        return { data: result };
      }
      console.warn(`Function ${functionName} invoked but not fully implemented in local backend`);
      return { data: {} };
    }
  }
};
