---
read_when:
    - OpenClaw hinter einem identitätsbewussten Proxy ausführen
    - Pomerium, Caddy oder nginx mit OAuth vor OpenClaw einrichten
    - WebSocket-1008-unauthorized-Fehler bei Reverse-Proxy-Setups beheben
    - Entscheiden, wo HSTS und andere HTTP-Härtungs-Header gesetzt werden sollen
summary: Gateway-Authentifizierung an einen vertrauenswürdigen Reverse-Proxy delegieren (Pomerium, Caddy, nginx + OAuth)
title: Trusted Proxy Auth
x-i18n:
    generated_at: "2026-04-23T14:02:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Trusted Proxy Auth

> ⚠️ **Sicherheitsrelevante Funktion.** Dieser Modus delegiert die Authentifizierung vollständig an Ihren Reverse-Proxy. Eine Fehlkonfiguration kann Ihr Gateway für unbefugten Zugriff öffnen. Lesen Sie diese Seite sorgfältig, bevor Sie sie aktivieren.

## Wann verwenden

Verwenden Sie den Auth-Modus `trusted-proxy`, wenn:

- Sie OpenClaw hinter einem **identitätsbewussten Proxy** ausführen (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Ihr Proxy die gesamte Authentifizierung übernimmt und die Benutzeridentität per Header weitergibt
- Sie sich in einer Kubernetes- oder Container-Umgebung befinden, in der der Proxy der einzige Pfad zum Gateway ist
- Sie auf WebSocket-`1008 unauthorized`-Fehler stoßen, weil Browser keine Tokens in WS-Payloads übergeben können

## Wann NICHT verwenden

- Wenn Ihr Proxy Benutzer nicht authentifiziert (nur TLS-Terminator oder Load Balancer)
- Wenn es irgendeinen Pfad zum Gateway gibt, der den Proxy umgeht (Firewall-Lücken, interner Netzwerkzugriff)
- Wenn Sie nicht sicher sind, ob Ihr Proxy weitergeleitete Header korrekt entfernt/überschreibt
- Wenn Sie nur persönlichen Einzelbenutzerzugriff benötigen (erwägen Sie Tailscale Serve + loopback für eine einfachere Einrichtung)

## So funktioniert es

1. Ihr Reverse-Proxy authentifiziert Benutzer (OAuth, OIDC, SAML usw.)
2. Der Proxy fügt einen Header mit der authentifizierten Benutzeridentität hinzu (z. B. `x-forwarded-user: nick@example.com`)
3. OpenClaw prüft, dass die Anfrage von einer **vertrauenswürdigen Proxy-IP** stammt (konfiguriert in `gateway.trustedProxies`)
4. OpenClaw extrahiert die Benutzeridentität aus dem konfigurierten Header
5. Wenn alles passt, wird die Anfrage autorisiert

## Pairing-Verhalten der Control UI

Wenn `gateway.auth.mode = "trusted-proxy"` aktiv ist und die Anfrage die Prüfungen für vertrauenswürdige Proxys besteht, können WebSocket-Sitzungen der Control UI ohne Geräte-Pairing-Identität eine Verbindung herstellen.

Auswirkungen:

- Pairing ist in diesem Modus nicht mehr die primäre Schranke für den Zugriff auf die Control UI.
- Ihre Reverse-Proxy-Auth-Richtlinie und `allowUsers` werden zur effektiven Zugriffskontrolle.
- Halten Sie den Gateway-Ingress nur für vertrauenswürdige Proxy-IPs offen (`gateway.trustedProxies` + Firewall).

## Konfiguration

```json5
{
  gateway: {
    // Trusted-Proxy-Auth erwartet Anfragen von einer nicht-loopback vertrauenswürdigen Proxy-Quelle
    bind: "lan",

    // KRITISCH: Fügen Sie hier nur die IP(s) Ihres Proxys hinzu
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header mit der authentifizierten Benutzeridentität (erforderlich)
        userHeader: "x-forwarded-user",

        // Optional: Header, die IMMER vorhanden sein MÜSSEN (Proxy-Verifikation)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: auf bestimmte Benutzer beschränken (leer = alle erlauben)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Wichtige Laufzeitregel:

- Trusted-Proxy-Auth lehnt Anfragen von loopback-Quellen (`127.0.0.1`, `::1`, loopback-CIDRs) ab.
- Reverse-Proxys auf demselben Host über loopback erfüllen Trusted-Proxy-Auth **nicht**.
- Für Proxy-Setups auf demselben Host über loopback verwenden Sie stattdessen Token-/Passwort-Auth oder routen Sie über eine nicht-loopback vertrauenswürdige Proxy-Adresse, die OpenClaw verifizieren kann.
- Nicht-loopback-Control-UI-Bereitstellungen benötigen weiterhin explizite `gateway.controlUi.allowedOrigins`.
- **Evidence aus Forwarded-Headers übersteuert loopback-Lokalität.** Wenn eine Anfrage über loopback ankommt, aber Header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` trägt, die auf einen nicht lokalen Ursprung zeigen, disqualifiziert diese Evidence die Behauptung lokaler loopback-Herkunft. Die Anfrage wird für Pairing, Trusted-Proxy-Auth und das Gate für Geräteidentität der Control UI als remote behandelt. Dadurch wird verhindert, dass ein loopback-Proxy auf demselben Host die Identität aus Forwarded-Headers in Trusted-Proxy-Auth einschleust.

### Konfigurationsreferenz

| Feld                                        | Erforderlich | Beschreibung                                                               |
| ------------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Ja           | Array vertrauenswürdiger Proxy-IP-Adressen. Anfragen von anderen IPs werden abgelehnt. |
| `gateway.auth.mode`                         | Ja           | Muss `"trusted-proxy"` sein                                                |
| `gateway.auth.trustedProxy.userHeader`      | Ja           | Header-Name mit der authentifizierten Benutzeridentität                    |
| `gateway.auth.trustedProxy.requiredHeaders` | Nein         | Zusätzliche Header, die vorhanden sein müssen, damit die Anfrage vertrauenswürdig ist |
| `gateway.auth.trustedProxy.allowUsers`      | Nein         | Allowlist von Benutzeridentitäten. Leer bedeutet, dass alle authentifizierten Benutzer erlaubt sind. |

## TLS-Terminierung und HSTS

Verwenden Sie einen TLS-Terminierungspunkt und setzen Sie dort HSTS.

### Empfohlenes Muster: TLS-Terminierung am Proxy

Wenn Ihr Reverse-Proxy HTTPS für `https://control.example.com` verarbeitet, setzen Sie `Strict-Transport-Security` am Proxy für diese Domain.

- Gut geeignet für internetseitig erreichbare Bereitstellungen.
- Hält Zertifikate + HTTP-Härtungsrichtlinie an einem Ort zusammen.
- OpenClaw kann hinter dem Proxy auf loopback-HTTP bleiben.

Beispielwert für den Header:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### TLS-Terminierung am Gateway

Wenn OpenClaw selbst HTTPS direkt bereitstellt (kein TLS-terminierender Proxy), setzen Sie:

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

`strictTransportSecurity` akzeptiert einen String als Header-Wert oder `false`, um ihn explizit zu deaktivieren.

### Hinweise zum Rollout

- Beginnen Sie zunächst mit einer kurzen Max-Age (zum Beispiel `max-age=300`), während Sie den Traffic validieren.
- Erhöhen Sie erst auf langlebige Werte (zum Beispiel `max-age=31536000`), wenn das Vertrauen hoch ist.
- Fügen Sie `includeSubDomains` nur hinzu, wenn jede Subdomain HTTPS-fähig ist.
- Verwenden Sie Preload nur, wenn Sie die Preload-Anforderungen bewusst für Ihren gesamten Domain-Satz erfüllen.
- Lokale Entwicklung nur über loopback profitiert nicht von HSTS.

## Beispiele für Proxy-Setups

### Pomerium

Pomerium übergibt Identität in `x-pomerium-claim-email` (oder anderen Claim-Headern) und ein JWT in `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // Pomeriums IP
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
    trustedProxies: ["10.0.0.1"], // IP des Caddy-/Sidecar-Proxys
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

oauth2-proxy authentifiziert Benutzer und übergibt die Identität in `x-auth-request-email`.

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

nginx-Konfigurationsausschnitt:

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

Wenn beim Start ein Fehler `mixed_trusted_proxy_token` erscheint:

- Entfernen Sie das gemeinsame Token, wenn Sie den Modus trusted-proxy verwenden, oder
- wechseln Sie `gateway.auth.mode` zu `"token"`, wenn Sie Token-basierte Auth verwenden möchten.

Trusted-Proxy-Auth über loopback schlägt ebenfalls fail-closed fehl: Aufrufer auf demselben Host müssen die konfigurierten Identitäts-Header über einen vertrauenswürdigen Proxy bereitstellen, statt stillschweigend authentifiziert zu werden.

## Header für Operator-Scopes

Trusted-Proxy-Auth ist ein **identity-bearing** HTTP-Modus, daher können Aufrufer optional Operator-Scopes mit `x-openclaw-scopes` deklarieren.

Beispiele:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Verhalten:

- Wenn der Header vorhanden ist, berücksichtigt OpenClaw den deklarierten Scope-Satz.
- Wenn der Header vorhanden, aber leer ist, deklariert die Anfrage **keine** Operator-Scopes.
- Wenn der Header fehlt, fallen normale identity-bearing HTTP-APIs auf den Standard-Scope-Satz für Operatoren zurück.
- Gateway-Auth-**Plugin-HTTP-Routen** sind standardmäßig enger: Wenn `x-openclaw-scopes` fehlt, fällt ihr Laufzeit-Scope auf `operator.write` zurück.
- HTTP-Anfragen aus dem Browser-Ursprung müssen weiterhin `gateway.controlUi.allowedOrigins` (oder den bewusst aktivierten Fallback-Modus für den Host-Header) bestehen, auch wenn Trusted-Proxy-Auth erfolgreich war.

Praktische Regel:

- Senden Sie `x-openclaw-scopes` explizit, wenn Sie möchten, dass eine Trusted-Proxy-Anfrage enger ist als die Standards, oder wenn eine Gateway-Auth-Plugin-Route etwas Stärkeres als Write-Scope benötigt.

## Sicherheits-Checkliste

Bevor Sie Trusted-Proxy-Auth aktivieren, prüfen Sie:

- [ ] **Proxy ist der einzige Pfad**: Der Gateway-Port ist von allem außer Ihrem Proxy per Firewall abgeschirmt
- [ ] **trustedProxies ist minimal**: Nur die tatsächlichen Proxy-IPs, nicht ganze Subnetze
- [ ] **Keine loopback-Proxy-Quelle**: Trusted-Proxy-Auth schlägt für Anfragen aus loopback-Quellen fail-closed fehl
- [ ] **Proxy entfernt Header**: Ihr Proxy überschreibt (statt anzuhängen) `x-forwarded-*`-Header von Clients
- [ ] **TLS-Terminierung**: Ihr Proxy übernimmt TLS; Benutzer verbinden sich über HTTPS
- [ ] **allowedOrigins ist explizit**: Nicht-loopback-Control-UI verwendet explizite `gateway.controlUi.allowedOrigins`
- [ ] **allowUsers ist gesetzt** (empfohlen): Auf bekannte Benutzer beschränken, statt jedem authentifizierten Benutzer Zugriff zu erlauben
- [ ] **Keine gemischte Token-Konfiguration**: Setzen Sie nicht gleichzeitig `gateway.auth.token` und `gateway.auth.mode: "trusted-proxy"`

## Sicherheitsaudit

`openclaw security audit` markiert Trusted-Proxy-Auth mit einem Befund der Schwere **kritisch**. Das ist beabsichtigt — es erinnert daran, dass Sie Sicherheit an Ihr Proxy-Setup delegieren.

Das Audit prüft auf:

- Basiswarnung/-kritischen Hinweis `gateway.trusted_proxy_auth`
- Fehlende Konfiguration von `trustedProxies`
- Fehlende Konfiguration von `userHeader`
- Leeres `allowUsers` (erlaubt jedem authentifizierten Benutzer Zugriff)
- Platzhalter- oder fehlende Richtlinie für Browser-Ursprünge auf exponierten Control-UI-Oberflächen

## Fehlerbehebung

### `trusted_proxy_untrusted_source`

Die Anfrage kam nicht von einer IP in `gateway.trustedProxies`. Prüfen Sie:

- Ist die Proxy-IP korrekt? (Docker-Container-IPs können sich ändern)
- Gibt es einen Load Balancer vor Ihrem Proxy?
- Verwenden Sie `docker inspect` oder `kubectl get pods -o wide`, um die tatsächlichen IPs zu finden

### `trusted_proxy_loopback_source`

OpenClaw hat eine Trusted-Proxy-Anfrage aus einer loopback-Quelle abgelehnt.

Prüfen Sie:

- Verbindet sich der Proxy von `127.0.0.1` / `::1`?
- Versuchen Sie, Trusted-Proxy-Auth mit einem loopback-Reverse-Proxy auf demselben Host zu verwenden?

Behebung:

- Verwenden Sie Token-/Passwort-Auth für Proxy-Setups auf demselben Host über loopback, oder
- routen Sie über eine nicht-loopback vertrauenswürdige Proxy-Adresse und behalten Sie diese IP in `gateway.trustedProxies`.

### `trusted_proxy_user_missing`

Der Benutzer-Header war leer oder fehlte. Prüfen Sie:

- Ist Ihr Proxy so konfiguriert, dass er Identitäts-Header weitergibt?
- Ist der Header-Name korrekt? (Groß-/Kleinschreibung ist nicht relevant, aber die Schreibweise schon)
- Ist der Benutzer am Proxy tatsächlich authentifiziert?

### `trusted_proxy_missing_header_*`

Ein erforderlicher Header war nicht vorhanden. Prüfen Sie:

- Ihre Proxy-Konfiguration für diese spezifischen Header
- ob Header irgendwo in der Kette entfernt werden

### `trusted_proxy_user_not_allowed`

Der Benutzer ist authentifiziert, aber nicht in `allowUsers`. Fügen Sie ihn entweder hinzu oder entfernen Sie die Allowlist.

### `trusted_proxy_origin_not_allowed`

Trusted-Proxy-Auth war erfolgreich, aber der Browser-Header `Origin` hat die Origin-Prüfungen der Control UI nicht bestanden.

Prüfen Sie:

- `gateway.controlUi.allowedOrigins` enthält exakt den Browser-Origin
- Sie verlassen sich nicht auf Platzhalter-Origins, es sei denn, Sie möchten bewusst ein Allow-all-Verhalten
- Wenn Sie bewusst den Fallback-Modus für Host-Header verwenden, ist `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` absichtlich gesetzt

### WebSocket schlägt weiterhin fehl

Stellen Sie sicher, dass Ihr Proxy:

- WebSocket-Upgrades unterstützt (`Upgrade: websocket`, `Connection: upgrade`)
- die Identitäts-Header bei WebSocket-Upgrade-Anfragen weitergibt (nicht nur bei HTTP)
- keinen separaten Auth-Pfad für WebSocket-Verbindungen hat

## Migration von Token-Auth

Wenn Sie von Token-Auth auf Trusted-Proxy umsteigen:

1. Konfigurieren Sie Ihren Proxy so, dass er Benutzer authentifiziert und Header weitergibt
2. Testen Sie das Proxy-Setup unabhängig davon (`curl` mit Headern)
3. Aktualisieren Sie die OpenClaw-Konfiguration mit Trusted-Proxy-Auth
4. Starten Sie das Gateway neu
5. Testen Sie WebSocket-Verbindungen aus der Control UI
6. Führen Sie `openclaw security audit` aus und prüfen Sie die Befunde

## Verwandt

- [Sicherheit](/de/gateway/security) — vollständiger Sicherheitsleitfaden
- [Konfiguration](/de/gateway/configuration) — Konfigurationsreferenz
- [Remote Access](/de/gateway/remote) — weitere Muster für Fernzugriff
- [Tailscale](/de/gateway/tailscale) — einfachere Alternative für Zugriff nur über Tailscale
