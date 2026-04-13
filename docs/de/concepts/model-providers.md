---
read_when:
    - Sie benötigen eine anbieterweise Referenz für die Modelleinrichtung
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modellanbieter
summary: Übersicht über Modellanbieter mit Beispielkonfigurationen + CLI-Abläufen
title: Modellanbieter
x-i18n:
    generated_at: "2026-04-13T08:50:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ba688c4b4366eec07667571e835d4cfeee684896e2ffae11d601b5fa0a4b98
    source_path: concepts/model-providers.md
    workflow: 15
---

# Modellanbieter

Diese Seite behandelt **LLM-/Modellanbieter** (nicht Chat-Kanäle wie WhatsApp/Telegram).
Regeln zur Modellauswahl finden Sie unter [/concepts/models](/de/concepts/models).

## Schnellregeln

- Modell-Referenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
- Wenn Sie `agents.defaults.models` festlegen, wird es zur Allowlist.
- CLI-Hilfen: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Fallback-Laufzeitregeln, Cooldown-Sonden und die Persistenz von Sitzungsüberschreibungen
  sind in [/concepts/model-failover](/de/concepts/model-failover) dokumentiert.
- `models.providers.*.models[].contextWindow` sind native Modellmetadaten;
  `models.providers.*.models[].contextTokens` ist die effektive Laufzeitobergrenze.
- Anbieter-Plugins können Modellkataloge über `registerProvider({ catalog })` einspeisen;
  OpenClaw führt diese Ausgabe vor dem Schreiben von
  `models.json` in `models.providers` zusammen.
- Anbieter-Manifeste können `providerAuthEnvVars` und
  `providerAuthAliases` deklarieren, damit generische umgebungsvariablenbasierte Authentifizierungsprüfungen und Anbietervarianten
  keine Plugin-Laufzeit laden müssen. Die verbleibende zentrale Env-Var-Zuordnung ist jetzt
  nur noch für Nicht-Plugin-/Kernanbieter und einige generische Präzedenzfälle gedacht, wie
  etwa Anthropic-Onboarding mit API-Schlüssel zuerst.
- Anbieter-Plugins können außerdem das Laufzeitverhalten des Anbieters übernehmen über
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
  `onModelSelected`.
- Hinweis: Laufzeit-`capabilities` des Anbieters sind Metadaten des gemeinsamen Runners (Anbieterfamilie, Besonderheiten bei Transkripten/Tools, Transport-/Cache-Hinweise). Sie sind nicht
  dasselbe wie das [öffentliche Fähigkeitsmodell](/de/plugins/architecture#public-capability-model),
  das beschreibt, was ein Plugin registriert (Textinferenz, Sprache usw.).
- Der gebündelte `codex`-Anbieter ist mit dem gebündelten Codex-Agent-Harness gekoppelt.
  Verwenden Sie `codex/gpt-*`, wenn Sie von Codex verwalteten Login, Modellerkennung, natives
  Fortsetzen von Threads und Ausführung auf dem App-Server möchten. Normale `openai/gpt-*`-Referenzen verwenden weiterhin
  den OpenAI-Anbieter und den normalen OpenClaw-Anbietertransport.
  Reine Codex-Bereitstellungen können den automatischen PI-Fallback mit
  `agents.defaults.embeddedHarness.fallback: "none"` deaktivieren; siehe
  [Codex Harness](/de/plugins/codex-harness).

## Plugin-eigenes Anbieterverhalten

Anbieter-Plugins können jetzt den Großteil der anbieterspezifischen Logik übernehmen, während OpenClaw
die generische Inferenzschleife beibehält.

Typische Aufteilung:

- `auth[].run` / `auth[].runNonInteractive`: Der Anbieter übernimmt Onboarding-/Login-Abläufe
  für `openclaw onboard`, `openclaw models auth` und Headless-Setup
- `wizard.setup` / `wizard.modelPicker`: Der Anbieter übernimmt Labels für Authentifizierungsoptionen,
  veraltete Aliasse, Hinweise für Onboarding-Allowlists und Setup-Einträge in Onboarding-/Modellauswahlen
- `catalog`: Der Anbieter erscheint in `models.providers`
- `normalizeModelId`: Der Anbieter normalisiert veraltete/Vorschau-Modell-IDs vor
  Lookup oder Kanonisierung
- `normalizeTransport`: Der Anbieter normalisiert `api` / `baseUrl` der Transportfamilie
  vor der generischen Modellzusammenstellung; OpenClaw prüft zuerst den passenden Anbieter,
  dann andere Hook-fähige Anbieter-Plugins, bis eines den
  Transport tatsächlich ändert
- `normalizeConfig`: Der Anbieter normalisiert die Konfiguration `models.providers.<id>` vor
  der Nutzung zur Laufzeit; OpenClaw prüft zuerst den passenden Anbieter, dann andere
  Hook-fähige Anbieter-Plugins, bis eines die Konfiguration tatsächlich ändert. Wenn kein
  Anbieter-Hook die Konfiguration umschreibt, normalisieren gebündelte Helfer der Google-Familie weiterhin
  unterstützte Google-Anbietereinträge.
- `applyNativeStreamingUsageCompat`: Der Anbieter wendet endpointgesteuerte Kompatibilitäts-Umschreibungen für native Streaming-Nutzung auf Konfigurationsanbieter an
- `resolveConfigApiKey`: Der Anbieter löst Env-Marker-Authentifizierung für Konfigurationsanbieter auf,
  ohne das vollständige Laden der Laufzeit-Authentifizierung zu erzwingen. `amazon-bedrock` hat hier außerdem einen
  eingebauten AWS-Env-Marker-Resolver, obwohl die Bedrock-Laufzeit-Authentifizierung
  die AWS-SDK-Standardkette verwendet.
- `resolveSyntheticAuth`: Der Anbieter kann lokale/selbstgehostete oder andere
  konfigurationsgestützte Verfügbarkeit von Authentifizierung bereitstellen, ohne Klartext-Geheimnisse zu persistieren
- `shouldDeferSyntheticProfileAuth`: Der Anbieter kann gespeicherte synthetische Profil-
  Platzhalter als geringere Priorität als env-/konfigurationsgestützte Authentifizierung markieren
- `resolveDynamicModel`: Der Anbieter akzeptiert Modell-IDs, die noch nicht im lokalen
  statischen Katalog vorhanden sind
- `prepareDynamicModel`: Der Anbieter benötigt eine Aktualisierung der Metadaten, bevor die dynamische
  Auflösung erneut versucht wird
- `normalizeResolvedModel`: Der Anbieter benötigt Umschreibungen für Transport oder Basis-URL
- `contributeResolvedModelCompat`: Der Anbieter steuert Kompatibilitäts-Flags für seine
  Herstellermodelle bei, auch wenn sie über einen anderen kompatiblen Transport kommen
- `capabilities`: Der Anbieter veröffentlicht Besonderheiten zu Transkripten/Tools/Anbieterfamilien
- `normalizeToolSchemas`: Der Anbieter bereinigt Tool-Schemas, bevor der eingebettete
  Runner sie sieht
- `inspectToolSchemas`: Der Anbieter zeigt transportspezifische Schemawarnungen
  nach der Normalisierung an
- `resolveReasoningOutputMode`: Der Anbieter wählt native oder markierte
  Verträge für Reasoning-Ausgaben
- `prepareExtraParams`: Der Anbieter setzt Standardwerte oder normalisiert anfragespezifische Parameter pro Modell
- `createStreamFn`: Der Anbieter ersetzt den normalen Streaming-Pfad durch einen vollständig
  benutzerdefinierten Transport
- `wrapStreamFn`: Der Anbieter wendet Wrapper für Anfrage-Header/-Body/Modellkompatibilität an
- `resolveTransportTurnState`: Der Anbieter liefert native Transport-
  Header oder Metadaten pro Turn
- `resolveWebSocketSessionPolicy`: Der Anbieter liefert native WebSocket-Sitzungs-
  Header oder eine Cooldown-Richtlinie für Sitzungen
- `createEmbeddingProvider`: Der Anbieter übernimmt das Embedding-Verhalten für den Speicher, wenn es
  beim Anbieter-Plugin statt beim zentralen Embedding-Switchboard liegen soll
- `formatApiKey`: Der Anbieter formatiert gespeicherte Authentifizierungsprofile in die zur Laufzeit
  erwartete `apiKey`-Zeichenfolge des Transports
- `refreshOAuth`: Der Anbieter übernimmt die OAuth-Aktualisierung, wenn die gemeinsamen `pi-ai`-
  Refresher nicht ausreichen
- `buildAuthDoctorHint`: Der Anbieter fügt Reparaturhinweise an, wenn die OAuth-Aktualisierung
  fehlschlägt
- `matchesContextOverflowError`: Der Anbieter erkennt anbieterspezifische
  Fehler bei Überschreitung des Kontextfensters, die generische Heuristiken übersehen würden
- `classifyFailoverReason`: Der Anbieter ordnet anbieterspezifische rohe Transport-/API-
  Fehler Failover-Gründen wie Ratenbegrenzung oder Überlastung zu
- `isCacheTtlEligible`: Der Anbieter entscheidet, welche Upstream-Modell-IDs Prompt-Cache-TTL unterstützen
- `buildMissingAuthMessage`: Der Anbieter ersetzt den generischen Fehler des Authentifizierungsspeichers
  durch einen anbieterspezifischen Wiederherstellungshinweis
- `suppressBuiltInModel`: Der Anbieter blendet veraltete Upstream-Zeilen aus und kann einen
  herstellereigenen Fehler für direkte Auflösungsfehler zurückgeben
- `augmentModelCatalog`: Der Anbieter fügt nach
  Erkennung und Konfigurationszusammenführung synthetische/finale Katalogzeilen an
- `isBinaryThinking`: Der Anbieter übernimmt die UX für binäres Denken ein/aus
- `supportsXHighThinking`: Der Anbieter aktiviert `xhigh` für ausgewählte Modelle
- `resolveDefaultThinkingLevel`: Der Anbieter übernimmt die standardmäßige `/think`-Richtlinie für eine
  Modellfamilie
- `applyConfigDefaults`: Der Anbieter wendet anbieterspezifische globale Standardwerte
  während der Materialisierung der Konfiguration basierend auf Authentifizierungsmodus, Umgebung oder Modellfamilie an
- `isModernModelRef`: Der Anbieter übernimmt die bevorzugte Modellzuordnung für Live-/Smoke-Tests
- `prepareRuntimeAuth`: Der Anbieter wandelt konfigurierte Zugangsdaten in ein kurzlebiges
  Laufzeit-Token um
- `resolveUsageAuth`: Der Anbieter löst Anmeldedaten für Nutzung/Kontingent für `/usage`
  und verwandte Status-/Berichtsoberflächen auf
- `fetchUsageSnapshot`: Der Anbieter übernimmt Abruf/Parsing des Nutzungsendpunkts, während
  der Kern weiterhin die Zusammenfassungs-Shell und Formatierung übernimmt
- `onModelSelected`: Der Anbieter führt Nebenwirkungen nach der Modellauswahl aus, wie
  Telemetrie oder anbietereigene Sitzungsbuchführung

Aktuelle gebündelte Beispiele:

- `anthropic`: Claude-4.6-Forward-Compat-Fallback, Hinweise zur Auth-Reparatur, Abfrage des Usage-Endpunkts, Cache-TTL-/Provider-Family-Metadaten und auth-bewusste globale Konfigurationsstandards
- `amazon-bedrock`: Provider-eigenes Context-Overflow-Matching und Failover-Grundklassifizierung für Bedrock-spezifische Throttle-/Not-Ready-Fehler sowie die gemeinsame Replay-Familie `anthropic-by-model` für Claude-only-Replay-Policy-Guards auf Anthropic-Traffic
- `anthropic-vertex`: Claude-only-Replay-Policy-Guards auf Anthropic-Message-Traffic
- `openrouter`: Durchreichen von Modell-IDs, Request-Wrapper, Hinweise zu Provider-Fähigkeiten, Bereinigung von Gemini-Thought-Signatures auf Proxy-Gemini-Traffic, Proxy-Reasoning-Injektion über die Stream-Familie `openrouter-thinking`, Weiterleitung von Routing-Metadaten und Cache-TTL-Policy
- `github-copilot`: Onboarding/Device-Login, Forward-Compat-Modell-Fallback, Claude-Thinking-Transkripthinweise, Runtime-Token-Austausch und Abfrage des Usage-Endpunkts
- `openai`: GPT-5.4-Forward-Compat-Fallback, direkte OpenAI-Transport-Normalisierung, Codex-bewusste Hinweise bei fehlender Auth, Spark-Unterdrückung, synthetische OpenAI-/Codex-Katalogzeilen, Thinking-/Live-Model-Policy, Usage-Token-Alias-Normalisierung (`input`-/`output`- und `prompt`-/`completion`-Familien), die gemeinsame Stream-Familie `openai-responses-defaults` für native OpenAI-/Codex-Wrapper, Provider-Family-Metadaten, gebündelte Registrierung des Image-Generation-Providers für `gpt-image-1` und gebündelte Registrierung des Video-Generation-Providers für `sora-2`
- `google` und `google-gemini-cli`: Gemini-3.1-Forward-Compat-Fallback, native Gemini-Replay-Validierung, Bootstrap-Replay-Bereinigung, getaggter Reasoning-Output-Modus, Modern-Model-Matching, gebündelte Registrierung des Image-Generation-Providers für Gemini-Image-Preview-Modelle und gebündelte Registrierung des Video-Generation-Providers für Veo-Modelle; Gemini-CLI-OAuth besitzt außerdem die Token-Formatierung des Auth-Profils, Usage-Token-Parsing und die Abfrage des Quota-Endpunkts für Usage-Oberflächen
- `moonshot`: gemeinsamer Transport, Plugin-eigene Normalisierung von Thinking-Payloads
- `kilocode`: gemeinsamer Transport, Plugin-eigene Request-Header, Normalisierung von Reasoning-Payloads, Bereinigung von Proxy-Gemini-Thought-Signatures und Cache-TTL-Policy
- `zai`: GLM-5-Forward-Compat-Fallback, Standards für `tool_stream`, Cache-TTL-Policy, Binary-Thinking-/Live-Model-Policy sowie Usage-Auth und Quota-Abfrage; unbekannte `glm-5*`-IDs werden aus dem gebündelten Template `glm-4.7` synthetisiert
- `xai`: native Responses-Transport-Normalisierung, Alias-Umschreibungen für `/fast` bei schnellen Grok-Varianten, Standard für `tool_stream`, xAI-spezifische Bereinigung von Tool-Schemas / Reasoning-Payloads und gebündelte Registrierung des Video-Generation-Providers für `grok-imagine-video`
- `mistral`: Plugin-eigene Capability-Metadaten
- `opencode` und `opencode-go`: Plugin-eigene Capability-Metadaten sowie Bereinigung von Proxy-Gemini-Thought-Signatures
- `alibaba`: Plugin-eigener Video-Generation-Katalog für direkte Wan-Modellreferenzen wie `alibaba/wan2.6-t2v`
- `byteplus`: Plugin-eigene Kataloge sowie gebündelte Registrierung des Video-Generation-Providers für Seedance-Text-zu-Video-/Bild-zu-Video-Modelle
- `fal`: gebündelte Registrierung des Video-Generation-Providers für gehostete Drittanbieter, Registrierung des Image-Generation-Providers für FLUX-Image-Modelle sowie gebündelte Registrierung des Video-Generation-Providers für gehostete Drittanbieter-Video-Modelle
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` und `volcengine`:
  nur Plugin-eigene Kataloge
- `qwen`: Plugin-eigene Kataloge für Textmodelle sowie gemeinsame Registrierungen für Media-Understanding- und Video-Generation-Provider für seine multimodalen Oberflächen; die Qwen-Videogenerierung verwendet die Standard-DashScope-Videoendpunkte mit gebündelten Wan-Modellen wie `wan2.6-t2v` und `wan2.7-r2v`
- `runway`: Plugin-eigene Registrierung des Video-Generation-Providers für native Runway-aufgabenbasierte Modelle wie `gen4.5`
- `minimax`: Plugin-eigene Kataloge, gebündelte Registrierung des Video-Generation-Providers für Hailuo-Videomodelle, gebündelte Registrierung des Image-Generation-Providers für `image-01`, hybride Anthropic-/OpenAI-Replay-Policy-Auswahl und Usage-Auth-/Snapshot-Logik
- `together`: Plugin-eigene Kataloge sowie gebündelte Registrierung des Video-Generation-Providers für Wan-Videomodelle
- `xiaomi`: Plugin-eigene Kataloge sowie Usage-Auth-/Snapshot-Logik

Das gebündelte Plugin `openai` besitzt jetzt beide Provider-IDs: `openai` und
`openai-codex`.

Damit sind die Provider abgedeckt, die noch in die normalen Transporte von OpenClaw passen. Ein Provider,
der einen vollständig benutzerdefinierten Request-Executor benötigt, ist eine separate, tiefere Extension-Oberfläche.

## Rotation von API-Schlüsseln

- Unterstützt generische Provider-Rotation für ausgewählte Provider.
- Konfiguriere mehrere Schlüssel über:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
  - `<PROVIDER>_API_KEYS` (durch Komma oder Semikolon getrennte Liste)
  - `<PROVIDER>_API_KEY` (primärer Schlüssel)
  - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)
- Für Google-Provider wird `GOOGLE_API_KEY` zusätzlich als Fallback einbezogen.
- Die Reihenfolge der Schlüsselauswahl bewahrt die Priorität und entfernt Duplikate.
- Requests werden nur bei Rate-Limit-Antworten mit dem nächsten Schlüssel erneut versucht (zum
  Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` oder periodische Usage-Limit-Meldungen).
- Fehler, die keine Rate-Limit-Fehler sind, schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
- Wenn alle Kandidatenschlüssel fehlschlagen, wird der letzte Fehler aus dem letzten Versuch zurückgegeben.

## Eingebaute Provider (pi-ai-Katalog)

OpenClaw wird mit dem pi‑ai-Katalog ausgeliefert. Diese Provider benötigen **keine**
`models.providers`-Konfiguration; setze einfach Auth + wähle ein Modell.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` sowie `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Der Standardtransport ist `auto` (zuerst WebSocket, SSE als Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- Das Warm-up für OpenAI Responses WebSocket ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- OpenAI-Priority-Processing kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Requests auf `api.openai.com` `service_tier=priority` zu
- Verwende `params.serviceTier`, wenn du eine explizite Tier-Stufe statt des gemeinsamen Schalters `/fast` möchtest
- Versteckte OpenClaw-Attribution-Header (`originator`, `version`,
  `User-Agent`) gelten nur für nativen OpenAI-Traffic zu `api.openai.com`, nicht
  für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und
  OpenAI-Reasoning-kompatibles Payload-Shaping bei; Proxy-Routen tun das nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil die Live-OpenAI-API es ablehnt; Spark wird als nur für Codex behandelt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` sowie `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Requests unterstützen ebenfalls den gemeinsamen Schalter `/fast` und `params.fastMode`, einschließlich per API-Key und OAuth authentifiziertem Traffic, der an `api.anthropic.com` gesendet wird; OpenClaw ordnet das Anthropic-`service_tier` zu (`auto` vs. `standard_only`)
- Anthropic-Hinweis: Anthropic-Mitarbeiter haben uns mitgeteilt, dass OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Der Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt jetzt die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.

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
- Der Standardtransport ist `auto` (zuerst WebSocket, SSE als Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird ebenfalls bei nativen Codex-Responses-Requests weitergeleitet (`chatgpt.com/backend-api`)
- Versteckte OpenClaw-Attribution-Header (`originator`, `version`,
  `User-Agent`) werden nur an nativen Codex-Traffic zu
  `chatgpt.com/backend-api` angehängt, nicht an generische OpenAI-kompatible Proxys
- Nutzt denselben Schalter `/fast` und dieselbe `params.fastMode`-Konfiguration wie direktes `openai/*`; OpenClaw ordnet das `service_tier=priority` zu
- `openai-codex/gpt-5.3-codex-spark` bleibt verfügbar, wenn der Codex-OAuth-Katalog es bereitstellt; abhängig von Berechtigungen
- `openai-codex/gpt-5.4` behält natives `contextWindow = 1050000` und ein Standard-Runtime-`contextTokens = 272000`; überschreibe die Runtime-Obergrenze mit `models.providers.openai-codex.models[].contextTokens`
- Richtlinienhinweis: OpenAI Codex OAuth wird ausdrücklich für externe Tools/Workflows wie OpenClaw unterstützt.

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

### Andere abonnementartige gehostete Optionen

- [Qwen Cloud](/de/providers/qwen): Qwen-Cloud-Provider-Oberfläche sowie Alibaba-DashScope- und Coding-Plan-Endpunktzuordnung
- [MiniMax](/de/providers/minimax): MiniMax-Coding-Plan-OAuth- oder API-Key-Zugriff
- [GLM Models](/de/providers/glm): Z.AI Coding Plan oder allgemeine API-Endpunkte

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
- Kompatibilität: ältere OpenClaw-Konfigurationen mit `google/gemini-3.1-flash-preview` werden zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Direkte Gemini-Läufe akzeptieren auch `agents.defaults.models["google/<model>"].params.cachedContent`
  (oder das ältere `cached_content`), um ein provider-natives
  `cachedContents/...`-Handle weiterzuleiten; Gemini-Cache-Treffer erscheinen in OpenClaw als `cacheRead`

### Google Vertex und Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Flow
- Vorsicht: Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Nutzer haben berichtet, dass ihre Google-Konten nach der Nutzung von Drittanbieter-Clients eingeschränkt wurden. Prüfe die Google-Bedingungen und verwende ein unkritisches Konto, wenn du dich dafür entscheidest.
- Gemini-CLI-OAuth wird als Teil des gebündelten Plugins `google` ausgeliefert.
  - Installiere zuerst Gemini CLI:
    - `brew install gemini-cli`
    - oder `npm install -g @google/gemini-cli`
  - Aktivieren: `openclaw plugins enable google`
  - Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Standardmodell: `google-gemini-cli/gemini-3-flash-preview`
  - Hinweis: Du fügst **keine** Client-ID und kein Secret in `openclaw.json` ein. Der CLI-Login-Flow speichert
    Tokens in Auth-Profilen auf dem Gateway-Host.
  - Wenn Requests nach der Anmeldung fehlschlagen, setze `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  - Gemini-CLI-JSON-Antworten werden aus `response` geparst; Usage fällt auf
    `stats` zurück, wobei `stats.cached` in OpenClaw zu `cacheRead` normalisiert wird.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.1`
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
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- Der statische Fallback-Katalog wird mit `kilocode/kilo/auto` ausgeliefert; die Live-Erkennung über
  `https://api.kilo.ai/api/gateway/models` kann den Runtime-Katalog
  weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` liegt in der Verantwortung von Kilo Gateway
  und ist in OpenClaw nicht fest codiert.

Siehe [/providers/kilocode](/de/providers/kilocode) für Einrichtungsdetails.

### Weitere gebündelte Provider-Plugins

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Beispielmodell: `openrouter/auto`
- OpenClaw wendet die dokumentierten App-Attribution-Header von OpenRouter nur an, wenn
  das Request tatsächlich auf `openrouter.ai` zielt
- OpenRouter-spezifische Anthropic-`cache_control`-Marker sind ebenfalls auf
  verifizierte OpenRouter-Routen beschränkt, nicht auf beliebige Proxy-URLs
- OpenRouter bleibt auf dem proxyartigen OpenAI-kompatiblen Pfad, daher werden natives
  OpenAI-only-Request-Shaping (`serviceTier`, Responses-`store`,
  Prompt-Cache-Hinweise, OpenAI-Reasoning-kompatible Payloads) nicht weitergeleitet
- Gemini-gestützte OpenRouter-Referenzen behalten nur die Bereinigung von Proxy-Gemini-Thought-Signatures
  bei; native Gemini-Replay-Validierung und Bootstrap-Umschreibungen bleiben deaktiviert
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Beispielmodell: `kilocode/kilo/auto`
- Gemini-gestützte Kilo-Referenzen behalten denselben Pfad zur Bereinigung von Proxy-Gemini-Thought-Signatures
  bei; `kilocode/kilo/auto` und andere Hinweise ohne Unterstützung für Proxy-Reasoning
  überspringen die Injektion von Proxy-Reasoning
- MiniMax: `minimax` (API-Key) und `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`
- Beispielmodell: `minimax/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7`
- Das MiniMax-Onboarding / die API-Key-Einrichtung schreibt explizite M2.7-Modell-Definitionen mit
  `input: ["text", "image"]`; der gebündelte Provider-Katalog behält die Chat-Referenzen
  text-only, bis diese Provider-Konfiguration materialisiert wird
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
    `grok-4` und `grok-4-0709` auf ihre `*-fast`-Varianten um
  - `tool_stream` ist standardmäßig aktiviert; setze
    `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
    es zu deaktivieren
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- Beispielmodell: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - GLM-Modelle auf Cerebras verwenden die IDs `zai-glm-4.7` und `zai-glm-4.6`.
  - OpenAI-kompatible Basis-URL: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Beispielmodell für Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Siehe [Hugging Face (Inference)](/de/providers/huggingface).

## Provider über `models.providers` (benutzerdefinierte/Basis-URL)

Verwende `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder
OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten stehenden gebündelten Provider-Plugins veröffentlichen bereits einen Standardkatalog.
Verwende explizite Einträge unter `models.providers.<id>` nur dann, wenn du die
Standard-Basis-URL, Header oder Modellliste überschreiben möchtest.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Provider-Plugin ausgeliefert. Verwende standardmäßig den eingebauten Provider
und füge nur dann einen expliziten Eintrag `models.providers.moonshot` hinzu, wenn du
die Basis-URL oder Modellmetadaten überschreiben musst:

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

Das ältere `kimi/k2p5` bleibt als Kompatibilitäts-Modell-ID weiterhin akzeptiert.

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

Das Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine Katalog `volcengine/*`
wird gleichzeitig registriert.

In den Modell-Auswahlen für Onboarding/Konfiguration bevorzugt die Volcengine-Auth-Auswahl sowohl
Zeilen mit `volcengine/*` als auch mit `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, anstatt einen leeren
provider-spezifischen Picker anzuzeigen.

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

### BytePlus (International)

BytePlus ARK bietet internationalen Nutzern Zugriff auf dieselben Modelle wie Volcano Engine.

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

Das Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine Katalog `byteplus/*`
wird gleichzeitig registriert.

In den Modell-Auswahlen für Onboarding/Konfiguration bevorzugt die BytePlus-Auth-Auswahl sowohl
Zeilen mit `byteplus/*` als auch mit `byteplus-plan/*`. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, anstatt einen leeren
provider-spezifischen Picker anzuzeigen.

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

Synthetic stellt Anthropic-kompatible Modelle hinter dem Provider `synthetic` bereit:

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

MiniMax wird über `models.providers` konfiguriert, weil es benutzerdefinierte Endpunkte verwendet:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-Key (Global): `--auth-choice minimax-global-api`
- MiniMax API-Key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder
  `MINIMAX_API_KEY` für `minimax-portal`

Siehe [/providers/minimax](/de/providers/minimax) für Einrichtungsdetails, Modelloptionen und Konfigurations-Snippets.

Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking standardmäßig,
es sei denn, du setzt es ausdrücklich, und `/fast on` schreibt
`MiniMax-M2.7` auf `MiniMax-M2.7-highspeed` um.

Plugin-eigene Aufteilung der Fähigkeiten:

- Text-/Chat-Standards bleiben auf `minimax/MiniMax-M2.7`
- Bildgenerierung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist das Plugin-eigene `MiniMax-VL-01` auf beiden MiniMax-Auth-Pfaden
- Websuche bleibt auf der Provider-ID `minimax`

### LM Studio

LM Studio wird als gebündeltes Provider-Plugin ausgeliefert, das die native API verwendet:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- Standard-Basis-URL für Inferenz: `http://localhost:1234/v1`

Setze dann ein Modell (ersetze es durch eine der IDs, die von `http://localhost:1234/api/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw verwendet die nativen Endpunkte `/api/v1/models` und `/api/v1/models/load` von LM Studio
für Discovery + Auto-Load und standardmäßig `/v1/chat/completions` für Inferenz.
Siehe [/providers/lmstudio](/de/providers/lmstudio) für Einrichtung und Fehlerbehebung.

### Ollama

Ollama wird als gebündeltes Provider-Plugin ausgeliefert und verwendet die native API von Ollama:

- Provider: `ollama`
- Auth: Nicht erforderlich (lokaler Server)
- Beispielmodell: `ollama/llama3.3`
- Installation: [https://ollama.com/download](https://ollama.com/download)

```bash
# Installiere Ollama und lade dann ein Modell:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn du dich mit
`OLLAMA_API_KEY` dafür entscheidest, und das gebündelte Provider-Plugin fügt Ollama direkt zu
`openclaw onboard` und der Modellauswahl hinzu. Siehe [/providers/ollama](/de/providers/ollama)
für Onboarding, Cloud-/Lokalmodus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Provider-Plugin für lokale/selbst gehostete OpenAI-kompatible
Server ausgeliefert:

- Provider: `vllm`
- Auth: Optional (abhängig von deinem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

Um dich lokal für die automatische Erkennung zu entscheiden (jeder Wert funktioniert, wenn dein Server keine Auth erzwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Setze dann ein Modell (ersetze es durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Siehe [/providers/vllm](/de/providers/vllm) für Details.

### SGLang

SGLang wird als gebündeltes Provider-Plugin für schnelle selbst gehostete
OpenAI-kompatible Server ausgeliefert:

- Provider: `sglang`
- Auth: Optional (abhängig von deinem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

Um dich lokal für die automatische Erkennung zu entscheiden (jeder Wert funktioniert, wenn dein Server keine Auth
erzwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Setze dann ein Modell (ersetze es durch eine der IDs, die von `/v1/models` zurückgegeben werden):

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
      models: { "lmstudio/my-local-model": { alias: "Lokal" } },
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
            name: "Lokales Modell",
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
- Empfohlen: Setze explizite Werte, die zu den Grenzwerten deines Proxys/Modells passen.
- Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist) erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um Provider-400-Fehler für nicht unterstützte `developer`-Rollen zu vermeiden.
- Proxyartige OpenAI-kompatible Routen überspringen ebenfalls natives
  OpenAI-only-Request-Shaping: kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise, kein
  OpenAI-Reasoning-kompatibles Payload-Shaping und keine versteckten OpenClaw-Attribution-Header.
- Wenn `baseUrl` leer ist/weggelassen wird, behält OpenClaw das Standardverhalten von OpenAI bei (das zu `api.openai.com` aufgelöst wird).
- Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpunkten weiterhin überschrieben.

## CLI-Beispiele

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Siehe auch: [/gateway/configuration](/de/gateway/configuration) für vollständige Konfigurationsbeispiele.

## Verwandt

- [Models](/de/concepts/models) — Modellkonfiguration und Aliasse
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten und Retry-Verhalten
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Modell-Konfigurationsschlüssel
- [Providers](/de/providers) — Einrichtungsanleitungen pro Provider
