# Andemar — proyecto base (Fase 1 / MVP)

Monorepo simple con dos apps independientes que comparten un mismo backend en
Supabase:

```
andemar-app/
├── web/        Next.js — sitio + reservas, para navegador (y para tu Mac)
├── mobile/     Expo (React Native) — Android e iOS, se previsualiza en tu
│               Mac con Expo Go mientras desarrollas
└── supabase/   Esquema SQL de la base de datos (tablas, permisos, datos demo)
```

`web` y `mobile` son proyectos normales de Next.js y Expo — no necesitas
herramientas de monorepo (pnpm/turborepo) para correrlos, cada uno se instala
y se corre por separado con `npm`.

## 1. Crear el backend (Supabase) — 5 minutos

1. Crea una cuenta gratis en [supabase.com](https://supabase.com) y un
   proyecto nuevo.
2. Ve a **SQL Editor** → pega y corre `supabase/schema.sql`.
3. Corre `supabase/seed.sql` (carga los 3 tours de ejemplo que ya viste en
   los mockups).
4. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

Guarda estos dos valores, los vas a pegar en dos archivos `.env` en el paso
siguiente. Esta misma base de datos la usan **tanto la web como la app** —
un solo lugar para tours, reservas y comisiones.

## 2. Correr la web en local

```bash
cd web
cp .env.local.example .env.local   # pega tu URL y anon key de Supabase
npm install
npm run dev
```

Abre `http://localhost:3000` — deberías ver los 3 tours de ejemplo.

## 3. Correr la app móvil en local (en tu Mac)

```bash
cd mobile
cp .env.example .env               # pega tu URL y anon key de Supabase
npm install
npm run start
```

Esto abre Expo Dev Tools. Tienes tres formas de verla sin publicar nada:

- **En tu celular Android**: instala la app "Expo Go" desde Play Store y
  escanea el código QR que aparece en la terminal.
- **En un simulador**, si tienes Android Studio o Xcode instalados: presiona
  `a` (Android) o `i` (iOS) en la terminal.
- **En el navegador del Mac**, sin instalar nada más: presiona `w` en la
  terminal (usa react-native-web, la misma app corre como página web).

## Qué ya funciona (Fase 1)

- Catálogo de tours (playa / isla / montaña) leído desde Supabase, igual en
  web y en la app.
- Ficha de tour con precio, qué incluye, link a video 360°/VR.
- Formulario de reserva (web) que guarda la solicitud en `bookings` — de ahí
  la contactas por WhatsApp para confirmar, sin necesidad de pasarela de
  pago todavía.
- Sistema de referidos: cualquier link de tour con `?ref=CODIGO` deja
  registrado a ese vendedor como referente de la reserva.
- Vista `seller_commissions` en la base de datos: suma automáticamente
  cuánto ha generado cada vendedor, sin guardar comisiones por separado (así
  nunca quedan desincronizadas de las reservas reales).

## Activar la Fase 2 (login, pagos con Wompi, panel admin)

1. **Base de datos**: en el SQL Editor corre `supabase/fase2.sql` (después de
   `schema.sql` y `seed.sql`). Crea el trigger que arma el perfil al
   registrarse, la columna `is_admin`, los permisos del panel admin y las
   columnas de pago en `bookings`.
2. **Hazte administrador**: registrate en `/registro` y corre la última
   consulta (comentada) de `fase2.sql` con tu correo.
3. **Claves de Supabase** (Project Settings → API Keys): en `web/.env.local`
   y `mobile/.env` la variable `..._ANON_KEY` debe ser la clave
   **publicable** (`sb_publishable_...`). La clave **secreta**
   (`sb_secret_...`) va solo en `SUPABASE_SERVICE_ROLE_KEY` de
   `web/.env.local`.
4. **Wompi**: crea tu cuenta de comercio en [wompi.co](https://wompi.co) y en
   *Desarrolladores* copia la llave pública, el secreto de integridad y el
   secreto de eventos a `web/.env.local` (ver `web/.env.local.example`).
   Empieza con las llaves de pruebas y `WOMPI_API_URL=https://sandbox.wompi.co/v1`;
   para cobrar de verdad cambia a las de producción y
   `https://production.wompi.co/v1`.
5. **Webhook**: cuando la web esté publicada, configura en Wompi la URL de
   eventos `https://tu-dominio.com/api/wompi/webhook`. En local no hace falta:
   la página `/reserva/resultado` también confirma el pago consultando a Wompi.
6. **App**: pon `EXPO_PUBLIC_SITE_URL` en `mobile/.env` para que los
   vendedores compartan el link de la web con su código.

Flujo de una venta: el cliente llena el formulario del tour → `/api/reservas`
crea la reserva en `pending` con el precio calculado en el servidor → paga
en el checkout de Wompi (PSE, Nequi, tarjeta) → el webhook (o la página de
resultado) la pasa a `confirmed` → la comisión aparece sola en el panel del
vendedor.

## Qué falta a propósito (y en qué orden hacerlo)

**Fase 2 — vender de verdad** (hecha, salvo login con Google)
1. Login real (Supabase Auth: email/clave, luego Google) y pantalla de
   registro que cree la fila en `profiles` con el rol elegido.
2. Pasarela de pagos (Wompi o ePayco para Colombia, o Stripe si también
   quieres cobrar en dólares) en vez del formulario de "solicitar reserva".
3. Panel de administrador simple para crear/editar tours sin tocar SQL a
   mano (hoy se cargan desde el SQL Editor de Supabase a propósito, para no
   construir un panel completo antes de validar que el negocio funciona).
4. Panel de vendedor real en la app (pantalla que ya mockeaste) leyendo de
   la vista `seller_commissions`.

**Fase 3 — pulir**
5. Reproductor 360° embebido (hoy es un link que abre YouTube).
6. Notificaciones push (nueva reserva, comisión pagada).
7. Publicar de verdad: `eas build` para subir la app a Play Store / App
   Store, y Vercel para la web.

No construyas el paso 5 en adelante hasta tener ventas reales con el paso 1
a 4 — es la parte que valida si el negocio funciona antes de invertir en
pulir la experiencia.

## Stack y por qué

| Pieza | Herramienta | Por qué |
|---|---|---|
| Backend | Supabase (Postgres + Auth + Storage) | Una sola base de datos para web y app, sin servidor propio que mantener; tiene plan gratis suficiente para el MVP y puedes autohospedarlo después si hace falta. |
| Web | Next.js + TypeScript | Se indexa bien en Google (importante para una agencia que necesita que la encuentren) y corre en cualquier hosting gratis (Vercel). |
| App | Expo (React Native) | Un solo código para Android y iOS; se prueba en tu Mac sin comprar licencias ni Mac adicional; agregar pantallas nuevas es solo agregar archivos en `app/`. |
| Estilos | CSS-in-JS simple / StyleSheet | Cero configuración extra; los colores de marca están como constantes, listos para moverse a un archivo de tokens compartido cuando el equipo crezca. |

Este stack está pensado para que cada pieza de la Fase 2 y 3 sea agregar un
archivo nuevo, no reescribir lo que ya funciona.
