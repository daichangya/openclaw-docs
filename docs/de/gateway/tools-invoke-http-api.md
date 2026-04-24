---
read_when:
    - Tools aufrufen, ohne einen vollständigen Agenten-Turn auszuführen
    - Automatisierungen erstellen, die die Durchsetzung von Tool-Richtlinien benötigen
summary: Ein einzelnes Tool direkt über den Gateway-HTTP-Endpunkt aufrufen
title: Tools-invoke-API
x-i18n:
    generated_at: "2026-04-24T06:40:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: edae245ca8b3eb2f4bd62fb9001ddfcb3086bec40ab976b5389b291023f6205e
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

Das Gateway von OpenClaw stellt einen einfachen HTTP-Endpunkt bereit, um ein einzelnes Tool direkt aufzurufen. Er ist immer aktiviert und verwendet Gateway-Auth plus Tool-Richtlinie. Wie bei der OpenAI-kompatiblen Oberfläche `/v1/*` wird Bearer-Auth mit gemeinsamem Secret als vertrauenswürdiger Operator-Zugriff für das gesamte Gateway behandelt.

- `POST /tools/invoke`
- Derselbe Port wie das Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/tools/invoke`

Die maximale Payload-Größe beträgt standardmäßig 2 MB.

## Authentifizierung

Verwendet die Gateway-Auth-Konfiguration.

Gängige HTTP-Auth-Pfade:

- Auth mit gemeinsamem Secret (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige, identitätsführende HTTP-Auth (`gateway.auth.mode="trusted-proxy"`):
  über den konfigurierten identitätsbewussten Proxy routen und ihn die
  erforderlichen Identitäts-Header injizieren lassen
- offene Auth über privaten Ingress (`gateway.auth.mode="none"`):
  kein Auth-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` gilt, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` gilt, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` gilt, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle kommen, die nicht Loopback ist; Proxys mit
  Loopback auf demselben Host erfüllen diesen Modus nicht.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Auth-Fehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als Oberfläche mit **vollem Operator-Zugriff** für die Gateway-Instanz.

- Bearer-HTTP-Auth ist hier kein enges Scope-Modell pro Benutzer.
- Ein gültiges Gateway-Token/-Passwort für diesen Endpunkt sollte wie eine Eigentümer-/Operator-Anmeldedaten behandelt werden.
- Für Auth-Modi mit gemeinsamem Secret (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standardwerte wieder her, selbst wenn der Aufrufer einen engeren Header `x-openclaw-scopes` sendet.
- Auth mit gemeinsamem Secret behandelt direkte Tool-Aufrufe auf diesem Endpunkt außerdem als Turns eines Eigentümer-Absenders.
- Vertrauenswürdige identitätsführende HTTP-Modi (zum Beispiel Trusted-Proxy-Auth oder `gateway.auth.mode="none"` bei privatem Ingress) berücksichtigen `x-openclaw-scopes`, wenn vorhanden, und greifen andernfalls auf die normale Standardmenge von Operator-Scopes zurück.
- Halten Sie diesen Endpunkt nur auf Loopback/Tailnet/privatem Ingress; setzen Sie ihn nicht direkt dem öffentlichen Internet aus.

Auth-Matrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - beweist den Besitz des gemeinsam genutzten Gateway-Operator-Secrets
  - ignoriert enger gefasste `x-openclaw-scopes`
  - stellt die vollständige Standardmenge von Operator-Scopes wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt direkte Tool-Aufrufe auf diesem Endpunkt als Turns eines Eigentümer-Absenders
- vertrauenswürdige identitätsführende HTTP-Modi (zum Beispiel Trusted-Proxy-Auth oder `gateway.auth.mode="none"` bei privatem Ingress)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Deployment-Grenze
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - greifen auf die normale Standardmenge von Operator-Scopes zurück, wenn der Header fehlt
  - verlieren nur dann Eigentümer-Semantik, wenn der Aufrufer die Scopes explizit einschränkt und `operator.admin` weglässt

## Request-Body

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Felder:

- `tool` (string, erforderlich): Name des aufzurufenden Tools.
- `action` (string, optional): wird in args abgebildet, wenn das Tool-Schema `action` unterstützt und die args-Payload dies ausgelassen hat.
- `args` (object, optional): toolspezifische Argumente.
- `sessionKey` (string, optional): Ziel-Sitzungsschlüssel. Wenn weggelassen oder `"main"`, verwendet das Gateway den konfigurierten Haupt-Sitzungsschlüssel (berücksichtigt `session.mainKey` und den Standardagenten oder `global` im globalen Scope).
- `dryRun` (boolean, optional): für zukünftige Verwendung reserviert; derzeit ignoriert.

## Verhalten von Richtlinie + Routing

Die Verfügbarkeit von Tools wird durch dieselbe Richtlinienkette gefiltert, die auch von Gateway-Agenten verwendet wird:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- Gruppenrichtlinien (wenn der Sitzungsschlüssel einer Gruppe oder einem Channel zugeordnet ist)
- Unteragenten-Richtlinie (wenn mit einem Unteragenten-Sitzungsschlüssel aufgerufen wird)

Wenn ein Tool durch die Richtlinie nicht erlaubt ist, gibt der Endpunkt **404** zurück.

Wichtige Hinweise zur Grenze:

- Exec-Genehmigungen sind Operator-Guardrails, keine separate Autorisierungsgrenze für diesen HTTP-Endpunkt. Wenn ein Tool hier über Gateway-Auth + Tool-Richtlinie erreichbar ist, fügt `/tools/invoke` keine zusätzliche Genehmigungsaufforderung pro Aufruf hinzu.
- Geben Sie Gateway-Bearer-Anmeldedaten nicht an nicht vertrauenswürdige Aufrufer weiter. Wenn Sie Trennung über Vertrauensgrenzen hinweg benötigen, betreiben Sie separate Gateways (und idealerweise separate OS-Benutzer/Hosts).

Gateway-HTTP wendet standardmäßig außerdem eine harte Deny-Liste an (selbst wenn die Sitzungsrichtlinie das Tool erlaubt):

- `exec` — direkte Befehlsausführung (RCE-Oberfläche)
- `spawn` — beliebige Erstellung von Kindprozessen (RCE-Oberfläche)
- `shell` — Shell-Befehlsausführung (RCE-Oberfläche)
- `fs_write` — beliebige Dateimutation auf dem Host
- `fs_delete` — beliebiges Löschen von Dateien auf dem Host
- `fs_move` — beliebiges Verschieben/Umbenennen von Dateien auf dem Host
- `apply_patch` — Patch-Anwendung kann beliebige Dateien umschreiben
- `sessions_spawn` — Sitzungsorchestrierung; Agenten remote zu starten ist RCE
- `sessions_send` — sessionübergreifende Nachrichteninjektion
- `cron` — persistente Kontrolloberfläche für Automatisierung
- `gateway` — Gateway-Control-Plane; verhindert Rekonfiguration über HTTP
- `nodes` — Node-Befehlsweiterleitung kann `system.run` auf gepaarten Hosts erreichen
- `whatsapp_login` — interaktive Einrichtung mit QR-Scan im Terminal; hängt bei HTTP

Sie können diese Deny-Liste über `gateway.tools` anpassen:

```json5
{
  gateway: {
    tools: {
      // Zusätzliche Tools, die über HTTP /tools/invoke blockiert werden
      deny: ["browser"],
      // Tools aus der Standard-Deny-Liste entfernen
      allow: ["gateway"],
    },
  },
}
```

Damit Gruppenrichtlinien Kontext auflösen können, können Sie optional setzen:

- `x-openclaw-message-channel: <channel>` (Beispiel: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (wenn mehrere Konten existieren)

## Antworten

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (ungültige Anfrage oder Tool-Eingabefehler)
- `401` → nicht autorisiert
- `429` → Auth-ratenlimitiert (`Retry-After` gesetzt)
- `404` → Tool nicht verfügbar (nicht gefunden oder nicht allowlisted)
- `405` → Methode nicht erlaubt
- `500` → `{ ok: false, error: { type, message } }` (unerwarteter Fehler bei der Tool-Ausführung; bereinigte Meldung)

## Beispiel

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Verwandt

- [Gateway-Protokoll](/de/gateway/protocol)
- [Tools und Plugins](/de/tools)
