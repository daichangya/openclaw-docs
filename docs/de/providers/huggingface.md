---
read_when:
    - Sie möchten Hugging Face Inference mit OpenClaw verwenden
    - Sie benötigen die HF-Token-Umgebungsvariable oder die CLI-Authentifizierungsoption
summary: Einrichtung von Hugging Face Inference (Authentifizierung + Modellauswahl)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-12T23:31:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7787fce1acfe81adb5380ab1c7441d661d03c574da07149c037d3b6ba3c8e52a
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) bieten OpenAI-kompatible Chat Completions über eine einzelne Router-API. Sie erhalten mit einem Token Zugriff auf viele Modelle (DeepSeek, Llama und mehr). OpenClaw verwendet den **OpenAI-kompatiblen Endpunkt** (nur Chat Completions); für Text-zu-Bild, Embeddings oder Sprache verwenden Sie direkt die [HF Inference-Clients](https://huggingface.co/docs/api-inference/quicktour).

- Provider: `huggingface`
- Authentifizierung: `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN` (feingranularer Token mit **Make calls to Inference Providers**)
- API: OpenAI-kompatibel (`https://router.huggingface.co/v1`)
- Abrechnung: Ein einzelner HF-Token; die [Preisgestaltung](https://huggingface.co/docs/inference-providers/pricing) folgt den Provider-Tarifen mit einer kostenlosen Stufe.

## Erste Schritte

<Steps>
  <Step title="Create a fine-grained token">
    Gehen Sie zu [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) und erstellen Sie einen neuen feingranularen Token.

    <Warning>
    Der Token muss die Berechtigung **Make calls to Inference Providers** aktiviert haben, sonst werden API-Anfragen abgelehnt.
    </Warning>

  </Step>
  <Step title="Run onboarding">
    Wählen Sie **Hugging Face** im Provider-Dropdown aus und geben Sie dann Ihren API key ein, wenn Sie dazu aufgefordert werden:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Select a default model">
    Wählen Sie im Dropdown **Default Hugging Face model** das gewünschte Modell aus. Die Liste wird aus der Inference API geladen, wenn Sie einen gültigen Token haben; andernfalls wird eine integrierte Liste angezeigt. Ihre Auswahl wird als Standardmodell gespeichert.

    Sie können das Standardmodell später auch in der Konfiguration setzen oder ändern:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Nicht interaktive Einrichtung

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Dadurch wird `huggingface/deepseek-ai/DeepSeek-R1` als Standardmodell gesetzt.

## Modell-IDs

Modell-Referenzen verwenden die Form `huggingface/<org>/<model>` (Hub-ähnliche IDs). Die folgende Liste stammt von **GET** `https://router.huggingface.co/v1/models`; Ihr Katalog kann mehr enthalten.

| Modell                 | Ref (mit Präfix `huggingface/`)     |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

<Tip>
Sie können an jede Modell-ID `:fastest` oder `:cheapest` anhängen. Legen Sie Ihre Standardreihenfolge in den [Inference Provider settings](https://hf.co/settings/inference-providers) fest; die vollständige Liste finden Sie unter [Inference Providers](https://huggingface.co/docs/inference-providers) und **GET** `https://router.huggingface.co/v1/models`.
</Tip>

## Erweiterte Details

<AccordionGroup>
  <Accordion title="Modellerkennung und Onboarding-Dropdown">
    OpenClaw erkennt Modelle, indem es den **Inference-Endpunkt direkt** aufruft:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (Optional: Senden Sie `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` oder `$HF_TOKEN` für die vollständige Liste; einige Endpunkte geben ohne Authentifizierung nur eine Teilmenge zurück.) Die Antwort ist im OpenAI-Stil `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Wenn Sie einen Hugging Face API key konfigurieren (über Onboarding, `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`), verwendet OpenClaw dieses GET, um verfügbare Chat-Completion-Modelle zu erkennen. Während der **interaktiven Einrichtung** sehen Sie nach Eingabe Ihres Tokens ein Dropdown **Default Hugging Face model**, das mit dieser Liste gefüllt wird (oder mit dem integrierten Katalog, falls die Anfrage fehlschlägt). Zur Laufzeit (z. B. beim Gateway-Start) ruft OpenClaw erneut **GET** `https://router.huggingface.co/v1/models` auf, um den Katalog zu aktualisieren, wenn ein Schlüssel vorhanden ist. Die Liste wird mit einem integrierten Katalog zusammengeführt (für Metadaten wie Kontextfenster und Kosten). Falls die Anfrage fehlschlägt oder kein Schlüssel gesetzt ist, wird nur der integrierte Katalog verwendet.

  </Accordion>

  <Accordion title="Modellnamen, Aliase und Richtlinien-Suffixe">
    - **Name aus der API:** Der Anzeigename des Modells wird aus **GET /v1/models** **übernommen**, wenn die API `name`, `title` oder `display_name` zurückgibt; andernfalls wird er aus der Modell-ID abgeleitet (z. B. wird `deepseek-ai/DeepSeek-R1` zu „DeepSeek R1“).
    - **Anzeigenamen überschreiben:** Sie können pro Modell in der Konfiguration ein benutzerdefiniertes Label setzen, damit es in CLI und UI so erscheint, wie Sie es möchten:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **Richtlinien-Suffixe:** OpenClaws gebündelte Hugging-Face-Dokumentation und Hilfsfunktionen behandeln derzeit diese beiden Suffixe als integrierte Richtlinienvarianten:
      - **`:fastest`** — höchster Durchsatz.
      - **`:cheapest`** — niedrigste Kosten pro Ausgabetoken.

      Sie können diese als separate Einträge in `models.providers.huggingface.models` hinzufügen oder `model.primary` mit dem Suffix setzen. Sie können Ihre Standard-Provider-Reihenfolge auch in den [Inference Provider settings](https://hf.co/settings/inference-providers) festlegen (ohne Suffix = diese Reihenfolge verwenden).

    - **Zusammenführen der Konfiguration:** Vorhandene Einträge in `models.providers.huggingface.models` (z. B. in `models.json`) bleiben beim Zusammenführen der Konfiguration erhalten. Daher bleiben alle benutzerdefinierten `name`, `alias` oder Modelloptionen, die Sie dort festlegen, erhalten.

  </Accordion>

  <Accordion title="Umgebungs- und Daemon-Einrichtung">
    Wenn das Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher, dass `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN` für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).

    <Note>
    OpenClaw akzeptiert sowohl `HUGGINGFACE_HUB_TOKEN` als auch `HF_TOKEN` als Umgebungsvariablen-Aliase. Beide funktionieren; wenn beide gesetzt sind, hat `HUGGINGFACE_HUB_TOKEN` Vorrang.
    </Note>

  </Accordion>

  <Accordion title="Konfiguration: DeepSeek R1 mit Qwen-Fallback">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfiguration: Qwen mit günstigsten und schnellsten Varianten">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfiguration: DeepSeek + Llama + GPT-OSS mit Aliasen">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Konfiguration: Mehrere Qwen- und DeepSeek-Modelle mit Richtlinien-Suffixen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Model providers" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modell-Referenzen und Failover-Verhalten.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    Wie Modelle ausgewählt und konfiguriert werden.
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    Offizielle Dokumentation zu Hugging Face Inference Providers.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
