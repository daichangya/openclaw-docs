---
read_when:
    - OpenClaw hinter einem identity-aware Proxy betreiben.
    - Pomerium, Caddy oder nginx mit OAuth vor OpenClaw einrichten.
    - WebSocket-Fehler 1008 „unauthorized“ bei Reverse-Proxy-Setups beheben
    - Entscheiden, wo HSTS und andere Härtungs-Header für HTTP gesetzt werden.
summary: Gateway-Authentifizierung an einen vertrauenswürdigen Reverse Proxy delegieren (Pomerium, Caddy, nginx + OAuth)
title: Trusted-Proxy-Authentifizierung
x-i18n:
    generated_at: "2026-04-24T06:40:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: af406f218fb91c5ae2fed04921670bfc4cd3d06f51b08eec91cddde4521bf771
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

> ⚠️ **Sicherheitskritische Funktion.** Dieser Modus delegiert die Authentifizierung vollständig an Ihren Reverse Proxy. Eine Fehlkonfiguration kann Ihr Gateway für unbefugten Zugriff offenlegen. Lesen Sie diese Seite sorgfältig, bevor Sie sie aktivieren.

## Wann verwenden

Verwenden Sie den Authentifizierungsmodus `trusted-proxy`, wenn:

- Sie OpenClaw hinter einem **identity-aware Proxy** betreiben (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + Forward Auth)
- Ihr Proxy die gesamte Authentifizierung übernimmt und die Benutzeridentität über Header weitergibt
- Sie sich in einer Kubernetes- oder Container-Umgebung befinden, in der der Proxy der einzige Pfad zum Gateway ist
- Sie auf WebSocket-Fehler `1008 unauthorized` stoßen, weil Browser keine Tokens in WS-Payloads übergeben können

## Wann NICHT verwenden

- Wenn Ihr Proxy Benutzer nicht authentifiziert (nur TLS-Terminierung oder Load Balancer)
- Wenn es irgendeinen Pfad zum Gateway gibt, der den Proxy umgeht (Firewall-Lücken, interner Netzwerkzugriff)
- Wenn Sie nicht sicher sind, ob Ihr Proxy weitergeleitete Header korrekt entfernt/überschreibt
- Wenn Sie nur persönlichen Single-User-Zugriff benötigen (erwägen Sie Tailscale Serve + loopback für ein einfacheres Setup)

## So funktioniert es

1. Ihr Reverse Proxy authentifiziert Benutzer (OAuth, OIDC, SAML usw.)
2. Der Proxy fügt einen Header mit der authentifizierten Benutzeridentität hinzu (z. B. `x-forwarded-user: nick@example.com`)
3. OpenClaw prüft, dass die Anfrage von einer **vertrauenswürdigen Proxy-IP** stammt (konfiguriert in `gateway.trustedProxies`)
4. OpenClaw extrahiert die Benutzeridentität aus dem konfigurierten Header
5. Wenn alles passt, wird die Anfrage autorisiert

## Pairing-Verhalten der Control UI

Wenn `gateway.auth.mode = "trusted-proxy"` aktiv ist und die Anfrage die
Trusted-Proxy-Prüfungen besteht, können WebSocket-Sitzungen der Control UI ohne
Geräte-Pairing-Identität verbunden werden.

Auswirkungen:

- Pairing ist in diesem Modus nicht mehr das primäre Gate für den Zugriff auf die Control UI.
- Ihre Auth-Richtlinie des Reverse Proxy und `allowUsers` werden zur effektiven Zugriffskontrolle.
- Halten Sie den Gateway-Ingress auf nur vertrauenswürdige Proxy-IPs beschränkt (`gateway.trustedProxies` + Firewall).

## Konfiguration

```json5
{
  gateway: {
    // Trusted-Proxy-Authentifizierung erwartet Anfragen von einer nicht-loopback Trusted-Proxy-Quelle
    bind: "lan",

    // KRITISCH: Fügen Sie hier nur die IP(s) Ihres Proxy hinzu
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header, der die authentifizierte Benutzeridentität enthält (erforderlich)
        userHeader: "x-forwarded-user",

        // Optional: Header, die vorhanden sein MÜSSEN (Proxy-Verifizierung)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: auf bestimmte Benutzer beschränken (leer = alle erlauben)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Wichtige Laufzeitregel:

- Trusted-Proxy-Authentifizierung lehnt Anfragen aus loopback-Quellen (`127.0.0.1`, `::1`, loopback-CIDRs) ab.
- Reverse Proxys auf demselben Host über loopback erfüllen die Trusted-Proxy-Authentifizierung **nicht**.
- Für loopback-Proxy-Setups auf demselben Host verwenden Sie stattdessen Token-/Passwort-Authentifizierung oder routen Sie über eine nicht-loopback Trusted-Proxy-Adresse, die OpenClaw verifizieren kann.
- Nicht-loopback-Bereitstellungen der Control UI benötigen weiterhin explizite `gateway.controlUi.allowedOrigins`.
- **Nachweise aus Forwarded-Headern überschreiben loopback-Lokalität.** Wenn eine Anfrage über loopback eintrifft, aber `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`-Header trägt, die auf einen nicht-lokalen Ursprung zeigen, entkräftet dieser Nachweis die Behauptung lokaler loopback-Herkunft. Die Anfrage wird für Pairing, Trusted-Proxy-Authentifizierung und Device-Identity-Gating der Control UI als remote behandelt. Dadurch wird verhindert, dass ein loopback-Proxy auf demselben Host über weitergeleitete Header eine Identität in die Trusted-Proxy-Authentifizierung einschleust.

### Konfigurationsreferenz

| Feld                                        | Erforderlich | Beschreibung                                                               |
| ------------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Ja           | Array vertrauenswürdiger Proxy-IP-Adressen. Anfragen von anderen IPs werden abgelehnt. |
| `gateway.auth.mode`                         | Ja           | Muss `"trusted-proxy"` sein                                                |
| `gateway.auth.trustedProxy.userHeader`      | Ja           | Name des Headers, der die authentifizierte Benutzeridentität enthält       |
| `gateway.auth.trustedProxy.requiredHeaders` | Nein         | Zusätzliche Header, die vorhanden sein müssen, damit die Anfrage vertraut wird |
| `gateway.auth.trustedProxy.allowUsers`      | Nein         | Allowlist von Benutzeridentitäten. Leer bedeutet: alle authentifizierten Benutzer erlauben. |

## TLS-Terminierung und HSTS

Verwenden Sie einen TLS-Terminierungspunkt und setzen Sie HSTS dort.

### Empfohlenes Muster: TLS-Terminierung am Proxy

Wenn Ihr Reverse Proxy HTTPS für `https://control.example.com` verarbeitet, setzen Sie
`Strict-Transport-Security` am Proxy für diese Domain.

- Gut geeignet für Bereitstellungen mit Internetzugriff.
- Hält Zertifikate + Richtlinien zur HTTP-Härtung an einem Ort.
- OpenClaw kann hinter dem Proxy auf loopback-HTTP bleiben.

Beispielwert für den Header:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### TLS-Terminierung im Gateway

Wenn OpenClaw selbst direkt HTTPS bereitstellt (kein TLS-terminierender Proxy), setzen Sie:

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

`strictTransportSecurity` akzeptiert einen String-Headerwert oder `false`, um ihn explizit zu deaktivieren.

### Hinweise für das Rollout

- Beginnen Sie zunächst mit einem kurzen Max-Age (zum Beispiel `max-age=300`), während Sie den Datenverkehr validieren.
- Erhöhen Sie erst dann auf langlebige Werte (zum Beispiel `max-age=31536000`), wenn Sie ausreichend Vertrauen haben.
- Fügen Sie `includeSubDomains` nur hinzu, wenn jede Subdomain HTTPS-bereit ist.
- Verwenden Sie Preload nur, wenn Sie die Anforderungen für Preload für Ihren vollständigen Domain-Satz absichtlich erfüllen.
- Nur loopback-basierte lokale Entwicklung profitiert nicht von HSTS.

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

Pomerium-Konfigurationsausschnitt:

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
    trustedProxies: ["10.0.0.1"], // Caddy-/Sidecar-Proxy-IP
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

Caddyfile-Ausschnitt:

```text
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

oauth2-proxy authentifiziert Benutzer und übergibt die Identität in `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // nginx-/oauth2-proxy-IP
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

OpenClaw lehnt mehrdeutige Konfigurationen ab, bei denen gleichzeitig sowohl ein `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`) als auch der Modus `trusted-proxy` aktiv sind. Gemischte Token-Konfigurationen können dazu führen, dass loopback-Anfragen stillschweigend über den falschen Auth-Pfad authentifiziert werden.

Wenn beim Start ein Fehler `mixed_trusted_proxy_token` auftritt:

- Entfernen Sie das Shared Token, wenn Sie den Modus `trusted-proxy` verwenden, oder
- wechseln Sie `gateway.auth.mode` auf `"token"`, wenn Sie tatsächlich tokenbasierte Authentifizierung beabsichtigen.

Trusted-Proxy-Authentifizierung für loopback schlägt ebenfalls fail-closed fehl: Aufrufer auf demselben Host müssen die konfigurierten Identitäts-Header über einen vertrauenswürdigen Proxy bereitstellen, statt stillschweigend authentifiziert zu werden.

## Header für Operator-Scopes

Trusted-Proxy-Authentifizierung ist ein **identity-bearing** HTTP-Modus, daher können Aufrufer
optional Operator-Scopes mit `x-openclaw-scopes` deklarieren.

Beispiele:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Verhalten:

- Wenn der Header vorhanden ist, berücksichtigt OpenClaw den deklarierten Scope-Satz.
- Wenn der Header vorhanden, aber leer ist, deklariert die Anfrage **keine** Operator-Scopes.
- Wenn der Header fehlt, fallen normale identity-bearing HTTP-APIs auf den Standardumfang für Operatoren zurück.
- Gateway-auth-**Plugin-HTTP-Routen** sind standardmäßig enger: Wenn `x-openclaw-scopes` fehlt, fällt ihr Runtime-Scope auf `operator.write` zurück.
- HTTP-Anfragen aus dem Browser-Ursprung müssen weiterhin `gateway.controlUi.allowedOrigins` (oder den absichtlichen Fallback-Modus über den Host-Header) bestehen, auch wenn die Trusted-Proxy-Authentifizierung erfolgreich war.

Praktische Regel:

- Senden Sie `x-openclaw-scopes` explizit, wenn Sie möchten, dass eine Trusted-Proxy-Anfrage
  enger als die Standardwerte ist, oder wenn eine Plugin-Route für Gateway-Auth
  etwas Stärkeres als Write-Scope benötigt.

## Sicherheits-Checkliste

Bevor Sie Trusted-Proxy-Authentifizierung aktivieren, prüfen Sie:

- [ ] **Proxy ist der einzige Pfad**: Der Gateway-Port ist für alles außer Ihrem Proxy durch eine Firewall gesperrt
- [ ] **trustedProxies ist minimal**: Nur die tatsächlichen IPs Ihres Proxy, nicht ganze Subnetze
- [ ] **Keine loopback-Proxy-Quelle**: Trusted-Proxy-Authentifizierung schlägt für Anfragen aus loopback-Quellen fail-closed fehl
- [ ] **Proxy entfernt Header**: Ihr Proxy überschreibt (statt anzuhängen) `x-forwarded-*`-Header von Clients
- [ ] **TLS-Terminierung**: Ihr Proxy verarbeitet TLS; Benutzer verbinden sich über HTTPS
- [ ] **allowedOrigins ist explizit**: Nicht-loopback-Control-UI verwendet explizite `gateway.controlUi.allowedOrigins`
- [ ] **allowUsers ist gesetzt** (empfohlen): Auf bekannte Benutzer beschränken, statt jeden authentifizierten Benutzer zuzulassen
- [ ] **Keine gemischte Token-Konfiguration**: Nicht gleichzeitig `gateway.auth.token` und `gateway.auth.mode: "trusted-proxy"` setzen

## Sicherheits-Audit

`openclaw security audit` markiert Trusted-Proxy-Authentifizierung mit einem Finding der Schwere **critical**. Das ist beabsichtigt — es erinnert daran, dass Sie die Sicherheit an Ihr Proxy-Setup delegieren.

Das Audit prüft auf:

- Basiswarnung/-erinnerung `gateway.trusted_proxy_auth` mit Warnung/Kritisch
- fehlende Konfiguration von `trustedProxies`
- fehlende Konfiguration von `userHeader`
- leeres `allowUsers` (erlaubt jeden authentifizierten Benutzer)
- Wildcard- oder fehlende Browser-Origin-Richtlinie auf offengelegten Oberflächen der Control UI

## Fehlerbehebung

### `trusted_proxy_untrusted_source`

Die Anfrage stammt nicht von einer IP in `gateway.trustedProxies`. Prüfen Sie:

- Ist die Proxy-IP korrekt? (Docker-Container-IPs können sich ändern)
- Befindet sich ein Load Balancer vor Ihrem Proxy?
- Verwenden Sie `docker inspect` oder `kubectl get pods -o wide`, um die tatsächlichen IPs zu ermitteln

### `trusted_proxy_loopback_source`

OpenClaw hat eine Trusted-Proxy-Anfrage aus einer loopback-Quelle abgelehnt.

Prüfen Sie:

- Verbindet sich der Proxy von `127.0.0.1` / `::1` aus?
- Versuchen Sie, Trusted-Proxy-Authentifizierung mit einem loopback-Reverse-Proxy auf demselben Host zu verwenden?

Korrektur:

- Verwenden Sie Token-/Passwort-Authentifizierung für loopback-Proxy-Setups auf demselben Host, oder
- routen Sie über eine nicht-loopback Trusted-Proxy-Adresse und behalten Sie diese IP in `gateway.trustedProxies`.

### `trusted_proxy_user_missing`

Der Benutzer-Header war leer oder fehlte. Prüfen Sie:

- Ist Ihr Proxy so konfiguriert, dass er Identitäts-Header weitergibt?
- Ist der Header-Name korrekt? (case-insensitive, aber die Schreibweise muss stimmen)
- Ist der Benutzer am Proxy tatsächlich authentifiziert?

### `trusted*proxy_missing_header*\*`

Ein erforderlicher Header war nicht vorhanden. Prüfen Sie:

- Ihre Proxy-Konfiguration für diese spezifischen Header
- ob Header irgendwo in der Kette entfernt werden

### `trusted_proxy_user_not_allowed`

Der Benutzer ist authentifiziert, aber nicht in `allowUsers`. Fügen Sie ihn hinzu oder entfernen Sie die Allowlist.

### `trusted_proxy_origin_not_allowed`

Trusted-Proxy-Authentifizierung war erfolgreich, aber der Browser-Header `Origin` hat die Origin-Prüfungen der Control UI nicht bestanden.

Prüfen Sie:

- `gateway.controlUi.allowedOrigins` enthält exakt die Browser-Origin
- Sie verlassen sich nicht auf Wildcard-Origins, außer Sie möchten absichtlich ein Allow-all-Verhalten
- wenn Sie absichtlich den Fallback-Modus über den Host-Header verwenden, ist `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bewusst gesetzt

### WebSocket schlägt weiterhin fehl

Stellen Sie sicher, dass Ihr Proxy:

- WebSocket-Upgrades unterstützt (`Upgrade: websocket`, `Connection: upgrade`)
- die Identitäts-Header auch bei WebSocket-Upgrade-Requests weitergibt (nicht nur bei HTTP)
- keinen separaten Auth-Pfad für WebSocket-Verbindungen hat

## Migration von Token-Authentifizierung

Wenn Sie von Token-Authentifizierung zu Trusted-Proxy wechseln:

1. Konfigurieren Sie Ihren Proxy so, dass er Benutzer authentifiziert und Header weitergibt
2. Testen Sie das Proxy-Setup unabhängig (curl mit Headern)
3. Aktualisieren Sie die OpenClaw-Konfiguration mit Trusted-Proxy-Authentifizierung
4. Starten Sie das Gateway neu
5. Testen Sie WebSocket-Verbindungen aus der Control UI
6. Führen Sie `openclaw security audit` aus und prüfen Sie die Findings

## Verwandt

- [Security](/de/gateway/security) — vollständige Sicherheitsanleitung
- [Configuration](/de/gateway/configuration) — Konfigurationsreferenz
- [Remote Access](/de/gateway/remote) — andere Muster für Remote-Zugriff
- [Tailscale](/de/gateway/tailscale) — einfachere Alternative für Zugriff nur im Tailnet
