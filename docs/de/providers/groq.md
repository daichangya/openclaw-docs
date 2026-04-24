---
read_when:
    - Sie möchten Groq mit OpenClaw verwenden
    - Sie benötigen die API-Key-Env-Variable oder die CLI-Auth-Auswahl
summary: Groq-Einrichtung (Auth + Modellauswahl)
title: Groq
x-i18n:
    generated_at: "2026-04-24T06:54:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c711297d42dea7fabe8ba941f75ef9dc82bd9b838f78d5dc4385210d9f65ade
    source_path: providers/groq.md
    workflow: 15
---

[Groq](https://groq.com) bietet ultraschnelle Inferenz auf Open-Source-Modellen
(Llama, Gemma, Mistral und mehr) mit benutzerdefinierter LPU-Hardware. OpenClaw verbindet sich
über die OpenAI-kompatible API mit Groq.

| Eigenschaft | Wert              |
| ----------- | ----------------- |
| Provider    | `groq`            |
| Auth        | `GROQ_API_KEY`    |
| API         | OpenAI-kompatibel |

## Erste Schritte

<Steps>
  <Step title="Einen API-Key holen">
    Erstellen Sie einen API-Key unter [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Den API-Key setzen">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Ein Standardmodell setzen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Beispiel für die Konfigurationsdatei

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Integrierter Katalog

Groqs Modellkatalog ändert sich häufig. Führen Sie `openclaw models list | grep groq`
aus, um die aktuell verfügbaren Modelle zu sehen, oder prüfen Sie
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modell                      | Hinweise                           |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Allgemeiner Einsatz, großer Kontext |
| **Llama 3.1 8B Instant**    | Schnell, leichtgewichtig           |
| **Gemma 2 9B**              | Kompakt, effizient                 |
| **Mixtral 8x7B**            | MoE-Architektur, starkes Reasoning |

<Tip>
Verwenden Sie `openclaw models list --provider groq` für die aktuellste Liste der
auf Ihrem Konto verfügbaren Modelle.
</Tip>

## Audio-Transkription

Groq bietet außerdem schnelle Whisper-basierte Audio-Transkription. Wenn es als
Provider für Medienverständnis konfiguriert ist, verwendet OpenClaw Groqs Modell
`whisper-large-v3-turbo`, um Sprachnachrichten über die gemeinsame Oberfläche
`tools.media.audio` zu transkribieren.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Details zur Audio-Transkription">
    | Eigenschaft | Wert |
    |-------------|------|
    | Gemeinsamer Konfigurationspfad | `tools.media.audio` |
    | Standard-Basis-URL | `https://api.groq.com/openai/v1` |
    | Standardmodell | `whisper-large-v3-turbo` |
    | API-Endpoint | OpenAI-kompatibel `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `GROQ_API_KEY`
    für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für durch Daemon verwaltete
    Gateway-Prozesse nicht sichtbar. Verwenden Sie `~/.openclaw/.env` oder die Konfiguration `env.shellEnv` für
    dauerhafte Verfügbarkeit.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Referenzen und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider- und Audio-Einstellungen.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq-Dashboard, API-Dokumentation und Preise.
  </Card>
  <Card title="Groq-Modellliste" href="https://console.groq.com/docs/models" icon="list">
    Offizieller Groq-Modellkatalog.
  </Card>
</CardGroup>
