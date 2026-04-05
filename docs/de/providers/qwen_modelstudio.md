---
x-i18n:
    generated_at: "2026-04-05T12:53:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1066a1d0acebe4ae3500d18c21f7de07f43b9766daf3d13b098936734e9e7a2b
    source_path: providers/qwen_modelstudio.md
    workflow: 15
---

title: "Qwen / Model Studio"
summary: "Endpunktdetails für den gebündelten `qwen`-Provider und seine ältere `modelstudio`-Kompatibilitätsoberfläche"
read_when:

- Du möchtest Details auf Endpunktebene für Qwen Cloud / Alibaba DashScope
- Du benötigst die Geschichte der Env-Var-Kompatibilität für den `qwen`-Provider
- Du möchtest den Endpunkt Standard (Pay-as-you-go) oder Coding Plan verwenden

---

# Qwen / Model Studio (Alibaba Cloud)

Diese Seite dokumentiert die Endpunktzuordnung hinter dem gebündelten `qwen`-Provider von OpenClaw. Der Provider hält Provider-IDs, Auth-Choice-IDs und Modell-Refs von `modelstudio` als Kompatibilitäts-Aliasse funktionsfähig, während `qwen` zur kanonischen Oberfläche wird.

<Info>

Wenn du **`qwen3.6-plus`** benötigst, bevorzuge **Standard (Pay-as-you-go)**. Die Verfügbarkeit im Coding Plan kann hinter dem öffentlichen Model Studio-Katalog zurückbleiben, und die Coding-Plan-API kann ein Modell ablehnen, bis es in der Liste der von deinem Plan unterstützten Modelle erscheint.

</Info>

- Provider: `qwen` (älterer Alias: `modelstudio`)
- Auth: `QWEN_API_KEY`
- Ebenfalls akzeptiert: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API: OpenAI-kompatibel

## Schnellstart

### Standard (Pay-as-you-go)

```bash
# China endpoint
openclaw onboard --auth-choice qwen-standard-api-key-cn

# Global/Intl endpoint
openclaw onboard --auth-choice qwen-standard-api-key
```

### Coding Plan (Abonnement)

```bash
# China endpoint
openclaw onboard --auth-choice qwen-api-key-cn

# Global/Intl endpoint
openclaw onboard --auth-choice qwen-api-key
```

Ältere `modelstudio-*`-Auth-Choice-IDs funktionieren weiterhin als Kompatibilitäts-Aliasse, aber die kanonischen Onboarding-IDs sind die oben gezeigten `qwen-*`-Choices.

Lege nach dem Onboarding ein Standardmodell fest:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Plantypen und Endpunkte

| Plan                       | Region | Auth-Choice               | Endpunkt                                        |
| -------------------------- | ------ | ------------------------- | ------------------------------------------------ |
| Standard (Pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (Pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (Abonnement)   | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (Abonnement)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Der Provider wählt den Endpunkt automatisch anhand deiner Auth-Choice aus. Kanonische Choices verwenden die Familie `qwen-*`; `modelstudio-*` bleibt nur für Kompatibilität bestehen. Du kannst ihn mit einer benutzerdefinierten `baseUrl` in der Konfiguration überschreiben.

Native Model-Studio-Endpunkte kündigen Streaming-Usage-Kompatibilität auf dem gemeinsamen Transport `openai-completions` an. OpenClaw richtet sich jetzt nach Endpunkt-Fähigkeiten, sodass DashScope-kompatible benutzerdefinierte Provider-IDs, die auf dieselben nativen Hosts zeigen, dasselbe Streaming-Usage-Verhalten übernehmen, statt speziell die integrierte Provider-ID `qwen` zu erfordern.

## API-Key abrufen

- **Schlüssel verwalten**: [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **Dokumentation**: [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## Integrierter Katalog

OpenClaw liefert derzeit diesen gebündelten Qwen-Katalog aus:

| Modell-Ref                  | Eingabe     | Kontext   | Hinweise                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | Text, Bild  | 1,000,000 | Standardmodell                                     |
| `qwen/qwen3.6-plus`         | Text, Bild  | 1,000,000 | Bevorzuge Standard-Endpunkte, wenn du dieses Modell benötigst |
| `qwen/qwen3-max-2026-01-23` | Text        | 262,144   | Qwen-Max-Linie                                     |
| `qwen/qwen3-coder-next`     | Text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | Text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | Text        | 1,000,000 | Reasoning aktiviert                                |
| `qwen/glm-5`                | Text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | Text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | Text, Bild  | 262,144   | Moonshot AI über Alibaba                           |

Die Verfügbarkeit kann weiterhin je nach Endpunkt und Abrechnungsplan variieren, auch wenn ein Modell im gebündelten Katalog vorhanden ist.

Die native Streaming-Kompatibilität für Usage gilt sowohl für die Coding-Plan-Hosts als auch für die Standard-DashScope-kompatiblen Hosts:

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Verfügbarkeit von Qwen 3.6 Plus

`qwen3.6-plus` ist auf den Model-Studio-Endpunkten Standard (Pay-as-you-go) verfügbar:

- China: `dashscope.aliyuncs.com/compatible-mode/v1`
- Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

Wenn die Endpunkte des Coding Plan für `qwen3.6-plus` einen Fehler „unsupported model“ zurückgeben, wechsle statt des Endpunkt-/Schlüsselpaars des Coding Plan zu Standard (Pay-as-you-go).

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (launchd/systemd), stelle sicher, dass
`QWEN_API_KEY` diesem Prozess zur Verfügung steht (zum Beispiel in
`~/.openclaw/.env` oder über `env.shellEnv`).
