---
read_when:
    - Sie möchten Hugging Face Inference mit OpenClaw verwenden
    - Sie benötigen die HF-Token-Umgebungsvariable oder die Authentifizierungswahl für die CLI
summary: Einrichtung von Hugging Face Inference (Authentifizierung + Modellauswahl)
title: Hugging Face (Inference)
x-i18n:
    generated_at: "2026-04-05T12:53:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 692d2caffbaf991670260da393c67ae7e6349b9e1e3ed5cb9a514f8a77192e86
    source_path: providers/huggingface.md
    workflow: 15
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) bieten OpenAI-kompatible Chat-Completions über eine einzige Router-API. Sie erhalten mit einem einzigen Token Zugriff auf viele Modelle (DeepSeek, Llama und mehr). OpenClaw verwendet den **OpenAI-kompatiblen Endpunkt** (nur Chat-Completions); für Text-zu-Bild, Embeddings oder Sprache verwenden Sie die [HF Inference-Clients](https://huggingface.co/docs/api-inference/quicktour) direkt.

- Provider: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN` (feingranulares Token mit **Make calls to Inference Providers**)
- API: OpenAI-kompatibel (`https://router.huggingface.co/v1`)
- Abrechnung: Ein einzelnes HF-Token; die [Preisgestaltung](https://huggingface.co/docs/inference-providers/pricing) folgt den Provider-Tarifen mit einer kostenlosen Stufe.

## Schnellstart

1. Erstellen Sie unter [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) ein feingranulares Token mit der Berechtigung **Make calls to Inference Providers**.
2. Führen Sie das Onboarding aus, wählen Sie im Provider-Dropdown **Hugging Face** aus und geben Sie dann auf Aufforderung Ihren API-Schlüssel ein:

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. Wählen Sie im Dropdown **Default Hugging Face model** das gewünschte Modell aus (die Liste wird aus der Inference API geladen, wenn Sie ein gültiges Token haben; andernfalls wird eine integrierte Liste angezeigt). Ihre Auswahl wird als Standardmodell gespeichert.
4. Sie können das Standardmodell auch später in der Konfiguration festlegen oder ändern:

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## Nicht-interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Dadurch wird `huggingface/deepseek-ai/DeepSeek-R1` als Standardmodell festgelegt.

## Hinweis zur Umgebung

Wenn das Gateway als Daemon ausgeführt wird (`launchd`/`systemd`), stellen Sie sicher, dass `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`
für diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).

## Modellerkennung und Onboarding-Dropdown

OpenClaw erkennt Modelle durch direkten Aufruf des **Inference-Endpunkts**:

```bash
GET https://router.huggingface.co/v1/models
```

(Optional: Senden Sie `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` oder `$HF_TOKEN` für die vollständige Liste; einige Endpunkte geben ohne Authentifizierung nur eine Teilmenge zurück.) Die Antwort ist im OpenAI-Stil gehalten: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

Wenn Sie einen Hugging Face-API-Schlüssel konfigurieren (über Onboarding, `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`), verwendet OpenClaw dieses GET, um verfügbare Chat-Completion-Modelle zu erkennen. Während der **interaktiven Einrichtung** sehen Sie nach Eingabe Ihres Tokens ein Dropdown **Default Hugging Face model**, das mit dieser Liste gefüllt wird (oder mit dem integrierten Katalog, falls die Anfrage fehlschlägt). Zur Laufzeit (z. B. beim Gateway-Start) ruft OpenClaw, wenn ein Schlüssel vorhanden ist, erneut **GET** `https://router.huggingface.co/v1/models` auf, um den Katalog zu aktualisieren. Die Liste wird mit einem integrierten Katalog zusammengeführt (für Metadaten wie Kontextfenster und Kosten). Wenn die Anfrage fehlschlägt oder kein Schlüssel gesetzt ist, wird nur der integrierte Katalog verwendet.

## Modellnamen und bearbeitbare Optionen

- **Name aus der API:** Der Anzeigename des Modells wird aus **GET /v1/models** **übernommen**, wenn die API `name`, `title` oder `display_name` zurückgibt; andernfalls wird er aus der Modell-ID abgeleitet (z. B. `deepseek-ai/DeepSeek-R1` → „DeepSeek R1“).
- **Anzeigenamen überschreiben:** Sie können pro Modell in der Konfiguration ein benutzerdefiniertes Label setzen, damit es in der CLI und UI so erscheint, wie Sie es möchten:

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (schnell)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (günstig)" },
      },
    },
  },
}
```

- **Richtlinien-Suffixe:** Die gebündelte Hugging Face-Dokumentation und die Hilfsfunktionen von OpenClaw behandeln derzeit diese beiden Suffixe als integrierte Richtlinienvarianten:
  - **`:fastest`** — höchster Durchsatz.
  - **`:cheapest`** — niedrigste Kosten pro ausgegebenem Token.

  Sie können diese als separate Einträge in `models.providers.huggingface.models` hinzufügen oder `model.primary` mit dem Suffix festlegen. Sie können Ihre Standardreihenfolge für Provider auch in den [Inference Provider-Einstellungen](https://hf.co/settings/inference-providers) festlegen (kein Suffix = diese Reihenfolge verwenden).

- **Konfigurationszusammenführung:** Bestehende Einträge in `models.providers.huggingface.models` (z. B. in `models.json`) bleiben beim Zusammenführen der Konfiguration erhalten. Daher bleiben alle benutzerdefinierten `name`-, `alias`- oder Modelloptionen erhalten, die Sie dort festlegen.

## Modell-IDs und Konfigurationsbeispiele

Modellreferenzen verwenden das Format `huggingface/<org>/<model>` (IDs im Hub-Stil). Die folgende Liste stammt aus **GET** `https://router.huggingface.co/v1/models`; Ihr Katalog kann weitere enthalten.

**Beispiel-IDs (vom Inference-Endpunkt):**

| Modell                 | Ref (mit Präfix `huggingface/`)    |
| ---------------------- | ---------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`          |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`        |
| Qwen3 8B               | `Qwen/Qwen3-8B`                    |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`         |
| Qwen3 32B              | `Qwen/Qwen3-32B`                   |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct` |
| GPT-OSS 120B           | `openai/gpt-oss-120b`              |
| GLM 4.7                | `zai-org/GLM-4.7`                  |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`             |

Sie können `:fastest` oder `:cheapest` an die Modell-ID anhängen. Legen Sie Ihre Standardreihenfolge in den [Inference Provider-Einstellungen](https://hf.co/settings/inference-providers) fest; siehe [Inference Providers](https://huggingface.co/docs/inference-providers) und **GET** `https://router.huggingface.co/v1/models` für die vollständige Liste.

### Vollständige Konfigurationsbeispiele

**Primäres DeepSeek R1 mit Qwen als Fallback:**

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

**Qwen als Standard, mit Varianten `:cheapest` und `:fastest`:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen3-8B" },
      models: {
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (günstigste)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (schnellste)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS mit Aliasen:**

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

**Mehrere Qwen- und DeepSeek-Modelle mit Richtlinien-Suffixen:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (günstig)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (schnell)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```
