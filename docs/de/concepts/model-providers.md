---
read_when:
    - Sie benötigen eine anbieterweise Referenz zur Modelleinrichtung
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modellanbieter
summary: Überblick über Modellanbieter mit Beispielkonfigurationen + CLI-Abläufen
title: Modellanbieter
x-i18n:
    generated_at: "2026-04-21T06:24:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e433dfd51d1721832480089cb35ab1243e5c873a587f9968e14744840cb912cf
    source_path: concepts/model-providers.md
    workflow: 15
---

# Modellanbieter

Diese Seite behandelt **LLM-/Modellanbieter** (nicht Chat-Kanäle wie WhatsApp/Telegram).
Für Regeln zur Modellauswahl siehe [/concepts/models](/de/concepts/models).

## Schnellregeln

- Modell-Referenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
- Wenn Sie `agents.defaults.models` setzen, wird es zur Allowlist.
- CLI-Helfer: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Laufzeitregeln für Fallbacks, Cooldown-Probes und die Persistenz von Sitzungs-Overrides sind in [/concepts/model-failover](/de/concepts/model-failover) dokumentiert.
- `models.providers.*.models[].contextWindow` ist native Modellmetadaten; `models.providers.*.models[].contextTokens` ist die effektive Laufzeitgrenze.
- Anbieter-Plugins können Modellkataloge über `registerProvider({ catalog })` injizieren; OpenClaw führt diese Ausgabe in `models.providers` zusammen, bevor `models.json` geschrieben wird.
- Anbietermanifeste können `providerAuthEnvVars` und `providerAuthAliases` deklarieren, damit generische env-basierte Auth-Probes und Anbietervarianten die Plugin-Laufzeit nicht laden müssen. Die verbleibende Core-Env-Var-Map ist jetzt nur noch für Nicht-Plugin-/Core-Anbieter und einige generische Vorrangfälle gedacht, etwa Anthropic-Onboarding mit API-Schlüssel zuerst.
- Anbieter-Plugins können außerdem das Laufzeitverhalten des Anbieters besitzen über `normalizeModelId`, `normalizeTransport`, `normalizeConfig`, `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`, `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`, `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`, `contributeResolvedModelCompat`, `capabilities`, `normalizeToolSchemas`, `inspectToolSchemas`, `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`, `wrapStreamFn`, `resolveTransportTurnState`, `resolveWebSocketSessionPolicy`, `createEmbeddingProvider`, `formatApiKey`, `refreshOAuth`, `buildAuthDoctorHint`, `matchesContextOverflowError`, `classifyFailoverReason`, `isCacheTtlEligible`, `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`, `isBinaryThinking`, `supportsXHighThinking`, `supportsAdaptiveThinking`, `supportsMaxThinking`, `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`, `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot` und `onModelSelected`.
- Hinweis: Laufzeit-`capabilities` des Anbieters sind gemeinsame Runner-Metadaten (Anbieterfamilie, Transcript-/Tooling-Eigenheiten, Transport-/Cache-Hinweise). Sie sind nicht dasselbe wie das [öffentliche Fähigkeitsmodell](/de/plugins/architecture#public-capability-model), das beschreibt, was ein Plugin registriert (Text-Inferenz, Sprache usw.).
- Der gebündelte Anbieter `codex` ist mit dem gebündelten Codex-Agent-Harness gekoppelt. Verwenden Sie `codex/gpt-*`, wenn Sie Codex-eigenen Login, Modellerkennung, native Thread-Fortsetzung und App-Server-Ausführung möchten. Einfache `openai/gpt-*`-Referenzen verwenden weiterhin den OpenAI-Anbieter und den normalen OpenClaw-Anbietertransport. Reine Codex-Deployments können den automatischen PI-Fallback mit `agents.defaults.embeddedHarness.fallback: "none"` deaktivieren; siehe [Codex Harness](/de/plugins/codex-harness).

## Plugin-eigenes Anbieterverhalten

Anbieter-Plugins können nun den Großteil der anbieterspezifischen Logik besitzen, während OpenClaw die generische Inferenzschleife beibehält.

Typische Aufteilung:

- `auth[].run` / `auth[].runNonInteractive`: Anbieter besitzt Onboarding-/Login-Abläufe für `openclaw onboard`, `openclaw models auth` und Headless-Setup
- `wizard.setup` / `wizard.modelPicker`: Anbieter besitzt Beschriftungen für Auth-Auswahl, Legacy-Aliasse, Hinweise zur Onboarding-Allowlist und Setup-Einträge in Onboarding-/Modell-Pickern
- `catalog`: Anbieter erscheint in `models.providers`
- `normalizeModelId`: Anbieter normalisiert Legacy-/Vorschau-Modell-IDs vor Lookup oder Kanonisierung
- `normalizeTransport`: Anbieter normalisiert `api` / `baseUrl` der Transportfamilie vor dem generischen Modellaufbau; OpenClaw prüft zuerst den passenden Anbieter, dann andere hook-fähige Anbieter-Plugins, bis eines den Transport tatsächlich ändert
- `normalizeConfig`: Anbieter normalisiert die Konfiguration `models.providers.<id>`, bevor die Laufzeit sie verwendet; OpenClaw prüft zuerst den passenden Anbieter, dann andere hook-fähige Anbieter-Plugins, bis eines die Konfiguration tatsächlich ändert. Wenn kein Anbieter-Hook die Konfiguration umschreibt, normalisieren gebündelte Google-Familien-Helfer weiterhin unterstützte Google-Anbietereinträge.
- `applyNativeStreamingUsageCompat`: Anbieter wendet endpoint-gesteuerte native Kompatibilitätsumschreibungen für Streaming-Nutzung auf Konfigurationsanbieter an
- `resolveConfigApiKey`: Anbieter löst Env-Marker-Auth für Konfigurationsanbieter auf, ohne das vollständige Laden der Laufzeit-Auth zu erzwingen. `amazon-bedrock` hat hier außerdem einen eingebauten AWS-Env-Marker-Resolver, obwohl die Bedrock-Laufzeit-Auth die AWS-SDK-Standardkette verwendet.
- `resolveSyntheticAuth`: Anbieter kann lokale/self-hosted oder andere konfigurationsgestützte Auth-Verfügbarkeit verfügbar machen, ohne Klartext-Geheimnisse zu persistieren
- `shouldDeferSyntheticProfileAuth`: Anbieter kann gespeicherte synthetische Profil-Platzhalter als niedrigere Priorität als env-/konfigurationsgestützte Auth markieren
- `resolveDynamicModel`: Anbieter akzeptiert Modell-IDs, die noch nicht im lokalen statischen Katalog vorhanden sind
- `prepareDynamicModel`: Anbieter benötigt eine Aktualisierung der Metadaten, bevor die dynamische Auflösung erneut versucht wird
- `normalizeResolvedModel`: Anbieter benötigt Umschreibungen von Transport oder Basis-URL
- `contributeResolvedModelCompat`: Anbieter steuert Kompatibilitätsflags für seine Vendor-Modelle bei, selbst wenn sie über einen anderen kompatiblen Transport eintreffen
- `capabilities`: Anbieter veröffentlicht Eigenheiten von Transcript/Tooling/Anbieterfamilie
- `normalizeToolSchemas`: Anbieter bereinigt Tool-Schemas, bevor der eingebettete Runner sie sieht
- `inspectToolSchemas`: Anbieter macht transportspezifische Schemawarnungen nach der Normalisierung sichtbar
- `resolveReasoningOutputMode`: Anbieter wählt native oder getaggte Verträge für Reasoning-Ausgabe
- `prepareExtraParams`: Anbieter setzt Standardwerte oder normalisiert anfragespezifische Parameter pro Modell
- `createStreamFn`: Anbieter ersetzt den normalen Stream-Pfad durch einen vollständig benutzerdefinierten Transport
- `wrapStreamFn`: Anbieter wendet Wrapper für Anfrage-Header/Body/Modell-Kompatibilität an
- `resolveTransportTurnState`: Anbieter liefert native Header oder Metadaten des Transports pro Turn
- `resolveWebSocketSessionPolicy`: Anbieter liefert native Header für WebSocket-Sitzungen oder eine Sitzungs-Cooldown-Richtlinie
- `createEmbeddingProvider`: Anbieter besitzt das Verhalten von Memory Embeddings, wenn es zum Anbieter-Plugin statt zum Core-Embedding-Switchboard gehört
- `formatApiKey`: Anbieter formatiert gespeicherte Auth-Profile in den von dem Transport erwarteten Laufzeit-String `apiKey`
- `refreshOAuth`: Anbieter besitzt das OAuth-Refresh, wenn die gemeinsamen `pi-ai`-Refresher nicht ausreichen
- `buildAuthDoctorHint`: Anbieter ergänzt Reparaturhinweise, wenn das OAuth-Refresh fehlschlägt
- `matchesContextOverflowError`: Anbieter erkennt anbieterspezifische Fehler bei Überschreitung des Kontextfensters, die generische Heuristiken übersehen würden
- `classifyFailoverReason`: Anbieter ordnet anbieterspezifische rohe Transport-/API-Fehler Failover-Gründen wie Rate Limit oder Überlastung zu
- `isCacheTtlEligible`: Anbieter entscheidet, welche Upstream-Modell-IDs Prompt-Cache-TTL unterstützen
- `buildMissingAuthMessage`: Anbieter ersetzt den generischen Fehler des Auth-Speichers durch einen anbieterspezifischen Wiederherstellungshinweis
- `suppressBuiltInModel`: Anbieter blendet veraltete Upstream-Zeilen aus und kann für direkte Auflösungsfehler einen Vendor-eigenen Fehler zurückgeben
- `augmentModelCatalog`: Anbieter hängt nach Erkennung und Konfigurationszusammenführung synthetische/finale Katalogzeilen an
- `isBinaryThinking`: Anbieter besitzt die UX für binäres Thinking mit Ein/Aus
- `supportsXHighThinking`: Anbieter aktiviert `xhigh` für ausgewählte Modelle
- `supportsAdaptiveThinking`: Anbieter aktiviert `adaptive` für ausgewählte Modelle
- `supportsMaxThinking`: Anbieter aktiviert `max` für ausgewählte Modelle
- `resolveDefaultThinkingLevel`: Anbieter besitzt die Standardrichtlinie von `/think` für eine Modellfamilie
- `applyConfigDefaults`: Anbieter wendet anbieterspezifische globale Standardwerte während der Konfigurationsmaterialisierung an, basierend auf Auth-Modus, env oder Modellfamilie
- `isModernModelRef`: Anbieter besitzt die Zuordnung bevorzugter Modelle für Live-/Smoke-Tests
- `prepareRuntimeAuth`: Anbieter wandelt konfigurierte Zugangsdaten in ein kurzlebiges Laufzeit-Token um
- `resolveUsageAuth`: Anbieter löst Nutzungs-/Quota-Zugangsdaten für `/usage` und verwandte Status-/Reporting-Oberflächen auf
- `fetchUsageSnapshot`: Anbieter besitzt das Abrufen/Parsen des Nutzungsendpunkts, während der Core weiterhin die Zusammenfassungshülle und Formatierung besitzt
- `onModelSelected`: Anbieter führt Nebeneffekte nach der Modellauswahl aus, etwa Telemetrie oder anbieter-eigene Sitzungsbuchführung

Aktuelle gebündelte Beispiele:

- `anthropic`: Claude-4.6-Vorwärtskompatibilitäts-Fallback, Hinweise zur Auth-Reparatur, Abruf des Nutzungsendpunkts, Metadaten zu Cache-TTL/Anbieterfamilie und Auth-bewusste globale Konfigurationsstandards
- `amazon-bedrock`: Anbieter-eigenes Matching für Kontextüberlauf und Klassifizierung von Failover-Gründen für Bedrock-spezifische Drosselungs-/Nicht-bereit-Fehler sowie die gemeinsame Replay-Familie `anthropic-by-model` für Claude-exklusive Replay-Policy-Schutzmechanismen auf Anthropic-Datenverkehr
- `anthropic-vertex`: Claude-exklusive Replay-Policy-Schutzmechanismen auf Anthropic-Message-Datenverkehr
- `openrouter`: Durchreichen von Modell-IDs, Anfrage-Wrapper, Hinweise zu Anbieterfähigkeiten, Bereinigung von Gemini-Thought-Signaturen auf Proxy-Gemini-Datenverkehr, Proxy-Reasoning-Injektion über die Stream-Familie `openrouter-thinking`, Weiterleitung von Routing-Metadaten und Cache-TTL-Richtlinie
- `github-copilot`: Onboarding/Geräte-Login, Vorwärtskompatibilitäts-Fallback für Modelle, Hinweise zu Claude-Thinking-Transkripten, Austausch von Laufzeit-Token und Abruf des Nutzungsendpunkts
- `openai`: GPT-5.4-Vorwärtskompatibilitäts-Fallback, direkte Normalisierung des OpenAI-Transports, Codex-bewusste Hinweise für fehlende Auth, Unterdrückung von Spark, synthetische OpenAI-/Codex-Katalogzeilen, Thinking-/Live-Modell-Richtlinie, Alias-Normalisierung für Usage-Token (`input` / `output` und `prompt` / `completion`-Familien), die gemeinsame Stream-Familie `openai-responses-defaults` für native OpenAI-/Codex-Wrapper, Metadaten zur Anbieterfamilie, gebündelte Registrierung des Bildgenerierungsanbieters für `gpt-image-1` und gebündelte Registrierung des Videogenerierungsanbieters für `sora-2`
- `google` und `google-gemini-cli`: Gemini-3.1-Vorwärtskompatibilitäts-Fallback, native Gemini-Replay-Validierung, Bereinigung von Bootstrap-Replay, getaggter Ausgabemodus für Reasoning, modernes Modell-Matching, gebündelte Registrierung des Bildgenerierungsanbieters für Gemini-Image-Preview-Modelle und gebündelte Registrierung des Videogenerierungsanbieters für Veo-Modelle; Gemini-CLI-OAuth besitzt außerdem die Formatierung von Auth-Profil-Token, das Parsen von Usage-Token und das Abrufen von Quotenendpunkten für Usage-Oberflächen
- `moonshot`: gemeinsamer Transport, Plugin-eigene Normalisierung der Thinking-Payload
- `kilocode`: gemeinsamer Transport, Plugin-eigene Anfrage-Header, Normalisierung der Reasoning-Payload, Bereinigung von Proxy-Gemini-Thought-Signaturen und Cache-TTL-Richtlinie
- `zai`: GLM-5-Vorwärtskompatibilitäts-Fallback, Standardwerte für `tool_stream`, Cache-TTL-Richtlinie, Richtlinie für binäres Thinking/Live-Modelle und Usage-Auth + Quotenabruf; unbekannte `glm-5*`-IDs werden aus der gebündelten Vorlage `glm-4.7` synthetisiert
- `xai`: native Normalisierung des Responses-Transports, Umschreibungen von `/fast`-Aliasen für schnelle Grok-Varianten, Standard `tool_stream`, xAI-spezifische Bereinigung von Tool-Schemas / Reasoning-Payload und gebündelte Registrierung des Videogenerierungsanbieters für `grok-imagine-video`
- `mistral`: Plugin-eigene Metadaten zu Fähigkeiten
- `opencode` und `opencode-go`: Plugin-eigene Metadaten zu Fähigkeiten sowie Bereinigung von Proxy-Gemini-Thought-Signaturen
- `alibaba`: Plugin-eigener Videogenerierungskatalog für direkte Wan-Modell-Referenzen wie `alibaba/wan2.6-t2v`
- `byteplus`: Plugin-eigene Kataloge sowie gebündelte Registrierung des Videogenerierungsanbieters für Seedance-Text-zu-Video-/Bild-zu-Video-Modelle
- `fal`: gebündelte Registrierung des Videogenerierungsanbieters für gehostete Bildgenerierungsanbieter-Registrierung für FLUX-Bildmodelle sowie gebündelte Registrierung des Videogenerierungsanbieters für gehostete Drittanbieter-Videomodelle
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`, `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` und `volcengine`: nur Plugin-eigene Kataloge
- `qwen`: Plugin-eigene Kataloge für Textmodelle sowie gemeinsame Registrierungen von Anbietern für Medienverständnis und Videogenerierung für seine multimodalen Oberflächen; die Videogenerierung von Qwen verwendet die Standard-DashScope-Videoendpunkte mit gebündelten Wan-Modellen wie `wan2.6-t2v` und `wan2.7-r2v`
- `runway`: Plugin-eigene Registrierung des Videogenerierungsanbieters für native, auf Aufgaben basierende Runway-Modelle wie `gen4.5`
- `minimax`: Plugin-eigene Kataloge, gebündelte Registrierung des Videogenerierungsanbieters für Hailuo-Videomodelle, gebündelte Registrierung des Bildgenerierungsanbieters für `image-01`, hybride Auswahl der Anthropic-/OpenAI-Replay-Policy und Usage-Auth-/Snapshot-Logik
- `together`: Plugin-eigene Kataloge sowie gebündelte Registrierung des Videogenerierungsanbieters für Wan-Videomodelle
- `xiaomi`: Plugin-eigene Kataloge sowie Usage-Auth-/Snapshot-Logik

Das gebündelte Plugin `openai` besitzt nun beide Anbieter-IDs: `openai` und `openai-codex`.

Damit sind Anbieter abgedeckt, die noch in die normalen Transporte von OpenClaw passen. Ein Anbieter, der einen vollständig benutzerdefinierten Anfrage-Executor benötigt, ist eine separate, tiefere Erweiterungsoberfläche.

## API-Schlüssel-Rotation

- Unterstützt generische Anbieterrotation für ausgewählte Anbieter.
- Konfigurieren Sie mehrere Schlüssel über:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelner Live-Override, höchste Priorität)
  - `<PROVIDER>_API_KEYS` (durch Komma oder Semikolon getrennte Liste)
  - `<PROVIDER>_API_KEY` (primärer Schlüssel)
  - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)
- Für Google-Anbieter wird `GOOGLE_API_KEY` zusätzlich als Fallback einbezogen.
- Die Reihenfolge der Schlüsselauswahl bewahrt die Priorität und entfernt doppelte Werte.
- Anfragen werden nur bei Antworten mit Rate-Limit mit dem nächsten Schlüssel wiederholt (zum Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` oder periodische Meldungen zu Usage-Limits).
- Fehler, die keine Rate-Limits sind, schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
- Wenn alle Kandidatenschlüssel fehlschlagen, wird der letzte Fehler des letzten Versuchs zurückgegeben.

## Eingebaute Anbieter (pi-ai-Katalog)

OpenClaw wird mit dem pi‑ai-Katalog ausgeliefert. Diese Anbieter erfordern **keine** Konfiguration in `models.providers`; setzen Sie einfach Auth und wählen Sie ein Modell.

### OpenAI

- Anbieter: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` sowie `OPENCLAW_LIVE_OPENAI_KEY` (einzelner Override)
- Beispielmodelle: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standardtransport ist `auto` (WebSocket zuerst, SSE als Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- OpenAI-Responses-WebSocket-Warm-up ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- OpenAI-Prioritätsverarbeitung kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Anfragen `service_tier=priority` auf `api.openai.com` zu
- Verwenden Sie `params.serviceTier`, wenn Sie eine explizite Stufe statt des gemeinsamen Schalters `/fast` möchten
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`) gelten nur für nativen OpenAI-Datenverkehr zu `api.openai.com`, nicht für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und OpenAI-Reasoning-kompatibles Payload-Shaping bei; Proxy-Routen nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil die Live-OpenAI-API es ablehnt; Spark wird als Codex-exklusiv behandelt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Anbieter: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` sowie `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelner Override)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Anfragen unterstützen den gemeinsamen Schalter `/fast` und `params.fastMode`, einschließlich mit API-Schlüssel und OAuth authentifiziertem Datenverkehr an `api.anthropic.com`; OpenClaw ordnet das Anthropic-`service_tier` zu (`auto` vs `standard_only`)
- Anthropic-Hinweis: Mitarbeitende von Anthropic haben uns mitgeteilt, dass die Verwendung im Stil der Claude CLI mit OpenClaw wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung der Claude CLI und die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt nun, wenn verfügbar, die Wiederverwendung der Claude CLI und `claude -p`.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Anbieter: `openai-codex`
- Auth: OAuth (ChatGPT)
- Beispielmodell: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` oder `openclaw models auth login --provider openai-codex`
- Standardtransport ist `auto` (WebSocket zuerst, SSE als Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird ebenfalls bei nativen Codex-Responses-Anfragen weitergereicht (`chatgpt.com/backend-api`)
- Versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`) werden nur an nativen Codex-Datenverkehr zu `chatgpt.com/backend-api` angehängt, nicht an generische OpenAI-kompatible Proxys
- Teilt sich denselben Schalter `/fast` und dieselbe Konfiguration `params.fastMode` wie direktes `openai/*`; OpenClaw ordnet dies `service_tier=priority` zu
- `openai-codex/gpt-5.3-codex-spark` bleibt verfügbar, wenn der Codex-OAuth-Katalog es bereitstellt; abhängig von den Berechtigungen
- `openai-codex/gpt-5.4` behält natives `contextWindow = 1050000` und standardmäßig Laufzeit-`contextTokens = 272000`; überschreiben Sie die Laufzeitgrenze mit `models.providers.openai-codex.models[].contextTokens`
- Richtlinienhinweis: OpenAI-Codex-OAuth wird ausdrücklich für externe Tools/Workflows wie OpenClaw unterstützt.

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

- [Qwen Cloud](/de/providers/qwen): Qwen-Cloud-Anbieteroberfläche sowie Endpoint-Zuordnung für Alibaba DashScope und Coding Plan
- [MiniMax](/de/providers/minimax): Zugriff per MiniMax-Coding-Plan-OAuth oder API-Schlüssel
- [GLM Models](/de/providers/glm): Z.AI Coding Plan oder allgemeine API-Endpunkte

### OpenCode

- Auth: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
- Zen-Laufzeitanbieter: `opencode`
- Go-Laufzeitanbieter: `opencode-go`
- Beispielmodelle: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-Schlüssel)

- Anbieter: `google`
- Auth: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, Fallback `GOOGLE_API_KEY` und `OPENCLAW_LIVE_GEMINI_KEY` (einzelner Override)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Legacy-OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Direkte Gemini-Läufe akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent` (oder das Legacy-`cached_content`), um einen anbieter-nativen Handle `cachedContents/...` weiterzureichen; Gemini-Cache-Treffer erscheinen als OpenClaw-`cacheRead`

### Google Vertex und Gemini CLI

- Anbieter: `google-vertex`, `google-gemini-cli`
- Auth: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Ablauf
- Vorsicht: Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Nutzer haben von Einschränkungen ihres Google-Kontos nach der Verwendung von Drittanbieter-Clients berichtet. Prüfen Sie die Google-Nutzungsbedingungen und verwenden Sie ein unkritisches Konto, wenn Sie sich dafür entscheiden.
- Gemini-CLI-OAuth wird als Teil des gebündelten `google`-Plugins ausgeliefert.
  - Installieren Sie zuerst Gemini CLI:
    - `brew install gemini-cli`
    - oder `npm install -g @google/gemini-cli`
  - Aktivieren: `openclaw plugins enable google`
  - Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Standardmodell: `google-gemini-cli/gemini-3-flash-preview`
  - Hinweis: Sie fügen **keine** Client-ID und kein Secret in `openclaw.json` ein. Der CLI-Login-Ablauf speichert Token in Auth-Profilen auf dem Gateway-Host.
  - Wenn Anfragen nach dem Login fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  - JSON-Antworten von Gemini CLI werden aus `response` geparst; die Nutzung greift auf `stats` zurück, wobei `stats.cached` in OpenClaw-`cacheRead` normalisiert wird.

### Z.AI (GLM)

- Anbieter: `zai`
- Auth: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasse: `z.ai/*` und `z-ai/*` werden zu `zai/*` normalisiert
  - `zai-api-key` erkennt den passenden Z.AI-Endpunkt automatisch; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

### Vercel AI Gateway

- Anbieter: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Beispielmodell: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Anbieter: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Beispielmodell: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- Der statische Fallback-Katalog enthält `kilocode/kilo/auto`; die Live-Erkennung über `https://api.kilo.ai/api/gateway/models` kann den Laufzeitkatalog weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` wird von Kilo Gateway verwaltet und ist nicht fest in OpenClaw codiert.

Siehe [/providers/kilocode](/de/providers/kilocode) für Einrichtungsdetails.

### Andere gebündelte Anbieter-Plugins

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Beispielmodell: `openrouter/auto`
- OpenClaw wendet die dokumentierten App-Attributions-Header von OpenRouter nur an, wenn die Anfrage tatsächlich an `openrouter.ai` geht
- OpenRouter-spezifische Anthropic-`cache_control`-Marker sind ebenfalls auf verifizierte OpenRouter-Routen beschränkt, nicht auf beliebige Proxy-URLs
- OpenRouter bleibt auf dem proxyartigen OpenAI-kompatiblen Pfad, daher werden natives, nur für OpenAI geltendes Anfrage-Shaping (`serviceTier`, Responses-`store`, Prompt-Cache-Hinweise, OpenAI-Reasoning-kompatible Payloads) nicht weitergereicht
- Gemini-gestützte OpenRouter-Referenzen behalten nur die Bereinigung von Proxy-Gemini-Thought-Signaturen; native Gemini-Replay-Validierung und Bootstrap-Umschreibungen bleiben deaktiviert
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Beispielmodell: `kilocode/kilo/auto`
- Gemini-gestützte Kilo-Referenzen behalten denselben Bereinigungspfad für Proxy-Gemini-Thought-Signaturen; `kilocode/kilo/auto` und andere Hinweise ohne Unterstützung für Proxy-Reasoning überspringen die Proxy-Reasoning-Injektion
- MiniMax: `minimax` (API-Schlüssel) und `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`
- Beispielmodell: `minimax/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7`
- MiniMax-Onboarding/API-Key-Setup schreibt explizite M2.7-Modell-Definitionen mit `input: ["text", "image"]`; der gebündelte Anbieterkatalog hält die Chat-Referenzen nur für Text, bis diese Anbieter-Konfiguration materialisiert ist
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- Beispielmodell: `moonshot/kimi-k2.6`
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
  - Native gebündelte xAI-Anfragen verwenden den xAI-Responses-Pfad
  - `/fast` oder `params.fastMode: true` schreiben `grok-3`, `grok-3-mini`, `grok-4` und `grok-4-0709` auf ihre `*-fast`-Varianten um
  - `tool_stream` ist standardmäßig aktiviert; setzen Sie `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um es zu deaktivieren
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Beispielmodell: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - GLM-Modelle auf Cerebras verwenden die IDs `zai-glm-4.7` und `zai-glm-4.6`.
  - OpenAI-kompatible Basis-URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Beispielmodell für Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Siehe [Hugging Face (Inference)](/de/providers/huggingface).

## Anbieter über `models.providers` (benutzerdefiniert/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Anbieter oder OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Anbieter-Plugins veröffentlichen bereits einen Standardkatalog. Verwenden Sie explizite Einträge `models.providers.<id>` nur dann, wenn Sie die Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Anbieter-Plugin ausgeliefert. Verwenden Sie standardmäßig den eingebauten Anbieter und fügen Sie nur dann einen expliziten Eintrag `models.providers.moonshot` hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben müssen:

- Anbieter: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Beispielmodell: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` oder `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi-K2-Modell-IDs:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding verwendet den Anthropic-kompatiblen Endpunkt von Moonshot AI:

- Anbieter: `kimi`
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

Legacy-`kimi/k2p5` wird weiterhin als kompatible Modell-ID akzeptiert.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) bietet in China Zugriff auf Doubao und andere Modelle.

- Anbieter: `volcengine` (Coding: `volcengine-plan`)
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

Beim Onboarding wird standardmäßig die Coding-Oberfläche verwendet, aber der allgemeine Katalog `volcengine/*` wird gleichzeitig registriert.

In Onboarding-/Konfigurations-Modell-Pickern bevorzugt die Volcengine-Auth-Auswahl sowohl Zeilen `volcengine/*` als auch `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind, greift OpenClaw auf den ungefilterten Katalog zurück, anstatt einen leeren anbieterbezogenen Picker anzuzeigen.

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

BytePlus ARK bietet internationalen Nutzern Zugriff auf dieselben Modelle wie Volcano Engine.

- Anbieter: `byteplus` (Coding: `byteplus-plan`)
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

Beim Onboarding wird standardmäßig die Coding-Oberfläche verwendet, aber der allgemeine Katalog `byteplus/*` wird gleichzeitig registriert.

In Onboarding-/Konfigurations-Modell-Pickern bevorzugt die BytePlus-Auth-Auswahl sowohl Zeilen `byteplus/*` als auch `byteplus-plan/*`. Wenn diese Modelle noch nicht geladen sind, greift OpenClaw auf den ungefilterten Katalog zurück, anstatt einen leeren anbieterbezogenen Picker anzuzeigen.

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

Synthetic stellt Anthropic-kompatible Modelle hinter dem Anbieter `synthetic` bereit:

- Anbieter: `synthetic`
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

MiniMax wird über `models.providers` konfiguriert, weil es benutzerdefinierte Endpunkte verwendet:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-Schlüssel (Global): `--auth-choice minimax-global-api`
- MiniMax API-Schlüssel (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`

Siehe [/providers/minimax](/de/providers/minimax) für Einrichtungsdetails, Modelloptionen und Konfigurationsbeispiele.

Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw standardmäßig Thinking, sofern Sie es nicht explizit setzen, und `/fast on` schreibt `MiniMax-M2.7` auf `MiniMax-M2.7-highspeed` um.

Plugin-eigene Aufteilung der Fähigkeiten:

- Standardwerte für Text/Chat bleiben auf `minimax/MiniMax-M2.7`
- Bildgenerierung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist das Plugin-eigene `MiniMax-VL-01` auf beiden MiniMax-Auth-Pfaden
- Die Websuche bleibt auf der Anbieter-ID `minimax`

### LM Studio

LM Studio wird als gebündeltes Anbieter-Plugin ausgeliefert, das die native API verwendet:

- Anbieter: `lmstudio`
- Auth: `LM_API_TOKEN`
- Standard-Basis-URL für Inferenz: `http://localhost:1234/v1`

Setzen Sie dann ein Modell (ersetzen Sie es durch eine der IDs, die von `http://localhost:1234/api/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw verwendet die nativen Endpunkte `/api/v1/models` und `/api/v1/models/load` von LM Studio für Erkennung + automatisches Laden und standardmäßig `/v1/chat/completions` für die Inferenz.
Siehe [/providers/lmstudio](/de/providers/lmstudio) für Einrichtung und Fehlerbehebung.

### Ollama

Ollama wird als gebündeltes Anbieter-Plugin ausgeliefert und verwendet die native API von Ollama:

- Anbieter: `ollama`
- Auth: Nicht erforderlich (lokaler Server)
- Beispielmodell: `ollama/llama3.3`
- Installation: [https://ollama.com/download](https://ollama.com/download)

```bash
# Ollama installieren, dann ein Modell laden:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie sich mit `OLLAMA_API_KEY` dafür entscheiden, und das gebündelte Anbieter-Plugin fügt Ollama direkt zu `openclaw onboard` und dem Modell-Picker hinzu. Siehe [/providers/ollama](/de/providers/ollama) für Onboarding, Cloud-/lokalen Modus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Anbieter-Plugin für lokale/self-hosted OpenAI-kompatible Server ausgeliefert:

- Anbieter: `vllm`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

Um sich lokal für die automatische Erkennung zu entscheiden (jeder Wert funktioniert, wenn Ihr Server keine Auth erzwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Setzen Sie dann ein Modell (ersetzen Sie es durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Siehe [/providers/vllm](/de/providers/vllm) für Details.

### SGLang

SGLang wird als gebündeltes Anbieter-Plugin für schnelle self-hosted OpenAI-kompatible Server ausgeliefert:

- Anbieter: `sglang`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

Um sich lokal für die automatische Erkennung zu entscheiden (jeder Wert funktioniert, wenn Ihr Server keine Auth erzwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Setzen Sie dann ein Modell (ersetzen Sie es durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Siehe [/providers/sglang](/de/providers/sglang) für Details.

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
        apiKey: "${LM_API_TOKEN}",
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

- Für benutzerdefinierte Anbieter sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional.
  Wenn sie ausgelassen werden, verwendet OpenClaw standardmäßig:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Empfohlen: Setzen Sie explizite Werte, die zu Ihren Proxy-/Modellgrenzen passen.
- Für `api: "openai-completions"` auf nicht-nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist) erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um 400-Fehler des Anbieters bei nicht unterstützten `developer`-Rollen zu vermeiden.
- Proxy-artige OpenAI-kompatible Routen überspringen außerdem natives, nur für OpenAI geltendes Anfrage-Shaping: kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise, kein OpenAI-Reasoning-kompatibles Payload-Shaping und keine versteckten OpenClaw-Attributions-Header.
- Wenn `baseUrl` leer ist oder weggelassen wird, behält OpenClaw das Standardverhalten von OpenAI bei (das zu `api.openai.com` aufgelöst wird).
- Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` auf nicht-nativen Endpunkten `openai-completions` weiterhin überschrieben.

## CLI-Beispiele

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Siehe auch: [/gateway/configuration](/de/gateway/configuration) für vollständige Konfigurationsbeispiele.

## Verwandt

- [Models](/de/concepts/models) — Modellkonfiguration und Aliasse
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten und Wiederholungsverhalten
- [Konfigurationsreferenz](/de/gateway/configuration-reference#agent-defaults) — Modell-Konfigurationsschlüssel
- [Anbieter](/de/providers) — anbieterbezogene Einrichtungsanleitungen
