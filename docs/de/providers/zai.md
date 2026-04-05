---
read_when:
    - Sie möchten Z.AI-/GLM-Modelle in OpenClaw verwenden
    - Sie benötigen eine einfache Einrichtung mit `ZAI_API_KEY`
summary: Verwenden Sie Z.AI (GLM-Modelle) mit OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-05T12:54:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48006cdd580484f0c62e2877b27a6a68d7bc44795b3e97a28213d95182d9acf9
    source_path: providers/zai.md
    workflow: 15
---

# Z.AI

Z.AI ist die API-Plattform für **GLM**-Modelle. Sie stellt REST-APIs für GLM bereit und verwendet API-Schlüssel
zur Authentifizierung. Erstellen Sie Ihren API-Schlüssel in der Z.AI-Konsole. OpenClaw verwendet den Provider `zai`
mit einem Z.AI-API-Schlüssel.

## CLI-Einrichtung

```bash
# Generische Einrichtung mit API-Schlüssel und automatischer Endpunkterkennung
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, empfohlen für Coding-Plan-Benutzer
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (Region China), empfohlen für Coding-Plan-Benutzer
openclaw onboard --auth-choice zai-coding-cn

# Allgemeine API
openclaw onboard --auth-choice zai-global

# Allgemeine API CN (Region China)
openclaw onboard --auth-choice zai-cn
```

## Konfigurationsausschnitt

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

Mit `zai-api-key` kann OpenClaw den passenden Z.AI-Endpunkt anhand des Schlüssels erkennen und
automatisch die richtige Basis-URL anwenden. Verwenden Sie die expliziten regionalen Optionen, wenn
Sie eine bestimmte Coding-Plan- oder allgemeine API-Oberfläche erzwingen möchten.

## Gebündelter GLM-Katalog

OpenClaw initialisiert den gebündelten Provider `zai` derzeit mit:

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## Hinweise

- GLM-Modelle sind als `zai/<model>` verfügbar (Beispiel: `zai/glm-5`).
- Standardreferenz des gebündelten Modells: `zai/glm-5`
- Unbekannte `glm-5*`-IDs werden auf dem Pfad des gebündelten Providers weiterhin vorwärts aufgelöst, indem
  provider-eigene Metadaten aus der Vorlage `glm-4.7` synthetisiert werden, wenn die ID
  der aktuellen Form der GLM-5-Familie entspricht.
- `tool_stream` ist standardmäßig für Z.AI-Streaming von Tool-Aufrufen aktiviert. Setzen Sie
  `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um es zu deaktivieren.
- Siehe [/providers/glm](/providers/glm) für den Überblick über die Modelfamilie.
- Z.AI verwendet Bearer-Authentifizierung mit Ihrem API-Schlüssel.
