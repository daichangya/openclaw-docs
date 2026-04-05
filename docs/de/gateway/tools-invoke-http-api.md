---
read_when:
    - Aufrufen von Tools ohne einen vollständigen Agenten-Turn auszuführen
    - Erstellen von Automatisierungen, die eine Durchsetzung von Tool-Richtlinien benötigen
summary: Ein einzelnes Tool direkt über den Gateway-HTTP-Endpunkt aufrufen
title: Tools-Invoke-API
x-i18n:
    generated_at: "2026-04-05T12:44:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e924f257ba50b25dea0ec4c3f9eed4c8cac8a53ddef18215f87ac7de330a37fd
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

Das Gateway von OpenClaw stellt einen einfachen HTTP-Endpunkt bereit, um ein einzelnes Tool direkt aufzurufen. Er ist immer aktiviert und verwendet Gateway-Authentifizierung plus Tool-Richtlinie. Wie bei der OpenAI-kompatiblen `/v1/*`-Oberfläche wird Shared-Secret-Bearer-Authentifizierung als vertrauenswürdiger Operatorzugriff für das gesamte Gateway behandelt.

- `POST /tools/invoke`
- Derselbe Port wie das Gateway (WS + HTTP-Multiplex): `http://<gateway-host>:<port>/tools/invoke`

Die standardmäßige maximale Payload-Größe beträgt 2 MB.

## Authentifizierung

Verwendet die Gateway-Authentifizierungskonfiguration.

Häufige HTTP-Authentifizierungspfade:

- Shared-Secret-Authentifizierung (`gateway.auth.mode="token"` oder `"password"`):
  `Authorization: Bearer <token-or-password>`
- vertrauenswürdige identitätstragende HTTP-Authentifizierung (`gateway.auth.mode="trusted-proxy"`):
  leiten Sie die Anfrage über den konfigurierten identitätsbewussten Proxy und lassen Sie ihn die
  erforderlichen Identitäts-Header einfügen
- offene Authentifizierung für privaten Ingress (`gateway.auth.mode="none"`):
  kein Auth-Header erforderlich

Hinweise:

- Wenn `gateway.auth.mode="token"` gesetzt ist, verwenden Sie `gateway.auth.token` (oder `OPENCLAW_GATEWAY_TOKEN`).
- Wenn `gateway.auth.mode="password"` gesetzt ist, verwenden Sie `gateway.auth.password` (oder `OPENCLAW_GATEWAY_PASSWORD`).
- Wenn `gateway.auth.mode="trusted-proxy"` gesetzt ist, muss die HTTP-Anfrage von einer
  konfigurierten vertrauenswürdigen Proxy-Quelle kommen, die nicht loopback ist; Proxys auf demselben Host über loopback
  erfüllen diesen Modus nicht.
- Wenn `gateway.auth.rateLimit` konfiguriert ist und zu viele Auth-Fehler auftreten, gibt der Endpunkt `429` mit `Retry-After` zurück.

## Sicherheitsgrenze (wichtig)

Behandeln Sie diesen Endpunkt als eine Oberfläche mit **vollem Operatorzugriff** für die Gateway-Instanz.

- HTTP-Bearer-Authentifizierung ist hier kein enges Bereichsmodell pro Benutzer.
- Ein gültiges Gateway-Token/-Passwort für diesen Endpunkt sollte wie eine Besitzer-/Operator-Anmeldeinformation behandelt werden.
- Für Shared-Secret-Authentifizierungsmodi (`token` und `password`) stellt der Endpunkt die normalen vollständigen Operator-Standardwerte wieder her, selbst wenn der Aufrufer einen engeren `x-openclaw-scopes`-Header sendet.
- Shared-Secret-Authentifizierung behandelt direkte Tool-Aufrufe an diesem Endpunkt außerdem als Owner-Sender-Turns.
- Vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` bei privatem Ingress) berücksichtigen `x-openclaw-scopes`, wenn vorhanden, und greifen andernfalls auf den normalen Standardbereichssatz für Operatoren zurück.
- Halten Sie diesen Endpunkt nur auf loopback/Tailnet/privatem Ingress; setzen Sie ihn nicht direkt dem öffentlichen Internet aus.

Authentifizierungsmatrix:

- `gateway.auth.mode="token"` oder `"password"` + `Authorization: Bearer ...`
  - beweist den Besitz des gemeinsamen Operator-Secrets des Gateway
  - ignoriert engere `x-openclaw-scopes`
  - stellt den vollständigen Standardbereichssatz für Operatoren wieder her:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - behandelt direkte Tool-Aufrufe an diesem Endpunkt als Owner-Sender-Turns
- vertrauenswürdige identitätstragende HTTP-Modi (zum Beispiel Trusted-Proxy-Authentifizierung oder `gateway.auth.mode="none"` bei privatem Ingress)
  - authentifizieren eine äußere vertrauenswürdige Identität oder Bereitstellungsgrenze
  - berücksichtigen `x-openclaw-scopes`, wenn der Header vorhanden ist
  - greifen auf den normalen Standardbereichssatz für Operatoren zurück, wenn der Header fehlt
  - verlieren die Owner-Semantik nur, wenn der Aufrufer die Bereiche explizit einschränkt und `operator.admin` weglässt

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
- `action` (string, optional): wird in `args` abgebildet, wenn das Tool-Schema `action` unterstützt und die `args`-Payload es nicht enthält.
- `args` (object, optional): toolspezifische Argumente.
- `sessionKey` (string, optional): Ziel-Sitzungsschlüssel. Wenn er weggelassen wird oder `"main"` ist, verwendet das Gateway den konfigurierten Hauptsitzungsschlüssel (berücksichtigt `session.mainKey` und den Standardagenten oder `global` im globalen Bereich).
- `dryRun` (boolean, optional): für zukünftige Verwendung reserviert; wird derzeit ignoriert.

## Richtlinien- und Routing-Verhalten

Die Verfügbarkeit von Tools wird durch dieselbe Richtlinienkette gefiltert, die auch von Gateway-Agenten verwendet wird:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- Gruppenrichtlinien (wenn der Sitzungsschlüssel einer Gruppe oder einem Kanal zugeordnet ist)
- Subagent-Richtlinie (beim Aufruf mit einem Subagent-Sitzungsschlüssel)

Wenn ein Tool durch die Richtlinie nicht erlaubt ist, gibt der Endpunkt **404** zurück.

Wichtige Hinweise zur Grenze:

- Exec-Genehmigungen sind Operator-Schutzmechanismen, keine separate Autorisierungsgrenze für diesen HTTP-Endpunkt. Wenn ein Tool hier über Gateway-Authentifizierung + Tool-Richtlinie erreichbar ist, fügt `/tools/invoke` keine zusätzliche Genehmigungsaufforderung pro Aufruf hinzu.
- Geben Sie Gateway-Bearer-Anmeldedaten nicht an nicht vertrauenswürdige Aufrufer weiter. Wenn Sie Trennung über Vertrauensgrenzen hinweg benötigen, betreiben Sie separate Gateways (und idealerweise separate OS-Benutzer/Hosts).

Gateway-HTTP wendet standardmäßig außerdem eine harte Sperrliste an (selbst wenn die Sitzungsrichtlinie das Tool erlaubt):

- `exec` — direkte Befehlsausführung (RCE-Oberfläche)
- `spawn` — beliebige Erstellung von Kindprozessen (RCE-Oberfläche)
- `shell` — Shell-Befehlsausführung (RCE-Oberfläche)
- `fs_write` — beliebige Dateiveränderung auf dem Host
- `fs_delete` — beliebiges Löschen von Dateien auf dem Host
- `fs_move` — beliebiges Verschieben/Umbenennen von Dateien auf dem Host
- `apply_patch` — Patch-Anwendung kann beliebige Dateien umschreiben
- `sessions_spawn` — Sitzungsorchestrierung; das Remote-Starten von Agenten ist RCE
- `sessions_send` — nachrichtenübergreifende Injektion zwischen Sitzungen
- `cron` — persistente Automatisierungs-Control-Plane
- `gateway` — Gateway-Control-Plane; verhindert Rekonfiguration über HTTP
- `nodes` — Node-Befehlsweiterleitung kann `system.run` auf gepaarten Hosts erreichen
- `whatsapp_login` — interaktive Einrichtung, die einen QR-Scan im Terminal erfordert; hängt bei HTTP

Sie können diese Sperrliste über `gateway.tools` anpassen:

```json5
{
  gateway: {
    tools: {
      // Zusätzliche Tools, die über HTTP /tools/invoke blockiert werden sollen
      deny: ["browser"],
      // Tools aus der Standardsperrliste entfernen
      allow: ["gateway"],
    },
  },
}
```

Damit Gruppenrichtlinien den Kontext auflösen können, können Sie optional setzen:

- `x-openclaw-message-channel: <channel>` (Beispiel: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (wenn mehrere Konten vorhanden sind)

## Antworten

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (ungültige Anfrage oder Fehler bei Tool-Eingaben)
- `401` → nicht autorisiert
- `429` → Auth-Rate-Limit erreicht (`Retry-After` gesetzt)
- `404` → Tool nicht verfügbar (nicht gefunden oder nicht in Allowlist)
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
