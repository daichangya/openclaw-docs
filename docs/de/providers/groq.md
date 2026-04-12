---
read_when:
    - Sie möchten Groq mit OpenClaw verwenden
    - Sie benötigen die API-Key-Env-Variable oder die CLI-Auth-Auswahl
summary: Einrichtung von Groq (Authentifizierung + Modellauswahl)
title: Groq
x-i18n:
    generated_at: "2026-04-12T23:31:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613289efc36fedd002e1ebf9366e0e7119ea1f9e14a1dae773b90ea57100baee
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) bietet ultraschnelle Inferenz auf Open-Source-Modellen
(Llama, Gemma, Mistral und mehr) mit benutzerdefinierter LPU-Hardware. OpenClaw verbindet sich
mit Groq über dessen OpenAI-kompatible API.

| Eigenschaft | Wert              |
| ----------- | ----------------- |
| Provider    | `groq`            |
| Auth        | `GROQ_API_KEY`    |
| API         | OpenAI-kompatibel |

## Erste Schritte

<Steps>
  <Step title="Einen API-Schlüssel erstellen">
    Erstellen Sie einen API-Schlüssel unter [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Den API-Schlüssel festlegen">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Ein Standardmodell festlegen">
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

### Beispiel für eine Konfigurationsdatei

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

## Verfügbare Modelle

Groqs Modellkatalog ändert sich häufig. Führen Sie `openclaw models list | grep groq`
aus, um die derzeit verfügbaren Modelle zu sehen, oder prüfen Sie
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modell                      | Hinweise                           |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Allzweckmodell, großer Kontext     |
| **Llama 3.1 8B Instant**    | Schnell, leichtgewichtig           |
| **Gemma 2 9B**              | Kompakt, effizient                 |
| **Mixtral 8x7B**            | MoE-Architektur, starkes Reasoning |

<Tip>
Verwenden Sie `openclaw models list --provider groq`, um die aktuellste Liste der
für Ihr Konto verfügbaren Modelle zu erhalten.
</Tip>

## Audio-Transkription

Groq bietet auch schnelle Whisper-basierte Audio-Transkription. Wenn es als
Media-Understanding-Provider konfiguriert ist, verwendet OpenClaw Groqs
Modell `whisper-large-v3-turbo`, um Sprachnachrichten über die gemeinsame Oberfläche `tools.media.audio`
zu transkribieren.

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
    |----------|-------|
    | Gemeinsamer Konfigurationspfad | `tools.media.audio` |
    | Standard-Base-URL   | `https://api.groq.com/openai/v1` |
    | Standardmodell      | `whisper-large-v3-turbo` |
    | API-Endpunkt       | OpenAI-kompatibel `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway als Daemon läuft (`launchd`/`systemd`), stellen Sie sicher, dass `GROQ_API_KEY` für
    diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für von Daemons verwaltete
    Gateway-Prozesse nicht sichtbar. Verwenden Sie `~/.openclaw/.env` oder die Konfiguration `env.shellEnv` für
    dauerhafte Verfügbarkeit.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
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
