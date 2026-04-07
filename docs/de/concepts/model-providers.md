---
read_when:
    - Sie benötigen eine Einrichtungsreferenz für Modelle nach Anbieter gegliedert
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modellanbieter
summary: Übersicht über Modellanbieter mit Beispielkonfigurationen + CLI-Abläufen
title: Modellanbieter
x-i18n:
    generated_at: "2026-04-07T06:16:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9c1f7f8cf09b6047a64189f7440811aafc93d01335f76969afd387cc54c7ab5
    source_path: concepts/model-providers.md
    workflow: 15
---

# Modellanbieter

Diese Seite behandelt **LLM-/Modellanbieter** (nicht Chat-Kanäle wie WhatsApp/Telegram).
Regeln zur Modellauswahl finden Sie unter [/concepts/models](/de/concepts/models).

## Kurze Regeln

- Modellreferenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
- Wenn Sie `agents.defaults.models` festlegen, wird dies zur Zulassungsliste.
- CLI-Helfer: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- Fallback-Laufzeitregeln, Cooldown-Sondierungen und die Persistenz von Sitzungsüberschreibungen
  sind in [/concepts/model-failover](/de/concepts/model-failover) dokumentiert.
- `models.providers.*.models[].contextWindow` sind native Modellmetadaten;
  `models.providers.*.models[].contextTokens` ist die effektive Laufzeitobergrenze.
- Anbieter-Plugins können Modellkataloge über `registerProvider({ catalog })` einschleusen;
  OpenClaw führt diese Ausgabe vor dem Schreiben von
  `models.json` in `models.providers` zusammen.
- Anbieter-Manifeste können `providerAuthEnvVars` deklarieren, sodass generische
  umgebungsvariablenbasierte Auth-Sondierungen die Plugin-Laufzeit nicht laden müssen. Die verbleibende zentrale Env-Var-
  Zuordnung ist jetzt nur noch für Nicht-Plugin-/Core-Anbieter und einige generische Vorrang-
  Fälle gedacht, etwa Anthropic-Onboarding mit API-Schlüssel-vor-zuerst.
- Anbieter-Plugins können das Laufzeitverhalten des Anbieters auch selbst steuern über
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
  `prepareRuntimeAuth`, `resolveUsageAuth`, `fetchUsageSnapshot`, und
  `onModelSelected`.
- Hinweis: Die Anbieter-Laufzeit-`capabilities` sind gemeinsam genutzte Runner-Metadaten (Anbieter-
  Familie, Eigenheiten bei Transkripten/Tooling, Transport-/Cache-Hinweise). Sie sind nicht dasselbe
  wie das [öffentliche Fähigkeitsmodell](/de/plugins/architecture#public-capability-model),
  das beschreibt, was ein Plugin registriert (Textinferenz, Sprache usw.).

## Plugin-eigenes Anbieterverhalten

Anbieter-Plugins können nun den Großteil der anbieterspezifischen Logik selbst übernehmen, während OpenClaw
die generische Inferenzschleife beibehält.

Typische Aufteilung:

- `auth[].run` / `auth[].runNonInteractive`: Der Anbieter steuert Onboarding-/Login-
  Abläufe für `openclaw onboard`, `openclaw models auth` und die kopflose Einrichtung
- `wizard.setup` / `wizard.modelPicker`: Der Anbieter steuert Beschriftungen für Auth-Auswahlen,
  Legacy-Aliasse, Hinweise zu Onboarding-Zulassungslisten und Einrichtungseinträge in Onboarding-/Modellauswahlen
- `catalog`: Der Anbieter erscheint in `models.providers`
- `normalizeModelId`: Der Anbieter normalisiert Legacy-/Preview-Modell-IDs vor
  Suche oder Kanonisierung
- `normalizeTransport`: Der Anbieter normalisiert `api` / `baseUrl` der Transportfamilie
  vor der generischen Modellzusammenstellung; OpenClaw prüft zuerst den passenden Anbieter,
  dann andere hook-fähige Anbieter-Plugins, bis eines den
  Transport tatsächlich ändert
- `normalizeConfig`: Der Anbieter normalisiert die Konfiguration `models.providers.<id>` bevor
  die Laufzeit sie verwendet; OpenClaw prüft zuerst den passenden Anbieter, dann andere
  hook-fähige Anbieter-Plugins, bis eines die Konfiguration tatsächlich ändert. Wenn kein
  Anbieter-Hook die Konfiguration umschreibt, normalisieren gebündelte Google-Familien-Helfer weiterhin
  unterstützte Google-Anbietereinträge.
- `applyNativeStreamingUsageCompat`: Der Anbieter wendet endpointgesteuerte native Streaming-Usage-Kompatibilitätsanpassungen für Konfigurationsanbieter an
- `resolveConfigApiKey`: Der Anbieter löst Env-Marker-Auth für Konfigurationsanbieter auf,
  ohne das vollständige Laufzeit-Auth-Laden zu erzwingen. `amazon-bedrock` hat hier ebenfalls einen
  integrierten AWS-Env-Marker-Resolver, obwohl die Bedrock-Laufzeit-Auth
  die AWS-SDK-Standardkette verwendet.
- `resolveSyntheticAuth`: Der Anbieter kann die Verfügbarkeit lokaler/selbstgehosteter oder anderer
  konfigurationsgestützter Auth verfügbar machen, ohne Klartext-Geheimnisse zu persistieren
- `shouldDeferSyntheticProfileAuth`: Der Anbieter kann gespeicherte synthetische Profil-
  Platzhalter als niedrigere Priorität als env-/konfigurationsgestützte Auth markieren
- `resolveDynamicModel`: Der Anbieter akzeptiert Modell-IDs, die im lokalen
  statischen Katalog noch nicht vorhanden sind
- `prepareDynamicModel`: Der Anbieter benötigt vor dem erneuten Versuch der
  dynamischen Auflösung eine Metadatenaktualisierung
- `normalizeResolvedModel`: Der Anbieter benötigt Umschreibungen von Transport oder Basis-URL
- `contributeResolvedModelCompat`: Der Anbieter steuert Kompatibilitäts-Flags für seine
  Herstellermodelle bei, selbst wenn sie über einen anderen kompatiblen Transport eintreffen
- `capabilities`: Der Anbieter veröffentlicht Eigenheiten bei Transkripten/Tooling/Anbieterfamilie
- `normalizeToolSchemas`: Der Anbieter bereinigt Tool-Schemas, bevor der eingebettete
  Runner sie sieht
- `inspectToolSchemas`: Der Anbieter zeigt transportspezifische Schemawarnungen
  nach der Normalisierung an
- `resolveReasoningOutputMode`: Der Anbieter wählt native oder markierte
  Verträge für Reasoning-Ausgaben
- `prepareExtraParams`: Der Anbieter setzt Standardwerte oder normalisiert anfragebezogene Parameter pro Modell
- `createStreamFn`: Der Anbieter ersetzt den normalen Stream-Pfad durch einen vollständig
  benutzerdefinierten Transport
- `wrapStreamFn`: Der Anbieter wendet Wrapper für Anforderungsheader/-Body/Modellkompatibilität an
- `resolveTransportTurnState`: Der Anbieter liefert native Transport-
  Header oder Metadaten pro Zug
- `resolveWebSocketSessionPolicy`: Der Anbieter liefert native WebSocket-Sitzungs-
  Header oder eine Sitzungs-Cooldown-Richtlinie
- `createEmbeddingProvider`: Der Anbieter steuert das Verhalten von Memory-Embeddings, wenn es
  beim Anbieter-Plugin statt bei der zentralen Embedding-Schaltzentrale liegen soll
- `formatApiKey`: Der Anbieter formatiert gespeicherte Auth-Profile in den von
  dem Transport erwarteten Laufzeit-String `apiKey`
- `refreshOAuth`: Der Anbieter steuert die OAuth-Aktualisierung, wenn die gemeinsamen `pi-ai`-
  Refresher nicht ausreichen
- `buildAuthDoctorHint`: Der Anbieter ergänzt Reparaturhinweise, wenn die OAuth-Aktualisierung
  fehlschlägt
- `matchesContextOverflowError`: Der Anbieter erkennt anbieterspezifische
  Fehler bei Kontextfenster-Überläufen, die generische Heuristiken übersehen würden
- `classifyFailoverReason`: Der Anbieter ordnet anbieterspezifische rohe Transport-/API-
  Fehler Failover-Gründen wie Ratenlimit oder Überlastung zu
- `isCacheTtlEligible`: Der Anbieter entscheidet, welche Upstream-Modell-IDs Prompt-Cache-TTL unterstützen
- `buildMissingAuthMessage`: Der Anbieter ersetzt den generischen Auth-Store-Fehler
  durch einen anbieterspezifischen Wiederherstellungshinweis
- `suppressBuiltInModel`: Der Anbieter blendet veraltete Upstream-Zeilen aus und kann einen
  herstellereigenen Fehler für direkte Auflösungsfehler zurückgeben
- `augmentModelCatalog`: Der Anbieter hängt synthetische/finale Katalogzeilen nach
  Discovery und Konfigurationszusammenführung an
- `isBinaryThinking`: Der Anbieter steuert die binäre Ein/Aus-Thinking-UX
- `supportsXHighThinking`: Der Anbieter aktiviert für ausgewählte Modelle `xhigh`
- `resolveDefaultThinkingLevel`: Der Anbieter steuert die Standardrichtlinie für `/think` einer
  Modellfamilie
- `applyConfigDefaults`: Der Anbieter wendet anbieterspezifische globale Standardwerte
  während der Konfigurationsmaterialisierung basierend auf Auth-Modus, Env oder Modellfamilie an
- `isModernModelRef`: Der Anbieter steuert die Zuordnung bevorzugter Modelle für Live-/Smoke-Tests
- `prepareRuntimeAuth`: Der Anbieter wandelt eine konfigurierte Zugangsinformation in ein kurz-
  lebiges Laufzeit-Token um
- `resolveUsageAuth`: Der Anbieter löst Nutzungs-/Kontingent-Zugangsdaten für `/usage`
  und zugehörige Status-/Berichtsoberflächen auf
- `fetchUsageSnapshot`: Der Anbieter steuert das Abrufen/Parsen des Nutzungsendpunkts, während
  Core weiterhin die Zusammenfassungshülle und Formatierung übernimmt
- `onModelSelected`: Der Anbieter führt nach der Auswahl Seiteneffekte aus, etwa
  Telemetrie oder anbietereigene Sitzungsbuchhaltung

Aktuelle gebündelte Beispiele:

- `anthropic`: zukunftskompatibler Claude-4.6-Fallback, Auth-Reparaturhinweise, Abruf von
  Nutzungsendpunkten, Cache-TTL-/Anbieterfamilien-Metadaten und auth-bewusste globale
  Konfigurationsstandardwerte
- `amazon-bedrock`: anbietereigene Erkennung von Kontextüberläufen und Failover-
  Grundklassifikation für Bedrock-spezifische Throttle-/Not-ready-Fehler sowie
  die gemeinsame Replay-Familie `anthropic-by-model` für Claude-spezifische Replay-Richtlinien-
  Schutzmaßnahmen bei Anthropic-Datenverkehr
- `anthropic-vertex`: Claude-spezifische Replay-Richtlinien-Schutzmaßnahmen für Anthropic-Message-
  Datenverkehr
- `openrouter`: durchgereichte Modell-IDs, Anforderungs-Wrapper, Anbieter-Fähigkeits-
  Hinweise, Gemini-Thought-Signature-Bereinigung bei proxybasiertem Gemini-Datenverkehr,
  Proxy-Reasoning-Injektion über die Stream-Familie `openrouter-thinking`, Weiterleitung von Routing-
  Metadaten und Cache-TTL-Richtlinie
- `github-copilot`: Onboarding/Geräte-Login, zukunftskompatibler Modell-Fallback,
  Claude-Thinking-Transkript-Hinweise, Laufzeit-Token-Austausch und Abruf von
  Nutzungsendpunkten
- `openai`: zukunftskompatibler GPT-5.4-Fallback, direkte OpenAI-Transport-
  Normalisierung, Codex-bewusste Hinweise bei fehlender Auth, Spark-Unterdrückung, synthetische
  OpenAI-/Codex-Katalogzeilen, Thinking-/Live-Modell-Richtlinie, Normalisierung von Usage-Token-Aliassen
  (`input` / `output` und `prompt` / `completion`-Familien), die gemeinsame Stream-Familie
  `openai-responses-defaults` für native OpenAI-/Codex-Wrapper, Metadaten zur Anbieterfamilie,
  gebündelte Registrierung eines Bildgenerierungsanbieters
  für `gpt-image-1` und gebündelte Registrierung eines Videogenerierungsanbieters
  für `sora-2`
- `google` und `google-gemini-cli`: zukunftskompatibler Gemini-3.1-Fallback,
  native Gemini-Replay-Validierung, Bereinigung von Bootstrap-Replays, markierter
  Modus für Reasoning-Ausgaben, Zuordnung moderner Modelle, gebündelte Registrierung eines Bildgenerierungs-
  anbieter für Gemini-Image-Preview-Modelle und gebündelte
  Registrierung eines Videogenerierungsanbieters für Veo-Modelle; Gemini CLI OAuth steuert außerdem
  die Formatierung von Auth-Profil-Token, das Parsen von Usage-Token und das Abrufen von Kontingentendpunkten
  für Nutzungsoberflächen
- `moonshot`: gemeinsamer Transport, plugin-eigene Normalisierung von Thinking-Payloads
- `kilocode`: gemeinsamer Transport, plugin-eigene Anforderungsheader, Normalisierung von Reasoning-Payloads,
  Bereinigung von Proxy-Gemini-Thought-Signatures und Cache-TTL-
  Richtlinie
- `zai`: zukunftskompatibler GLM-5-Fallback, Standardwerte für `tool_stream`, Cache-TTL-
  Richtlinie, binäre Thinking-/Live-Modell-Richtlinie und Usage-Auth + Kontingentabruf;
  unbekannte `glm-5*`-IDs werden aus der gebündelten Vorlage `glm-4.7` synthetisiert
- `xai`: native Responses-Transport-Normalisierung, Umschreibungen von `/fast`-Aliasen für
  Grok-Fast-Varianten, Standardwert `tool_stream`, xAI-spezifische Bereinigung von Tool-Schema /
  Reasoning-Payload und gebündelte Registrierung eines Videogenerierungsanbieters
  für `grok-imagine-video`
- `mistral`: plugin-eigene Fähigkeitsmetadaten
- `opencode` und `opencode-go`: plugin-eigene Fähigkeitsmetadaten plus
  Bereinigung von Proxy-Gemini-Thought-Signatures
- `alibaba`: plugin-eigener Videogenerierungskatalog für direkte Wan-Modellreferenzen
  wie `alibaba/wan2.6-t2v`
- `byteplus`: plugin-eigene Kataloge plus gebündelte Registrierung eines Videogenerierungsanbieters
  für Seedance-Text-zu-Video-/Bild-zu-Video-Modelle
- `fal`: gebündelte Registrierung eines Videogenerierungsanbieters für gehostete Drittanbieter-
  Registrierung eines Bildgenerierungsanbieters für FLUX-Bildmodelle plus gebündelte
  Registrierung eines Videogenerierungsanbieters für gehostete Drittanbieter-Videomodelle
- `cloudflare-ai-gateway`, `huggingface`, `kimi`, `nvidia`, `qianfan`,
  `stepfun`, `synthetic`, `venice`, `vercel-ai-gateway` und `volcengine`:
  nur plugin-eigene Kataloge
- `qwen`: plugin-eigene Kataloge für Textmodelle plus gemeinsame
  Registrierungen von Media-Understanding- und Videogenerierungsanbietern für seine
  multimodalen Oberflächen; Qwen-Videogenerierung verwendet die Standard-DashScope-Video-
  Endpunkte mit gebündelten Wan-Modellen wie `wan2.6-t2v` und `wan2.7-r2v`
- `runway`: plugin-eigene Registrierung eines Videogenerierungsanbieters für native
  aufgabenbasierte Runway-Modelle wie `gen4.5`
- `minimax`: plugin-eigene Kataloge, gebündelte Registrierung eines Videogenerierungsanbieters
  für Hailuo-Videomodelle, gebündelte Registrierung eines Bildgenerierungsanbieters
  für `image-01`, hybride Auswahl von Anthropic/OpenAI-Replay-Richtlinien sowie
  Usage-Auth-/Snapshot-Logik
- `together`: plugin-eigene Kataloge plus gebündelte Registrierung eines Videogenerierungsanbieters
  für Wan-Videomodelle
- `xiaomi`: plugin-eigene Kataloge plus Usage-Auth-/Snapshot-Logik

Das gebündelte `openai`-Plugin steuert jetzt beide Anbieter-IDs: `openai` und
`openai-codex`.

Das deckt Anbieter ab, die noch in die normalen Transporte von OpenClaw passen. Ein Anbieter,
der einen vollständig benutzerdefinierten Anforderungsausführer benötigt, ist eine separate, tiefere Erweiterungsoberfläche.

## Rotation von API-Schlüsseln

- Unterstützt generische Anbieterrotation für ausgewählte Anbieter.
- Konfigurieren Sie mehrere Schlüssel über:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
  - `<PROVIDER>_API_KEYS` (durch Komma oder Semikolon getrennte Liste)
  - `<PROVIDER>_API_KEY` (primärer Schlüssel)
  - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)
- Für Google-Anbieter ist `GOOGLE_API_KEY` außerdem als Fallback enthalten.
- Die Auswahlreihenfolge der Schlüssel wahrt die Priorität und entfernt doppelte Werte.
- Anforderungen werden nur bei Antworten mit Ratenbegrenzung mit dem nächsten Schlüssel wiederholt (zum
  Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` oder periodische Usage-Limit-Meldungen).
- Fehler ohne Ratenbegrenzung schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
- Wenn alle Kandidatenschlüssel fehlschlagen, wird der letzte Fehler aus dem letzten Versuch zurückgegeben.

## Integrierte Anbieter (pi-ai-Katalog)

OpenClaw wird mit dem pi‑ai-Katalog ausgeliefert. Diese Anbieter benötigen **keine**
`models.providers`-Konfiguration; setzen Sie einfach Auth und wählen Sie ein Modell.

### OpenAI

- Anbieter: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.4`, `openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Der Standardtransport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- OpenAI-Responses-WebSocket-Warm-up ist standardmäßig über `params.openaiWsWarmup` aktiviert (`true`/`false`)
- OpenAI-Priority-Processing kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` ordnen direkte `openai/*`-Responses-Anforderungen auf `api.openai.com` `service_tier=priority` zu
- Verwenden Sie `params.serviceTier`, wenn Sie eine explizite Stufe anstelle des gemeinsamen `/fast`-Toggles möchten
- Versteckte OpenClaw-Attributionsheader (`originator`, `version`,
  `User-Agent`) gelten nur für nativen OpenAI-Datenverkehr zu `api.openai.com`, nicht
  für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten auch Responses-`store`, Prompt-Cache-Hinweise und
  OpenAI-Reasoning-Kompatibilitäts-Payload-Formung bei; Proxy-Routen nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil die Live-OpenAI-API es ablehnt; Spark wird als nur-Codex behandelt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Anbieter: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Anforderungen unterstützen den gemeinsamen `/fast`-Toggle und `params.fastMode`, einschließlich API-Schlüssel- und OAuth-authentifiziertem Datenverkehr zu `api.anthropic.com`; OpenClaw ordnet dies Anthropic-`service_tier` zu (`auto` vs `standard_only`)
- Anthropic-Hinweis: Anthropic-Mitarbeitende haben uns mitgeteilt, dass OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Tokenpfad verfügbar, aber OpenClaw bevorzugt nun die Wiederverwendung von Claude CLI und `claude -p`, wenn verfügbar.

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
- Der Standardtransport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Pro Modell überschreiben über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird auch bei nativen Codex-Responses-Anforderungen weitergereicht (`chatgpt.com/backend-api`)
- Versteckte OpenClaw-Attributionsheader (`originator`, `version`,
  `User-Agent`) werden nur an nativen Codex-Datenverkehr zu
  `chatgpt.com/backend-api` angehängt, nicht an generische OpenAI-kompatible Proxys
- Verwendet denselben `/fast`-Toggle und dieselbe `params.fastMode`-Konfiguration wie direktes `openai/*`; OpenClaw ordnet dies `service_tier=priority` zu
- `openai-codex/gpt-5.3-codex-spark` bleibt verfügbar, wenn der Codex-OAuth-Katalog es bereitstellt; abhängig von Berechtigungen
- `openai-codex/gpt-5.4` behält natives `contextWindow = 1050000` und ein Standard-Laufzeitlimit von `contextTokens = 272000`; überschreiben Sie die Laufzeitobergrenze mit `models.providers.openai-codex.models[].contextTokens`
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

### Andere gehostete Optionen im Abonnementstil

- [Qwen Cloud](/de/providers/qwen): Anbieteroberfläche von Qwen Cloud plus Zuordnung von Alibaba-DashScope- und Coding-Plan-Endpunkten
- [MiniMax](/de/providers/minimax): OAuth- oder API-Schlüssel-Zugriff für MiniMax Coding Plan
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
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, `GOOGLE_API_KEY` als Fallback und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: Legacy-OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Direkte Gemini-Läufe akzeptieren auch `agents.defaults.models["google/<model>"].params.cachedContent`
  (oder das Legacy-`cached_content`), um ein anbieterinternes
  Handle `cachedContents/...` weiterzuleiten; Gemini-Cache-Treffer erscheinen als OpenClaw-`cacheRead`

### Google Vertex und Gemini CLI

- Anbieter: `google-vertex`, `google-gemini-cli`
- Auth: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Ablauf
- Vorsicht: Gemini CLI OAuth in OpenClaw ist eine inoffizielle Integration. Einige Nutzer haben nach der Verwendung von Drittanbieter-Clients Einschränkungen bei Google-Konten gemeldet. Prüfen Sie die Google-Bedingungen und verwenden Sie bei Bedarf ein nicht kritisches Konto.
- Gemini CLI OAuth wird als Teil des gebündelten `google`-Plugins ausgeliefert.
  - Installieren Sie zuerst Gemini CLI:
    - `brew install gemini-cli`
    - oder `npm install -g @google/gemini-cli`
  - Aktivieren: `openclaw plugins enable google`
  - Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Standardmodell: `google-gemini-cli/gemini-3.1-pro-preview`
  - Hinweis: Sie fügen **keine** Client-ID oder kein Secret in `openclaw.json` ein. Der CLI-Login-Ablauf speichert
    Tokens in Auth-Profilen auf dem Gateway-Host.
  - Wenn Anforderungen nach dem Login fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  - Gemini-CLI-JSON-Antworten werden aus `response` geparst; die Nutzung greift als Fallback auf
    `stats` zurück, wobei `stats.cached` in OpenClaw-`cacheRead` normalisiert wird.

### Z.AI (GLM)

- Anbieter: `zai`
- Auth: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasse: `z.ai/*` und `z-ai/*` werden zu `zai/*` normalisiert
  - `zai-api-key` erkennt automatisch den passenden Z.AI-Endpunkt; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

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
- Der statische Fallback-Katalog liefert `kilocode/kilo/auto`; die Live-
  Discovery von `https://api.kilo.ai/api/gateway/models` kann den Laufzeit-
  Katalog weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` wird von Kilo Gateway gesteuert
  und ist in OpenClaw nicht fest codiert.

Einrichtungsdetails finden Sie unter [/providers/kilocode](/de/providers/kilocode).

### Andere gebündelte Anbieter-Plugins

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- Beispielmodell: `openrouter/auto`
- OpenClaw wendet die dokumentierten App-Attributionsheader von OpenRouter nur an, wenn
  die Anfrage tatsächlich an `openrouter.ai` geht
- OpenRouter-spezifische Anthropic-`cache_control`-Marker werden ebenfalls nur auf
  verifizierten OpenRouter-Routen angewendet, nicht auf beliebigen Proxy-URLs
- OpenRouter bleibt auf dem proxyartigen OpenAI-kompatiblen Pfad, daher wird natives
  nur-OpenAI-Anforderungs-Shaping (`serviceTier`, Responses-`store`,
  Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilitäts-Payloads) nicht weitergeleitet
- Auf Gemini basierende OpenRouter-Referenzen behalten nur die Proxy-Gemini-Bereinigung von Thought-Signatures
  bei; native Gemini-Replay-Validierung und Bootstrap-Umschreibungen bleiben deaktiviert
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- Beispielmodell: `kilocode/kilo/auto`
- Auf Gemini basierende Kilo-Referenzen behalten denselben Pfad zur Proxy-Gemini-Bereinigung von Thought-Signatures;
  `kilocode/kilo/auto` und andere Hinweise ohne Unterstützung für Proxy-Reasoning
  überspringen die Proxy-Reasoning-Injektion
- MiniMax: `minimax` (API-Schlüssel) und `minimax-portal` (OAuth)
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder `MINIMAX_API_KEY` für `minimax-portal`
- Beispielmodell: `minimax/MiniMax-M2.7` oder `minimax-portal/MiniMax-M2.7`
- MiniMax-Onboarding/API-Schlüssel-Einrichtung schreibt explizite M2.7-Modelldefinitionen mit
  `input: ["text", "image"]`; der gebündelte Anbieter-Katalog hält die Chat-Referenzen
  text-only, bis diese Anbieter-Konfiguration materialisiert wird
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
  - Native gebündelte xAI-Anforderungen verwenden den xAI-Responses-Pfad
  - `/fast` oder `params.fastMode: true` schreiben `grok-3`, `grok-3-mini`,
    `grok-4` und `grok-4-0709` auf ihre `*-fast`-Varianten um
  - `tool_stream` ist standardmäßig aktiviert; setzen Sie
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
- Hugging Face Inference Beispielmodell: `huggingface/deepseek-ai/DeepSeek-R1`; CLI: `openclaw onboard --auth-choice huggingface-api-key`. Siehe [Hugging Face (Inference)](/de/providers/huggingface).

## Anbieter über `models.providers` (benutzerdefiniert/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Anbieter oder
OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Anbieter-Plugins veröffentlichen bereits einen Standardkatalog.
Verwenden Sie explizite `models.providers.<id>`-Einträge nur dann, wenn Sie die
standardmäßige Basis-URL, Header oder Modellliste überschreiben möchten.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Anbieter-Plugin ausgeliefert. Verwenden Sie standardmäßig den integrierten Anbieter
und fügen Sie einen expliziten Eintrag `models.providers.moonshot` nur hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben
müssen:

- Anbieter: `moonshot`
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

Das Legacy-`kimi/k2p5` bleibt als Kompatibilitätsmodell-ID akzeptiert.

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

Beim Onboarding ist standardmäßig die Coding-Oberfläche ausgewählt, aber der allgemeine `volcengine/*`-
Katalog wird gleichzeitig registriert.

In Onboarding-/Modellkonfigurations-Auswahlen bevorzugt die Volcengine-Auth-Auswahl sowohl
Zeilen `volcengine/*` als auch `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere
anbieterspezifische Auswahl anzuzeigen.

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

Beim Onboarding ist standardmäßig die Coding-Oberfläche ausgewählt, aber der allgemeine `byteplus/*`-
Katalog wird gleichzeitig registriert.

In Onboarding-/Modellkonfigurations-Auswahlen bevorzugt die BytePlus-Auth-Auswahl sowohl
Zeilen `byteplus/*` als auch `byteplus-plan/*`. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere
anbieterspezifische Auswahl anzuzeigen.

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

MiniMax wird über `models.providers` konfiguriert, da es benutzerdefinierte Endpunkte verwendet:

- MiniMax OAuth (global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-Schlüssel (global): `--auth-choice minimax-global-api`
- MiniMax API-Schlüssel (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder
  `MINIMAX_API_KEY` für `minimax-portal`

Einrichtungsdetails, Modelloptionen und Konfigurationsbeispiele finden Sie unter [/providers/minimax](/de/providers/minimax).

Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking standardmäßig,
sofern Sie es nicht ausdrücklich festlegen, und `/fast on` schreibt
`MiniMax-M2.7` auf `MiniMax-M2.7-highspeed` um.

Aufteilung der plugin-eigenen Fähigkeiten:

- Text-/Chat-Standardwerte bleiben bei `minimax/MiniMax-M2.7`
- Bildgenerierung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist das plugin-eigene `MiniMax-VL-01` auf beiden MiniMax-Auth-Pfaden
- Websuche bleibt bei der Anbieter-ID `minimax`

### Ollama

Ollama wird als gebündeltes Anbieter-Plugin ausgeliefert und verwendet die native API von Ollama:

- Anbieter: `ollama`
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
`OLLAMA_API_KEY` dafür anmelden, und das gebündelte Anbieter-Plugin fügt Ollama direkt zu
`openclaw onboard` und der Modellauswahl hinzu. Siehe [/providers/ollama](/de/providers/ollama)
für Onboarding, Cloud-/Lokalmodus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Anbieter-Plugin für lokale/selbstgehostete OpenAI-kompatible
Server ausgeliefert:

- Anbieter: `vllm`
- Auth: Optional (hängt von Ihrem Server ab)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

So melden Sie sich lokal für die automatische Erkennung an (beliebiger Wert funktioniert, wenn Ihr Server keine Auth erzwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Legen Sie dann ein Modell fest (ersetzen Sie dies durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Einzelheiten finden Sie unter [/providers/vllm](/de/providers/vllm).

### SGLang

SGLang wird als gebündeltes Anbieter-Plugin für schnelle selbstgehostete
OpenAI-kompatible Server ausgeliefert:

- Anbieter: `sglang`
- Auth: Optional (hängt von Ihrem Server ab)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

So melden Sie sich lokal für die automatische Erkennung an (beliebiger Wert funktioniert, wenn Ihr Server keine Auth nicht
erzwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Legen Sie dann ein Modell fest (ersetzen Sie dies durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Einzelheiten finden Sie unter [/providers/sglang](/de/providers/sglang).

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

- Für benutzerdefinierte Anbieter sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional.
  Wenn sie weggelassen werden, verwendet OpenClaw standardmäßig:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Empfohlen: Setzen Sie explizite Werte, die zu den Limits Ihres Proxys/Modells passen.
- Für `api: "openai-completions"` auf nicht nativen Endpunkten (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist), setzt OpenClaw `compat.supportsDeveloperRole: false` zwangsweise, um Anbieter-400-Fehler für nicht unterstützte `developer`-Rollen zu vermeiden.
- Proxyartige OpenAI-kompatible Routen überspringen ebenfalls natives nur-OpenAI-
  Anforderungs-Shaping: kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise, keine
  OpenAI-Reasoning-Kompatibilitäts-Payload-Formung und keine versteckten OpenClaw-Attributions-
  Header.
- Wenn `baseUrl` leer ist oder weggelassen wird, behält OpenClaw das Standard-OpenAI-Verhalten bei (das zu `api.openai.com` aufgelöst wird).
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
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten und Wiederholungsverhalten
- [Configuration Reference](/de/gateway/configuration-reference#agent-defaults) — Modellkonfigurationsschlüssel
- [Providers](/de/providers) — anbieterbezogene Einrichtungsanleitungen
