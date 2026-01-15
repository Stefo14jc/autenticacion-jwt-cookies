const API_URL = '/api/auth';

export const authService = {
  // Registrar nuevo usuario
  register: async (email, password, name) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ✅ Correcto
      body: JSON.stringify({ email, password, name })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar usuario');
    }

    const data = await response.json();
    
    // ❌ ELIMINAR estas líneas - ya NO usamos localStorage
    // localStorage.setItem('token', data.token);
    // localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  },

  // Iniciar sesión
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ✅ Correcto
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    const data = await response.json();
    
    // ❌ ELIMINAR estas líneas - ya NO usamos localStorage
    // localStorage.setItem('token', data.token);
    // localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  },

  // Cerrar sesión
  logout: async () => {  // ✅ CORREGIR: debe ser una función async
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include' // ✅ Correcto
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    
    // ❌ ELIMINAR estas líneas - ya NO usamos localStorage
    // localStorage.removeItem('token');
    // localStorage.removeItem('user');
  },

  // ❌ ELIMINAR estas funciones - ya NO las necesitamos
  // getCurrentUser: () => {
  //   const userStr = localStorage.getItem('user');
  //   return userStr ? JSON.parse(userStr) : null;
  // },

  // getToken: () => {
  //   return localStorage.getItem('token');
  // },

  // isAuthenticated: () => {
  //   return !!localStorage.getItem('token');
  // },

  // Obtener perfil del servidor
  getProfile: async () => {
    // ❌ ELIMINAR: const token = authService.getToken();
    
    const response = await fetch(`${API_URL}/me`, {
      credentials: 'include' // ✅ AGREGAR: para enviar cookies
      // ❌ ELIMINAR el header Authorization
      // headers: {
      //   'Authorization': `Bearer ${token}`
      // }
    });

    if (!response.ok) {
      throw new Error('Error al obtener perfil');
    }

    return response.json();
  },

  // Verificar autenticación llamando al servidor
  checkAuth: async () => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        credentials: 'include'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // ❌ ELIMINAR la función fetchWithAuth - ya no la necesitamos
  // porque las cookies se envían automáticamente
};