---
x-i18n:
    generated_at: "2026-04-05T12:53:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 895b701d3a3950ea7482e5e870663ed93e0355e679199ed4622718d588ef18fa
    source_path: providers/qwen.md
    workflow: 15
---

summary: "Qwen Cloud über den gebündelten qwen-Provider von OpenClaw verwenden"
read_when:

- Sie möchten Qwen mit OpenClaw verwenden
- Sie haben zuvor Qwen OAuth verwendet
  title: "Qwen"

---

# Qwen

<Warning>

**Qwen OAuth wurde entfernt.** Die OAuth-Integration der kostenlosen Stufe
(`qwen-portal`), die Endpunkte von `portal.qwen.ai` verwendete, ist nicht mehr verfügbar.
Hintergrundinformationen finden Sie unter [Issue #49557](https://github.com/openclaw/openclaw/issues/49557).

</Warning>

## Empfohlen: Qwen Cloud

OpenClaw behandelt Qwen jetzt als erstklassigen gebündelten Provider mit der kanonischen ID
`qwen`. Der gebündelte Provider zielt auf die Endpunkte Qwen Cloud / Alibaba DashScope und
Coding Plan ab und hält ältere `modelstudio`-IDs als
Kompatibilitätsalias funktionsfähig.

- Provider: `qwen`
- Bevorzugte Umgebungsvariable: `QWEN_API_KEY`
- Ebenfalls aus Kompatibilitätsgründen akzeptiert: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API-Stil: OpenAI-kompatibel

Wenn Sie `qwen3.6-plus` verwenden möchten, bevorzugen Sie den Endpunkt **Standard (pay-as-you-go)**.
Die Unterstützung für Coding Plan kann dem öffentlichen Katalog hinterherhinken.

```bash
# Globaler Coding-Plan-Endpunkt
openclaw onboard --auth-choice qwen-api-key

# Chinesischer Coding-Plan-Endpunkt
openclaw onboard --auth-choice qwen-api-key-cn

# Globaler Standard-Endpunkt (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key

# Chinesischer Standard-Endpunkt (pay-as-you-go)
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

Ältere Auth-Choice-IDs `modelstudio-*` und Modellreferenzen `modelstudio/...` funktionieren weiterhin
als Kompatibilitätsaliase, aber neue Einrichtungsabläufe sollten die kanonischen
Auth-Choice-IDs `qwen-*` und Modellreferenzen `qwen/...` bevorzugen.

Legen Sie nach dem Onboarding ein Standardmodell fest:

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## Fähigkeitsplan

Die Erweiterung `qwen` wird als Anbieter-Heimat für die vollständige Qwen-
Cloud-Oberfläche positioniert, nicht nur für Coding-/Textmodelle.

- Text-/Chatmodelle: jetzt gebündelt
- Tool-Aufrufe, strukturierte Ausgabe, Thinking: vom OpenAI-kompatiblen Transport geerbt
- Bildgenerierung: auf der Ebene des Provider-Plugins geplant
- Bild-/Videoverständnis: jetzt auf dem Standard-Endpunkt gebündelt
- Sprache/Audio: auf der Ebene des Provider-Plugins geplant
- Memory-Embeddings/Reranking: über die Oberfläche des Embedding-Adapters geplant
- Videogenerierung: jetzt über die gemeinsame Fähigkeit zur Videogenerierung gebündelt

## Multimodale Add-ons

Die Erweiterung `qwen` stellt jetzt außerdem Folgendes bereit:

- Videoverständnis über `qwen-vl-max-latest`
- Wan-Videogenerierung über:
  - `wan2.6-t2v` (Standard)
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

Diese multimodalen Oberflächen verwenden die DashScope-Endpunkte **Standard**, nicht die
Endpunkte von Coding Plan.

- Globale/intl. Standard-Basis-URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Chinesische Standard-Basis-URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

Für die Videogenerierung ordnet OpenClaw die konfigurierte Qwen-Region dem passenden
DashScope-AIGC-Host zu, bevor der Job übermittelt wird:

- Global/intl.: `https://dashscope-intl.aliyuncs.com`
- China: `https://dashscope.aliyuncs.com`

Das bedeutet, dass ein normales `models.providers.qwen.baseUrl`, das entweder auf die
Qwen-Hosts von Coding Plan oder Standard zeigt, die Videogenerierung weiterhin auf dem richtigen
regionalen DashScope-Videoendpunkt hält.

Legen Sie für die Videogenerierung ausdrücklich ein Standardmodell fest:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Aktuelle gebündelte Grenzen für die Qwen-Videogenerierung:

- Bis zu **1** Ausgabevideo pro Anfrage
- Bis zu **1** Eingabebild
- Bis zu **4** Eingabevideos
- Bis zu **10 Sekunden** Dauer
- Unterstützt `size`, `aspectRatio`, `resolution`, `audio` und `watermark`

Siehe [Qwen / Model Studio](/providers/qwen_modelstudio) für Details auf Endpunktebene
und Kompatibilitätshinweise.
