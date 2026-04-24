---
read_when:
    - Sie möchten TaskFlow aus einem externen System auslösen oder steuern
    - Sie konfigurieren das gebündelte Webhooks-Plugin
summary: 'Webhooks-Plugin: authentifizierter TaskFlow-Eingang für vertrauenswürdige externe Automatisierung'
title: Webhooks-Plugin
x-i18n:
    generated_at: "2026-04-24T06:52:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (Plugin)

Das Webhooks-Plugin fügt authentifizierte HTTP-Routen hinzu, die externe
Automatisierung an OpenClaw TaskFlow binden.

Verwenden Sie es, wenn Sie ein vertrauenswürdiges System wie Zapier, n8n, einen CI-Job oder einen
internen Dienst verwenden möchten, um verwaltete TaskFlows zu erstellen und zu steuern, ohne zuerst ein benutzerdefiniertes
Plugin schreiben zu müssen.

## Wo es läuft

Das Webhooks-Plugin läuft innerhalb des Gateway-Prozesses.

Wenn Ihr Gateway auf einem anderen Rechner läuft, installieren und konfigurieren Sie das Plugin auf
diesem Gateway-Host und starten Sie das Gateway dann neu.

## Routen konfigurieren

Setzen Sie die Konfiguration unter `plugins.entries.webhooks.config`:

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

Felder einer Route:

- `enabled`: optional, Standard ist `true`
- `path`: optional, Standard ist `/plugins/webhooks/<routeId>`
- `sessionKey`: erforderliche Sitzung, die die gebundenen TaskFlows besitzt
- `secret`: erforderliches Shared Secret oder SecretRef
- `controllerId`: optionale Controller-ID für erzeugte verwaltete Flows
- `description`: optionale Anmerkung für Operatoren

Unterstützte `secret`-Eingaben:

- Einfache Zeichenfolge
- SecretRef mit `source: "env" | "file" | "exec"`

Wenn eine secretgestützte Route ihr Secret beim Start nicht auflösen kann, überspringt
das Plugin diese Route und protokolliert eine Warnung, statt einen kaputten Endpunkt bereitzustellen.

## Sicherheitsmodell

Jede Route gilt als vertrauenswürdig und handelt mit der TaskFlow-Befugnis ihres konfigurierten
`sessionKey`.

Das bedeutet, dass die Route TaskFlows dieser Sitzung prüfen und verändern kann, daher
sollten Sie:

- ein starkes eindeutiges Secret pro Route verwenden
- Secret-Referenzen gegenüber eingebetteten Klartext-Secrets bevorzugen
- Routen an die engstmögliche Sitzung binden, die zum Workflow passt
- nur den spezifischen Webhook-Pfad bereitstellen, den Sie benötigen

Das Plugin wendet an:

- Shared-Secret-Authentifizierung
- Schutzmechanismen für Größe und Timeout des Request-Bodys
- Rate-Limiting mit festem Zeitfenster
- Begrenzung gleichzeitig laufender Requests
- sitzungsgebundenen TaskFlow-Zugriff über `api.runtime.taskFlow.bindSession(...)`

## Request-Format

Senden Sie `POST`-Requests mit:

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

Erstellt eine verwaltete Child-Aufgabe innerhalb eines bestehenden verwalteten TaskFlow.

Erlaubte Laufzeiten sind:

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

## Antwortform

Erfolgreiche Antworten geben zurück:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Abgelehnte Requests geben zurück:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Das Plugin bereinigt absichtlich Owner-/Sitzungsmetadaten aus Webhook-Antworten.

## Verwandte Dokumente

- [Plugin runtime SDK](/de/plugins/sdk-runtime)
- [Hooks and webhooks overview](/de/automation/hooks)
- [CLI webhooks](/de/cli/webhooks)
