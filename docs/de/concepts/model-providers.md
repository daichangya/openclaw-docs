---
read_when:
    - Sie benötigen eine Einrichtungsreferenz für Modelle nach Provider
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modell-Provider
summary: Überblick über Modell-Provider mit Beispielkonfigurationen und CLI-Abläufen
title: Modell-Provider
x-i18n:
    generated_at: "2026-04-05T12:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5d8f56a2a5319de03f7b86e7b19b9a89e7023f757930b5b5949568f680352a3a
    source_path: concepts/model-providers.md
    workflow: 15
---

# Modell-Provider

Diese Seite behandelt **LLM-/Modell-Provider** (nicht Chat-Kanäle wie WhatsApp/Telegram).
Regeln zur Modellauswahl finden Sie unter [/concepts/models](/concepts/models).

## Kurzregeln

- Modell-Refs verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
- Wenn Sie `agents.defaults.models` setzen, wird es zur Allowlist.
- CLI-Helfer: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Fallback-Runtime-Regeln, Cooldown-Probes und Persistenz von Sitzungsüberschreibungen sind
  in [/concepts/model-failover](/concepts/model-failover) dokumentiert.
- `models.providers.*.models[].contextWindow` sind native Modellmetadaten;
  `models.providers.*.models[].contextTokens` ist die effektive Runtime-Obergrenze.
- Provider-Plugins können Modellkataloge über `registerProvider({ catalog })` einspeisen;
  OpenClaw führt diese Ausgabe in `models.providers` zusammen, bevor
  `models.json` geschrieben wird.
- Provider-Manifeste können `providerAuthEnvVars` deklarieren, damit generische umgebungsbasierte
  Auth-Probes die Plugin-Runtime nicht laden müssen. Die verbleibende Core-Env-Var-
  Zuordnung ist nun nur noch für Nicht-Plugin-/Core-Provider und einige generische Präzedenz-
  Fälle da, etwa Anthropic-Onboarding mit API-Key-zuerst.
- Provider-Plugins können Provider-Runtime-Verhalten auch über
  `normalizeModelId`, `normalizeTransport`, `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`,
  `normalizeResolvedModel`, `contributeResolvedModelCompat`,
  `capabilities`, `normalizeToolSchemas`,
  `inspectToolSchemas`, `resolveReasoningOutputMode`,
  `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`,
  `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`,
  `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`,
  `matchesContextOverflowError`, `classifyFailoverReason`,
  `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` und
  `onModelSelected` besitzen.
- Hinweis: Provider-Runtime-`capabilities` sind gemeinsam genutzte Runner-Metadaten (Provider-
  Familie, Transcript-/Tooling-Besonderheiten, Transport-/Cache-Hinweise). Sie sind nicht dasselbe
  wie das [public capability model](/plugins/architecture#public-capability-model),
  das beschreibt, was ein Plugin registriert (Text-Inferenz, Sprache usw.).

## Plugin-eigenes Provider-Verhalten

Provider-Plugins können nun den Großteil der providerspezifischen Logik besitzen, während OpenClaw
die generische Inferenzschleife beibehält.

Typische Aufteilung:

- `auth[].run` / `auth[].runNonInteractive`: Provider besitzt Onboarding-/Login-
  Abläufe für `openclaw onboard`, `openclaw models auth` und Headless-Setup
- `wizard.setup` / `wizard.modelPicker`: Provider besitzt Auth-Auswahllabels,
  Legacy-Aliasse, Onboarding-Allowlist-Hinweise und Setup-Einträge in Onboarding-/Model-Pickern
- `catalog`: Provider erscheint in `models.providers`
- `normalizeModelId`: Provider normalisiert Legacy-/Preview-Modell-IDs vor
  Lookup oder Kanonisierung
- `normalizeTransport`: Provider normalisiert `api` / `baseUrl` der Transport-Familie
  vor der generischen Modellassemblierung; OpenClaw prüft zuerst den passenden Provider,
  dann andere hook-fähige Provider-Plugins, bis eines den
  Transport tatsächlich ändert
- `normalizeConfig`: Provider normalisiert `models.providers.<id>`-Konfiguration vor
  der Nutzung durch die Runtime; OpenClaw prüft zuerst den passenden Provider, dann andere
  hook-fähige Provider-Plugins, bis eines die Konfiguration tatsächlich ändert. Wenn kein
  Provider-Hook die Konfiguration umschreibt, normalisieren gebündelte Google-Familien-Helfer
  weiterhin unterstützte Google-Provider-Einträge.
- `applyNativeStreamingUsageCompat`: Provider wendet endpoint-gesteuerte native Streaming-Usage-Compat-Umschreibungen für Konfigurations-Provider an
- `resolveConfigApiKey`: Provider löst Env-Marker-Auth für Konfigurations-Provider auf,
  ohne das vollständige Laden der Runtime-Auth zu erzwingen. `amazon-bedrock` besitzt hier
  außerdem einen integrierten AWS-Env-Marker-Resolver, obwohl Bedrock-Runtime-Auth die
  AWS-SDK-Default-Chain verwendet.
- `resolveSyntheticAuth`: Provider kann lokale/selbst gehostete oder andere
  konfigurationsgestützte Auth-Verfügbarkeit bereitstellen, ohne Secrets im Klartext zu persistieren
- `shouldDeferSyntheticProfileAuth`: Provider kann gespeicherte synthetische Profil-
  Platzhalter als niedrigere Priorität als umgebungs-/konfigurationsgestützte Auth markieren
- `resolveDynamicModel`: Provider akzeptiert Modell-IDs, die noch nicht im lokalen
  statischen Katalog vorhanden sind
- `prepareDynamicModel`: Provider benötigt eine Metadatenaktualisierung, bevor die
  dynamische Auflösung erneut versucht wird
- `normalizeResolvedModel`: Provider benötigt Umschreibungen von Transport oder Base URL
- `contributeResolvedModelCompat`: Provider steuert Compat-Flags für seine
  Hersteller-Modelle bei, auch wenn sie über einen anderen kompatiblen Transport eintreffen
- `capabilities`: Provider veröffentlicht Besonderheiten von Transcript/Tooling/Provider-Familie
- `normalizeToolSchemas`: Provider bereinigt Tool-Schemas, bevor der eingebettete
  Runner sie sieht
- `inspectToolSchemas`: Provider zeigt nach der Normalisierung transport-spezifische Schema-Warnungen an
- `resolveReasoningOutputMode`: Provider wählt native vs. getaggte
  Reasoning-Output-Verträge
- `prepareExtraParams`: Provider setzt Standardwerte oder normalisiert Request-Parameter pro Modell
- `createStreamFn`: Provider ersetzt den normalen Stream-Pfad durch einen vollständig
  benutzerdefinierten Transport
- `wrapStreamFn`: Provider wendet Wrapper für Request-Header/Body/Model-Compat an
- `resolveTransportTurnState`: Provider liefert native Transport-
  Header oder Metadaten pro Zug
- `resolveWebSocketSessionPolicy`: Provider liefert native WebSocket-Sitzungs-
  Header oder eine Sitzungs-Cooldown-Richtlinie
- `createEmbeddingProvider`: Provider besitzt Embedding-Verhalten für memory, wenn es
  besser in das Provider-Plugin als in den Core-Embedding-Switchboard gehört
- `formatApiKey`: Provider formatiert gespeicherte Auth-Profile in den von
  Transport erwarteten Runtime-`apiKey`-String
- `refreshOAuth`: Provider besitzt OAuth-Refresh, wenn die gemeinsamen `pi-ai`-
  Refresher nicht ausreichen
- `buildAuthDoctorHint`: Provider fügt Reparaturhinweise an, wenn OAuth-Refresh
  fehlschlägt
- `matchesContextOverflowError`: Provider erkennt providerspezifische
  Context-Window-Overflow-Fehler, die generische Heuristiken übersehen würden
- `classifyFailoverReason`: Provider ordnet providerspezifische rohe Transport-/API-
  Fehler Failover-Gründen wie Rate-Limit oder Überlastung zu
- `isCacheTtlEligible`: Provider entscheidet, welche Upstream-Modell-IDs Prompt-Cache-TTL unterstützen
- `buildMissingAuthMessage`: Provider ersetzt den generischen Auth-Store-Fehler
  durch einen providerspezifischen Wiederherstellungshinweis
- `suppressBuiltInModel`: Provider blendet veraltete Upstream-Zeilen aus und kann einen
  herstellereigenen Fehler für direkte Auflösungsfehler zurückgeben
- `augmentModelCatalog`: Provider hängt synthetische/finale Katalogzeilen nach
  Erkennung und Konfigurationszusammenführung an
- `isBinaryThinking`: Provider besitzt die UX für binäres Thinking an/aus
- `supportsXHighThinking`: Provider aktiviert `xhigh` für ausgewählte Modelle
- `resolveDefaultThinkingLevel`: Provider besitzt die Standard-`/think`-Richtlinie für eine
  Modellfamilie
- `applyConfigDefaults`: Provider wendet providerspezifische globale Standardwerte
  während der Konfigurationsmaterialisierung basierend auf Auth-Modus, Umgebung oder Modellfamilie an
- `isModernModelRef`: Provider besitzt das Matching bevorzugter Live-/Smoke-Modelle
- `prepareRuntimeAuth`: Provider wandelt ein konfiguriertes Credential in ein kurzlebiges Runtime-Token um
- `resolveUsageAuth`: Provider löst Credentials für Verwendung/Quota für `/usage`
  und verwandte Status-/Reporting-Oberflächen auf
- `fetchUsageSnapshot`: Provider besitzt das Abrufen/Parsen des Usage-Endpunkts, während
  der Core weiterhin die Zusammenfassungs-Shell und Formatierung besitzt
- `onModelSelected`: Provider führt Effekte nach der Auswahl aus, etwa
  Telemetrie oder providerspezifische Sitzungsbuchführung

Aktuelle gebündelte Beispiele:

- `anthropic`: Claude-4.6-Forward-Compat-Fallback, Hinweise zur Auth-Reparatur, Abruf von Usage-
  Endpunkten, Cache-TTL-/Provider-Familien-Metadaten und auth-bewusste globale
  Konfigurationsstandardwerte
- `amazon-bedrock`: provider-eigenes Matching von Context-Overflow und
  Failover-Grundklassifizierung für Bedrock-spezifische Throttle-/Not-ready-Fehler sowie
  die gemeinsame Replay-Familie `anthropic-by-model` für Claude-only-Replay-Policy-
  Guards auf Anthropic-Traffic
- `anthropic-vertex`: Claude-only-Replay-Policy-Guards auf Anthropic-Message-
  Traffic
- `openrouter`: Durchreichen von Modell-IDs, Request-Wrapper, Provider-Capability-
  Hinweise, Bereinigung von Gemini-Thought-Signatures auf Proxy-Gemini-Traffic, Proxy-
  Reasoning-Injektion über die Stream-Familie `openrouter-thinking`, Weiterleitung von Routing-
  Metadaten und Cache-TTL-Richtlinie
- `github-copilot`: Onboarding/Device-Login, Forward-Compat-Modell-Fallback,
  Claude-Thinking-Transcript-Hinweise, Runtime-Token-Austausch und Abruf des Usage-Endpunkts
- `openai`: GPT-5.4-Forward-Compat-Fallback, direkte OpenAI-Transport-
  Normalisierung, Codex-bewusste Missing-Auth-Hinweise, Unterdrückung von Spark, synthetische
  OpenAI-/Codex-Katalogzeilen, Thinking-/Live-Modell-Richtlinie, Alias-Normalisierung für Usage-Tokens
  (`input` / `output` und `prompt` / `completion`-Familien), die gemeinsame Stream-Familie
  `openai-responses-defaults` für native OpenAI-/Codex-Wrapper und Metadaten der
  Provider-Familie
- `google` und `google-gemini-cli`: Gemini-3.1-Forward-Compat-Fallback,
  native Gemini-Replay-Validierung, Bootstrap-Replay-Bereinigung, getaggter
  Reasoning-Output-Modus und Modern-Model-Matching; Gemini-CLI-OAuth besitzt außerdem die
  Formatierung von Auth-Profil-Tokens, Parsing von Usage-Tokens und Abruf des
  Quota-Endpunkts für Usage-Oberflächen
- `moonshot`: gemeinsamer Transport, plugin-eigene Normalisierung von Thinking-Payloads
- `kilocode`: gemeinsamer Transport, plugin-eigene Request-Header, Normalisierung von Reasoning-Payloads,
  Bereinigung von Proxy-Gemini-Thought-Signatures und Cache-TTL-
  Richtlinie
- `zai`: GLM-5-Forward-Compat-Fallback, Standardwerte für `tool_stream`, Cache-TTL-
  Richtlinie, binäre-Thinking-/Live-Modell-Richtlinie und Usage-Auth + Quota-Abruf;
  unbekannte `glm-5*`-IDs werden aus dem gebündelten `glm-4.7`-Template synthetisiert
- `xai`: native Responses-Transport-Normalisierung, Umschreibungen von `/fast`-Aliasen für
  Grok-Fast-Varianten, Standard `tool_stream` und xAI-spezifische Bereinigung von Tool-Schemas /
  Reasoning-Payloads
- `mistral`: plugin-eigene Capability-Metadaten
- `opencode` und `opencode-go`: plugin-eigene Capability-Metadaten plus
  Bereinigung von Proxy-Gemini-Thought-Signatures
- `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi`,
  `nvidia`, `qianfan`, `stepfun`, `synthetic`, `together`, `venice`,
  `vercel-ai-gateway` und `volcengine`: nur plugin-eigene Kataloge
- `qwen`: plugin-eigene Kataloge für Textmodelle plus gemeinsam genutzte
  Registrierungen für Media-Understanding- und Video-Generation-Provider für die
  multimodalen Oberflächen; die Qwen-Videogenerierung verwendet die Standard-DashScope-Video-
  Endpunkte mit gebündelten Wan-Modellen wie `wan2.6-t2v` und `wan2.7-r2v`
- `minimax`: plugin-eigene Kataloge, hybride Auswahl von Anthropic/OpenAI-Replay-Policy sowie Usage-Auth-/Snapshot-Logik
- `xiaomi`: plugin-eigene Kataloge plus Usage-Auth-/Snapshot-Logik

Das gebündelte `openai`-Plugin besitzt jetzt beide Provider-IDs:
`openai` und `openai-codex`.

Dies deckt Provider ab, die noch in OpenClaws normale Transporte passen. Ein Provider,
der einen vollständig benutzerdefinierten Request-Executor benötigt, ist eine separate, tiefere Erweiterungsoberfläche.

## API-Key-Rotation

- Unterstützt generische Provider-Rotation für ausgewählte Provider.
- Konfigurieren Sie mehrere Schlüssel über:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
  - `<PROVIDER>_API_KEYS` (durch Komma oder Semikolon getrennte Liste)
  - `<PROVIDER>_API_KEY` (primärer Schlüssel)
  - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)
- Für Google-Provider ist `GOOGLE_API_KEY` zusätzlich als Fallback enthalten.
- Die Reihenfolge der Schlüsselauswahl bewahrt die Priorität und dedupliziert Werte.
- Requests werden nur bei Rate-Limit-Antworten mit dem nächsten Schlüssel wiederholt (zum
  Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` oder periodische Usage-Limit-Meldungen).
- Fehler ohne Rate-Limit schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
- Wenn alle Kandidatenschlüssel fehlschlagen, wird der letzte Fehler aus dem letzten Versuch zurückgegeben.

## Integrierte Provider (pi-ai-Katalog)

OpenClaw wird mit dem pi-ai-Katalog ausgeliefert. Für diese Provider ist **keine**
`models.providers`-Konfiguration erforderlich; setzen Sie einfach Auth + wählen Sie ein Modell.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standardtransport ist `auto` (WebSocket-zuerst, SSE-Fallback)
- Überschreiben Sie dies pro Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- Das Warm-up für OpenAI Responses WebSocket ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- OpenAI-Priority-Processing kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Requests `service_tier=priority` auf `api.openai.com` zu
- Verwenden Sie `params.serviceTier`, wenn Sie eine explizite Tier-Einstellung statt des gemeinsamen Schalters `/fast` möchten
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) gelten nur auf nativem OpenAI-Traffic zu `api.openai.com`, nicht
  für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und
  OpenAI-Reasoning-Compat-Payload-Shaping bei; Proxy-Routen nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, da die Live-OpenAI-API es ablehnt; Spark wird als Codex-only behandelt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey` oder `openclaw onboard --auth-choice anthropic-cli`
- Direkte öffentliche Anthropic-Requests unterstützen den gemeinsamen Schalter `/fast` und `params.fastMode`, einschließlich per API-Key und OAuth authentifiziertem Traffic an `api.anthropic.com`; OpenClaw ordnet dies Anthropic-`service_tier` zu (`auto` vs `standard_only`)
- Abrechnungshinweis: Die öffentlichen Claude-Code-Dokumente von Anthropic enthalten weiterhin direkte Claude-Code-Terminalnutzung in den Claude-Plan-Limits. Separat hat Anthropic OpenClaw-Benutzer am **4. April 2026 um 12:00 PM PT / 8:00 PM BST** informiert, dass der **OpenClaw**-Claude-Login-Pfad als Drittanbieter-Harness-Nutzung zählt und **Extra Usage** erfordert, die getrennt vom Abonnement abgerechnet wird.
- Das Anthropic-Setup-Token ist wieder als Legacy-/manueller OpenClaw-Pfad verfügbar. Verwenden Sie es in der Erwartung, dass Anthropic OpenClaw-Benutzern mitgeteilt hat, dass dieser Pfad **Extra Usage** erfordert.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- Beispielmodell: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` oder `openclaw models auth login --provider openai-codex`
- Standardtransport ist `auto` (WebSocket-zuerst, SSE-Fallback)
- Überschreiben Sie dies pro Modell über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch auf nativen Codex-Responses-Requests weitergereicht (`chatgpt.com/backend-api`)
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) werden nur auf nativem Codex-Traffic zu
  `chatgpt.com/backend-api` angehängt, nicht an generische OpenAI-kompatible Proxys
- Teilt denselben Schalter `/fast` und dieselbe `params.fastMode`-Konfiguration wie direkte `openai/*`; OpenClaw ordnet dies `service_tier=priority` zu
- `openai-codex/gpt-5.3-codex-spark` bleibt verfügbar, wenn der Codex-OAuth-Katalog es bereitstellt; abhängig von Berechtigungen
- `openai-codex/gpt-5.4` behält natives `contextWindow = 1050000` und ein Standard-Runtime-`contextTokens = 272000`; überschreiben Sie die Runtime-Obergrenze mit `models.providers.openai-codex.models[].contextTokens`
- Richtlinienhinweis: OpenAI-Codex-OAuth wird explizit für externe Tools/Workflows wie OpenClaw unterstützt.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### Andere gehostete Optionen im Abonnementstil

- [Qwen Cloud](/providers/qwen): Qwen-Cloud-Provider-Oberfläche plus Zuordnung von Alibaba-DashScope- und Coding-Plan-Endpunkten
- [MiniMax](/providers/minimax): MiniMax-Coding-Plan-OAuth- oder API-Key-Zugriff
- [GLM Models](/providers/glm): Z.AI Coding Plan oder allgemeine API-Endpunkte

### OpenCode

- Auth: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
- Zen-Runtime-Provider: `opencode`
- Go-Runtime-Provider: `opencode-go`
- Beispielmodelle: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-Key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` als Fallback und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Legacy-OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Direkte Gemini-Läufe akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent`
  (oder Legacy-`cached_content`), um einen provider-nativen
  `cachedContents/...`-Handle weiterzugeben; Gemini-Cache-Treffer erscheinen als OpenClaw-`cacheRead`

### Google Vertex und Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Ablauf
- Vorsicht: Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Benutzer haben nach der Verwendung von Drittanbieter-Clients über Einschränkungen ihres Google-Kontos berichtet. Prüfen Sie die Google-Bedingungen und verwenden Sie ein nicht kritisches Konto, wenn Sie fortfahren möchten.
- Gemini-CLI-OAuth wird als Teil des gebündelten `google`-Plugins ausgeliefert.
  - Installieren Sie zuerst Gemini CLI:
    - `brew install gemini-cli`
    - oder `npm install -g @google/gemini-cli`
  - Aktivieren: `openclaw plugins enable google`
  - Login: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Standardmodell: `google-gemini-cli/gemini-3.1-pro-preview`
  - Hinweis: Sie fügen **keine** Client-ID oder Secret in `openclaw.json` ein. Der CLI-Login-Ablauf speichert
    Tokens in Auth-Profilen auf dem Gateway-Host.
  - Wenn Requests nach dem Login fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  - Gemini-CLI-JSON-Antworten werden aus `response` geparst; Usage fällt auf
    `stats` zurück, wobei `stats.cached` zu OpenClaw-`cacheRead` normalisiert wird.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasse: `z.ai/*` und `z-ai/*` werden zu `zai/*` normalisiert
  - `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Beispielmodell: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Beispielmodell: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- Der statische Fallback-Katalog enthält `kilocode/kilo/auto`; die Live-
  Erkennung über `https://api.kilo.ai/api/gateway/models` kann den Runtime-
  Katalog weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` gehört zu Kilo Gateway
  und ist nicht in OpenClaw fest kodiert.

Siehe [/providers/kilocode](/providers/kilocode) für Einrichtungsdetails.

### Andere gebündelte Provider-Plugins

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Beispielmodell: `openrouter/auto`
- OpenClaw wendet die dokumentierten App-Attributions-Header von OpenRouter nur an, wenn
  die Anfrage tatsächlich `openrouter.ai` adressiert
- OpenRouter-spezifische Anthropic-`cache_control`-Marker werden ebenso nur auf
  verifizierten OpenRouter-Routen gesetzt, nicht auf beliebigen Proxy-URLs
- OpenRouter bleibt auf dem Proxy-Stil-Pfad für OpenAI-Kompatibilität, daher
  werden native nur-OpenAI-Request-Formungen (`serviceTier`, Responses-`store`,
  Prompt-Cache-Hinweise, OpenAI-Reasoning-Compat-Payloads) nicht weitergereicht
- Gemini-gestützte OpenRouter-Refs behalten nur die Bereinigung von Proxy-Gemini-Thought-Signatures;
  native Gemini-Replay-Validierung und Bootstrap-Umschreibungen bleiben deaktiviert
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Beispielmodell: `kilocode/kilo/auto`
- Gemini-gestützte Kilo-Refs behalten denselben Pfad zur Bereinigung von Proxy-Gemini-Thought-Signatures;
  `kilocode/kilo/auto` und andere Hinweise auf Proxy-Reasoning ohne Unterstützung
  überspringen die Proxy-Reasoning-Injektion
- MiniMax: `minimax` (API-Key) und `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`
- Beispielmodell: `minimax/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7`
- MiniMax-Onboarding/API-Key-Setup schreibt explizite M2.7-Modelldefinitionen mit
  `input: ["text", "image"]`; der gebündelte Provider-Katalog hält die Chat-Refs
  text-only, bis diese Provider-Konfiguration materialisiert ist
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Beispielmodell: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi` (`KIMI_API_KEY` oder `KIMICODE_API_KEY`)
- Beispielmodell: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- Beispielmodell: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY`, `MODELSTUDIO_API_KEY` oder `DASHSCOPE_API_KEY`)
- Beispielmodell: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- Beispielmodell: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- Beispielmodelle: `stepfun/step-3.5-flash`, `stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- Beispielmodell: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- Beispielmodell: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- Beispielmodell: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- Beispielmodell: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - Native gebündelte xAI-Requests verwenden den xAI-Responses-Pfad
  - `/fast` oder `params.fastMode: true` schreiben `grok-3`, `grok-3-mini`,
    `grok-4` und `grok-4-0709` zu ihren `*-fast`-Varianten um
  - `tool_stream` ist standardmäßig aktiviert; setzen Sie
    `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
    es zu deaktivieren
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Beispielmodell: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - GLM-Modelle auf Cerebras verwenden die IDs `zai-glm-4.7` und `zai-glm-4.6`.
  - OpenAI-kompatible Base URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Beispielmodell für Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Siehe [Hugging Face (Inference)](/providers/huggingface).

## Provider über `models.providers` (benutzerdefiniert/Base URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder
OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Provider-Plugins veröffentlichen bereits einen Standardkatalog.
Verwenden Sie explizite `models.providers.<id>`-Einträge nur, wenn Sie die
Standard-Base-URL, Header oder Modellliste überschreiben möchten.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Provider-Plugin ausgeliefert. Verwenden Sie standardmäßig den integrierten Provider
und fügen Sie einen expliziten `models.providers.moonshot`-Eintrag nur dann hinzu, wenn Sie die Base URL oder Modellmetadaten überschreiben müssen:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Beispielmodell: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` oder `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi-K2-Modell-IDs:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding verwendet den Anthropic-kompatiblen Endpunkt von Moonshot AI:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- Beispielmodell: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Legacy-`kimi/k2p5` bleibt als Kompatibilitäts-Modell-ID akzeptiert.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) bietet Zugriff auf Doubao und andere Modelle in China.

- Provider: `volcengine` (Coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Beispielmodell: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Das Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine `volcengine/*`-
Katalog wird gleichzeitig registriert.

In Onboarding-/Konfigurations-Model-Pickern bevorzugt die Volcengine-Auth-Auswahl sowohl
`volcengine/*`- als auch `volcengine-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, statt einen leeren
providerbezogenen Picker anzuzeigen.

Verfügbare Modelle:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Coding-Modelle (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (international)

BytePlus ARK bietet internationalen Benutzern Zugriff auf dieselben Modelle wie Volcano Engine.

- Provider: `byteplus` (Coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Beispielmodell: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Das Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine `byteplus/*`-
Katalog wird gleichzeitig registriert.

In Onboarding-/Konfigurations-Model-Pickern bevorzugt die BytePlus-Auth-Auswahl sowohl
`byteplus/*`- als auch `byteplus-plan/*`-Zeilen. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, statt einen leeren
providerbezogenen Picker anzuzeigen.

Verfügbare Modelle:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Coding-Modelle (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic bietet Anthropic-kompatible Modelle hinter dem Provider `synthetic`:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Beispielmodell: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax wird über `models.providers` konfiguriert, da es benutzerdefinierte Endpunkte verwendet:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-Key (Global): `--auth-choice minimax-global-api`
- MiniMax API-Key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder
  `MINIMAX_API_KEY` für `minimax-portal`

Siehe [/providers/minimax](/providers/minimax) für Einrichtungsdetails, Modelloptionen und Konfigurations-Snippets.

Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking
standardmäßig, sofern Sie es nicht explizit setzen, und `/fast on` schreibt
`MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.

Plugin-eigene Capability-Aufteilung:

- Text-/Chat-Standardwerte bleiben auf `minimax/MiniMax-M2.7`
- Bildgenerierung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist plugin-eigenes `MiniMax-VL-01` auf beiden MiniMax-Auth-Pfaden
- Websuche bleibt auf Provider-ID `minimax`

### Ollama

Ollama wird als gebündeltes Provider-Plugin ausgeliefert und verwendet Ollamas native API:

- Provider: `ollama`
- Auth: Nicht erforderlich (lokaler Server)
- Beispielmodell: `ollama/llama3.3`
- Installation: [https://ollama.com/download](https://ollama.com/download)

```bash
# Installieren Sie Ollama und laden Sie dann ein Modell:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie sich mit
`OLLAMA_API_KEY` dafür entscheiden, und das gebündelte Provider-Plugin fügt Ollama direkt zu
`openclaw onboard` und dem Modell-Picker hinzu. Siehe [/providers/ollama](/providers/ollama)
für Onboarding, Cloud-/lokalen Modus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Provider-Plugin für lokale/selbst gehostete OpenAI-kompatible
Server ausgeliefert:

- Provider: `vllm`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Base-URL: `http://127.0.0.1:8000/v1`

Um sich lokal für Auto-Discovery zu entscheiden (jeder Wert funktioniert, wenn Ihr Server keine Auth erzwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Setzen Sie dann ein Modell (ersetzen Sie dies durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Siehe [/providers/vllm](/providers/vllm) für Details.

### SGLang

SGLang wird als gebündeltes Provider-Plugin für schnelle selbst gehostete
OpenAI-kompatible Server ausgeliefert:

- Provider: `sglang`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Base-URL: `http://127.0.0.1:30000/v1`

Um sich lokal für Auto-Discovery zu entscheiden (jeder Wert funktioniert, wenn Ihr Server keine
Auth erzwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Setzen Sie dann ein Modell (ersetzen Sie dies durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Siehe [/providers/sglang](/providers/sglang) für Details.

### Lokale Proxys (LM Studio, vLLM, LiteLLM usw.)

Beispiel (OpenAI-kompatibel):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Hinweise:

- Für benutzerdefinierte Provider sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional.
  Wenn sie weggelassen werden, verwendet OpenClaw standardmäßig:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Empfohlen: Setzen Sie explizite Werte, die zu Ihren Proxy-/Modellgrenzen passen.
- Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist) erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um Provider-400-Fehler für nicht unterstützte `developer`-Rollen zu vermeiden.
- OpenAI-kompatible Routen im Proxy-Stil überspringen außerdem natives nur-OpenAI-Request-
  Shaping: kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise,
  kein OpenAI-Reasoning-Compat-Payload-Shaping und keine versteckten OpenClaw-Attributions-
  Header.
- Wenn `baseUrl` leer ist/weggelassen wird, behält OpenClaw das Standard-OpenAI-Verhalten bei (das zu `api.openai.com` aufgelöst wird).
- Aus Sicherheitsgründen wird auch ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten überschrieben.

## CLI-Beispiele

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Siehe auch: [/gateway/configuration](/gateway/configuration) für vollständige Konfigurationsbeispiele.

## Verwandt

- [Models](/concepts/models) — Modellkonfiguration und Aliasse
- [Model Failover](/concepts/model-failover) — Fallback-Ketten und Wiederholungsverhalten
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — Modell-Konfigurationsschlüssel
- [Providers](/providers) — Einrichtungsleitfäden pro Provider
