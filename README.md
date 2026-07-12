# DNS Lookup Tool

Herramienta web educativa para consultar registros DNS de cualquier dominio, implementada con **Node.js (backend)** y **React + Vite (frontend)**. Diseñada como proyecto universitario para demostrar el funcionamiento del protocolo DNS en la **capa de aplicación (Capa 7) del modelo OSI**.

---

## Descripción

Esta aplicación permite ingresar un nombre de dominio (ej. `google.com`) o una dirección IP (ej. `8.8.8.8`) y obtener sus registros DNS: **A, AAAA, MX, TXT, NS, CNAME, SOA** y **PTR** (resolución inversa). Incluye funcionalidades avanzadas como comparación entre resolvers públicos, cache inteligente, histórico local, exportación JSON y visualización gráfica de tiempos de respuesta.

**Objetivo académico:** Comprender la resolución de nombres, el protocolo DNS, y la arquitectura cliente-servidor usando módulos nativos de Node.js sin dependencias externas de DNS.

---

## Stack Tecnológico

| Capa | Tecnología | Detalle |
|------|------------|---------|
| **Frontend** | React 18 + Vite 5 | SPA con hooks personalizados |
| **Estilos** | Tailwind CSS 3 | Utility-first, modo oscuro/claro |
| **Backend** | Node.js 24 + Express 4 | API RESTful |
| **DNS** | `dns` (módulo nativo) | `dns.promises`, `dns.Resolver` |
| **Utilidades** | `util.promisify` | Adaptar callbacks a promises |
| **Seguridad** | `express-rate-limit` | 100 req / 15 min por IP |
| **Proxy Dev** | Vite Proxy | `/api/*` → `localhost:7000` |

---

## Arquitectura

```text
┌─────────────────┐      HTTP/JSON      ┌─────────────────┐      DNS/UDP      ┌──────────────────┐
│   Navegador     │ ◄─────────────────► │   Backend       │ ◄──────────────►  │  Servidores DNS  │
│   (React)       │   Puerto 6000/6001  │   (Express)     │   Puerto 7000     │  8.8.8.8         │
│                 │                     │   :7000         │                   │  1.1.1.1         │
│                 │                     │                 │                   │  208.67.222.222  │
└─────────────────┘                     └─────────────────┘                   └──────────────────┘
        │                                       │
        │ Vite Proxy (/api/*)                   │ dns.promises
        ▼                                       ▼
   Port 6000/6001                          Port 7000
```

**Flujo de datos:**
1. Usuario escribe dominio en React → validación y limpieza automática
2. `fetch('/api/dns/lookup?domain=...')` → Vite proxy redirige a Express
3. Express valida nuevamente → `dnsService.lookupDomain(domain, types, servers)`
4. `dns.Resolver` consulta servidores DNS → medición con `performance.now()`
4. Respuesta JSON estructurada → React renderiza Cards / Tabla / Gráfico

---

## Instalación y Ejecución

### Prerequisitos
- **Node.js ≥ 18** (probado en 24.x)
- **npm** incluido con Node

### Instalación única
```bash
cd "C:\Me\Coding\Herramienta de Consulta DNS (DNS Lookup Tool)"
npm run install:all
```
Instala dependencias de **backend** y **frontend** automáticamente.

### Desarrollo (hot-reload en ambos)
```bash
npm run dev
```
Levanta:
- **Frontend:** `http://localhost:6000` (o 6001 si 6000 ocupado)
- **Backend:**  `http://localhost:7000`

### Producción
```bash
# Backend
cd backend && npm start

# Frontend (build estático)
cd frontend && npm run build && npx serve dist
```

---

## Puertos

| Servicio | Puerto | Protocolo |
|----------|--------|-----------|
| Frontend (Vite) | 6000 / 6001 | HTTP |
| Backend (Express) | 7000 | HTTP |
| Proxy `/api/*` | 6000 → 7000 | Interno |

---

## Endpoints de la API

### Consulta múltiple (recomendada)
```http
GET /api/dns/lookup?domain=google.com&types=A,MX,SOA
```

**Parámetros:**
| Parámetro | Requerido | Descripción |
|-----------|-----------|-------------|
| `domain` | ✅ | Dominio o IP a consultar |
| `types` | ❌ | Lista separada por comas: `A,AAAA,MX,TXT,NS,CNAME,SOA`. Por defecto: todos |

### Consulta por tipo específico
```http
GET /api/dns/lookup/google.com/A
```

### Resolución inversa (PTR)
```http
GET /api/dns/reverse?ip=8.8.8.8
```

### Comparación de resolvers
```http
GET /api/dns/compare?domain=google.com&types=A,MX&resolvers=8.8.8.8,1.1.1.1,208.67.222.222
```

**Parámetros:**
| Parámetro | Requerido | Descripción |
|-----------|-----------|-------------|
| `domain` | ✅ | Dominio a consultar |
| `types` | ❌ | Tipos separados por comas (default: todos) |
| `resolvers` | ✅ | IPs de resolvers separados por comas |

### Health check
```http
GET /api/health
```

---

## Tipos de Registro Soportados

| Tipo | Descripción | Método Node.js | Campos devueltos |
|------|-------------|----------------|------------------|
| **A** | IPv4 | `resolve4({ttl:true})` | `value`, `ttl`, `ttlHuman` |
| **AAAA** | IPv6 | `resolve6({ttl:true})` | `value`, `ttl`, `ttlHuman` |
| **MX** | Servidores de correo | `resolveMx()` | `priority`, `value`, `ttl` |
| **TXT** | Texto (SPF, DKIM, verificación) | `resolveTxt()` | `value` (string plano) |
| **NS** | Nameservers autoritativos | `resolveNs()` | `value` |
| **CNAME** | Alias canónico | `resolveCname()` | `value` |
| **SOA** | Start of Authority | `resolveSoa()` | `nsname`, `hostmaster`, `serial`, `refresh`, `retry`, `expire`, `minttl` |
| **PTR** | Resolución inversa (IP → nombre) | `reverse()` | `value` |

---

## Funcionalidades

### ✅ Core
- **Búsqueda flexible:** Acepta `google.com`, `https://google.com`, `google.com/path` — extrae el dominio automáticamente
- **Detección IP vs Dominio:** Si ingresás `8.8.8.8` hace PTR automáticamente
- **Selector de tipos:** Checkbox por tipo (A, AAAA, MX, TXT, NS, CNAME, SOA)
- **Validación robusta:** Frontend + Backend (longitud, ASCII, caracteres de control, regex dominio/IP)

### 🔄 Comparación de Resolvers
- Resolvers predefinidos: Google (8.8.8.8), Cloudflare (1.1.1.1), OpenDNS (208.67.222.222), Quad9 (9.9.9.9)
- Resolvers custom: Agregá/quitá IPs manualmente
- Vista tabular lado a lado con TTL y tiempo de respuesta por resolver

### 🎨 UI/UX
- **Modo oscuro/claro** persistente en `localStorage`
- **Vista Cards** (colores por tipo) ↔ **Vista Tabla** (compacta)
- **Skeleton loading** por tipo durante la consulta
- **Tooltips explicativos** en cada tipo de registro
- **Gráfico barras horizontales** de tiempo de respuesta por tipo
- **Paginación** en cards (>10 valores: "Ver más / Ver menos")
- **Badge CACHE** cuando la respuesta viene de cache (30s TTL)

### 💾 Historial y Exportación
- **Historial** últimos 10 dominios en `localStorage` (click para recargar)
- **Exportar JSON** → descarga archivo `dns-lookup-{dominio}.json`
- **Copiar al portapapeles** JSON completo

### 🛡️ Seguridad y Rendimiento
- **Rate limiting:** 100 requests / 15 min por IP (`express-rate-limit`)
- **Validación profunda:** Límite 253 chars dominio, solo ASCII, sin chars de control
- **Cache en memoria:** Map con TTL 30s, máx 100 entradas (LRU simple)
- **HTTPS en desarrollo** (configurable en `vite.config.js`)
- **Body limit:** 1KB JSON

---

## Estructura del Proyecto

```text
dns-lookup-tool/
├── package.json                 # Scripts raíz: install:all, dev, clean
├── README.md                    # Este archivo
├── guia_estudio_dns.txt         # Guía académica completa
├── ejemplos_prueba_dns.txt      # 33 casos + 10 ejercicios
│
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.js            # Entry point (puerto 7000)
│   │   ├── app.js               # Express + middleware + rate limit
│   │   ├── routes/
│   │   │   └── dnsRoutes.js     # 4 endpoints REST
│   │   ├── controllers/
│   │   │   └── dnsController.js # Lógica de endpoints
│   │   ├── services/
│   │   │   └── dnsService.js    # DNS nativo + cache + timing
│   │   └── utils/
│   │       └── validators.js    # Sanitización + validación dominio/IP
│
└── frontend/
    ├── package.json
    ├── vite.config.js           # Proxy /api → 7000, puerto 6000
    ├── tailwind.config.js       # darkMode: 'class'
    ├── index.html               # Favicon SVG inline
    ├── public/
    │   └── (assets estáticos)
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css            # Variables CSS light/dark
        ├── pages/
        │   └── Home.jsx         # Layout principal
        ├── components/
        │   ├── DomainForm.jsx   # Input + tipos + resolvers custom
        │   ├── RecordCard.jsx   # Card por tipo (colores + paginación)
        │   ├── RecordTable.jsx  # Vista tabular
        │   ├── RecordSkeleton.jsx
        │   ├── ResponseTimeChart.jsx
        │   ├── ThemeToggle.jsx
        │   ├── SearchHistory.jsx
        │   └── ResolverComparison.jsx
        ├── hooks/
        │   ├── useDnsLookup.js  # fetch + estados
        │   └── useSearchHistory.js
        └── services/
            └── api.js           # 4 funciones fetch tipadas
```

---

## Formato de Respuesta JSON

### Éxito (ejemplo real `google.com`)
```json
{
  "domain": "google.com",
  "queryTimestamp": "2026-07-12T00:35:31.653Z",
  "fromCache": false,
  "totalRecords": 3,
  "records": [
    {
      "type": "A",
      "values": [
        { "value": "142.251.15.138", "ttl": 146, "ttlHuman": "2m 26s" },
        { "value": "142.251.15.102", "ttl": 146, "ttlHuman": "2m 26s" }
      ],
      "responseTimeMs": 59
    },
    {
      "type": "MX",
      "values": [
        { "priority": 10, "value": "smtp.google.com", "ttl": null, "ttlHuman": "N/A" }
      ],
      "responseTimeMs": 62
    },
    {
      "type": "SOA",
      "values": [{
        "nsname": "ns1.google.com",
        "hostmaster": "dns-admin.google.com",
        "serial": 946146208,
        "refresh": 900,
        "retry": 900,
        "expire": 1800,
        "minttl": 60,
        "ttl": 60,
        "ttlHuman": "1m"
      }],
      "responseTimeMs": 55
    }
  ]
}
```

### Error por tipo (no tumba la consulta completa)
```json
{
  "type": "AAAA",
  "values": [],
  "responseTimeMs": 45,
  "error": "No records of this type"
}
```

### Comparación de resolvers
```json
{
  "domain": "google.com",
  "queryTimestamp": "2026-07-12T00:35:31.653Z",
  "resolvers": {
    "8.8.8.8": [
      { "type": "A", "values": [...], "responseTimeMs": 59 }
    ],
    "1.1.1.1": [
      { "type": "A", "values": [...], "responseTimeMs": 48 }
    ]
  }
}
```

---

## Manejo de Errores

| Código DNS | HTTP | Mensaje | Causa |
|------------|------|---------|-------|
| `ENOTFOUND` / `NXDOMAIN` | 200* | `NXDOMAIN - Domain does not exist` | Dominio inexistente |
| `ENODATA` | 200* | `No records of this type` | Dominio existe, sin ese tipo |
| `ETIMEOUT` | 200* | `DNS query timed out` | Resolver no responde |
| Validación frontend | 400 | `Formato inválido` | Input mal formado |
| Validación backend | 400 | `Invalid domain format` | Input mal formado (server) |
| Rate limit | 429 | `Demasiadas solicitudes` | >100 req/15min |

*Los errores por tipo se devuelven dentro del array `records` con `success: false`, no como HTTP error, para que la UI pueda mostrar resultados parciales.

---

## Conceptos Aprendidos (para defensa)

1. **Modelo OSI - Capa 7:** DNS como protocolo de aplicación sobre UDP/TCP
2. **Resolución recursiva vs iterativa:** Flujo real de una consulta DNS
3. **Módulo nativo `dns` de Node.js:** `dnsPromises`, `dns.Resolver`, `util.promisify`
4. **Arquitectura Cliente-Servidor:** React (SPA) ↔ Express (API) ↔ DNS (UDP)
5. **Validación y sanitización:** Frontend + Backend (defensa en profundidad)
6. **Rate Limiting:** Protección contra DoS y abuso
7. **Cache con TTL:** Map en memoria con expiración y LRU
8. **Medición de performance:** `performance.now()` para latencia real
9. **Patrones React:** Custom hooks, `useCallback`, composición de componentes
10. **Tailwind + darkMode class:** Temas sin CSS custom
11. **Vite Proxy:** Desarrollo sin CORS issues
12. **Manejo de errores granulares:** Por tipo de registro, no global

---

## Mejoras Futuras (Opcional)

| Mejora | Descripción | Complejidad |
|--------|-------------|-------------|
| **DNS over HTTPS (DoH)** | `dns.Resolver({endpoints:['https://dns.google/dns-query']})` | Media |
| **DNSSEC Validation** | Verificar `RRSIG`/`DNSKEY` y cadena de confianza | Alta |
| **Zone Transfer (AXFR)** | Intentar `dig @ns AXFR dominio` para auditoría | Media |
| **WebSockets** | Push de resultados en tiempo real para consultas largas | Media |
| **SQLite persistente** | Historial y cache en `better-sqlite3` | Baja |
| **Métricas Prometheus** | `/metrics` para Grafana/Prometheus | Baja |
| **Dockerfile + Compose** | Despliegue en contenedores | Baja |

---

## Licencia

MIT — Uso educativo y libre.

---

## Autor

Proyecto universitario — Herramienta de Consulta DNS (DNS Lookup Tool)  
Stack: Node.js (dns nativo) + React + Tailwind CSS  
Modelo OSI: Capa 7 — Aplicación