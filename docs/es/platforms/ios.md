---
read_when:
    - Emparejar o reconectar el Node de iOS
    - Ejecutar la app de iOS desde el código fuente
    - Depurar el descubrimiento del gateway o los comandos de canvas
summary: 'App Node de iOS: conectarse al Gateway, emparejamiento, canvas y solución de problemas'
title: App de iOS
x-i18n:
    generated_at: "2026-04-25T13:50:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

Disponibilidad: vista previa interna. La app de iOS todavía no se distribuye públicamente.

## Qué hace

- Se conecta a un Gateway mediante WebSocket (LAN o tailnet).
- Expone capacidades de Node: Canvas, instantánea de pantalla, captura de cámara, ubicación, modo Talk, activación por voz.
- Recibe comandos `node.invoke` e informa eventos de estado del nodo.

## Requisitos

- Gateway ejecutándose en otro dispositivo (macOS, Linux o Windows mediante WSL2).
- Ruta de red:
  - Misma LAN mediante Bonjour, **o**
  - Tailnet mediante DNS-SD unicast (dominio de ejemplo: `openclaw.internal.`), **o**
  - Host/puerto manual (fallback).

## Inicio rápido (emparejar + conectar)

1. Inicia el Gateway:

```bash
openclaw gateway --port 18789
```

2. En la app de iOS, abre Settings y elige un gateway descubierto (o habilita Manual Host e introduce host/puerto).

3. Aprueba la solicitud de emparejamiento en el host del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Si la app vuelve a intentar el emparejamiento con detalles de autenticación modificados (rol/scopes/clave pública),
la solicitud pendiente anterior queda reemplazada y se crea un nuevo `requestId`.
Ejecuta `openclaw devices list` otra vez antes de aprobar.

Opcional: si el Node de iOS siempre se conecta desde una subred estrictamente controlada, puedes
activar la autoaprobación inicial de nodos con CIDR explícitos o IP exactas:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Esto está desactivado por defecto. Se aplica solo al emparejamiento nuevo de `role: node` sin
scopes solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, scope, metadatos o
clave pública siguen requiriendo aprobación manual.

4. Verifica la conexión:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push con relay para compilaciones oficiales

Las compilaciones oficiales distribuidas de iOS usan el relay externo de push en lugar de publicar el token APNs
sin procesar al gateway.

Requisito del lado del Gateway:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Cómo funciona el flujo:

- La app de iOS se registra en el relay usando App Attest y el recibo de la app.
- El relay devuelve un identificador opaco de relay más un permiso de envío con alcance de registro.
- La app de iOS obtiene la identidad del gateway emparejado y la incluye en el registro del relay, de modo que el registro respaldado por relay quede delegado a ese gateway específico.
- La app reenvía ese registro respaldado por relay al gateway emparejado con `push.apns.register`.
- El gateway usa ese identificador de relay almacenado para `push.test`, activaciones en segundo plano y avisos de activación.
- La URL base del relay del gateway debe coincidir con la URL del relay integrada en la compilación oficial/TestFlight de iOS.
- Si la app se conecta después a otro gateway o a una compilación con una URL base de relay diferente, actualiza el registro del relay en lugar de reutilizar el enlace anterior.

Lo que el gateway **no** necesita para esta ruta:

- Ningún token de relay para toda la implementación.
- Ninguna clave APNs directa para envíos oficiales/TestFlight respaldados por relay.

Flujo esperado para el operador:

1. Instala la compilación oficial/TestFlight de iOS.
2. Establece `gateway.push.apns.relay.baseUrl` en el gateway.
3. Empareja la app con el gateway y deja que termine de conectarse.
4. La app publica `push.apns.register` automáticamente después de tener un token APNs, de que la sesión del operador esté conectada y de que el registro en el relay tenga éxito.
5. Después de eso, `push.test`, las activaciones de reconexión y los avisos de activación pueden usar el registro almacenado respaldado por relay.

Nota de compatibilidad:

- `OPENCLAW_APNS_RELAY_BASE_URL` sigue funcionando como sobrescritura temporal por variable de entorno para el gateway.

## Flujo de autenticación y confianza

El relay existe para imponer dos restricciones que APNs directo en el gateway no puede proporcionar para
las compilaciones oficiales de iOS:

- Solo las compilaciones genuinas de OpenClaw para iOS distribuidas mediante Apple pueden usar el relay alojado.
- Un gateway puede enviar pushes respaldados por relay solo para dispositivos iOS que se emparejaron con ese gateway específico.

Salto por salto:

1. `iOS app -> gateway`
   - La app primero se empareja con el gateway mediante el flujo normal de autenticación del Gateway.
   - Eso le da a la app una sesión de nodo autenticada más una sesión de operador autenticada.
   - La sesión de operador se usa para llamar a `gateway.identity.get`.

2. `iOS app -> relay`
   - La app llama a los endpoints de registro del relay mediante HTTPS.
   - El registro incluye prueba de App Attest más el recibo de la app.
   - El relay valida el bundle ID, la prueba de App Attest y el recibo de Apple, y requiere la
     ruta oficial/de producción de distribución.
   - Esto es lo que impide que las compilaciones locales de Xcode/desarrollo usen el relay alojado. Una compilación local puede estar
     firmada, pero no satisface la prueba oficial de distribución de Apple que el relay espera.

3. `gateway identity delegation`
   - Antes del registro en el relay, la app obtiene la identidad del gateway emparejado desde
     `gateway.identity.get`.
   - La app incluye esa identidad del gateway en el payload de registro del relay.
   - El relay devuelve un identificador de relay y un permiso de envío con alcance de registro delegados a
     esa identidad del gateway.

4. `gateway -> relay`
   - El gateway almacena el identificador de relay y el permiso de envío desde `push.apns.register`.
   - En `push.test`, activaciones de reconexión y avisos de activación, el gateway firma la solicitud de envío con su
     propia identidad de dispositivo.
   - El relay verifica tanto el permiso de envío almacenado como la firma del gateway frente a la identidad de gateway delegada desde el registro.
   - Otro gateway no puede reutilizar ese registro almacenado, incluso si de algún modo obtiene el identificador.

5. `relay -> APNs`
   - El relay posee las credenciales APNs de producción y el token APNs sin procesar de la compilación oficial.
   - El gateway nunca almacena el token APNs sin procesar para compilaciones oficiales respaldadas por relay.
   - El relay envía el push final a APNs en nombre del gateway emparejado.

Por qué se creó este diseño:

- Para mantener las credenciales APNs de producción fuera de los gateways de usuario.
- Para evitar almacenar tokens APNs sin procesar de compilaciones oficiales en el gateway.
- Para permitir el uso del relay alojado solo para compilaciones oficiales/TestFlight de OpenClaw.
- Para impedir que un gateway envíe pushes de activación a dispositivos iOS propiedad de otro gateway.

Las compilaciones locales/manuales siguen usando APNs directo. Si estás probando esas compilaciones sin el relay, el
gateway sigue necesitando credenciales APNs directas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Estas son variables de entorno de runtime del host del gateway, no ajustes de Fastlane. `apps/ios/fastlane/.env` solo almacena
autenticación de App Store Connect / TestFlight como `ASC_KEY_ID` y `ASC_ISSUER_ID`; no configura
la entrega APNs directa para compilaciones locales de iOS.

Almacenamiento recomendado en el host del gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

No hagas commit del archivo `.p8` ni lo coloques dentro del checkout del repositorio.

## Rutas de descubrimiento

### Bonjour (LAN)

La app de iOS explora `_openclaw-gw._tcp` en `local.` y, cuando está configurado, el mismo
dominio de descubrimiento DNS-SD de área amplia. Los gateways en la misma LAN aparecen automáticamente desde `local.`;
el descubrimiento entre redes puede usar el dominio de área amplia configurado sin cambiar el tipo de beacon.

### Tailnet (entre redes)

Si mDNS está bloqueado, usa una zona DNS-SD unicast (elige un dominio; ejemplo:
`openclaw.internal.`) y DNS dividido de Tailscale.
Consulta [Bonjour](/es/gateway/bonjour) para el ejemplo de CoreDNS.

### Host/puerto manual

En Settings, habilita **Manual Host** e introduce el host + puerto del gateway (predeterminado `18789`).

## Canvas + A2UI

El Node de iOS renderiza un canvas WKWebView. Usa `node.invoke` para controlarlo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Notas:

- El host de canvas del Gateway sirve `/__openclaw__/canvas/` y `/__openclaw__/a2ui/`.
- Se sirve desde el servidor HTTP del Gateway (mismo puerto que `gateway.port`, predeterminado `18789`).
- El Node de iOS navega automáticamente a A2UI al conectarse cuando se anuncia una URL de host de canvas.
- Vuelve al scaffold integrado con `canvas.navigate` y `{"url":""}`.

### Evaluación / instantánea de canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Activación por voz + modo Talk

- La activación por voz y el modo Talk están disponibles en Settings.
- iOS puede suspender el audio en segundo plano; trata las funciones de voz como best-effort cuando la app no está activa.

## Errores comunes

- `NODE_BACKGROUND_UNAVAILABLE`: lleva la app de iOS al primer plano (los comandos de canvas/camera/screen lo requieren).
- `A2UI_HOST_NOT_CONFIGURED`: el Gateway no anunció una URL de host de canvas; revisa `canvasHost` en [Configuración del Gateway](/es/gateway/configuration).
- La solicitud de emparejamiento nunca aparece: ejecuta `openclaw devices list` y aprueba manualmente.
- La reconexión falla después de reinstalar: el token de emparejamiento del Keychain se borró; vuelve a emparejar el Node.

## Documentación relacionada

- [Emparejamiento](/es/channels/pairing)
- [Descubrimiento](/es/gateway/discovery)
- [Bonjour](/es/gateway/bonjour)
