# LaserTec — Tienda online de corte laser industrial

Sitio completo (frontend + backend + integracion de pagos) para vender piezas de
corte laser a medida: platinas, cancamos, cartelas y 20 categorias en total.

## Que incluye

- **Catalogo de 20 categorias** con sus formas y filtros especificos (los mismos
  que armamos en el Excel).
- **Cotizador en vivo**: al completar forma, espesor, medidas, agujeros y
  terminacion, el precio se calcula con la misma formula del Excel (material +
  corte + piercing + mano de obra + terminacion + overhead + margen + IVA).
- **Carrito** (se guarda en el navegador del cliente).
- **Checkout con Mercado Pago** (Checkout Pro): al pagar, se genera una
  preferencia de pago y se redirige al cliente a Mercado Pago.
- **Recalculo de precio en el servidor**: el precio que ve el cliente en pantalla
  es solo para mostrar; antes de cobrar, el servidor vuelve a calcular todo con
  los parametros vigentes. Nadie puede alterar el precio editando el navegador.
- **Panel de parametros** (`/api/admin/pricing-params`): para cambiar precio del
  acero, velocidad de corte, margen, etc. sin tocar codigo.

## Como correrlo en tu computadora

Necesitas tener instalado [Node.js](https://nodejs.org) (version 18 o mayor).

```bash
cd lasertec
npm install
cp .env.example .env
```

Abri el archivo `.env` y completa:

- `MP_ACCESS_TOKEN`: tu Access Token de Mercado Pago. Para probar sin arriesgar
  dinero real, generate uno de **prueba** (empieza con `TEST-`) en tu panel de
  desarrollador: https://www.mercadopago.com.ar/developers/panel
- `ADMIN_TOKEN`: cualquier clave secreta que inventes, para proteger el panel
  de parametros.
- `BASE_URL`: la URL publica de tu sitio (ver seccion de Mercado Pago mas abajo).

Despues corre:

```bash
npm start
```

Y abri http://localhost:3000 en el navegador.

## Estructura del proyecto

```
lasertec/
  server.js              -> arranca el servidor
  src/
    categories.js         -> las 20 categorias, formas y filtros
    pricingEngine.js       -> la formula de cotizacion (igual al Excel)
    store.js               -> guarda parametros de precio y pedidos en /data (JSON)
    mercadopago.js          -> conexion con la API de Mercado Pago
    routes.js               -> todos los endpoints de la API
  public/
    index.html              -> pagina de inicio
    categoria.html            -> configurador de producto (una sola pagina sirve
                                 para las 20 categorias, cambia segun ?cat=id)
    carrito.html               -> carrito y checkout
    success.html / failure.html / pending.html  -> resultado del pago
    css/style.css                -> estilos
    js/                            -> logica de cada pagina
  data/
    pricing-params.json            -> se crea solo la primera vez que arranca
    orders.json                      -> pedidos guardados
```

## Como cambiar tus costos y margen

Sin tocar codigo, con una herramienta como Postman o `curl`:

```bash
curl -X PUT http://localhost:3000/api/admin/pricing-params \
  -H "x-admin-token: TU_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"precioKg": 1350, "margen": 0.35}'
```

Podes actualizar cualquier campo de `data/pricing-params.json` (precio del kg,
velocidad de corte por espesor, costo de mano de obra, costo de terminaciones,
overhead, margen, IVA). El catalogo entero recalcula solo.

## Poner esto en produccion (dominio real, cobros reales)

Este proyecto esta listo para correr, pero para produccion real te faltan 3 cosas:

### 1. Hosting con soporte para Node.js
Un hosting de "solo archivos" (como GitHub Pages) **no sirve** porque este sitio
tiene un backend. Opciones simples y economicas: Railway, Render, Fly.io, o un
VPS (DigitalOcean, etc.). Todas soportan Node.js sin gran configuracion.

### 2. Una base de datos real (recomendado a partir de cierto volumen)
Ahora mismo los pedidos y los parametros de precio se guardan en archivos JSON
(carpeta `data/`). Esto funciona bien para arrancar, pero si vas a tener
muchos pedidos simultaneos te conviene migrar a una base de datos real
(Postgres, MySQL o MongoDB). Los unicos archivos que tocarias son
`src/store.js` (cambiar la lectura/escritura de JSON por consultas a la base) —
el resto del codigo no cambia, porque todo le habla a `store.js`, no a los
archivos directamente.

### 3. Mercado Pago en modo produccion
- Verifica tu cuenta de Mercado Pago como vendedor.
- Reemplaza el `MP_ACCESS_TOKEN` de prueba por tu Access Token de produccion.
- Actualiza `BASE_URL` en `.env` a tu dominio real (ej. `https://lasertec.com.ar`),
  porque Mercado Pago necesita mandar el webhook de confirmacion de pago a una
  URL publica real (no a `localhost`).
- Para probar el webhook ANTES de tener dominio propio, podes exponer tu
  maquina local con [ngrok](https://ngrok.com) y usar esa URL temporal como
  `BASE_URL`.

## Notas honestas sobre las limitaciones actuales

- El **perimetro de corte** que usa la formula se estima como un rectangulo
  (2 x (ancho + largo)). Es preciso para piezas rectangulares simples, pero se
  queda corto en formas con muchos recortes internos o curvas complejas. Para
  esas piezas puntuales conviene revisar el precio a mano.
- No hay un panel visual de administracion (todavia); los parametros se cambian
  con una llamada a la API como se explico arriba. Si mas adelante queres una
  pantalla para cambiar precios sin usar `curl`, es un desarrollo adicional
  sobre esta misma base.
- El carrito vive en el navegador de cada cliente (localStorage), no en una
  cuenta de usuario. Si un cliente cambia de computadora, pierde el carrito
  (pero no el pedido ya pagado, que queda guardado en `data/orders.json`).
