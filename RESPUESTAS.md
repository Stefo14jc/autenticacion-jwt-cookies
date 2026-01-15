1. ¿Qué vulnerabilidades de seguridad previenen las cookies HTTP-only que localStorage no puede prevenir?
Las cookies HTTP-only previenen principalmente los ataques XSS (Cross-Site Scripting).
Analogía: Imagina que tu token JWT es como la llave de tu casa. Con localStorage, es como si dejaras la llave en la mesa de la sala donde cualquier visitante (incluso uno no deseado) podría tomarla y hacer una copia. Con cookies HTTP-only, es como si guardaras la llave en una caja fuerte invisible que solo el cartero oficial (el navegador) puede usar para entregar paquetes, pero ninguna persona (ni siquiera tú mismo con JavaScript) puede abrir directamente.
Cuando un atacante logra inyectar código malicioso en tu página web (XSS), ese código JavaScript puede leer localStorage sin problema y robar el token. Pero con cookies HTTP-only, aunque el código malicioso se ejecute, no puede acceder a la cookie porque el navegador bloquea cualquier intento de JavaScript de leerla. La cookie solo se envía automáticamente con las peticiones HTTP al servidor.

2. ¿Por qué es importante el atributo sameSite: 'strict' en las cookies?
El atributo sameSite: 'strict' es crucial porque previene ataques CSRF (Cross-Site Request Forgery).
¿Qué es un ataque CSRF?
Analogía: Imagina que eres un cliente VIP de un banco y tienes una tarjeta especial que te identifica automáticamente al entrar. Un día, recibes un email con un enlace que dice "¡Ganaste un premio, haz clic aquí!". Al hacer clic, ese enlace secretamente te redirige a una página del banco que dice "transferir $10,000 a la cuenta X". Como tu tarjeta VIP (cookie) se envía automáticamente, el banco procesa la transferencia pensando que fuiste tú quien la solicitó.
Eso es CSRF: un sitio malicioso engaña a tu navegador para que haga peticiones a otro sitio donde ya estás autenticado, usando tus cookies sin que te des cuenta.
¿Cómo lo previene sameSite: 'strict'?
Con sameSite: 'strict', la cookie SOLO se envía si la petición se origina desde el mismo dominio. Siguiendo la analogía: tu tarjeta VIP solo funciona si entras al banco por la puerta principal del banco, no si alguien te empuja desde otra tienda hacia la ventanilla del banco.

3. ¿En qué escenarios NO sería recomendable usar cookies para autenticación?
No recomendaría usar cookies en estos casos:

Aplicaciones móviles nativas (iOS/Android): Las apps nativas no manejan cookies de la misma forma que los navegadores web. Es más natural y sencillo usar tokens en headers con localStorage o almacenamiento seguro nativo.
APIs públicas consumidas por terceros: Si estás construyendo una API que será usada por desarrolladores externos, es más estándar y flexible usar tokens en el header Authorization: Bearer. Las cookies complican la integración para los consumidores de la API.
Arquitecturas con múltiples subdominios independientes: Si tienes app1.midominio.com, app2.midominio.com, y cada uno necesita autenticación separada, manejar cookies entre dominios se vuelve complicado debido a las políticas de cookies de terceros.
Aplicaciones que necesitan enviar tokens a múltiples dominios: Las cookies están limitadas por el mismo origen. Si tu frontend necesita hacer peticiones autenticadas a múltiples APIs en diferentes dominios, los tokens en headers son más flexibles.


Preguntas Técnicas
1. ¿Qué pasaría si olvidas agregar credentials: 'include' en las peticiones fetch del frontend?
Experimento realizado:
Eliminé temporalmente credentials: 'include' del método login en authService.js y esto fue lo que observé:

Al intentar hacer login: La petición se envió correctamente al servidor, el servidor generó el token y lo estableció como cookie con res.cookie().
El problema: El navegador recibió la respuesta del servidor con la instrucción Set-Cookie, pero ignoró completamente esa instrucción y no guardó la cookie.
Consecuencia: Al intentar acceder a rutas protegidas o al llamar /api/auth/me, el navegador no enviaba la cookie, entonces el servidor respondía con error 401 "Token no proporcionado".
Mensaje en consola: En algunos navegadores aparecía una advertencia como: "Cookie was blocked because it was set with SameSite=Strict..." indicando que se ignoró la cookie por política de seguridad.

Conclusión: Sin credentials: 'include', el navegador no incluye cookies en las peticiones ni acepta cookies en las respuestas, incluso si el servidor las envía. Es como si el navegador dijera "no voy a participar en este intercambio de cookies a menos que me lo pidas explícitamente".

2. ¿Por qué necesitamos configurar CORS con credentials: true en el backend?
Necesitamos credentials: true por la política CORS (Cross-Origin Resource Sharing) del navegador.
Política de seguridad involucrada:
Por defecto, los navegadores implementan la Same-Origin Policy (Política del Mismo Origen), que bloquea peticiones entre diferentes orígenes (diferente dominio, protocolo o puerto) para proteger contra ataques.
En nuestro caso:

Frontend: http://localhost:5173
Backend: http://localhost:3000

Son orígenes diferentes (diferente puerto), por lo que las peticiones son cross-origin.
¿Por qué credentials: true específicamente?
Cuando envías cookies, estás enviando credenciales. Los navegadores tienen una regla estricta: no permiten que peticiones cross-origin incluyan credenciales (cookies, headers de autenticación) A MENOS QUE:

El frontend solicite explícitamente enviar credenciales: credentials: 'include'
El backend autorice explícitamente recibir credenciales: credentials: true en CORS

Es como un apretón de manos de seguridad: ambas partes deben estar de acuerdo en compartir información sensible.
Importante: Cuando usas credentials: true, el backend NO puede usar origin: '*' (permitir cualquier origen). Debe especificar exactamente qué origen está autorizado, en nuestro caso origin: 'http://localhost:5173'.

3. ¿Cómo afecta el uso de cookies a la arquitectura si decides separar frontend y backend en dominios diferentes?
Problema principal: Las cookies de terceros (third-party cookies).
¿
Desafíos:

Restricciones modernas de navegadores: Navegadores como Chrome, Safari y Firefox están bloqueando o limitando severamente las cookies de terceros por privacidad. Si el backend está en un dominio completamente diferente, las cookies pueden no funcionar.
Configuración de sameSite: Con dominios diferentes, no puedes usar sameSite: 'strict' porque las peticiones cross-domain serían bloqueadas. Tendrías que usar sameSite: 'none' y forzar secure: true (HTTPS obligatorio).
CORS más complejo: Debes configurar origin para permitir el dominio del frontend, y credentials: true.

Soluciones alternativas:

Usar subdominios del mismo dominio: Colocar el backend en api.miapp.com y el frontend en www.miapp.com, configurando las cookies con domain: '.miapp.com' para compartirlas.
Proxy reverso: Servir tanto frontend como backend desde el mismo dominio usando un proxy (como Nginx), haciendo que parezcan estar en el mismo origen.
Volver a tokens en headers: Para arquitecturas completamente separadas, volver a Authorization: Bearer con almacenamiento seguro puede ser más práctico.


Preguntas de Casos Prácticos
1. Mecanismo de "recordarme"
a) ¿Cómo modificarías maxAge de la cookie?
Crearía dos configuraciones diferentes según si el usuario marca "recordarme":
javascript// Si NO marca "recordarme" (sesión normal - 24 horas)
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 1 día
};

// Si marca "recordarme" (sesión extendida - 30 días)
const cookieOptionsRemember = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
};

// En el endpoint de login:
router.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;
  
  // ... validación y generación del token ...
  
  const options = rememberMe ? cookieOptionsRemember : cookieOptions;
  res.cookie('token', token, options);
  
  // ... respuesta ...
});
b) Consideraciones de seguridad:

Tokens de larga duración = mayor ventana de riesgo: Si el token es válido por 30 días y alguien lo roba, tiene 30 días para usarlo. Consideraría implementar refresh tokens: un token de acceso corto (15 minutos) y un refresh token de larga duración guardado en cookie separada.
Registro de dispositivos: Guardar información del dispositivo (user-agent, IP) y alertar al usuario si hay un inicio de sesión desde un dispositivo nuevo.
Rotación de tokens: Al usar el refresh token, generar uno nuevo y invalidar el anterior.
Opción de cerrar todas las sesiones: Permitir al usuario invalidar todos los tokens activos desde la configuración de su cuenta.


2. Manejo de expiración del token
a) ¿Cómo manejarías a nivel de UX la expiración del token?
Implementaría una estrategia en capas:
Detección:
javascript// En un interceptor o en authService
const handleApiCall = async (url, options) => {
  const response = await fetch(url, options);
  
  if (response.status === 401 || response.status === 403) {
    // Token expirado o inválido
    showSessionExpiredModal();
  }
  
  return response;
};
Modal de sesión expirada:
javascriptconst SessionExpiredModal = () => {
  return (
    <Modal>
      <h2>Tu sesión ha expirado</h2>
      <p>Por tu seguridad, necesitas iniciar sesión nuevamente.</p>
      <button onClick={() => redirectToLogin()}>
        Iniciar Sesión
      </button>
    </Modal>
  );
};
Advertencia previa (5 minutos antes):
javascript// Guardar tiempo de expiración al hacer login
const expirationTime = Date.now() + (24 * 60 * 60 * 1000);

// Verificar periódicamente
useEffect(() => {
  const interval = setInterval(() => {
    const timeLeft = expirationTime - Date.now();
    
    if (timeLeft < 5 * 60 * 1000 && timeLeft > 0) {
      showWarningToast("Tu sesión expirará pronto. ¿Deseas extenderla?");
    }
  }, 60000); // Cada minuto
  
  return () => clearInterval(interval);
}, []);
b) ¿Cómo redirigirías al login sin perder el contexto?
Guardar el contexto:
javascript// Cuando detectamos que el token expiró
const handleSessionExpired = () => {
  // Guardar la ruta actual y cualquier estado relevante
  sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
  sessionStorage.setItem('pendingAction', JSON.stringify({
    action: 'formSubmission',
    data: currentFormData
  }));
  
  // Limpiar el estado de autenticación
  setUser(null);
  
  // Redirigir al login
  navigate('/login', { 
    state: { 
      message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.' 
    } 
  });
};
Restaurar el contexto después del login:
javascript// En el componente de Login, después de login exitoso
const handleSuccessfulLogin = async () => {
  const redirectPath = sessionStorage.getItem('redirectAfterLogin');
  const pendingAction = sessionStorage.getItem('pendingAction');
  
  // Limpiar storage temporal
  sessionStorage.removeItem('redirectAfterLogin');
  sessionStorage.removeItem('pendingAction');
  
  if (pendingAction) {
    const action = JSON.parse(pendingAction);
    // Restaurar datos del formulario si era un envío
    if (action.action === 'formSubmission') {
      setFormData(action.data);
      showToast('Puedes continuar donde lo dejaste');
    }
  }
  
  // Redirigir a donde estaba
  navigate(redirectPath || '/dashboard');
};

Preguntas de Debugging
1. Error "Cannot set headers after they are sent to the client"
a) ¿Qué podría estar causándolo en el contexto de cookies?
Este error ocurre cuando intentas enviar headers HTTP (incluidas las cookies) después de que ya enviaste la respuesta al cliente.
Causas comunes con cookies:

Llamar a res.cookie() después de res.json() o res.send():

javascript// ❌ MAL
res.json({ message: 'OK' });
res.cookie('token', token, options); // Error! Ya enviaste la respuesta

Múltiples respuestas en el mismo flujo:

javascript// ❌ MAL
if (!user) {
  res.status(401).json({ error: 'No autorizado' });
}
// Olvidas el return y el código continúa...
res.cookie('token', token, options);
res.json({ success: true }); // Error!

En middleware o manejadores async sin return:

javascript// ❌ MAL
router.post('/login', async (req, res) => {
  if (!validPassword) {
    res.status(401).json({ error: 'Contraseña incorrecta' });
    // Sin return, continúa ejecutándose
  }
  
  res.cookie('token', token, options); // Error si el password era inválido
  res.json({ success: true });
});
b) ¿En qué orden deben ejecutarse res.cookie() y res.json()?
Orden correcto:
javascript//  BIEN
// 1. Primero establecer cookies (modificar headers)
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000
});

// 2. Después enviar la respuesta (finaliza la respuesta HTTP)
res.json({ 
  message: 'Login exitoso',
  user: userWithoutPassword 
});
Regla general: Cualquier modificación de headers (incluido res.cookie(), res.setHeader(), res.status()) debe hacerse ANTES de enviar el cuerpo de la respuesta con res.json(), res.send(), o res.end().

2. Las cookies no se están guardando en el navegador
Lista de 3 posibles causas y verificaciones:
Causa 1: Falta credentials: 'include' en el frontend
Verificación:

Abrir DevTools → pestaña Network
Hacer login
Buscar la petición POST a /api/auth/login
Revisar la pestaña "Headers" de la petición
En "Request Headers" debería aparecer Cookie: ... (si hay cookies previas)
En "Response Headers" debería aparecer Set-Cookie: token=...
Si aparece Set-Cookie pero la cookie no se guarda, falta credentials: 'include'

Solución:
javascript// Agregar en todas las peticiones fetch
fetch(url, {
  credentials: 'include',
  // ... otros options
});
Causa 2: Configuración incorrecta de CORS en el backend
Verificación:

En DevTools → Console, buscar errores de CORS
Error típico: "...has been blocked by CORS policy: The value of the 'Access-Control-Allow-Origin' header..."
Revisar el código del backend en la configuración de CORS

Soluciones múltiples:
javascript// Solución 1: Verificar que credentials esté en true
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true // ← Debe estar presente
}));

// Solución 2: Verificar que el origin coincida exactamente
//  No funciona si el frontend está en :5173 y pones :3000
origin: 'http://localhost:5173' // Debe coincidir EXACTAMENTE

// Solución 3: Si usas dominios, sin barras al final
origin: 'https://miapp.com' // 
origin: 'https://miapp.com/' // Puede causar problemas
Causa 3: Atributos incompatibles de la cookie
Verificación:

Revisar en DevTools → Application → Cookies
Si la cookie aparece tachada o con advertencia
Revisar la consola del navegador por advertencias de cookies

Soluciones múltiples:
javascript// Problema 1: secure: true pero usando HTTP (no HTTPS)
res.cookie('token', token, {
  httpOnly: true,
  secure: true, // ← Requiere HTTPS
  sameSite: 'strict'
});

// Solución: En desarrollo, usar secure basado en el ambiente
secure: process.env.NODE_ENV === 'production',

// Problema 2: sameSite muy restrictivo para tu setup
sameSite: 'strict' // Puede bloquear si hay redirecciones externas

// Solución: Probar con 'lax' en desarrollo
sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',

// Problema 3: Dominio incorrecto
res.cookie('token', token, {
  domain: '.miapp.com', // ← Solo funciona si estás en *.miapp.com
  // ...
});

// Solución: Omitir domain en desarrollo local
// El navegador usa el dominio actual automáticamente

Preguntas de Arquitectura
1. Compara localStorage vs Cookies
CriteriolocalStorageCookiesSeguridad XSS Vulnerable - JavaScript puede leer y robar tokens Protegido con httpOnly - JavaScript no puede accederSeguridad CSRF No vulnerable - no se envía automáticamente Vulnerable por defecto, requiere sameSite para protegerCapacidad de almacenamiento ~5-10 MB por dominio ~4 KB por cookie, límite de ~50 cookies por dominioPersistencia Persiste indefinidamente hasta que se borre manualmente Configurable con maxAge, puede expirar automáticamenteEnvío automático al servidor Debe incluirse manualmente en headers Se envía automáticamente con cada petición al dominioAcceso desde JavaScript Fácil lectura/escritura con localStorage.getItem() Solo si no tiene httpOnly (lo cual es mala práctica)Soporte multi-dominio Limitado estrictamente al dominio exacto Puede configurarse para subdominios con domain attributeCompatibilidad con apps móviles Natural en WebViews y apps híbridas Complejo en apps nativas, mejor usar almacenamiento nativo
Caso específico para localStorage:
Usaría localStorage para una aplicación móvil híbrida (React Native con WebView) que consume una API REST externa. Por ejemplo, una app de lectura de noticias donde:

La API no está bajo mi control (API pública de terceros)
Necesito guardar preferencias del usuario y su token
La app corre en un entorno controlado (mi WebView)
No hay riesgo de XSS porque no muestro contenido de usuarios externos sin sanitizar

Caso específico para Cookies:
Usaría cookies HTTP-only para una aplicación web bancaria donde:

Manejo información financiera sensible
El riesgo de XSS es alto (usuarios pueden tener extensiones maliciosas)
Backend y frontend están bajo mi control en el mismo dominio
Necesito máxima seguridad para los tokens de sesión
Puedo implementar medidas adicionales como sameSite y CSRF tokens


2. Diseña una estrategia de migración para una aplicación en producción
Ámbito seleccionado: Aplicación SaaS (E-commerce) con 50,000 usuarios activos
Estrategia de migración sin afectar usuarios activos:
Fase 1: Soporte Dual (Semana 1-2)
javascript// Backend: Aceptar token desde ambas fuentes
function authenticateToken(req, res, next) {
  // Intentar primero desde cookies (nuevo método)
  let token = req.cookies.token;
  
  // Si no hay cookie, intentar desde header (método antiguo)
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader && authHeader.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Frontend: Enviar en ambos lugares temporalmente
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    ...options.headers,
  };
  
  // Agregar header (método antiguo) si existe
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Nuevo: enviar cookies
  });
};
Despliegue: Subir primero el backend, luego el frontend.
Fase 2: Migración Gradual (Semana 3-4)
javascript// Endpoint especial de migración
router.post('/migrate-to-cookies', authenticateToken, (req, res) => {
  // Si llegó aquí, el token (de donde sea) es válido
  const token = req.cookies.token || extractTokenFromHeader(req);
  
  // Establecer cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
  
  res.json({ migrated: true });
});

// Frontend: Al detectar que está usando localStorage
useEffect(() => {
  const migrateIfNeeded = async () => {
    const hasLocalStorageToken = !!localStorage.getItem('token');
    const hasMigrated = localStorage.getItem('migrated_to_cookies');
    
    if (hasLocalStorageToken && !hasMigrated) {
      try {
        await fetch('/api/auth/migrate-to-cookies', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Marcar como migrado pero NO borrar token aún
        localStorage.setItem('migrated_to_cookies', 'true');
      } catch (error) {
        console.error('Error en migración:', error);
      }
    }
  };
  
  migrateIfNeeded();
}, []);
Fase 3: Transición Completa (Semana 5-6)
javascript// Frontend: Después de 2 semanas, comenzar a limpiar localStorage
useEffect(() => {
  const cleanupOldAuth = () => {
    const migrated = localStorage.getItem('migrated_to_cookies');
    const migrationDate = localStorage.getItem('migration_date');
    
    if (migrated && migrationDate) {
      const daysSinceMigration = 
        (Date.now() - parseInt(migrationDate)) / (1000 * 60 * 60 * 24);
      
      // Después de 14 días, limpiar
      if (daysSinceMigration > 14) {
        localStorage.removeItem('token');
        localStorage.removeItem('migrated_to_cookies');
        localStorage.removeItem('migration_date');
        console.log('✅ Migración completada, localStorage limpio');
      }
    }
  };
  
  cleanupOldAuth();
}, []);
Fase 4: Eliminación de código antiguo (Semana 7-8)
Después de confirmar que >95% de usuarios migraron:

Remover soporte de Authorization header del backend
Remover código de localStorage del frontend
Desplegar nueva versión

Pasos de rollback implementados:
Rollback Nivel 1: Problemas menores (< 1% usuarios afectados)
javascript// Mantener el soporte dual activo
// Solo agregar logging para diagnosticar
function authenticateToken(req, res, next) {
  const cookieToken = req.cookies.token;
  const headerToken = extractFromHeader(req);
  
  console.log('[MIGRATION] Cookie:', !!cookieToken, 'Header:', !!headerToken);
  
  const token = cookieToken || headerToken;
  // ... resto del código
}
Rollback Nivel 2: Problemas moderados (1-10% usuarios afectados)
javascript// Feature flag para desactivar migración
const ENABLE_COOKIE_MIGRATION = process.env.ENABLE_COOKIE_MIGRATION === 'true';

router.post('/login', async (req, res) => {
  // ... generar token ...
  
  if (ENABLE_COOKIE_MIGRATION) {
    res.cookie('token', token, cookieOptions);
  }
  
  // Siempre enviar en el body como fallback
  res.json({
    message: 'Login exitoso',
    user: userWithoutPassword,
    token: token // ← Volver a enviar token temporalmente
  });
});
Rollback Nivel 3: Problemas críticos (>10% usuarios afectados)
bash# Script de rollback completo
git revert [commit-hash]
npm run build
pm2 restart backend
pm2 restart frontend

# Notificar a usuarios por email
node scripts/notify-rollback.js

3. [Pregunta adicional implícita por completitud]
Monitoreo durante la migración:
javascript// Backend: Middleware de analytics
app.use((req, res, next) => {
  const authMethod = req.cookies.token ? 'cookie' : 
                     req.headers['authorization'] ? 'header' : 
                     'none';
  
  // Enviar a sistema de analytics
  analytics.track('auth_method_used', {
    method: authMethod,
    endpoint: req.path,
    timestamp: Date.now()
  });
  
  next();
});
Dashboard de monitoreo:

% usuarios usando cookies vs localStorage
Tasa de error en autenticación por método
Tiempo promedio de migración de usuarios
Alertas si errores superan el 5%