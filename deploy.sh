#!/usr/bin/env bash
#
# Deploy de Handfly → https://handfly.yapirides.com
#
# Uso:
#   ./deploy.sh                      prueba, compila y publica (pide confirmación)
#   ./deploy.sh -y                   igual, sin confirmación
#   ./deploy.sh --dominio otro       usa otro.yapirides.com en vez de handfly
#   ./deploy.sh --sin-pruebas        salta las pruebas (no recomendado)
#   ./deploy.sh --rollback           vuelve a la versión publicada anterior
#   ./deploy.sh --print-vhost        imprime el vhost de nginx y sale
#
# Qué es esto:
#   Handfly es una PWA 100 % estática (HTML + JS + CSS + tipografías). No hay PHP,
#   ni base de datos, ni .env, ni claves: los datos de cada persona viven en SU
#   navegador (IndexedDB) y nunca llegan al servidor. El servidor solo entrega
#   archivos.
#
# Cómo publica (sin cortes y con vuelta atrás):
#   Compila en local y sube el resultado a releases/<fecha>-<commit>/. Después
#   cambia el enlace simbólico `current` en un solo paso atómico. Se guardan las
#   últimas 5 versiones: --rollback vuelve a la anterior al instante.
#
# AISLAMIENTO — este script no puede tocar los otros proyectos del servidor:
#   - Escribe únicamente en rutas propias y nuevas:
#       /var/www/<dominio>/                   (releases/ y el enlace current)
#       /etc/nginx/sites-available/<dominio>  (su vhost, solo la primera vez)
#   - Si /var/www/<dominio> ya existe y NO tiene la marca .handfly-site, es de
#     otro proyecto: aborta antes de escribir un solo byte.
#   - El vhost se crea UNA sola vez y nunca se reescribe: certbot guarda ahí las
#     líneas ssl_certificate y sobrescribirlo tumbaría su HTTPS.
#   - nginx se valida con `nginx -t` y se recarga con `reload` (sin cortes),
#     nunca `restart`, y solo la primera vez, al crear el vhost.
#   - No toca nginx.conf, ni sites-enabled de terceros, ni certificados ajenos.
#
set -uo pipefail

SERVER="leonardo@157.173.201.170"
SUBDOMINIO="handfly"
ZONA="yapirides.com"
KEEP_RELEASES=5
MARCA=".handfly-site"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
die()  { echo -e "${RED}Error: $1${NC}" >&2; exit 1; }
info() { echo -e "${CYAN}$1${NC}"; }
warn() { echo -e "${YELLOW}$1${NC}"; }
ok()   { echo -e "${GREEN}$1${NC}"; }

# ───────────────────────── Argumentos ───────────────────────────────────────

ASSUME_YES=0
SOLO_VHOST=0
SIN_PRUEBAS=0
ROLLBACK=0
while [[ $# -gt 0 ]]; do
    case "$1" in
        -y|--yes)      ASSUME_YES=1; shift ;;
        --dominio)     SUBDOMINIO="${2:-}"; [[ -n "$SUBDOMINIO" ]] || die "--dominio necesita un nombre."; shift 2 ;;
        --sin-pruebas) SIN_PRUEBAS=1; shift ;;
        --rollback)    ROLLBACK=1; shift ;;
        --print-vhost) SOLO_VHOST=1; shift ;;
        -h|--help)     sed -n '2,40p' "$0" | sed 's/^# \?//'; exit 0 ;;
        *)             die "Opción desconocida: $1 (usa -y, --dominio, --sin-pruebas, --rollback, --print-vhost o --help)" ;;
    esac
done

[[ "$SUBDOMINIO" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]] \
    || die "Subdominio inválido: '$SUBDOMINIO' (solo minúsculas, números y guiones)."

DOMAIN="$SUBDOMINIO.$ZONA"
REMOTE_DIR="/var/www/$DOMAIN"
NGINX_SITE="/etc/nginx/sites-available/$DOMAIN"

# ───────────────────────── El vhost (única fuente de verdad) ────────────────

print_vhost() {
    cat <<NGINX
# $DOMAIN — Handfly: apaga el piloto automático (PWA estática, código abierto).
# Generado por deploy.sh (--print-vhost). Los datos de los usuarios viven en su
# navegador; este servidor solo entrega archivos.
# Certbot añade el bloque SSL a este mismo fichero: NO lo sobrescribas.
server {
    server_name $DOMAIN;
    root $REMOTE_DIR/current;
    index index.html;

    access_log /var/log/nginx/handfly.access.log;
    error_log  /var/log/nginx/handfly.error.log;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Nada que no sea contenido del sitio (marca de propiedad, archivos ocultos).
    location ~ /\\.(?!well-known/) { return 404; }

    # Con huella en el nombre: no cambian nunca, que se cacheen de verdad.
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        try_files \$uri =404;
    }

    # Sin huella: revalidar siempre, o tras un deploy el navegador (y Cloudflare,
    # que va delante) seguiría sirviendo la versión anterior de la app.
    location ~* ^/(index\\.html|sw\\.js|registerSW\\.js|workbox-[^/]+\\.js)\$ {
        add_header Cache-Control "no-cache";
        add_header X-Content-Type-Options "nosniff" always;
        try_files \$uri =404;
    }

    location = /manifest.webmanifest {
        default_type application/manifest+json;
        add_header Cache-Control "no-cache";
        try_files \$uri =404;
    }

    # La app usa rutas con # (HashRouter): todo lo demás es un archivo o no existe.
    location / {
        try_files \$uri \$uri/ =404;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css text/javascript application/javascript application/json application/manifest+json image/svg+xml;

    listen 80;
    listen [::]:80;
}
NGINX
}

if [[ $SOLO_VHOST -eq 1 ]]; then print_vhost; exit 0; fi

cd "$(cd "$(dirname "$0")" && pwd)" || die "No se pudo entrar al directorio del script."

ssh_ok() { ssh -o BatchMode=yes -o ConnectTimeout=10 "$SERVER" true 2>/dev/null; }

# ───────────────────────── Vuelta atrás ─────────────────────────────────────

if [[ $ROLLBACK -eq 1 ]]; then
    ssh_ok || die "No hay acceso SSH sin contraseña a $SERVER."
    ssh "$SERVER" "[ -f '$REMOTE_DIR/$MARCA' ]" || die "$REMOTE_DIR no es un despliegue de Handfly."
    ANTERIOR="$(ssh "$SERVER" "cd '$REMOTE_DIR/releases' && actual=\$(basename \"\$(readlink -f '$REMOTE_DIR/current')\") && ls -1 | sort | grep -B1 -x \"\$actual\" | head -n1")"
    ACTUAL="$(ssh "$SERVER" "basename \"\$(readlink -f '$REMOTE_DIR/current')\"")"
    [[ -n "$ANTERIOR" && "$ANTERIOR" != "$ACTUAL" ]] || die "No hay una versión anterior a $ACTUAL."
    info "Volviendo de $ACTUAL a $ANTERIOR…"
    ssh "$SERVER" "cd '$REMOTE_DIR' && ln -sfn 'releases/$ANTERIOR' current.tmp && mv -Tf current.tmp current" \
        || die "No se pudo cambiar el enlace current."
    ok "✓ https://$DOMAIN sirve ahora $ANTERIOR"
    exit 0
fi

# ───────────────────────── 1. Estado local ──────────────────────────────────

command -v node >/dev/null || die "Falta Node.js (se necesita la versión 20 o superior)."
command -v npm  >/dev/null || die "Falta npm."

COMMIT="sin-git"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo sin-commit)"
    if [[ -n "$(git status --porcelain)" ]]; then
        warn "Hay cambios sin commitear: se publican igualmente, marcados como '-local'."
        COMMIT="$COMMIT-local"
    fi
fi
RELEASE="$(date +%Y%m%d-%H%M%S)-$COMMIT"

echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
printf  "${GREEN}║${NC}  DEPLOY HANDFLY → %-33s${GREEN}║${NC}\n" "$DOMAIN"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}  Versión:${NC} $RELEASE"
echo -e "${GREEN}  Destino:${NC} $SERVER:$REMOTE_DIR"

if [[ $ASSUME_YES -ne 1 ]]; then
    echo ""
    read -r -p "Escribe DEPLOY para continuar: " confirm
    [[ "$confirm" == "DEPLOY" ]] || die "Deploy cancelado."
fi

ssh_ok || die "No hay acceso SSH sin contraseña a $SERVER. Configura tu clave (ssh-copy-id $SERVER)."

# ───────────────────────── 2. Guardia de aislamiento ────────────────────────
#
# Antes de escribir nada: si el directorio destino existe y no lleva la marca de
# Handfly, pertenece a otro proyecto y no se toca. Sin esto, un --dominio mal
# escrito (p. ej. --dominio imprimir) se llevaría por delante un sitio en producción.

ESTADO_DESTINO="$(ssh "$SERVER" "
    if [ ! -e '$REMOTE_DIR' ]; then echo nuevo
    elif [ -f '$REMOTE_DIR/$MARCA' ]; then echo propio
    elif [ -z \"\$(ls -A '$REMOTE_DIR' 2>/dev/null)\" ]; then echo vacio
    else echo ajeno; fi")"

case "$ESTADO_DESTINO" in
    ajeno) die "$REMOTE_DIR ya existe y NO es de Handfly. Elige otro subdominio con --dominio." ;;
    nuevo|vacio|propio) ;;
    *) die "No se pudo determinar el estado de $REMOTE_DIR en el servidor." ;;
esac

# ───────────────────────── 3. Pruebas y compilación ─────────────────────────

if [[ ! -d node_modules ]] || [[ package-lock.json -nt node_modules/.package-lock.json ]]; then
    info "\n[LOCAL] Instalando dependencias (npm ci)"
    npm ci --no-audit --no-fund || die "Falló npm ci."
fi

if [[ $SIN_PRUEBAS -eq 1 ]]; then
    warn "[LOCAL] Pruebas saltadas por --sin-pruebas."
else
    info "[LOCAL] Pruebas"
    npm test --silent || die "Fallaron las pruebas: no se publica nada."
fi

info "[LOCAL] Compilando para la raíz del subdominio"
BASE_PATH=/ npm run build --silent || die "Falló la compilación."

for imprescindible in dist/index.html dist/sw.js dist/manifest.webmanifest; do
    [[ -f "$imprescindible" ]] || die "Falta $imprescindible en la compilación."
done
grep -q 'src="/assets/' dist/index.html || die "dist/index.html no apunta a /assets/: la compilación no es para la raíz del dominio."

# ───────────────────────── 4. Subida y cambio atómico ───────────────────────

info "[SERVER] Subiendo la versión $RELEASE"
ssh "$SERVER" "mkdir -p '$REMOTE_DIR/releases/$RELEASE' && touch '$REMOTE_DIR/$MARCA'" \
    || die "No se pudo preparar $REMOTE_DIR."
rsync -az --delete dist/ "$SERVER:$REMOTE_DIR/releases/$RELEASE/" \
    || die "Falló la subida. La versión publicada sigue intacta."

info "[SERVER] Activando la versión (cambio atómico del enlace current)"
ssh "$SERVER" "
    set -e
    cd '$REMOTE_DIR'
    ln -sfn 'releases/$RELEASE' current.tmp
    mv -Tf current.tmp current
    # Conserva solo las últimas $KEEP_RELEASES versiones.
    ls -1 releases | sort | head -n -$KEEP_RELEASES | while read -r viejo; do rm -rf \"releases/\$viejo\"; done
" || die "No se pudo activar la versión."

# ───────────────────────── 5. nginx + SSL (solo la primera vez) ─────────────

if ssh "$SERVER" "[ -f '$NGINX_SITE' ]"; then
    ok "[SERVER] El vhost ya existe: no se toca (certbot guarda el SSL ahí dentro)."
else
    [[ -t 0 ]] || die "Falta crear el vhost y hace falta sudo con contraseña. Ejecuta ./deploy.sh desde una terminal."
    info "[SERVER] Creando el vhost de nginx (pedirá la contraseña de sudo)"
    print_vhost | ssh "$SERVER" "cat > /tmp/handfly-vhost.conf"
    # sudo solo copia bytes ya decididos y recarga; nunca decide qué escribir.
    ssh -t "$SERVER" "sudo install -o root -g root -m 644 /tmp/handfly-vhost.conf '$NGINX_SITE' \
        && sudo ln -sfn '$NGINX_SITE' '/etc/nginx/sites-enabled/$DOMAIN' \
        && { sudo nginx -t || { sudo rm -f '/etc/nginx/sites-enabled/$DOMAIN' '$NGINX_SITE'; exit 1; }; } \
        && sudo systemctl reload nginx && rm -f /tmp/handfly-vhost.conf" \
        || die "No se pudo instalar y validar el vhost. Se retiró; los demás sitios siguen intactos."
fi

ssh "$SERVER" "[ -f '$NGINX_SITE' ]" || die "El vhost no quedó confirmado en el servidor."

if ! ssh "$SERVER" "grep -q ssl_certificate '$NGINX_SITE'"; then
    [[ -t 0 ]] || die "Falta el certificado SSL y no hay terminal para emitirlo. Ejecuta ./deploy.sh desde una terminal."
    info "[SERVER] Emitiendo certificado SSL con certbot (pedirá sudo)"
    ssh -t "$SERVER" "sudo certbot --nginx -d '$DOMAIN' --redirect --non-interactive" \
        || die "Certbot no pudo emitir el certificado para $DOMAIN."
    ssh "$SERVER" "grep -q ssl_certificate '$NGINX_SITE'" || die "El certificado no quedó escrito en el vhost."
fi

# ───────────────────────── 6. Verificación ──────────────────────────────────

echo ""
info "Verificando…"
FALLO=0
NONCE="v=$RELEASE"

PORTADA="$(curl -sS -m 30 "https://$DOMAIN/?$NONCE" || true)"
if grep -q '<title>Handfly</title>' <<<"$PORTADA" && grep -q 'id="root"' <<<"$PORTADA"; then
    ok "✓ https://$DOMAIN/ sirve la app"
else
    warn "✗ La portada no trae la app (¿vhost mal apuntado?)"; FALLO=1
fi

# El index servido tiene que ser el de ESTA compilación (mismo paquete JS).
JS_LOCAL="$(grep -o '/assets/index-[^"]*\.js' dist/index.html | head -n1)"
if grep -q "$JS_LOCAL" <<<"$PORTADA"; then
    ok "✓ Sirve esta versión ($JS_LOCAL)"
else
    warn "✗ La portada no referencia $JS_LOCAL (¿caché?)"; FALLO=1
fi

for recurso in "$JS_LOCAL" /sw.js /manifest.webmanifest /pwa-192.png; do
    CODIGO="$(curl -s -o /dev/null -w '%{http_code}' -m 30 "https://$DOMAIN$recurso?$NONCE" || true)"
    [[ "$CODIGO" == "200" ]] \
        && ok "✓ $recurso → 200" \
        || { warn "✗ $recurso → ${CODIGO:-sin respuesta}"; FALLO=1; }
done

CODIGO="$(curl -s -o /dev/null -w '%{http_code}' -m 30 "https://$DOMAIN/$MARCA" || true)"
[[ "$CODIGO" == "404" ]] \
    && ok "✓ /$MARCA bloqueado (404)" \
    || { warn "✗ /$MARCA devolvió ${CODIGO:-sin respuesta} (debería ser 404)"; FALLO=1; }

[[ $FALLO -eq 0 ]] || die "La versión quedó subida, pero falló una verificación; el deploy NO se declara completo. (./deploy.sh --rollback para volver)"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               DEPLOY COMPLETO                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}  Abre:${NC} https://$DOMAIN"
echo -e "${CYAN}  Si ya tenías la app instalada, verás el aviso «Hay una versión nueva».${NC}"
