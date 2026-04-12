---
read_when:
    - Sie möchten Together AI mit OpenClaw verwenden
    - Sie benötigen die API-Key-Env-Variable oder die CLI-Auth-Auswahl
summary: Einrichtung von Together AI (Authentifizierung + Modellauswahl)
title: Together AI
x-i18n:
    generated_at: "2026-04-12T23:33:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33531a1646443ac2e46ee1fbfbb60ec71093611b022618106e8e5435641680ac
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) bietet Zugriff auf führende Open-Source-
Modelle, darunter Llama, DeepSeek, Kimi und weitere, über eine einheitliche API.

| Eigenschaft | Wert                          |
| ----------- | ----------------------------- |
| Provider    | `together`                    |
| Auth        | `TOGETHER_API_KEY`            |
| API         | OpenAI-kompatibel             |
| Base URL    | `https://api.together.xyz/v1` |

## Erste Schritte

<Steps>
  <Step title="Einen API-Schlüssel erstellen">
    Erstellen Sie einen API-Schlüssel unter
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Ein Standardmodell festlegen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
Die Onboarding-Voreinstellung setzt `together/moonshotai/Kimi-K2.5` als Standardmodell.
</Note>

## Integrierter Katalog

OpenClaw enthält diesen gebündelten Together-Katalog:

| Modell-Ref                                                   | Name                                   | Eingabe     | Kontext    | Hinweise                         |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | Text, Bild  | 262,144    | Standardmodell; Reasoning aktiviert |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | Text        | 202,752    | Allzweck-Textmodell              |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | Text        | 131,072    | Schnelles Instruct-Modell        |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | Text, Bild  | 10,000,000 | Multimodal                       |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | Text, Bild  | 20,000,000 | Multimodal                       |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | Text        | 131,072    | Allgemeines Textmodell           |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | Text        | 131,072    | Reasoning-Modell                 |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | Text        | 262,144    | Sekundäres Kimi-Textmodell       |

## Videogenerierung

Das gebündelte `together` Plugin registriert außerdem Videogenerierung über das gemeinsame
Tool `video_generate`.

| Eigenschaft          | Wert                                  |
| -------------------- | ------------------------------------- |
| Standard-Videomodell | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| Modi                 | Text-zu-Video, Einzelbild-Referenz    |
| Unterstützte Parameter | `aspectRatio`, `resolution`         |

So verwenden Sie Together als Standard-Provider für Video:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
Siehe [Videogenerierung](/de/tools/video-generation) für die gemeinsamen Tool-Parameter,
Providerauswahl und das Failover-Verhalten.
</Tip>

<AccordionGroup>
  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway als Daemon läuft (`launchd`/`systemd`), stellen Sie sicher, dass
    `TOGETHER_API_KEY` für diesen Prozess verfügbar ist (zum Beispiel in
    `~/.openclaw/.env` oder über `env.shellEnv`).

    <Warning>
    Schlüssel, die nur in Ihrer interaktiven Shell gesetzt sind, sind für von Daemons verwaltete
    Gateway-Prozesse nicht sichtbar. Verwenden Sie `~/.openclaw/.env` oder die Konfiguration `env.shellEnv` für
    dauerhafte Verfügbarkeit.
    </Warning>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Prüfen Sie, ob Ihr Schlüssel funktioniert: `openclaw models list --provider together`
    - Wenn Modelle nicht angezeigt werden, prüfen Sie, ob der API-Schlüssel in der richtigen
      Umgebung für Ihren Gateway-Prozess gesetzt ist.
    - Modell-Refs verwenden die Form `together/<model-id>`.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider-Regeln, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Tool-Parameter für Videogenerierung und Providerauswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider-Einstellungen.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together-AI-Dashboard, API-Dokumentation und Preise.
  </Card>
</CardGroup>
