# Deployment Guide

## Cross-Origin Isolation Headers

Pyodide uses `SharedArrayBuffer`, which requires the page to be served with
[Cross-Origin Isolation](https://web.dev/cross-origin-isolation-guide/) headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The Vite dev server (`npm run dev`) and preview server (`npm run preview`) both
set these headers automatically via the `crossOriginIsolationPlugin` in
`frontend/vite.config.ts`. When deploying the `dist/` folder to production you
must configure your web server or hosting platform to add them as well.

---

## Serving the `dist/` folder

### Nginx

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/heuristic-compiler/dist;
    index index.html;

    add_header Cross-Origin-Opener-Policy same-origin;
    add_header Cross-Origin-Embedder-Policy require-corp;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Caddy

```caddyfile
example.com {
    root * /var/www/heuristic-compiler/dist
    file_server

    header Cross-Origin-Opener-Policy same-origin
    header Cross-Origin-Embedder-Policy require-corp
}
```

---

## Cloud platforms

### Netlify

Create a `frontend/public/_headers` file (Vite copies `public/` files to
`dist/` automatically):

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

### Vercel

Add a `vercel.json` at the repository root (or inside `frontend/`):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

### GitHub Pages

GitHub Pages does not support custom HTTP response headers. Use a
service-worker workaround such as
[coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker), or
deploy to a platform that supports custom headers (Netlify, Vercel, Caddy,
Nginx, etc.).

---

## Static asset: `heuristic_layer.py`

`frontend/public/heuristic_layer.py` is copied verbatim into `dist/` by Vite
during `npm run build`. It is served at `/heuristic_layer.py` and can be
fetched from the browser:

```js
const res = await fetch('/heuristic_layer.py')
const src = await res.text()
```

No additional build configuration is required.
