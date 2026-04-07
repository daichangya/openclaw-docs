---
read_when:
    - Sie erstellen ein neues Modell-Provider-Plugin
    - Sie möchten OpenClaw einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM hinzufügen
    - Sie müssen Provider-Auth, Kataloge und Laufzeit-Hooks verstehen
sidebarTitle: Provider Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modell-Provider-Plugins für OpenClaw
title: Provider-Plugins erstellen
x-i18n:
    generated_at: "2026-04-07T06:19:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4da82a353e1bf4fe6dc09e14b8614133ac96565679627de51415926014bd3990
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Provider-Plugins erstellen

Diese Anleitung führt Sie durch das Erstellen eines Provider-Plugins, das OpenClaw einen Modell-Provider
(LLM) hinzufügt. Am Ende verfügen Sie über einen Provider mit Modellkatalog,
API-Key-Auth und dynamischer Modellauflösung.

<Info>
  Wenn Sie bisher noch kein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paket-
  Struktur und die Manifest-Einrichtung.
</Info>

## Walkthrough

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
    Anmeldedaten erkennen kann, ohne die Laufzeit Ihres Plugins zu laden. `modelSupport` ist optional
    und ermöglicht OpenClaw, Ihr Provider-Plugin anhand von Kurzform-Modell-IDs
    wie `acme-large` automatisch zu laden, bevor Laufzeit-Hooks existieren. Wenn Sie den
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

    Für gebündelte Provider, die nur einen einzelnen Text-Provider mit API-Key-
    Auth plus eine einzelne kataloggestützte Laufzeit registrieren, bevorzugen Sie den engeren
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
        },
      },
    });
    ```

    Wenn Ihr Auth-Flow während des Onboardings zusätzlich `models.providers.*`, Aliase und
    das Standardmodell des Agenten patchen muss, verwenden Sie die Preset-Helper aus
    `openclaw/plugin-sdk/provider-onboard`. Die engsten Helper sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn der native Endpunkt eines Providers gestreamte Usage-Blöcke auf dem
    normalen Transport `openai-completions` unterstützt, bevorzugen Sie die gemeinsam genutzten Katalog-Helper in
    `openclaw/plugin-sdk/provider-catalog-shared`, statt Provider-ID-Prüfungen
    hart zu codieren. `supportsNativeStreamingUsageCompat(...)` und
    `applyProviderNativeStreamingUsageCompat(...)` erkennen Unterstützung anhand der
    Endpoint-Capability-Map, sodass auch native Moonshot-/DashScope-artige Endpunkte
    aktiviert werden, selbst wenn ein Plugin eine benutzerdefinierte Provider-ID verwendet.

  </Step>

  <Step title="Dynamische Modellauflösung hinzufügen">
    Wenn Ihr Provider beliebige Modell-IDs akzeptiert (wie ein Proxy oder Router),
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

    Wenn die Auflösung einen Netzwerkaufruf erfordert, verwenden Sie `prepareDynamicModel` für asynchrones
    Aufwärmen — `resolveDynamicModel` wird nach dessen Abschluss erneut ausgeführt.

  </Step>

  <Step title="Laufzeit-Hooks hinzufügen (bei Bedarf)">
    Die meisten Provider benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks
    schrittweise hinzu, je nach Anforderungen Ihres Providers.

    Gemeinsam genutzte Helper-Builder decken jetzt die häufigsten Familien für Replay und Tool-Kompatibilität
    ab, sodass Plugins normalerweise nicht jeden Hook einzeln verdrahten müssen:

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

    Derzeit verfügbare Replay-Familien:

    | Family | Was eingebunden wird |
    | --- | --- |
    | `openai-compatible` | Gemeinsam genutzte Replay-Richtlinie im OpenAI-Stil für OpenAI-kompatible Transporte, einschließlich Bereinigung von Tool-Call-IDs, Korrekturen für Assistant-first-Reihenfolge und generischer Gemini-Turn-Validierung dort, wo der Transport sie benötigt |
    | `anthropic-by-model` | Claude-bewusste Replay-Richtlinie, gewählt nach `modelId`, sodass Transporte für Anthropic-Nachrichten nur dann Claude-spezifische Bereinigung von Thinking-Blöcken erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist |
    | `google-gemini` | Native Gemini-Replay-Richtlinie plus Bootstrap-Replay-Bereinigung und getaggter Reasoning-Output-Modus |
    | `passthrough-gemini` | Bereinigung von Gemini-Thought-Signatures für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte laufen; aktiviert keine native Gemini-Replay-Validierung oder Bootstrap-Umschreibungen |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Provider, die in einem Plugin Oberflächen für Anthropic-Nachrichten und OpenAI-kompatible Modelle mischen; das optionale Verwerfen von Thinking-Blöcken nur für Claude bleibt auf die Anthropic-Seite beschränkt |

    Reale gebündelte Beispiele:

    - `google` und `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` und `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` und `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` und `zai`: `openai-compatible`

    Derzeit verfügbare Stream-Familien:

    | Family | Was eingebunden wird |
    | --- | --- |
    | `google-thinking` | Normalisierung von Gemini-Thinking-Payloads auf dem gemeinsam genutzten Stream-Pfad |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsam genutzten Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs injiziertes Thinking überspringen |
    | `moonshot-thinking` | Zuordnung von nativen Moonshot-Thinking-Payloads im Binärformat aus Konfiguration + `/think`-Level |
    | `minimax-fast-mode` | Umschreibung von MiniMax-Fast-Mode-Modellen auf dem gemeinsam genutzten Stream-Pfad |
    | `openai-responses-defaults` | Gemeinsam genutzte native OpenAI-/Codex-Responses-Wrapper: Attribution-Header, `/fast`/`serviceTier`, Text-Verbosity, native Codex-Web-Suche, Payload-Shaping für Reasoning-Kompatibilität und Kontextverwaltung für Responses |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei Überspringen bei nicht unterstützten Modellen/`auto` zentral behandelt wird |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Provider wie Z.AI, die Tool-Streaming wünschen, sofern es nicht explizit deaktiviert wird |

    Reale gebündelte Beispiele:

    - `google` und `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` und `minimax-portal`: `minimax-fast-mode`
    - `openai` und `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exportiert außerdem das Enum für Replay-Familien
    plus die gemeinsam genutzten Helper, aus denen diese Familien aufgebaut sind. Häufige öffentliche
    Exporte sind:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - gemeinsam genutzte Replay-Builder wie `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` und
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini-Replay-Helper wie `sanitizeGoogleGeminiReplayHistory(...)`
      und `resolveTaggedReasoningOutputMode()`
    - Endpoint-/Modell-Helper wie `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` und
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` stellt sowohl den Family-Builder als
    auch die öffentlichen Wrapper-Helper bereit, die diese Familien wiederverwenden. Häufige öffentliche Exporte
    sind:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - gemeinsam genutzte OpenAI-/Codex-Wrapper wie
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` und
      `createCodexNativeWebSearchWrapper(...)`
    - gemeinsam genutzte Proxy-/Provider-Wrapper wie `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` und `createMinimaxFastModeWrapper(...)`

    Einige Stream-Helper bleiben absichtlich providerlokal. Aktuelles gebündeltes
    Beispiel: `@openclaw/anthropic-provider` exportiert
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die
    Low-Level-Builder für Anthropic-Wrapper über seinen öffentlichen Seam `api.ts` /
    `contract-api.ts`. Diese Helper bleiben Anthropic-spezifisch, weil
    sie auch die Behandlung von Claude-OAuth-Betas und `context1m`-Gating kodieren.

    Andere gebündelte Provider halten transportspezifische Wrapper ebenfalls lokal, wenn
    das Verhalten nicht sauber familienübergreifend geteilt wird. Aktuelles Beispiel: das
    gebündelte xAI-Plugin hält das native Shaping von xAI-Responses in seinem eigenen
    `wrapStreamFn`, einschließlich Umschreibungen von `/fast`-Aliasen, standardmäßigem `tool_stream`,
    Bereinigung nicht unterstützter Strict-Tools und Entfernung von xAI-spezifischen Reasoning-Payloads.

    `openclaw/plugin-sdk/provider-tools` stellt derzeit eine gemeinsam genutzte
    Tool-Schema-Familie plus gemeinsam genutzte Schema-/Kompatibilitäts-Helper bereit:

    - `ProviderToolCompatFamily` dokumentiert das heute gemeinsam genutzte Family-Inventar.
    - `buildProviderToolCompatFamilyHooks("gemini")` verdrahtet die Bereinigung von Gemini-Schemata
      + Diagnosen für Provider, die Gemini-sichere Tool-Schemata benötigen.
    - `normalizeGeminiToolSchemas(...)` und `inspectGeminiToolSchemas(...)`
      sind die zugrunde liegenden öffentlichen Gemini-Schema-Helper.
    - `resolveXaiModelCompatPatch()` gibt den gebündelten xAI-Kompatibilitäts-Patch zurück:
      `toolSchemaProfile: "xai"`, nicht unterstützte Schema-Schlüsselwörter, native
      `web_search`-Unterstützung und HTML-Entity-Dekodierung für Argumente von Tool-Calls.
    - `applyXaiModelCompat(model)` wendet denselben xAI-Kompatibilitäts-Patch auf ein
      aufgelöstes Modell an, bevor es den Runner erreicht.

    Reales gebündeltes Beispiel: Das xAI-Plugin verwendet `normalizeResolvedModel` plus
    `contributeResolvedModelCompat`, um diese Kompatibilitäts-Metadaten dem Provider zuzuordnen,
    anstatt xAI-Regeln im Core hart zu codieren.

    Dasselbe Paket-Root-Muster unterstützt auch andere gebündelte Provider:

    - `@openclaw/openai-provider`: `api.ts` exportiert Provider-Builder,
      Helper für Standardmodelle und Builder für Realtime-Provider
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
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
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
      | 1 | `catalog` | Modellkatalog oder Standardwerte für baseUrl |
      | 2 | `applyConfigDefaults` | Providereigene globale Standardwerte während der Materialisierung der Konfiguration |
      | 3 | `normalizeModelId` | Bereinigung von Legacy-/Preview-Modell-ID-Aliasen vor dem Lookup |
      | 4 | `normalizeTransport` | Bereinigung von `api` / `baseUrl` für Provider-Familien vor der generischen Modellzusammenstellung |
      | 5 | `normalizeConfig` | `models.providers.<id>`-Konfiguration normalisieren |
      | 6 | `applyNativeStreamingUsageCompat` | Native Streaming-Usage-Kompatibilitäts-Umschreibungen für Konfigurations-Provider |
      | 7 | `resolveConfigApiKey` | Providereigene Auflösung von Auth über Env-Marker |
      | 8 | `resolveSyntheticAuth` | Synthetische Auth aus lokalem/self-hosted oder konfigurationsgestütztem Kontext |
      | 9 | `shouldDeferSyntheticProfileAuth` | Platzhalter synthetischer gespeicherter Profile hinter Env-/Konfigurations-Auth niedriger priorisieren |
      | 10 | `resolveDynamicModel` | Beliebige Upstream-Modell-IDs akzeptieren |
      | 11 | `prepareDynamicModel` | Asynchrones Abrufen von Metadaten vor der Auflösung |
      | 12 | `normalizeResolvedModel` | Transport-Umschreibungen vor dem Runner |

      Hinweise zum Laufzeit-Fallback:

      - `normalizeConfig` prüft zuerst den passenden Provider und dann andere
        hookfähige Provider-Plugins, bis eines die Konfiguration tatsächlich ändert.
        Wenn kein Provider-Hook einen unterstützten Google-Family-Konfigurationseintrag umschreibt, wird weiterhin
        der gebündelte Google-Konfigurations-Normalizer angewendet.
      - `resolveConfigApiKey` verwendet den Provider-Hook, wenn er bereitgestellt wird. Der gebündelte
        Pfad `amazon-bedrock` hat hier zusätzlich einen integrierten AWS-Env-Marker-Resolver,
        obwohl Bedrock-Laufzeit-Auth selbst weiterhin die Standardkette des AWS-SDK verwendet.
      | 13 | `contributeResolvedModelCompat` | Kompatibilitäts-Flags für Vendor-Modelle hinter einem anderen kompatiblen Transport |
      | 14 | `capabilities` | Legacy-Bag mit statischen Fähigkeiten; nur zur Kompatibilität |
      | 15 | `normalizeToolSchemas` | Providereigene Bereinigung von Tool-Schemata vor der Registrierung |
      | 16 | `inspectToolSchemas` | Providereigene Diagnosen für Tool-Schemata |
      | 17 | `resolveReasoningOutputMode` | Vertrag für getaggten vs. nativen Reasoning-Output |
      | 18 | `prepareExtraParams` | Standard-Request-Parameter |
      | 19 | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | 20 | `wrapStreamFn` | Benutzerdefinierte Header-/Body-Wrapper auf dem normalen Stream-Pfad |
      | 21 | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | 22 | `resolveWebSocketSessionPolicy` | Native WS-Session-Header/Cool-down |
      | 23 | `formatApiKey` | Benutzerdefinierte Form von Laufzeit-Tokens |
      | 24 | `refreshOAuth` | Benutzerdefinierter OAuth-Refresh |
      | 25 | `buildAuthDoctorHint` | Hinweise zur Reparatur von Auth |
      | 26 | `matchesContextOverflowError` | Providereigene Erkennung von Überläufen |
      | 27 | `classifyFailoverReason` | Providereigene Klassifizierung von Ratenlimit/Überlastung |
      | 28 | `isCacheTtlEligible` | TTL-Gating für Prompt-Cache |
      | 29 | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis bei fehlender Auth |
      | 30 | `suppressBuiltInModel` | Veraltete Upstream-Zeilen ausblenden |
      | 31 | `augmentModelCatalog` | Synthetische Zeilen für Vorwärtskompatibilität |
      | 32 | `isBinaryThinking` | Binäres Thinking an/aus |
      | 33 | `supportsXHighThinking` | Unterstützung für `xhigh`-Reasoning |
      | 34 | `resolveDefaultThinkingLevel` | Standardrichtlinie für `/think` |
      | 35 | `isModernModelRef` | Abgleich für Live-/Smoke-Modelle |
      | 36 | `prepareRuntimeAuth` | Token-Austausch vor der Inferenz |
      | 37 | `resolveUsageAuth` | Benutzerdefiniertes Parsen von Usage-Anmeldedaten |
      | 38 | `fetchUsageSnapshot` | Benutzerdefinierter Usage-Endpunkt |
      | 39 | `createEmbeddingProvider` | Providereigener Embedding-Adapter für Memory/Search |
      | 40 | `buildReplayPolicy` | Benutzerdefinierte Replay-/Kompaktierungsrichtlinie für Transkripte |
      | 41 | `sanitizeReplayHistory` | Providerspezifische Replay-Umschreibungen nach generischer Bereinigung |
      | 42 | `validateReplayTurns` | Strikte Validierung von Replay-Turns vor dem eingebetteten Runner |
      | 43 | `onModelSelected` | Callback nach Auswahl (z. B. Telemetrie) |

      Hinweis zum Prompt-Tuning:

      - `resolveSystemPromptContribution` ermöglicht einem Provider, cachebewusste
        System-Prompt-Hinweise für eine Modellfamilie einzuschleusen. Bevorzugen Sie dies statt
        `before_prompt_build`, wenn das Verhalten zu einer Provider-/Modellfamilie gehört
        und die stabile/dynamische Cache-Aufteilung erhalten bleiben soll.

      Detaillierte Beschreibungen und praxisnahe Beispiele finden Sie unter
      [Interna: Provider-Laufzeit-Hooks](/de/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Zusätzliche Fähigkeiten hinzufügen (optional)">
    <a id="step-5-add-extra-capabilities"></a>
    Ein Provider-Plugin kann zusätzlich zu Text-Inferenz auch Speech, Realtime-Transkription, Realtime-
    Voice, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Fetch
    und Web-Suche registrieren:

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
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
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

    OpenClaw klassifiziert dies als **Hybrid-Capability**-Plugin. Dies ist das
    empfohlene Muster für Unternehmens-Plugins (ein Plugin pro Anbieter). Siehe
    [Interna: Eigentum an Fähigkeiten](/de/plugins/architecture#capability-ownership-model).

    Für Videogenerierung bevorzugen Sie die oben gezeigte modusb ewusste Form der Fähigkeiten:
    `generate`, `imageToVideo` und `videoToVideo`. Flache aggregierte Felder wie
    `maxInputImages`, `maxInputVideos` und `maxDurationSeconds` reichen nicht aus,
    um die Unterstützung von Transformationsmodi oder deaktivierte Modi sauber zu bewerben.

    Provider für Musikgenerierung sollten demselben Muster folgen:
    `generate` für promptbasierte Generierung und `edit` für referenzbildbasierte
    Generierung. Flache aggregierte Felder wie `maxInputImages`,
    `supportsLyrics` und `supportsFormat` reichen nicht aus, um Edit-
    Unterstützung zu bewerben; explizite Blöcke `generate` / `edit` sind der erwartete Vertrag.

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

Provider-Plugins werden genauso veröffentlicht wie jedes andere externe Code-Plugin:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwenden Sie hier nicht den veralteten Alias zum Veröffentlichen nur für Skills; Plugin-Pakete sollten
`clawhub package publish` verwenden.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers-Metadaten
├── openclaw.plugin.json      # Manifest mit providerAuthEnvVars
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage-Endpunkt (optional)
```

## Referenz für Katalogreihenfolge

`catalog.order` steuert, wann Ihr Katalog relativ zu eingebauten
Providern zusammengeführt wird:

| Order     | Wann          | Anwendungsfall                                |
| --------- | ------------- | --------------------------------------------- |
| `simple`  | Erster Durchlauf | Einfache Provider mit API-Key                 |
| `profile` | Nach simple   | Provider, die von Auth-Profilen abhängen      |
| `paired`  | Nach profile  | Mehrere zusammengehörige Einträge synthetisieren |
| `late`    | Letzter Durchlauf | Bestehende Provider überschreiben (gewinnt bei Kollision) |

## Nächste Schritte

- [Channel Plugins](/de/plugins/sdk-channel-plugins) — wenn Ihr Plugin auch einen Channel bereitstellt
- [SDK Runtime](/de/plugins/sdk-runtime) — `api.runtime`-Helper (TTS, Suche, Subagent)
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpfad-Importe
- [Plugin-Interna](/de/plugins/architecture#provider-runtime-hooks) — Hook-Details und gebündelte Beispiele
