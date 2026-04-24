---
read_when:
    - Sie erstellen ein neues Modell-Provider-Plugin.
    - Sie möchten einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen.
    - Sie möchten Provider-Authentifizierung, Kataloge und Runtime-Hooks verstehen.
sidebarTitle: Provider plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modell-Provider-Plugins für OpenClaw
title: Provider-Plugins erstellen
x-i18n:
    generated_at: "2026-04-24T06:50:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: bef17d1e9944f041c29a578ceab20835d82c8e846a401048676211237fdbc499
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

Diese Anleitung führt Sie durch das Erstellen eines Provider-Plugins, das einen Modell-Provider
(LLM) zu OpenClaw hinzufügt. Am Ende haben Sie einen Provider mit Modellkatalog,
API-Key-Authentifizierung und dynamischer Modellauflösung.

<Info>
  Wenn Sie noch nie ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Getting Started](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und das Setup des Manifests.
</Info>

<Tip>
  Provider-Plugins fügen Modelle zur normalen Inferenzschleife von OpenClaw hinzu. Wenn das Modell
  über einen nativen Agent-Daemon laufen muss, der Threads, Compaction oder Tool-
  Events besitzt, kombinieren Sie den Provider mit einem [agent harness](/de/plugins/sdk-agent-harness),
  statt Protokolldetails des Daemons in Core abzulegen.
</Tip>

## Walkthrough

<Steps>
  <Step title="Paket und Manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Das Manifest deklariert `providerAuthEnvVars`, damit OpenClaw
    Zugangsdaten erkennen kann, ohne die Runtime Ihres Plugins zu laden. Fügen Sie `providerAuthAliases`
    hinzu, wenn eine Provider-Variante die Authentifizierung einer anderen Provider-ID wiederverwenden soll. `modelSupport`
    ist optional und ermöglicht OpenClaw das automatische Laden Ihres Provider-Plugins aus Kurzformen
    von Modell-IDs wie `acme-large`, noch bevor Runtime-Hooks existieren. Wenn Sie den
    Provider auf ClawHub veröffentlichen, sind diese Felder `openclaw.compat` und `openclaw.build`
    in `package.json` erforderlich.

  </Step>

  <Step title="Den Provider registrieren">
    Ein minimaler Provider benötigt `id`, `label`, `auth` und `catalog`:

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    Das ist ein funktionierender Provider. Benutzer können jetzt
    `openclaw onboard --acme-ai-api-key <key>` ausführen und
    `acme-ai/acme-large` als ihr Modell auswählen.

    Wenn der Upstream-Provider andere Kontroll-Tokens als OpenClaw verwendet, fügen Sie
    eine kleine bidirektionale Texttransformation hinzu, statt den Stream-Pfad zu ersetzen:

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` schreibt den finalen System-Prompt und den Textinhalt von Nachrichten vor
    dem Transport um. `output` schreibt Text-Deltas und finalen Text des Assistant um, bevor
    OpenClaw seine eigenen Kontrollmarker oder die Kanalzustellung parst.

    Für gebündelte Provider, die nur einen Text-Provider mit API-Key-
    Authentifizierung plus eine einzelne kataloggestützte Runtime registrieren, bevorzugen Sie den engeren
    Helper `defineSingleProviderPluginEntry(...)`:

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider` ist der Live-Katalogpfad, der verwendet wird, wenn OpenClaw echte
    Provider-Authentifizierung auflösen kann. Er kann providerspezifische Erkennung ausführen. Verwenden Sie
    `buildStaticProvider` nur für Offline-Zeilen, die sicher angezeigt werden können, bevor Authentifizierung
    konfiguriert ist; sie darf keine Zugangsdaten benötigen oder Netzwerkanfragen ausführen.
    Die Anzeige `models list --all` von OpenClaw führt derzeit statische Kataloge
    nur für gebündelte Provider-Plugins aus, mit leerer Konfiguration, leerer Umgebung und ohne
    Agent-/Workspace-Pfade.

    Wenn Ihr Auth-Flow außerdem `models.providers.*`, Aliasse und das
    Standardmodell des Agenten während des Onboarding patchen muss, verwenden Sie die Preset-Helper aus
    `openclaw/plugin-sdk/provider-onboard`. Die engsten Helper sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn der native Endpunkt eines Providers Streaming-Usage-Blöcke auf dem
    normalen Transport `openai-completions` unterstützt, bevorzugen Sie die gemeinsamen Katalog-Helper aus
    `openclaw/plugin-sdk/provider-catalog-shared`, statt Checks für Provider-IDs fest zu codieren. `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen Unterstützung anhand der Endpoint-Capability-Map,
    sodass native Endpunkte im Stil von Moonshot/DashScope trotzdem ein Opt-in erhalten, auch wenn ein Plugin eine benutzerdefinierte Provider-ID verwendet.

  </Step>

  <Step title="Dynamische Modellauflösung hinzufügen">
    Wenn Ihr Provider beliebige Modell-IDs akzeptiert (wie ein Proxy oder Router),
    fügen Sie `resolveDynamicModel` hinzu:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog von oben

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    Wenn das Auflösen einen Netzwerkaufruf erfordert, verwenden Sie `prepareDynamicModel` für asynchrones
    Warm-up — `resolveDynamicModel` läuft erneut, nachdem es abgeschlossen ist.

  </Step>

  <Step title="Runtime-Hooks hinzufügen (bei Bedarf)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks
    schrittweise hinzu, wenn Ihr Provider sie benötigt.

    Gemeinsame Helper-Builder decken jetzt die häufigsten Familien für Replay/Tool-Kompatibilität
    ab, sodass Plugins normalerweise nicht jeden Hook einzeln manuell verdrahten müssen:

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    Heute verfügbare Replay-Familien:

    | Familie | Was sie verdrahtet | Gebündelte Beispiele |
    | --- | --- | --- |
    | `openai-compatible` | Gemeinsame OpenAI-artige Replay-Richtlinie für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Call-IDs, Korrekturen bei der Reihenfolge Assistant-first und generischer Gemini-Turn-Validierung, wenn der Transport sie benötigt | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | Claude-bewusste Replay-Richtlinie, gewählt nach `modelId`, sodass Transporte für Anthropic-Nachrichten Claude-spezifische Bereinigung von Thinking-Blöcken nur erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini-Replay-Richtlinie plus Bereinigung von Bootstrap-Replays und getaggter Modus für Reasoning-Ausgaben | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | Bereinigung von Gemini-Thought-Signaturen für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte laufen; aktiviert weder native Gemini-Replay-Validierung noch Umschreibungen beim Bootstrap | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Provider, die in einem Plugin Anthropic-Nachrichtenoberflächen und OpenAI-kompatible Modelloberflächen mischen; optionales Entfernen von Thinking-Blöcken nur für Claude bleibt auf die Anthropic-Seite begrenzt | `minimax` |

    Heute verfügbare Stream-Familien:

    | Familie | Was sie verdrahtet | Gebündelte Beispiele |
    | --- | --- | --- |
    | `google-thinking` | Normalisierung von Gemini-Thinking-Nutzlasten auf dem gemeinsamen Stream-Pfad | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs injiziertes Thinking überspringen | `kilocode` |
    | `moonshot-thinking` | Zuordnung nativer binärer Thinking-Nutzlasten von Moonshot aus Konfiguration + `/think`-Level | `moonshot` |
    | `minimax-fast-mode` | Umschreiben des Modells für den Fast-Modus von MiniMax auf dem gemeinsamen Stream-Pfad | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Gemeinsame native OpenAI-/Codex-Responses-Wrapper: Attribution-Header, `/fast`/`serviceTier`, Text-Verbose-Stufe, native Codex-Websuche, Shaping von reasoning-kompatiblen Nutzlasten und Context Management für Responses | `openai`, `openai-codex` |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei Überspringen bei nicht unterstützten Modellen/`auto` zentral behandelt wird | `openrouter` |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie Z.AI, die Tool-Streaming möchten, sofern es nicht explizit deaktiviert wird | `zai` |

    <Accordion title="SDK-Seams, die die Family Builder antreiben">
      Jeder Family Builder setzt sich aus niedrigerliegenden öffentlichen Helpern zusammen, die aus demselben Paket exportiert werden und auf die Sie zurückgreifen können, wenn ein Provider vom allgemeinen Muster abweichen muss:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` und die rohen Replay-Builder (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Exportiert außerdem Gemini-Replay-Helper (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) und Endpoint-/Modell-Helper (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`).
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)` sowie die gemeinsamen OpenAI-/Codex-Wrapper (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`) und gemeinsame Proxy-/Provider-Wrapper (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, zugrunde liegende Helper für Gemini-Schemas (`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`) und xAI-Kompatibilitäts-Helper (`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). Das gebündelte xAI-Plugin verwendet `normalizeResolvedModel` + `contributeResolvedModelCompat` damit, um xAI-Regeln beim Provider zu belassen.

      Einige Stream-Helper bleiben absichtlich providerspezifisch lokal. `@openclaw/anthropic-provider` behält `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die niedrigeren Builder für Anthropic-Wrapper in seiner eigenen öffentlichen `api.ts`-/`contract-api.ts`-Seam, weil sie das Handling von Claude-OAuth-Betas und `context1m`-Gating kodieren. Das xAI-Plugin behält auf ähnliche Weise natives xAI-Responses-Shaping in seinem eigenen `wrapStreamFn` (Aliasse für `/fast`, Standard-`tool_stream`, Bereinigung nicht unterstützter Strict-Tools, Entfernen xAI-spezifischer Reasoning-Nutzlasten).

      Dasselbe Muster mit Paket-Root unterstützt auch `@openclaw/openai-provider` (Provider-Builder, Helper für Standardmodelle, Builder für Realtime-Provider) und `@openclaw/openrouter-provider` (Provider-Builder plus Helper für Onboarding/Konfiguration).
    </Accordion>

    <Tabs>
      <Tab title="Token-Austausch">
        Für Provider, die vor jedem Inferenzaufruf einen Token-Austausch benötigen:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="Benutzerdefinierte Header">
        Für Provider, die benutzerdefinierte Request-Header oder Änderungen am Body benötigen:

        ```typescript
        // wrapStreamFn gibt ein StreamFn zurück, das von ctx.streamFn abgeleitet ist
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="Native Transportidentität">
        Für Provider, die native Request-/Session-Header oder Metadaten auf
        generischen HTTP- oder WebSocket-Transporten benötigen:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="Nutzung und Abrechnung">
        Für Provider, die Daten zu Nutzung/Abrechnung bereitstellen:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="Alle verfügbaren Provider-Hooks">
      OpenClaw ruft Hooks in dieser Reihenfolge auf. Die meisten Provider verwenden nur 2–3:

      | # | Hook | Wann zu verwenden |
      | --- | --- | --- |
      | 1 | `catalog` | Modellkatalog oder Standardwerte für Base-URL |
      | 2 | `applyConfigDefaults` | globale Standardwerte im Besitz des Providers bei der Materialisierung der Konfiguration |
      | 3 | `normalizeModelId` | Bereinigung älterer/Vorschau-Aliasse für Modell-IDs vor der Suche |
      | 4 | `normalizeTransport` | Bereinigung von `api` / `baseUrl` für Provider-Familien vor der generischen Modellzusammenstellung |
      | 5 | `normalizeConfig` | `models.providers.<id>`-Konfiguration normalisieren |
      | 6 | `applyNativeStreamingUsageCompat` | Rewrites für native Streaming-Usage-Kompatibilität bei Konfigurationsprovidern |
      | 7 | `resolveConfigApiKey` | Auflösung von Env-Marker-Authentifizierung im Besitz des Providers |
      | 8 | `resolveSyntheticAuth` | synthetische lokale/selbst gehostete oder konfigurationsgestützte Auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | synthetische Platzhalter aus gespeicherten Profilen hinter Env-/Konfigurationsauth zurückstellen |
      | 10 | `resolveDynamicModel` | beliebige Upstream-Modell-IDs akzeptieren |
      | 11 | `prepareDynamicModel` | asynchrones Abrufen von Metadaten vor dem Auflösen |
      | 12 | `normalizeResolvedModel` | Transport-Rewrites vor dem Runner |
      | 13 | `contributeResolvedModelCompat` | Kompatibilitätsflags für Vendor-Modelle hinter einem anderen kompatiblen Transport |
      | 14 | `capabilities` | älterer statischer Capability-Bag; nur für Kompatibilität |
      | 15 | `normalizeToolSchemas` | Bereinigung von Tool-Schemas im Besitz des Providers vor der Registrierung |
      | 16 | `inspectToolSchemas` | Diagnostik von Tool-Schemas im Besitz des Providers |
      | 17 | `resolveReasoningOutputMode` | Vertrag für getaggte vs. native Reasoning-Ausgabe |
      | 18 | `prepareExtraParams` | Standard-Request-Parameter |
      | 19 | `createStreamFn` | vollständig benutzerdefinierter StreamFn-Transport |
      | 20 | `wrapStreamFn` | Wrapper für benutzerdefinierte Header/Bodys auf dem normalen Stream-Pfad |
      | 21 | `resolveTransportTurnState` | native Header/Metadaten pro Turn |
      | 22 | `resolveWebSocketSessionPolicy` | native WS-Session-Header/Cool-down |
      | 23 | `formatApiKey` | benutzerdefinierte Runtime-Token-Form |
      | 24 | `refreshOAuth` | benutzerdefinierte OAuth-Aktualisierung |
      | 25 | `buildAuthDoctorHint` | Hinweise zur Reparatur von Auth |
      | 26 | `matchesContextOverflowError` | Erkennung von Überläufen im Besitz des Providers |
      | 27 | `classifyFailoverReason` | Klassifikation von Rate-Limit/Überlastung im Besitz des Providers |
      | 28 | `isCacheTtlEligible` | Gating für Prompt-Cache-TTL |
      | 29 | `buildMissingAuthMessage` | benutzerdefinierter Hinweis bei fehlender Auth |
      | 30 | `suppressBuiltInModel` | veraltete Upstream-Zeilen ausblenden |
      | 31 | `augmentModelCatalog` | synthetische Zeilen für Forward-Kompatibilität |
      | 32 | `resolveThinkingProfile` | modellabhängige Optionsmenge für `/think` |
      | 33 | `isBinaryThinking` | Kompatibilität für binäres Thinking ein/aus |
      | 34 | `supportsXHighThinking` | Kompatibilität für `xhigh`-Reasoning |
      | 35 | `resolveDefaultThinkingLevel` | Kompatibilität für Standardrichtlinie von `/think` |
      | 36 | `isModernModelRef` | Abgleich für Live-/Smoke-Modelle |
      | 37 | `prepareRuntimeAuth` | Token-Austausch vor Inferenz |
      | 38 | `resolveUsageAuth` | benutzerdefiniertes Parsen von Usage-Credentials |
      | 39 | `fetchUsageSnapshot` | benutzerdefinierter Usage-Endpunkt |
      | 40 | `createEmbeddingProvider` | Embedding-Adapter im Besitz des Providers für Memory/Suche |
      | 41 | `buildReplayPolicy` | benutzerdefinierte Richtlinie für Transcript-Replay/Compaction |
      | 42 | `sanitizeReplayHistory` | providerspezifische Replay-Rewrites nach generischer Bereinigung |
      | 43 | `validateReplayTurns` | strikte Validierung von Replay-Turns vor dem eingebetteten Runner |
      | 44 | `onModelSelected` | Callback nach der Auswahl (z. B. Telemetrie) |

      Hinweise zu Runtime-Fallbacks:

      - `normalizeConfig` prüft zuerst den passenden Provider und dann andere Hook-fähige Provider-Plugins, bis tatsächlich eines die Konfiguration ändert. Wenn kein Provider-Hook einen unterstützten Google-Familien-Konfigurationseintrag umschreibt, greift weiterhin der gebündelte Google-Konfigurations-Normalizer.
      - `resolveConfigApiKey` verwendet den Provider-Hook, wenn er exponiert wird. Der gebündelte Pfad `amazon-bedrock` hat hier außerdem einen eingebauten AWS-Env-Marker-Resolver, obwohl die Runtime-Auth von Bedrock selbst weiterhin die Standardkette des AWS SDK verwendet.
      - `resolveSystemPromptContribution` erlaubt einem Provider, cache-aware Hinweise für den System-Prompt einer Modellfamilie zu injizieren. Bevorzugen Sie ihn gegenüber `before_prompt_build`, wenn das Verhalten zu einer Provider-/Modellfamilie gehört und die stabile/dynamische Cache-Aufteilung erhalten bleiben soll.

      Detaillierte Beschreibungen und Beispiele aus der Praxis finden Sie unter [Internals: Provider Runtime Hooks](/de/plugins/architecture-internals#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Zusätzliche Funktionen hinzufügen (optional)">
    Ein Provider-Plugin kann neben Textinferenz auch Sprache, Realtime-Transkription, Realtime-
    Voice, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Fetch
    und Websuche registrieren. OpenClaw klassifiziert dies als
    **hybrid-capability**-Plugin — das empfohlene Muster für Firmen-Plugins
    (ein Plugin pro Vendor). Siehe
    [Internals: Capability Ownership](/de/plugins/architecture#capability-ownership-model).

    Registrieren Sie jede Fähigkeit innerhalb von `register(api)` zusammen mit Ihrem bestehenden
    Aufruf `api.registerProvider(...)`. Wählen Sie nur die Tabs aus, die Sie benötigen:

    <Tabs>
      <Tab title="Sprache (TTS)">
        ```typescript
        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => ({
            audioBuffer: Buffer.from(/* PCM-Daten */),
            outputFormat: "mp3",
            fileExtension: ".mp3",
            voiceCompatible: false,
          }),
        });
        ```
      </Tab>
      <Tab title="Realtime-Transkription">
        Bevorzugen Sie `createRealtimeTranscriptionWebSocketSession(...)` — der gemeinsame
        Helper übernimmt Proxy-Erfassung, Reconnect-Backoff, Flush bei Close, Ready-Handshakes, Audio-Queueing und Diagnostik von Close-Events. Ihr Plugin
        bildet nur Upstream-Events ab.

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        Batch-STT-Provider, die Multipart-Audio per POST senden, sollten
        `buildAudioTranscriptionFormData(...)` aus
        `openclaw/plugin-sdk/provider-http` verwenden. Der Helper normalisiert Upload-
        Dateinamen, einschließlich AAC-Uploads, die für kompatible Transkriptions-APIs einen Dateinamen im Stil von M4A benötigen.
      </Tab>
      <Tab title="Realtime-Voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```
      </Tab>
      <Tab title="Medienverständnis">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Bild- und Videogenerierung">
        Videofunktionen verwenden eine **modusbewusste** Form: `generate`,
        `imageToVideo` und `videoToVideo`. Flache aggregierte Felder wie
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` reichen nicht aus, um Unterstützung für Transformationsmodi oder deaktivierte Modi sauber auszudrücken.
        Musikgenerierung folgt demselben Muster mit expliziten Blöcken `generate` /
        `edit`.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* Bildergebnis */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web-Fetch und Websuche">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
          envVars: ["ACME_FETCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/fetch",
          credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
          getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
          setCredentialValue: (fetchConfigTarget, value) => {
            const acme = (fetchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Fetch a page through Acme Fetch.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          search: async (req) => ({ content: [] }),
        });
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="Testen">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportieren Sie Ihr Provider-Konfigurationsobjekt aus index.ts oder einer dedizierten Datei
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## Auf ClawHub veröffentlichen

Provider-Plugins werden auf dieselbe Weise veröffentlicht wie jedes andere externe Code-Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwenden Sie hier nicht den älteren Publish-Alias nur für Skills; Plugin-Pakete sollten
`clawhub package publish` verwenden.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers-Metadaten
├── openclaw.plugin.json      # Manifest mit Metadaten für Provider-Authentifizierung
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage-Endpunkt (optional)
```

## Referenz zur Katalogreihenfolge

`catalog.order` steuert, wann Ihr Katalog relativ zu eingebauten
Providern zusammengeführt wird:

| Reihenfolge | Wann          | Anwendungsfall                                  |
| ----------- | ------------- | ----------------------------------------------- |
| `simple`    | Erster Durchlauf | Einfache Provider mit API-Key                |
| `profile`   | Nach simple   | Provider, die durch Auth-Profile gesteuert sind |
| `paired`    | Nach profile  | Mehrere zusammengehörige Einträge synthetisieren |
| `late`      | Letzter Durchlauf | Vorhandene Provider überschreiben (gewinnt bei Kollision) |

## Nächste Schritte

- [Channel Plugins](/de/plugins/sdk-channel-plugins) — wenn Ihr Plugin auch einen Kanal bereitstellt
- [SDK Runtime](/de/plugins/sdk-runtime) — `api.runtime`-Helper (TTS, Suche, Subagent)
- [SDK Overview](/de/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [Plugin Internals](/de/plugins/architecture-internals#provider-runtime-hooks) — Hook-Details und gebündelte Beispiele

## Verwandt

- [Plugin SDK setup](/de/plugins/sdk-setup)
- [Building plugins](/de/plugins/building-plugins)
- [Building channel plugins](/de/plugins/sdk-channel-plugins)
