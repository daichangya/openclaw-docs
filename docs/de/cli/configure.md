---
read_when:
    - Sie möchten Anmeldedaten, Geräte oder Agent-Standardwerte interaktiv anpassen
summary: CLI-Referenz für `openclaw configure` (interaktive Konfigurationsabfragen)
title: configure
x-i18n:
    generated_at: "2026-04-05T12:37:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989569fdb8e1b31ce3438756b3ed9bf18e0c8baf611c5981643ba5925459c98f
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Interaktive Eingabeaufforderung zum Einrichten von Anmeldedaten, Geräten und Agent-Standardwerten.

Hinweis: Der Abschnitt **Model** enthält jetzt eine Mehrfachauswahl für die
Allowlist `agents.defaults.models` (was in `/model` und in der Modellauswahl angezeigt wird).

Wenn `configure` aus einer Provider-Authentifizierungsauswahl startet, bevorzugen die Auswahlen für Standardmodell und
Allowlist diesen Provider automatisch. Bei gekoppelten Providern wie
Volcengine/BytePlus berücksichtigt dieselbe Präferenz auch deren Coding-Plan-
Varianten (`volcengine-plan/*`, `byteplus-plan/*`). Wenn der Filter für den bevorzugten Provider
eine leere Liste erzeugen würde, greift `configure` auf den ungefilterten
Katalog zurück, statt eine leere Auswahl anzuzeigen.

Tipp: `openclaw config` ohne Unterbefehl öffnet denselben Assistenten. Verwenden Sie
`openclaw config get|set|unset` für nicht interaktive Bearbeitungen.

Für die Websuche können Sie mit `openclaw configure --section web` einen Provider
auswählen und dessen Anmeldedaten konfigurieren. Einige Provider zeigen auch providerspezifische
Folgeabfragen an:

- **Grok** kann eine optionale Einrichtung von `x_search` mit demselben `XAI_API_KEY` anbieten und
  Sie ein `x_search`-Modell auswählen lassen.
- **Kimi** kann nach der Moonshot-API-Region fragen (`api.moonshot.ai` vs.
  `api.moonshot.cn`) und nach dem Standard-Websuchmodell von Kimi.

Verwandt:

- Gateway-Konfigurationsreferenz: [Configuration](/gateway/configuration)
- Config-CLI: [Config](/cli/config)

## Optionen

- `--section <section>`: wiederholbarer Abschnittsfilter

Verfügbare Abschnitte:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Hinweise:

- Wenn ausgewählt wird, wo das Gateway ausgeführt wird, wird immer `gateway.mode` aktualisiert. Sie können „Continue“ ohne weitere Abschnitte auswählen, wenn Sie nur das benötigen.
- Channel-orientierte Dienste (Slack/Discord/Matrix/Microsoft Teams) fragen bei der Einrichtung nach Channel-/Raum-Allowlists. Sie können Namen oder IDs eingeben; der Assistent löst Namen nach Möglichkeit in IDs auf.
- Wenn Sie den Installationsschritt für den Daemon ausführen, erfordert Token-Authentifizierung ein Token, und wenn `gateway.auth.token` per SecretRef verwaltet wird, validiert `configure` den SecretRef, persistiert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn Token-Authentifizierung ein Token erfordert und der konfigurierte Token-SecretRef nicht aufgelöst ist, blockiert `configure` die Daemon-Installation mit umsetzbaren Hinweisen zur Behebung.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert `configure` die Daemon-Installation, bis der Modus explizit gesetzt wird.

## Beispiele

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
