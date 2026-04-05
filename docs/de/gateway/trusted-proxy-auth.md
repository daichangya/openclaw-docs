---
read_when:
    - OpenClaw hinter einem identitätsbewussten Proxy ausführen
    - Pomerium, Caddy oder nginx mit OAuth vor OpenClaw einrichten
    - WebSocket-`1008 unauthorized`-Fehler bei Reverse-Proxy-Setups beheben
    - Entscheiden, wo HSTS und andere HTTP-Härtungs-Header gesetzt werden sollen
summary: Gateway-Authentifizierung an einen vertrauenswürdigen Reverse Proxy delegieren (Pomerium, Caddy, nginx + OAuth)
title: Trusted Proxy Auth
x-i18n:
    generated_at: "2026-04-05T12:44:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccd39736b43e8744de31566d5597b3fbf40ecb6ba9c8ba9d2343e1ab9bb8cd45
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Trusted Proxy Auth

> ⚠️ **Sicherheitskritische Funktion.** In diesem Modus wird die Authentifizierung vollständig an Ihren Reverse Proxy delegiert. Eine Fehlkonfiguration kann Ihr Gateway unbefugtem Zugriff aussetzen. Lesen Sie diese Seite sorgfältig, bevor Sie sie aktivieren.

## Wann verwenden

Verwenden Sie den Auth-Modus `trusted-proxy`, wenn:

- Sie OpenClaw hinter einem **identitätsbewussten Proxy** ausführen (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Ihr Proxy die gesamte Authentifizierung übernimmt und die Benutzeridentität über Header weitergibt
- Sie sich in einer Kubernetes- oder Container-Umgebung befinden, in der der Proxy der einzige Pfad zum Gateway ist
- Sie auf WebSocket-Fehler vom Typ `1008 unauthorized` stoßen, weil Browser keine Tokens in WS-Payloads übergeben können

## Wann NICHT verwenden

- Wenn Ihr Proxy Benutzer nicht authentifiziert (nur TLS-Terminator oder Load Balancer)
- Wenn es irgendeinen Pfad zum Gateway gibt, der den Proxy umgeht (Firewall-Lücken, interner Netzwerkzugriff)
- Wenn Sie nicht sicher sind, ob Ihr Proxy weitergeleitete Header korrekt entfernt/überschreibt
- Wenn Sie nur persönlichen Einzelbenutzerzugriff benötigen (für ein einfacheres Setup sollten Sie Tailscale Serve + loopback in Betracht ziehen)

## So funktioniert es

1. Ihr Reverse Proxy authentifiziert Benutzer (OAuth, OIDC, SAML usw.)
2. Der Proxy fügt einen Header mit der authentifizierten Benutzeridentität hinzu (z. B. `x-forwarded-user: nick@example.com`)
3. OpenClaw prüft, ob die Anfrage von einer **vertrauenswürdigen Proxy-IP** stammt (konfiguriert in `gateway.trustedProxies`)
4. OpenClaw extrahiert die Benutzeridentität aus dem konfigurierten Header
5. Wenn alles passt, wird die Anfrage autorisiert

## Pairing-Verhalten der Control UI

Wenn `gateway.auth.mode = "trusted-proxy"` aktiv ist und die Anfrage die
Trusted-Proxy-Prüfungen besteht, können WebSocket-Sitzungen der Control UI ohne
Device-Pairing-Identität verbinden.

Auswirkungen:

- Pairing ist in diesem Modus nicht mehr die primäre Schranke für den Zugriff auf die Control UI.
- Ihre Reverse-Proxy-Auth-Richtlinie und `allowUsers` werden zur effektiven Zugriffskontrolle.
- Halten Sie den Gateway-Ingress strikt auf vertrauenswürdige Proxy-IPs beschränkt (`gateway.trustedProxies` + Firewall).

## Konfiguration

```json5
{
  gateway: {
    // Trusted-Proxy-Auth erwartet Anfragen von einer vertrauenswürdigen Nicht-Loopback-Proxy-Quelle
    bind: "lan",

    // KRITISCH: Fügen Sie hier nur die IP(s) Ihres Proxys hinzu
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header mit der authentifizierten Benutzeridentität (erforderlich)
        userHeader: "x-forwarded-user",

        // Optional: Header, die vorhanden sein MÜSSEN (Proxy-Verifizierung)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: auf bestimmte Benutzer beschränken (leer = alle zulassen)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Wichtige Laufzeitregel:

- Trusted-Proxy-Auth lehnt Anfragen von loopback-Quellen (`127.0.0.1`, `::1`, loopback-CIDRs) ab.
- Reverse Proxys auf demselben Host über loopback erfüllen Trusted-Proxy-Auth **nicht**.
- Für Proxy-Setups über loopback auf demselben Host verwenden Sie stattdessen Token-/Passwort-Auth oder routen Sie über eine vertrauenswürdige Nicht-Loopback-Proxy-Adresse, die OpenClaw verifizieren kann.
- Nicht-Loopback-Bereitstellungen der Control UI benötigen weiterhin explizite `gateway.controlUi.allowedOrigins`.

### Konfigurationsreferenz

| Feld                                        | Erforderlich | Beschreibung                                                               |
| ------------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Ja           | Array vertrauenswürdiger Proxy-IP-Adressen. Anfragen von anderen IPs werden abgelehnt. |
| `gateway.auth.mode`                         | Ja           | Muss `"trusted-proxy"` sein                                                |
| `gateway.auth.trustedProxy.userHeader`      | Ja           | Header-Name, der die authentifizierte Benutzeridentität enthält            |
| `gateway.auth.trustedProxy.requiredHeaders` | Nein         | Zusätzliche Header, die vorhanden sein müssen, damit die Anfrage als vertrauenswürdig gilt |
| `gateway.auth.trustedProxy.allowUsers`      | Nein         | Allowlist von Benutzeridentitäten. Leer bedeutet, alle authentifizierten Benutzer zuzulassen. |

## TLS-Terminierung und HSTS

Verwenden Sie einen TLS-Terminierungspunkt und setzen Sie dort HSTS.

### Empfohlenes Muster: TLS-Terminierung am Proxy

Wenn Ihr Reverse Proxy HTTPS für `https://control.example.com` verarbeitet, setzen Sie
`Strict-Transport-Security` am Proxy für diese Domain.

- Geeignet für internetseitig erreichbare Bereitstellungen.
- Hält Zertifikate und HTTP-Härtungsrichtlinien an einem Ort zusammen.
- OpenClaw kann hinter dem Proxy auf loopback-HTTP bleiben.

Beispielwert für den Header:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### TLS-Terminierung am Gateway

Wenn OpenClaw HTTPS selbst direkt bereitstellt (kein TLS-terminierender Proxy), setzen Sie:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

`strictTransportSecurity` akzeptiert einen Header-Wert als Zeichenfolge oder `false`, um ihn explizit zu deaktivieren.

### Hinweise zum Rollout

- Beginnen Sie zunächst mit einer kurzen Max-Age-Zeit (zum Beispiel `max-age=300`), während Sie den Datenverkehr validieren.
- Erhöhen Sie auf langlebige Werte (zum Beispiel `max-age=31536000`) erst, wenn Sie hohe Sicherheit haben.
- Fügen Sie `includeSubDomains` nur hinzu, wenn jede Subdomain für HTTPS bereit ist.
- Verwenden Sie Preload nur, wenn Sie die Preload-Anforderungen für Ihre gesamte Domainmenge bewusst erfüllen.
- Rein lokale Entwicklung mit loopback profitiert nicht von HSTS.

## Beispiele für Proxy-Setups

### Pomerium

Pomerium übergibt Identität in `x-pomerium-claim-email` (oder anderen Claim-Headern) und ein JWT in `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP von Pomerium
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

Ausschnitt aus der Pomerium-Konfiguration:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy mit OAuth

Caddy mit dem Plugin `caddy-security` kann Benutzer authentifizieren und Identitäts-Header weitergeben.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP von Caddy/Sidecar-Proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Ausschnitt aus der Caddyfile:

```
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy authentifiziert Benutzer und übergibt Identität in `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // IP von nginx/oauth2-proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

Ausschnitt aus der nginx-Konfiguration:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik mit Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // IP des Traefik-Containers
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## Gemischte Token-Konfiguration

OpenClaw lehnt mehrdeutige Konfigurationen ab, bei denen gleichzeitig `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`) und der Modus `trusted-proxy` aktiv sind. Gemischte Token-Konfigurationen können dazu führen, dass loopback-Anfragen stillschweigend über den falschen Auth-Pfad authentifiziert werden.

Wenn beim Start der Fehler `mixed_trusted_proxy_token` angezeigt wird:

- Entfernen Sie das gemeinsame Token, wenn Sie den Modus `trusted-proxy` verwenden, oder
- wechseln Sie `gateway.auth.mode` zu `"token"`, wenn Sie tokenbasierte Authentifizierung beabsichtigen.

Trusted-Proxy-Auth über loopback schlägt ebenfalls sicher fehl: Aufrufer auf demselben Host müssen die konfigurierte Identität über einen vertrauenswürdigen Proxy-Header bereitstellen, statt stillschweigend authentifiziert zu werden.

## Header für Operator-Scopes

Trusted-Proxy-Auth ist ein **identitätstragender** HTTP-Modus, daher können Aufrufer
optional Operator-Scopes mit `x-openclaw-scopes` deklarieren.

Beispiele:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Verhalten:

- Wenn der Header vorhanden ist, berücksichtigt OpenClaw die deklarierte Scope-Menge.
- Wenn der Header vorhanden, aber leer ist, deklariert die Anfrage **keine** Operator-Scopes.
- Wenn der Header fehlt, greifen normale identitätstragende HTTP-APIs auf die Standardmenge der Operator-Default-Scopes zurück.
- Gateway-auth-**Plugin-HTTP-Routen** sind standardmäßig enger: Wenn `x-openclaw-scopes` fehlt, fällt ihr Laufzeit-Scope auf `operator.write` zurück.
- HTTP-Anfragen aus dem Browser müssen auch nach erfolgreicher Trusted-Proxy-Auth weiterhin `gateway.controlUi.allowedOrigins` bestehen (oder den bewusst aktivierten Host-Header-Fallback-Modus).

Praktische Regel:

- Senden Sie `x-openclaw-scopes` explizit, wenn eine Trusted-Proxy-Anfrage
  enger sein soll als die Standardwerte oder wenn eine Gateway-auth-Plugin-Route
  etwas Stärkeres als den Write-Scope benötigt.

## Sicherheits-Checkliste

Bevor Sie Trusted-Proxy-Auth aktivieren, prüfen Sie Folgendes:

- [ ] **Der Proxy ist der einzige Pfad**: Der Gateway-Port ist gegenüber allem außer Ihrem Proxy durch eine Firewall geschützt
- [ ] **trustedProxies ist minimal**: Nur die tatsächlichen IPs Ihres Proxys, nicht ganze Subnetze
- [ ] **Keine Proxy-Quelle über loopback**: Trusted-Proxy-Auth schlägt bei Anfragen von loopback-Quellen sicher fehl
- [ ] **Proxy entfernt Header**: Ihr Proxy überschreibt (statt anzuhängen) `x-forwarded-*`-Header von Clients
- [ ] **TLS-Terminierung**: Ihr Proxy verarbeitet TLS; Benutzer verbinden sich über HTTPS
- [ ] **allowedOrigins ist explizit**: Nicht-Loopback-Control-UI verwendet explizite `gateway.controlUi.allowedOrigins`
- [ ] **allowUsers ist gesetzt** (empfohlen): Auf bekannte Benutzer beschränken, statt jeden authentifizierten Benutzer zuzulassen
- [ ] **Keine gemischte Token-Konfiguration**: Setzen Sie nicht gleichzeitig `gateway.auth.token` und `gateway.auth.mode: "trusted-proxy"`

## Security Audit

`openclaw security audit` markiert Trusted-Proxy-Auth mit einem Befund der Schwere **critical**. Das ist beabsichtigt — es erinnert daran, dass Sie die Sicherheit an Ihr Proxy-Setup delegieren.

Das Audit prüft auf:

- Basiswarnung/-erinnerung `gateway.trusted_proxy_auth` mit warning/critical
- Fehlende Konfiguration von `trustedProxies`
- Fehlende Konfiguration von `userHeader`
- Leeres `allowUsers` (erlaubt jeden authentifizierten Benutzer)
- Wildcard- oder fehlende Browser-Origin-Richtlinie auf exponierten Oberflächen der Control UI

## Fehlerbehebung

### `trusted_proxy_untrusted_source`

Die Anfrage stammt nicht von einer IP in `gateway.trustedProxies`. Prüfen Sie:

- Ist die Proxy-IP korrekt? (Docker-Container-IPs können sich ändern)
- Befindet sich ein Load Balancer vor Ihrem Proxy?
- Verwenden Sie `docker inspect` oder `kubectl get pods -o wide`, um die tatsächlichen IPs zu finden

### `trusted_proxy_loopback_source`

OpenClaw hat eine Trusted-Proxy-Anfrage von einer loopback-Quelle abgelehnt.

Prüfen Sie:

- Verbindet sich der Proxy von `127.0.0.1` / `::1`?
- Versuchen Sie, Trusted-Proxy-Auth mit einem Reverse Proxy über loopback auf demselben Host zu verwenden?

Behebung:

- Verwenden Sie Token-/Passwort-Auth für Proxy-Setups über loopback auf demselben Host, oder
- routen Sie über eine vertrauenswürdige Nicht-Loopback-Proxy-Adresse und behalten Sie diese IP in `gateway.trustedProxies`.

### `trusted_proxy_user_missing`

Der Benutzer-Header war leer oder fehlte. Prüfen Sie:

- Ist Ihr Proxy so konfiguriert, dass er Identitäts-Header weitergibt?
- Ist der Header-Name korrekt? (Groß-/Kleinschreibung spielt keine Rolle, die Schreibweise aber schon)
- Ist der Benutzer am Proxy tatsächlich authentifiziert?

### `trusted*proxy_missing_header*\*`

Ein erforderlicher Header war nicht vorhanden. Prüfen Sie:

- Ihre Proxy-Konfiguration für diese spezifischen Header
- Ob Header irgendwo in der Kette entfernt werden

### `trusted_proxy_user_not_allowed`

Der Benutzer ist authentifiziert, aber nicht in `allowUsers`. Fügen Sie ihn hinzu oder entfernen Sie die Allowlist.

### `trusted_proxy_origin_not_allowed`

Trusted-Proxy-Auth war erfolgreich, aber der Browser-Header `Origin` hat die Origin-Prüfungen der Control UI nicht bestanden.

Prüfen Sie:

- `gateway.controlUi.allowedOrigins` enthält den exakten Browser-Origin
- Sie verlassen sich nicht auf Wildcard-Origins, außer wenn Sie absichtlich ein Allow-all-Verhalten möchten
- Wenn Sie bewusst den Host-Header-Fallback-Modus verwenden, ist `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` ausdrücklich gesetzt

### WebSocket schlägt weiterhin fehl

Stellen Sie sicher, dass Ihr Proxy:

- WebSocket-Upgrades unterstützt (`Upgrade: websocket`, `Connection: upgrade`)
- die Identitäts-Header bei WebSocket-Upgrade-Anfragen weitergibt (nicht nur bei HTTP)
- keinen separaten Auth-Pfad für WebSocket-Verbindungen hat

## Migration von Token-Auth

Wenn Sie von Token-Auth zu Trusted-Proxy wechseln:

1. Konfigurieren Sie Ihren Proxy so, dass er Benutzer authentifiziert und Header weitergibt
2. Testen Sie das Proxy-Setup unabhängig (curl mit Headern)
3. Aktualisieren Sie die OpenClaw-Konfiguration mit Trusted-Proxy-Auth
4. Starten Sie das Gateway neu
5. Testen Sie WebSocket-Verbindungen aus der Control UI
6. Führen Sie `openclaw security audit` aus und prüfen Sie die Befunde

## Verwandt

- [Security](/gateway/security) — vollständiger Sicherheitsleitfaden
- [Configuration](/gateway/configuration) — Konfigurationsreferenz
- [Remote Access](/gateway/remote) — andere Muster für Remote-Zugriff
- [Tailscale](/gateway/tailscale) — einfachere Alternative für Tailnet-only-Zugriff
