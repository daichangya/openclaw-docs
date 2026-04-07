---
read_when:
    - Sie möchten TaskFlows aus einem externen System auslösen oder steuern
    - Sie konfigurieren das gebündelte Webhooks-Plugin
summary: 'Webhooks-Plugin: authentifizierter TaskFlow-Eingang für vertrauenswürdige externe Automatisierung'
title: Webhooks-Plugin
x-i18n:
    generated_at: "2026-04-07T06:17:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5da12a887752ec6ee853cfdb912db0ae28512a0ffed06fe3828ef2eee15bc9d
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (Plugin)

Das Webhooks-Plugin fügt authentifizierte HTTP-Routen hinzu, die externe
Automatisierung an OpenClaw-TaskFlows binden.

Verwenden Sie es, wenn Sie möchten, dass ein vertrauenswürdiges System wie Zapier, n8n, ein
CI-Job oder ein interner Dienst verwaltete TaskFlows erstellt und steuert, ohne zuerst ein benutzerdefiniertes
Plugin schreiben zu müssen.

## Wo es ausgeführt wird

Das Webhooks-Plugin wird innerhalb des Gateway-Prozesses ausgeführt.

Wenn Ihr Gateway auf einem anderen Rechner läuft, installieren und konfigurieren Sie das Plugin auf
diesem Gateway-Host und starten Sie dann das Gateway neu.

## Routen konfigurieren

Legen Sie die Konfiguration unter `plugins.entries.webhooks.config` fest:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

Routenfelder:

- `enabled`: optional, Standardwert ist `true`
- `path`: optional, Standardwert ist `/plugins/webhooks/<routeId>`
- `sessionKey`: erforderliche Sitzung, der die gebundenen TaskFlows gehören
- `secret`: erforderliches gemeinsames Secret oder SecretRef
- `controllerId`: optionale Controller-ID für erstellte verwaltete Flows
- `description`: optionale Notiz für Betreiber

Unterstützte `secret`-Eingaben:

- Reine Zeichenkette
- SecretRef mit `source: "env" | "file" | "exec"`

Wenn eine Secret-gestützte Route ihr Secret beim Start nicht auflösen kann, überspringt
das Plugin diese Route und protokolliert stattdessen eine Warnung, anstatt einen defekten Endpunkt bereitzustellen.

## Sicherheitsmodell

Jede Route gilt als vertrauenswürdig und handelt mit der TaskFlow-Berechtigung ihres konfigurierten
`sessionKey`.

Das bedeutet, dass die Route die TaskFlows dieser Sitzung prüfen und verändern kann. Daher sollten Sie:

- Ein starkes eindeutiges Secret pro Route verwenden
- Secret-Referenzen Inline-Klartext-Secrets vorziehen
- Routen an die engste Sitzung binden, die zum Workflow passt
- Nur den spezifischen Webhook-Pfad freigeben, den Sie benötigen

Das Plugin wendet Folgendes an:

- Authentifizierung mit gemeinsamem Secret
- Schutzmechanismen für Größe und Timeout des Anfragetexts
- Rate-Limiting mit festem Zeitfenster
- Begrenzung gleichzeitiger laufender Anfragen
- Eigentümergebundenen TaskFlow-Zugriff über `api.runtime.taskFlow.bindSession(...)`

## Anfrageformat

Senden Sie `POST`-Anfragen mit:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` oder `x-openclaw-webhook-secret: <secret>`

Beispiel:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Unterstützte Aktionen

Das Plugin akzeptiert derzeit diese JSON-`action`-Werte:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Erstellt einen verwalteten TaskFlow für die an die Route gebundene Sitzung.

Beispiel:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Erstellt eine verwaltete untergeordnete Aufgabe innerhalb eines vorhandenen verwalteten TaskFlows.

Zulässige Laufzeiten sind:

- `subagent`
- `acp`

Beispiel:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Antwortformat

Erfolgreiche Antworten geben zurück:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Abgelehnte Anfragen geben zurück:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Das Plugin entfernt bewusst Eigentümer-/Sitzungsmetadaten aus Webhook-Antworten.

## Verwandte Dokumente

- [Plugin runtime SDK](/de/plugins/sdk-runtime)
- [Hooks and webhooks overview](/de/automation/hooks)
- [CLI webhooks](/cli/webhooks)
