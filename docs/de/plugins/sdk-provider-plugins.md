---
read_when:
    - Sie erstellen ein neues Model-Provider-Plugin
    - Sie möchten einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen
    - Sie müssen Provider-Authentifizierung, Kataloge und Runtime-Hooks verstehen
sidebarTitle: Provider Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Model-Provider-Plugins für OpenClaw
title: Provider-Plugins erstellen
x-i18n:
    generated_at: "2026-04-05T12:52:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e781e5fc436b2189b9f8cc63e7611f49df1fd2526604a0596a0631f49729b085
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Provider-Plugins erstellen

Diese Anleitung führt Sie durch das Erstellen eines Provider-Plugins, das OpenClaw einen Model-Provider
(LLM) hinzufügt. Am Ende haben Sie einen Provider mit einem Model-Katalog,
API-Key-Authentifizierung und dynamischer Model-Auflösung.

<Info>
  Wenn Sie noch nie ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Manifest-Einrichtung.
</Info>

## Schritt-für-Schritt-Anleitung

<Steps>
  <a id="step-1-package-and-manifest"></a>
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
    Zugangsdaten erkennen kann, ohne Ihre Plugin-Runtime zu laden. `modelSupport` ist optional
    und ermöglicht es OpenClaw, Ihr Provider-Plugin anhand kurzer Model-IDs
    wie `acme-large` automatisch zu laden, bevor Runtime-Hooks vorhanden sind. Wenn Sie den
    Provider auf ClawHub veröffentlichen, sind diese Felder `openclaw.compat` und `openclaw.build`
    in `package.json` erforderlich.

  </Step>

  <Step title="Den Provider registrieren">
    Ein minimaler Provider benötigt ein `id`, `label`, `auth` und `catalog`:

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
    `openclaw onboard --acme-ai-api-key <key>` verwenden und
    `acme-ai/acme-large` als ihr Model auswählen.

    Für gebündelte Provider, die nur einen Text-Provider mit API-Key-
    Authentifizierung plus eine einzelne kataloggestützte Runtime registrieren, sollten Sie den enger gefassten
    Helper `defineSingleProviderPluginEntry(...)` bevorzugen:

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
        },
      },
    });
    ```

    Wenn Ihr Authentifizierungsablauf außerdem `models.providers.*`, Aliase und
    das Standard-Model des Agenten während des Onboarding patchen muss, verwenden Sie die Preset-Helper aus
    `openclaw/plugin-sdk/provider-onboard`. Die am engsten gefassten Helper sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn der native Endpunkt eines Providers gestreamte Usage-Blöcke auf dem normalen
    Transport `openai-completions` unterstützt, sollten Sie die gemeinsamen Katalog-Helper in
    `openclaw/plugin-sdk/provider-catalog-shared` bevorzugen, statt Provider-ID-Prüfungen
    fest zu codieren. `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen die Unterstützung anhand der Endpunkt-Fähigkeitszuordnung,
    sodass native Endpunkte im Stil von Moonshot/DashScope weiterhin opt-in können, auch wenn ein Plugin eine benutzerdefinierte Provider-ID verwendet.

  </Step>

  <Step title="Dynamische Model-Auflösung hinzufügen">
    Wenn Ihr Provider beliebige Model-IDs akzeptiert, etwa ein Proxy oder Router,
    fügen Sie `resolveDynamicModel` hinzu:

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

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

    Wenn für die Auflösung ein Netzwerkaufruf erforderlich ist, verwenden Sie `prepareDynamicModel` für asynchrones
    Aufwärmen — `resolveDynamicModel` wird erneut ausgeführt, nachdem es abgeschlossen ist.

  </Step>

  <Step title="Runtime-Hooks hinzufügen (nach Bedarf)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks
    schrittweise hinzu, wenn Ihr Provider sie benötigt.

    Gemeinsame Helper-Builder decken jetzt die häufigsten Replay-/Tool-Kompatibilitäts-
    Familien ab, sodass Plugins normalerweise nicht jeden Hook einzeln verdrahten müssen:

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

    | Family | Was sie verdrahtet |
    | --- | --- |
    | `openai-compatible` | Gemeinsame Replay-Richtlinie im OpenAI-Stil für OpenAI-kompatible Transports, einschließlich Bereinigung von Tool-Call-IDs, Korrekturen für Assistant-first-Reihenfolge und generischer Gemini-Turn-Validierung, wo der Transport sie benötigt |
    | `anthropic-by-model` | Claude-spezifische Replay-Richtlinie, ausgewählt nach `modelId`, sodass Transports für Anthropic-Nachrichten nur dann Claude-spezifische Bereinigung von Thinking-Blöcken erhalten, wenn das aufgelöste Model tatsächlich eine Claude-ID ist |
    | `google-gemini` | Native Gemini-Replay-Richtlinie plus Bootstrap-Replay-Bereinigung und getaggter Modus für Reasoning-Ausgabe |
    | `passthrough-gemini` | Bereinigung der Gemini-Thought-Signature für Gemini-Models, die über OpenAI-kompatible Proxy-Transports laufen; aktiviert keine native Gemini-Replay-Validierung oder Bootstrap-Rewrites |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Provider, die Oberflächen für Anthropic-Nachrichten und OpenAI-kompatible Models in einem Plugin mischen; optionales Verwerfen von Thinking-Blöcken nur für Claude bleibt auf die Anthropic-Seite beschränkt |

    Reale gebündelte Beispiele:

    - `google` und `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` und `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` und `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` und `zai`: `openai-compatible`

    Heute verfügbare Stream-Familien:

    | Family | Was sie verdrahtet |
    | --- | --- |
    | `google-thinking` | Normalisierung der Gemini-Thinking-Payload auf dem gemeinsamen Stream-Pfad |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs das injizierte Thinking überspringen |
    | `moonshot-thinking` | Zuordnung der nativen binären Thinking-Payload von Moonshot aus Konfiguration + `/think`-Level |
    | `minimax-fast-mode` | Umschreiben des MiniMax-Fast-Mode-Models auf dem gemeinsamen Stream-Pfad |
    | `openai-responses-defaults` | Gemeinsame native OpenAI/Codex-Responses-Wrapper: Attribution-Header, `/fast`/`serviceTier`, Text-Verbosity, native Codex-Websuche, Payload-Gestaltung für Reasoning-Kompatibilität und Kontextverwaltung für Responses |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, mit zentral behandeltem Überspringen nicht unterstützter Models/`auto` |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie Z.AI, die Tool-Streaming wünschen, sofern es nicht ausdrücklich deaktiviert wird |

    Reale gebündelte Beispiele:

    - `google` und `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` und `minimax-portal`: `minimax-fast-mode`
    - `openai` und `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exportiert außerdem das Enum der Replay-Familien
    sowie die gemeinsamen Helper, aus denen diese Familien aufgebaut sind. Zu den üblichen öffentlichen
    Exporten gehören:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - gemeinsame Replay-Builder wie `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` und
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini-Replay-Helper wie `sanitizeGoogleGeminiReplayHistory(...)`
      und `resolveTaggedReasoningOutputMode()`
    - Endpunkt-/Model-Helper wie `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` und
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` stellt sowohl den Family-Builder als auch
    die öffentlichen Wrapper-Helper bereit, die diese Familien wiederverwenden. Zu den üblichen öffentlichen Exporten
    gehören:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - gemeinsame OpenAI/Codex-Wrapper wie
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` und
      `createCodexNativeWebSearchWrapper(...)`
    - gemeinsame Proxy-/Provider-Wrapper wie `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` und `createMinimaxFastModeWrapper(...)`

    Einige Stream-Helper bleiben absichtlich provider-lokal. Aktuelles gebündeltes
    Beispiel: `@openclaw/anthropic-provider` exportiert
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die
    Anthropic-Wrapper-Builder auf niedrigerer Ebene aus seinem öffentlichen `api.ts`- /
    `contract-api.ts`-Seam. Diese Helper bleiben Anthropic-spezifisch, weil
    sie auch die Behandlung von Claude-OAuth-Betas und `context1m`-Gating kodieren.

    Andere gebündelte Provider behalten ebenfalls transportspezifische Wrapper lokal, wenn
    sich das Verhalten nicht sauber über Familien hinweg teilen lässt. Aktuelles Beispiel: das
    gebündelte xAI-Plugin behält natives xAI-Responses-Shaping in seinem eigenen
    `wrapStreamFn`, einschließlich Umschreiben von `/fast`-Aliasen, standardmäßigem `tool_stream`,
    Bereinigung nicht unterstützter Strict-Tool-Konfigurationen und Entfernen
    xAI-spezifischer Reasoning-Payloads.

    `openclaw/plugin-sdk/provider-tools` stellt derzeit eine gemeinsame
    Tool-Schema-Familie plus gemeinsame Schema-/Kompatibilitäts-Helper bereit:

    - `ProviderToolCompatFamily` dokumentiert das heutige gemeinsame Family-Inventar.
    - `buildProviderToolCompatFamilyHooks("gemini")` verdrahtet Gemini-Schema-
      Bereinigung + Diagnose für Provider, die Gemini-sichere Tool-Schemas benötigen.
    - `normalizeGeminiToolSchemas(...)` und `inspectGeminiToolSchemas(...)`
      sind die zugrunde liegenden öffentlichen Gemini-Schema-Helper.
    - `resolveXaiModelCompatPatch()` gibt den gebündelten xAI-Kompatibilitäts-Patch zurück:
      `toolSchemaProfile: "xai"`, nicht unterstützte Schema-Schlüsselwörter, native
      `web_search`-Unterstützung und Dekodierung von Tool-Call-Argumenten mit HTML-Entities.
    - `applyXaiModelCompat(model)` wendet denselben xAI-Kompatibilitäts-Patch auf ein
      aufgelöstes Model an, bevor es den Runner erreicht.

    Reales gebündeltes Beispiel: Das xAI-Plugin verwendet `normalizeResolvedModel` plus
    `contributeResolvedModelCompat`, damit diese Kompatibilitäts-Metadaten dem
    Provider gehören, statt xAI-Regeln im Core fest zu codieren.

    Dasselbe Muster mit Paket-Root wird auch von anderen gebündelten Providern unterstützt:

    - `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
      Helper für Default-Models und Realtime-Provider-Builder
    - `@openclaw/openrouter-provider`: `api.ts` exportiert den Provider-Builder
      plus Onboarding-/Konfigurations-Helper

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
        // wrapStreamFn gibt eine aus ctx.streamFn abgeleitete StreamFn zurück
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
        generischen HTTP- oder WebSocket-Transports benötigen:

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
      <Tab title="Usage und Abrechnung">
        Für Provider, die Usage-/Abrechnungsdaten bereitstellen:

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
      OpenClaw ruft Hooks in dieser Reihenfolge auf. Die meisten Provider verwenden nur 2-3:

      | # | Hook | Wann verwenden |
      | --- | --- | --- |
      | 1 | `catalog` | Model-Katalog oder Base-URL-Standardeinstellungen |
      | 2 | `applyConfigDefaults` | Provider-eigene globale Standardeinstellungen während der Materialisierung der Konfiguration |
      | 3 | `normalizeModelId` | Bereinigung von Aliasen für Legacy-/Preview-Model-IDs vor dem Lookup |
      | 4 | `normalizeTransport` | Bereinigung von Provider-Familien-`api` / `baseUrl` vor der generischen Model-Zusammenstellung |
      | 5 | `normalizeConfig` | `models.providers.<id>`-Konfiguration normalisieren |
      | 6 | `applyNativeStreamingUsageCompat` | Rewrites für native Streaming-Usage-Kompatibilität bei Konfigurations-Providern |
      | 7 | `resolveConfigApiKey` | Provider-eigene Auflösung von Authentifizierung über Env-Marker |
      | 8 | `resolveSyntheticAuth` | Synthetische Authentifizierung lokal/selbst gehostet oder konfigurationsgestützt |
      | 9 | `shouldDeferSyntheticProfileAuth` | Synthetische gespeicherte Profil-Platzhalter hinter Env-/Konfigurations-Authentifizierung zurückstellen |
      | 10 | `resolveDynamicModel` | Beliebige vorgelagerte Model-IDs akzeptieren |
      | 11 | `prepareDynamicModel` | Asynchrones Abrufen von Metadaten vor der Auflösung |
      | 12 | `normalizeResolvedModel` | Transport-Rewrites vor dem Runner |

    Hinweise zu Runtime-Fallbacks:

    - `normalizeConfig` prüft zuerst den passenden Provider, dann andere
      hook-fähige Provider-Plugins, bis eines die Konfiguration tatsächlich ändert.
      Wenn kein Provider-Hook einen unterstützten Google-Familien-Konfigurationseintrag umschreibt, wird weiterhin der
      gebündelte Google-Konfigurations-Normalizer angewendet.
    - `resolveConfigApiKey` verwendet den Provider-Hook, wenn er verfügbar ist. Der gebündelte
      Pfad `amazon-bedrock` hat hier außerdem einen eingebauten AWS-Env-Marker-Resolver,
      obwohl die Runtime-Authentifizierung von Bedrock selbst weiterhin die Standardkette des AWS SDK verwendet.
      | 13 | `contributeResolvedModelCompat` | Kompatibilitäts-Flags für Vendor-Models hinter einem anderen kompatiblen Transport |
      | 14 | `capabilities` | Legacy-Bag statischer Fähigkeiten; nur aus Kompatibilitätsgründen |
      | 15 | `normalizeToolSchemas` | Provider-eigene Bereinigung von Tool-Schemas vor der Registrierung |
      | 16 | `inspectToolSchemas` | Provider-eigene Diagnose für Tool-Schemas |
      | 17 | `resolveReasoningOutputMode` | Vertrag für getaggte vs. native Reasoning-Ausgabe |
      | 18 | `prepareExtraParams` | Standard-Request-Parameter |
      | 19 | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | 20 | `wrapStreamFn` | Wrapper für benutzerdefinierte Header/Body-Anpassungen auf dem normalen Stream-Pfad |
      | 21 | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | 22 | `resolveWebSocketSessionPolicy` | Native WS-Session-Header/Cool-down |
      | 23 | `formatApiKey` | Benutzerdefinierte Form des Runtime-Tokens |
      | 24 | `refreshOAuth` | Benutzerdefinierte OAuth-Aktualisierung |
      | 25 | `buildAuthDoctorHint` | Hinweise zur Reparatur der Authentifizierung |
      | 26 | `matchesContextOverflowError` | Provider-eigene Erkennung von Overflow |
      | 27 | `classifyFailoverReason` | Provider-eigene Klassifizierung von Rate-Limit/Überlastung |
      | 28 | `isCacheTtlEligible` | TTL-Gating für Prompt-Cache |
      | 29 | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Authentifizierung |
      | 30 | `suppressBuiltInModel` | Veraltete vorgelagerte Zeilen ausblenden |
      | 31 | `augmentModelCatalog` | Synthetische Zeilen für Vorwärtskompatibilität |
      | 32 | `isBinaryThinking` | Binäres Thinking an/aus |
      | 33 | `supportsXHighThinking` | Unterstützung für `xhigh`-Reasoning |
      | 34 | `resolveDefaultThinkingLevel` | Standardrichtlinie für `/think` |
      | 35 | `isModernModelRef` | Abgleich von Live-/Smoke-Models |
      | 36 | `prepareRuntimeAuth` | Token-Austausch vor der Inferenz |
      | 37 | `resolveUsageAuth` | Benutzerdefiniertes Parsen von Usage-Zugangsdaten |
      | 38 | `fetchUsageSnapshot` | Benutzerdefinierter Usage-Endpunkt |
      | 39 | `createEmbeddingProvider` | Provider-eigener Embedding-Adapter für Memory/Search |
      | 40 | `buildReplayPolicy` | Benutzerdefinierte Richtlinie für Transcript-Replay/-Kompaktierung |
      | 41 | `sanitizeReplayHistory` | Provider-spezifische Replay-Rewrites nach der generischen Bereinigung |
      | 42 | `validateReplayTurns` | Strikte Validierung von Replay-Turns vor dem eingebetteten Runner |
      | 43 | `onModelSelected` | Callback nach der Auswahl (z. B. für Telemetrie) |

      Detaillierte Beschreibungen und Beispiele aus der Praxis finden Sie unter
      [Internals: Provider Runtime Hooks](/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Zusätzliche Fähigkeiten hinzufügen (optional)">
    <a id="step-5-add-extra-capabilities"></a>
    Ein Provider-Plugin kann zusätzlich zu Textinferenz Sprache, Realtime-Transkription, Realtime-
    Voice, Media Understanding, Bildgenerierung, Videogenerierung, Web Fetch
    und Web Search registrieren:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

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

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          maxVideos: 1,
          maxDurationSeconds: 10,
          supportsResolution: true,
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

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
    }
    ```

    OpenClaw klassifiziert dies als Plugin mit **hybriden Fähigkeiten**. Das ist das
    empfohlene Muster für Unternehmens-Plugins (ein Plugin pro Anbieter). Siehe
    [Internals: Capability Ownership](/plugins/architecture#capability-ownership-model).

  </Step>

  <Step title="Testen">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
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

Provider-Plugins werden genauso veröffentlicht wie jeder andere externe Code-Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwenden Sie hier nicht den alten Veröffentlichungsalias nur für Skills; Plugin-Pakete sollten
`clawhub package publish` verwenden.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Referenz für Katalogreihenfolge

`catalog.order` steuert, wann Ihr Katalog im Verhältnis zu eingebauten
Providern zusammengeführt wird:

| Order     | Wann         | Anwendungsfall                                |
| --------- | ------------ | --------------------------------------------- |
| `simple`  | Erster Durchlauf | Einfache API-Key-Provider                 |
| `profile` | Nach simple  | Provider, die von Auth-Profilen abhängen      |
| `paired`  | Nach profile | Mehrere zusammengehörige Einträge synthetisieren |
| `late`    | Letzter Durchlauf | Bestehende Provider überschreiben (gewinnt bei Kollisionen) |

## Nächste Schritte

- [Channel-Plugins](/plugins/sdk-channel-plugins) — wenn Ihr Plugin auch einen Channel bereitstellt
- [SDK Runtime](/plugins/sdk-runtime) — `api.runtime`-Helper (TTS, Suche, Subagent)
- [SDK Overview](/plugins/sdk-overview) — vollständige Referenz für Subpath-Importe
- [Plugin Internals](/plugins/architecture#provider-runtime-hooks) — Hook-Details und gebündelte Beispiele
