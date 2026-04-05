---
read_when:
    - Sie möchten MiniMax-Modelle in OpenClaw verwenden
    - Sie benötigen Hinweise zur Einrichtung von MiniMax
summary: MiniMax-Modelle in OpenClaw verwenden
title: MiniMax
x-i18n:
    generated_at: "2026-04-05T12:53:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 353e1d9ce1b48c90ccaba6cc0109e839c473ca3e65d0c5d8ba744e9011c2bf45
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

Der MiniMax-Provider von OpenClaw verwendet standardmäßig **MiniMax M2.7**.

MiniMax bietet außerdem:

- gebündelte Sprachsynthese über T2A v2
- gebündeltes Bildverständnis über `MiniMax-VL-01`
- gebündelte `web_search` über die MiniMax Coding Plan-Such-API

Aufteilung der Provider:

- `minimax`: Text-Provider mit API-Schlüssel sowie gebündelte Bilderzeugung, Bildverständnis, Sprache und Websuche
- `minimax-portal`: Text-Provider mit OAuth sowie gebündelte Bilderzeugung und Bildverständnis

## Modellübersicht

- `MiniMax-M2.7`: gehostetes Standard-Reasoning-Modell.
- `MiniMax-M2.7-highspeed`: schnellere M2.7-Reasoning-Stufe.
- `image-01`: Modell für Bilderzeugung (Generierung und Bild-zu-Bild-Bearbeitung).

## Bilderzeugung

Das MiniMax-Plugin registriert das Modell `image-01` für das Tool `image_generate`. Es unterstützt:

- **Text-zu-Bild-Generierung** mit Steuerung des Seitenverhältnisses.
- **Bild-zu-Bild-Bearbeitung** (Subjektreferenz) mit Steuerung des Seitenverhältnisses.
- Bis zu **9 Ausgabebilder** pro Anfrage.
- Bis zu **1 Referenzbild** pro Bearbeitungsanfrage.
- Unterstützte Seitenverhältnisse: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`.

Um MiniMax für die Bilderzeugung zu verwenden, legen Sie es als Provider für die Bilderzeugung fest:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Das Plugin verwendet denselben `MINIMAX_API_KEY` oder dieselbe OAuth-Authentifizierung wie die Textmodelle. Wenn MiniMax bereits eingerichtet ist, ist keine zusätzliche Konfiguration erforderlich.

Sowohl `minimax` als auch `minimax-portal` registrieren `image_generate` mit demselben
Modell `image-01`. Setups mit API-Schlüssel verwenden `MINIMAX_API_KEY`; OAuth-Setups können
stattdessen den gebündelten Auth-Pfad `minimax-portal` verwenden.

Wenn Onboarding oder die Einrichtung mit API-Schlüssel explizite `models.providers.minimax`-
Einträge schreibt, materialisiert OpenClaw `MiniMax-M2.7` und
`MiniMax-M2.7-highspeed` mit `input: ["text", "image"]`.

Der integrierte gebündelte MiniMax-Textkatalog selbst bleibt Metadaten nur für Text, bis diese explizite Provider-Konfiguration existiert. Das Bildverständnis wird separat über den plugin-eigenen Medien-Provider `MiniMax-VL-01` bereitgestellt.

## Bildverständnis

Das MiniMax-Plugin registriert Bildverständnis getrennt vom Textkatalog:

- `minimax`: Standard-Bildmodell `MiniMax-VL-01`
- `minimax-portal`: Standard-Bildmodell `MiniMax-VL-01`

Deshalb kann automatisches Medienrouting das Bildverständnis von MiniMax verwenden, auch wenn der gebündelte Text-Provider-Katalog die M2.7-Chat-Referenzen weiterhin nur als Text-Metadaten anzeigt.

## Websuche

Das MiniMax-Plugin registriert außerdem `web_search` über die MiniMax Coding Plan-
Such-API.

- Provider-ID: `minimax`
- Strukturierte Ergebnisse: Titel, URLs, Snippets, verwandte Suchanfragen
- Bevorzugte Umgebungsvariable: `MINIMAX_CODE_PLAN_KEY`
- Akzeptierter Env-Alias: `MINIMAX_CODING_API_KEY`
- Kompatibilitäts-Fallback: `MINIMAX_API_KEY`, wenn er bereits auf ein Coding-Plan-Token verweist
- Wiederverwendung der Region: `plugins.entries.minimax.config.webSearch.region`, dann `MINIMAX_API_HOST`, dann MiniMax-Provider-Basis-URLs
- Die Suche bleibt auf der Provider-ID `minimax`; ein OAuth-CN-/globales Setup kann die Region weiterhin indirekt über `models.providers.minimax-portal.baseUrl` steuern

Die Konfiguration befindet sich unter `plugins.entries.minimax.config.webSearch.*`.
Siehe [MiniMax Search](/tools/minimax-search).

## Ein Setup wählen

### MiniMax OAuth (Coding Plan) - empfohlen

**Am besten geeignet für:** schnelle Einrichtung mit MiniMax Coding Plan über OAuth, kein API-Schlüssel erforderlich.

Authentifizieren Sie sich mit der expliziten regionalen OAuth-Option:

```bash
openclaw onboard --auth-choice minimax-global-oauth
# oder
openclaw onboard --auth-choice minimax-cn-oauth
```

Zuordnung der Optionen:

- `minimax-global-oauth`: internationale Benutzer (`api.minimax.io`)
- `minimax-cn-oauth`: Benutzer in China (`api.minimaxi.com`)

Details finden Sie in der README des MiniMax-Plugin-Pakets im OpenClaw-Repository.

### MiniMax M2.7 (API-Schlüssel)

**Am besten geeignet für:** gehostetes MiniMax mit Anthropic-kompatibler API.

Über die CLI konfigurieren:

- Interaktives Onboarding:

```bash
openclaw onboard --auth-choice minimax-global-api
# oder
openclaw onboard --auth-choice minimax-cn-api
```

- `minimax-global-api`: internationale Benutzer (`api.minimax.io`)
- `minimax-cn-api`: Benutzer in China (`api.minimaxi.com`)

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
          {
            id: "MiniMax-M2.7-highspeed",
            name: "MiniMax M2.7 Highspeed",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Im Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw jetzt standardmäßig das MiniMax-
Thinking, sofern Sie `thinking` nicht explizit selbst setzen. Der Streaming-
Endpunkt von MiniMax gibt `reasoning_content` in Delta-Chunks im OpenAI-Stil
anstelle nativer Anthropic-Thinking-Blöcke aus, was internes Reasoning in der sichtbaren Ausgabe
offenlegen kann, wenn es implizit aktiviert bleibt.

### MiniMax M2.7 als Fallback (Beispiel)

**Am besten geeignet für:** Ihr stärkstes Modell der neuesten Generation als primäres Modell beibehalten und bei Fehlern auf MiniMax M2.7 zurückfallen.
Das folgende Beispiel verwendet Opus als konkretes primäres Modell; tauschen Sie es gegen Ihr bevorzugtes primäres Modell der neuesten Generation aus.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

## Über `openclaw configure` konfigurieren

Verwenden Sie den interaktiven Konfigurationsassistenten, um MiniMax festzulegen, ohne JSON zu bearbeiten:

1. Führen Sie `openclaw configure` aus.
2. Wählen Sie **Model/auth**.
3. Wählen Sie eine **MiniMax**-Authentifizierungsoption.
4. Wählen Sie Ihr Standardmodell, wenn Sie dazu aufgefordert werden.

Aktuelle MiniMax-Authentifizierungsoptionen im Assistenten/in der CLI:

- `minimax-global-oauth`
- `minimax-cn-oauth`
- `minimax-global-api`
- `minimax-cn-api`

## Konfigurationsoptionen

- `models.providers.minimax.baseUrl`: bevorzugt `https://api.minimax.io/anthropic` (Anthropic-kompatibel); `https://api.minimax.io/v1` ist optional für OpenAI-kompatible Nutzlasten.
- `models.providers.minimax.api`: bevorzugt `anthropic-messages`; `openai-completions` ist optional für OpenAI-kompatible Nutzlasten.
- `models.providers.minimax.apiKey`: MiniMax-API-Schlüssel (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: definieren Sie `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models`: Alias-Namen für Modelle, die Sie in der Allowlist haben möchten.
- `models.mode`: behalten Sie `merge` bei, wenn Sie MiniMax zusätzlich zu integrierten Providern hinzufügen möchten.

## Hinweise

- Modellreferenzen folgen dem Auth-Pfad:
  - Setup mit API-Schlüssel: `minimax/<model>`
  - Setup mit OAuth: `minimax-portal/<model>`
- Standard-Chatmodell: `MiniMax-M2.7`
- Alternatives Chatmodell: `MiniMax-M2.7-highspeed`
- Bei `api: "anthropic-messages"` injiziert OpenClaw
  `thinking: { type: "disabled" }`, sofern Thinking nicht bereits explizit in
  Parametern/Konfiguration gesetzt ist.
- `/fast on` oder `params.fastMode: true` schreibt `MiniMax-M2.7` im Anthropic-kompatiblen Streaming-Pfad zu
  `MiniMax-M2.7-highspeed` um.
- Onboarding und direkte Einrichtung mit API-Schlüssel schreiben explizite Modelldefinitionen mit
  `input: ["text", "image"]` für beide M2.7-Varianten
- Der gebündelte Provider-Katalog stellt die Chat-Referenzen derzeit als reine Text-Metadaten dar,
  bis eine explizite MiniMax-Provider-Konfiguration existiert
- Coding Plan-Nutzungs-API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (erfordert einen Coding-Plan-Schlüssel).
- OpenClaw normalisiert die Coding-Plan-Nutzung von MiniMax auf dieselbe Anzeige „% left“, die
  auch bei anderen Providern verwendet wird. Die rohen Felder `usage_percent` / `usagePercent` von MiniMax
  geben das verbleibende Kontingent an, nicht das verbrauchte Kontingent, daher invertiert OpenClaw sie.
  Zählungsbasierte Felder haben Vorrang, wenn sie vorhanden sind. Wenn die API `model_remains` zurückgibt,
  bevorzugt OpenClaw den Eintrag des Chatmodells, leitet bei Bedarf die Fensterbeschriftung aus
  `start_time` / `end_time` ab und schließt den ausgewählten Modellnamen in die Plan-Bezeichnung ein,
  damit sich Coding-Plan-Fenster leichter unterscheiden lassen.
- Nutzungssnapshots behandeln `minimax`, `minimax-cn` und `minimax-portal` als dieselbe
  MiniMax-Kontingentoberfläche und bevorzugen gespeichertes MiniMax OAuth, bevor auf Env-Variablen für Coding-Plan-Schlüssel zurückgegriffen wird.
- Aktualisieren Sie bei Bedarf die Preiswerte in `models.json`, wenn Sie eine exakte Kostenverfolgung benötigen.
- Empfehlungslink für MiniMax Coding Plan (10 % Rabatt): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Siehe [/concepts/model-providers](/de/concepts/model-providers) für Provider-Regeln.
- Verwenden Sie `openclaw models list`, um die aktuelle Provider-ID zu bestätigen, und wechseln Sie dann mit
  `openclaw models set minimax/MiniMax-M2.7` oder
  `openclaw models set minimax-portal/MiniMax-M2.7`.

## Fehlerbehebung

### "Unknown model: minimax/MiniMax-M2.7"

Das bedeutet normalerweise, dass der **MiniMax-Provider nicht konfiguriert ist** (kein passender
Provider-Eintrag und kein gefundener MiniMax-Auth-Profilschlüssel/Env-Schlüssel). Eine Korrektur für diese
Erkennung ist in **2026.1.12** enthalten. Beheben Sie das Problem wie folgt:

- Aktualisieren Sie auf **2026.1.12** (oder führen Sie den Quellcode aus `main` aus) und starten Sie dann das Gateway neu.
- Führen Sie `openclaw configure` aus und wählen Sie eine **MiniMax**-Authentifizierungsoption, oder
- fügen Sie den passenden Block `models.providers.minimax` oder
  `models.providers.minimax-portal` manuell hinzu, oder
- setzen Sie `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` oder ein MiniMax-Auth-Profil,
  damit der passende Provider injiziert werden kann.

Stellen Sie sicher, dass die Modell-ID **groß-/kleinschreibungssensitiv** ist:

- Pfad mit API-Schlüssel: `minimax/MiniMax-M2.7` oder `minimax/MiniMax-M2.7-highspeed`
- Pfad mit OAuth: `minimax-portal/MiniMax-M2.7` oder
  `minimax-portal/MiniMax-M2.7-highspeed`

Prüfen Sie dann erneut mit:

```bash
openclaw models list
```
