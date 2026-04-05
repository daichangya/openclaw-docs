---
read_when:
    - Sie möchten GLM-Modelle in OpenClaw verwenden
    - Sie benötigen die Benennungskonvention und Einrichtung für Modelle
summary: Überblick über die GLM-Modellfamilie und wie sie in OpenClaw verwendet wird
title: GLM-Modelle
x-i18n:
    generated_at: "2026-04-05T12:52:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59622edab5094d991987f9788fbf08b33325e737e7ff88632b0c3ac89412d4c7
    source_path: providers/glm.md
    workflow: 15
---

# GLM-Modelle

GLM ist eine **Modellfamilie** (kein Unternehmen), die über die Plattform Z.AI verfügbar ist. In OpenClaw
wird auf GLM-Modelle über den Provider `zai` und Modell-IDs wie `zai/glm-5` zugegriffen.

## CLI-Einrichtung

```bash
# Generische API-Key-Einrichtung mit automatischer Endpunkterkennung
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, empfohlen für Nutzer von Coding Plan
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (China-Region), empfohlen für Nutzer von Coding Plan
openclaw onboard --auth-choice zai-coding-cn

# Allgemeine API
openclaw onboard --auth-choice zai-global

# Allgemeine API CN (China-Region)
openclaw onboard --auth-choice zai-cn
```

## Konfigurationsbeispiel

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

Mit `zai-api-key` kann OpenClaw den passenden Z.AI-Endpunkt anhand des Schlüssels erkennen und
automatisch die richtige Basis-URL anwenden. Verwenden Sie die expliziten regionalen Optionen, wenn
Sie gezielt eine bestimmte Oberfläche für Coding Plan oder die allgemeine API erzwingen möchten.

## Aktuelle gebündelte GLM-Modelle

OpenClaw initialisiert den gebündelten Provider `zai` derzeit mit diesen GLM-Referenzen:

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

- GLM-Versionen und Verfügbarkeit können sich ändern; prüfen Sie die Z.AI-Dokumentation auf den neuesten Stand.
- Die standardmäßige gebündelte Modellreferenz ist `zai/glm-5`.
- Details zum Provider finden Sie unter [/providers/zai](/providers/zai).
