# 🍔 Qué Chimba — Web de Restaurante + Backend (Supabase)

Web de pedidos para **Qué Chimba** con carrito, pedidos en local o a domicilio y **panel de administración conectado a Supabase** (base de datos Postgres + login real + tiempo real).

## Cómo funciona

| Pieza | Qué hace |
|---|---|
| `products` | Menú. Lectura pública; solo un admin puede crear, editar o eliminar. |
| `orders` | Pedidos. Nadie inserta directo: el cliente llama a la función `create_order`, que **recalcula los precios en el servidor**. Solo un admin lee y cambia el estado. |
| `admins` | Lista de usuarios autorizados como administradores. |
| Auth | Login real con correo y contraseña (Supabase Auth). |
| Realtime | Un pedido nuevo aparece al instante en el panel; los cambios de menú se ven en vivo. |

## Puesta en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → pega todo `supabase/schema.sql` → **Run** (crea tablas, seguridad, función y carga el menú inicial).
3. **Authentication → Users → Add user**: crea tu usuario admin (correo + contraseña, marca *Auto Confirm*).
4. Autorízalo como admin, en el SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'tu@correo.com';
   ```
5. **Authentication → Providers → Email**: desactiva *Allow new users to sign up* (nadie más necesita registrarse).
6. **Project Settings → API**: copia *Project URL* y la clave **anon public** en `js/config.js`.
7. Sirve la web (`npx serve .`, `python -m http.server 8000` o GitHub Pages) y entra a **Panel Admin**.

> 🔐 La clave `anon` es pública por diseño; lo que protege los datos son las políticas RLS del esquema. **Nunca** pongas la clave `service_role` en el frontend.

## Estructura

```
├── index.html
├── css/style.css
├── js/
│   ├── config.js    # URL y anon key de Supabase
│   ├── data.js      # Imágenes y recargos (el menú ahora vive en la base de datos)
│   └── app.js       # Lógica de la web y del panel admin
├── supabase/
│   └── schema.sql   # Tablas, RLS, create_order, realtime y menú inicial
└── assets/
```

## Notas

- El costo de domicilio ($1.50) está en la función `create_order` (`supabase/schema.sql`). Si lo cambias, cámbialo también en `js/data.js` y en el `index.html`, que lo muestran en pantalla.
- Los códigos de pedido son secuenciales (`QC-1001`, `QC-1002`…).
- Próximos pasos recomendados: protección anti-spam en `create_order` (captcha o Edge Function) y subir fotos de productos a Supabase Storage.
