---
read_when:
    - Sie möchten Zugangsdaten, Geräte oder Agent-Standardeinstellungen interaktiv anpassen.
summary: CLI-Referenz für `openclaw configure` (interaktive Konfigurationsabfragen)
title: Konfigurieren
x-i18n:
    generated_at: "2026-04-24T06:30:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

Interaktive Abfrage zum Einrichten von Zugangsdaten, Geräten und Agent-Standardeinstellungen.

Hinweis: Der Abschnitt **Model** enthält jetzt eine Mehrfachauswahl für die
Allowlist `agents.defaults.models` (was in `/model` und im Modellauswahlfeld angezeigt wird).
Providerbezogene Einrichtungsoptionen führen ihre ausgewählten Modelle mit der vorhandenen
Allowlist zusammen, anstatt nicht zusammenhängende Provider in der Konfiguration zu ersetzen.

Wenn `configure` ausgehend von einer Provider-Authentifizierungsoption startet, werden
der Standardmodell- und der Allowlist-Auswahl automatisch für diesen Provider bevorzugt. Bei gekoppelten Providern wie
Volcengine/BytePlus gilt dieselbe Bevorzugung auch für deren Coding-Plan-
Varianten (`volcengine-plan/*`, `byteplus-plan/*`). Wenn der Filter für den bevorzugten Provider
eine leere Liste ergeben würde, greift `configure` auf den ungefilterten
Katalog zurück, anstatt eine leere Auswahl anzuzeigen.

Tipp: `openclaw config` ohne Unterbefehl öffnet denselben Assistenten. Verwenden Sie
`openclaw config get|set|unset` für nicht interaktive Bearbeitungen.

Für die Websuche können Sie mit `openclaw configure --section web` einen Provider
auswählen und dessen Zugangsdaten konfigurieren. Einige Provider zeigen auch providerspezifische
Folgeabfragen an:

- **Grok** kann eine optionale `x_search`-Einrichtung mit demselben `XAI_API_KEY` anbieten und
  Ihnen die Auswahl eines `x_search`-Modells ermöglichen.
- **Kimi** kann nach der Moonshot-API-Region fragen (`api.moonshot.ai` vs
  `api.moonshot.cn`) und nach dem standardmäßigen Kimi-Websuchmodell.

Verwandt:

- Referenz zur Gateway-Konfiguration: [Konfiguration](/de/gateway/configuration)
- Config-CLI: [Config](/de/cli/config)

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

- Die Auswahl, wo das Gateway ausgeführt wird, aktualisiert immer `gateway.mode`. Sie können „Continue“ ohne weitere Abschnitte auswählen, wenn Sie nur das benötigen.
- Kanalorientierte Dienste (Slack/Discord/Matrix/Microsoft Teams) fragen während der Einrichtung nach Kanal-/Raum-Allowlists. Sie können Namen oder IDs eingeben; der Assistent löst Namen nach Möglichkeit zu IDs auf.
- Wenn Sie den Daemon-Installationsschritt ausführen, Token-Authentifizierung ein Token erfordert und `gateway.auth.token` per SecretRef verwaltet wird, validiert `configure` das SecretRef, speichert aber keine aufgelösten Klartext-Tokenwerte in den Umgebungsmetadaten des Supervisor-Dienstes.
- Wenn Token-Authentifizierung ein Token erfordert und das konfigurierte Token-SecretRef nicht aufgelöst werden kann, blockiert `configure` die Daemon-Installation mit konkreten Hinweisen zur Behebung.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind und `gateway.auth.mode` nicht gesetzt ist, blockiert `configure` die Daemon-Installation, bis der Modus explizit gesetzt wird.

## Beispiele

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Verwandt

- [CLI-Referenz](/de/cli)
- [Konfiguration](/de/gateway/configuration)
