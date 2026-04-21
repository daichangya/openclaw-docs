---
read_when:
    - Sie erstellen ein neues Modellanbieter-Plugin
    - Sie möchten einen OpenAI-kompatiblen Proxy oder ein benutzerdefiniertes LLM zu OpenClaw hinzufügen
    - Sie müssen Auth, Kataloge und Laufzeit-Hooks von Anbietern verstehen
sidebarTitle: Provider Plugins
summary: Schritt-für-Schritt-Anleitung zum Erstellen eines Modellanbieter-Plugins für OpenClaw
title: Anbieter-Plugins erstellen
x-i18n:
    generated_at: "2026-04-21T06:29:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 459761118c7394c1643c170edfec97c87e1c6323b436183b53ad7a2fed783b04
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Anbieter-Plugins erstellen

Diese Anleitung führt Sie durch die Erstellung eines Anbieter-Plugins, das OpenClaw einen Modellanbieter (LLM) hinzufügt. Am Ende haben Sie einen Anbieter mit Modellkatalog, API-Schlüssel-Auth und dynamischer Modellauflösung.

<Info>
  Wenn Sie noch nie ein OpenClaw-Plugin erstellt haben, lesen Sie zuerst
  [Erste Schritte](/de/plugins/building-plugins) für die grundlegende Paketstruktur
  und die Manifest-Einrichtung.
</Info>

<Tip>
  Anbieter-Plugins fügen Modelle zur normalen Inferenzschleife von OpenClaw hinzu. Wenn das Modell über einen nativen Agent-Daemon laufen muss, der Threads, Compaction oder Tool-Ereignisse besitzt, koppeln Sie den Anbieter mit einem [agent harness](/de/plugins/sdk-agent-harness), statt Daemon-Protokolldetails in den Core zu legen.
</Tip>

## Schritt-für-Schritt

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
      "description": "Acme-AI-Modellanbieter",
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
          "choiceLabel": "Acme-AI-API-Schlüssel",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme-AI-API-Schlüssel"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Das Manifest deklariert `providerAuthEnvVars`, damit OpenClaw Zugangsdaten erkennen kann, ohne Ihre Plugin-Laufzeit zu laden. Fügen Sie `providerAuthAliases` hinzu, wenn eine Anbietervariante die Auth einer anderen Anbieter-ID wiederverwenden soll. `modelSupport` ist optional und erlaubt OpenClaw, Ihr Anbieter-Plugin automatisch aus Kurzform-Modell-IDs wie `acme-large` zu laden, bevor Laufzeit-Hooks existieren. Wenn Sie den Anbieter auf ClawHub veröffentlichen, sind diese Felder `openclaw.compat` und `openclaw.build` in `package.json` erforderlich.

  </Step>

  <Step title="Den Anbieter registrieren">
    Ein minimaler Anbieter benötigt `id`, `label`, `auth` und `catalog`:

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
              label: "Acme-AI-API-Schlüssel",
              hint: "API-Schlüssel aus Ihrem Acme-AI-Dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Geben Sie Ihren Acme-AI-API-Schlüssel ein",
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

    Das ist ein funktionierender Anbieter. Benutzer können jetzt
    `openclaw onboard --acme-ai-api-key <key>` ausführen und
    `acme-ai/acme-large` als Modell auswählen.

    Wenn der Upstream-Anbieter andere Steuer-Token als OpenClaw verwendet, fügen Sie eine kleine bidirektionale Texttransformation hinzu, statt den Stream-Pfad zu ersetzen:

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

    `input` schreibt den finalen System-Prompt und den Inhalt von Textnachrichten vor dem Transport um. `output` schreibt Assistant-Text-Deltas und finalen Text um, bevor OpenClaw seine eigenen Kontrollmarker oder die Kanalzustellung parst.

    Für gebündelte Anbieter, die nur einen Textanbieter mit API-Schlüssel-Auth plus eine einzelne kataloggestützte Laufzeit registrieren, bevorzugen Sie den schmaleren Helper `defineSingleProviderPluginEntry(...)`:

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
            label: "Acme-AI-API-Schlüssel",
            hint: "API-Schlüssel aus Ihrem Acme-AI-Dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Geben Sie Ihren Acme-AI-API-Schlüssel ein",
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

    Wenn Ihr Auth-Ablauf zusätzlich `models.providers.*`, Aliasse und das Standard-Agentenmodell beim Onboarding patchen muss, verwenden Sie die Preset-Helper aus `openclaw/plugin-sdk/provider-onboard`. Die schmalsten Helper sind
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` und
    `createModelCatalogPresetAppliers(...)`.

    Wenn ein nativer Endpunkt des Anbieters gestreamte Usage-Blöcke auf dem normalen Transport `openai-completions` unterstützt, bevorzugen Sie die gemeinsamen Katalog-Helper in `openclaw/plugin-sdk/provider-catalog-shared`, statt Anbieter-ID-Prüfungen fest zu codieren. `supportsNativeStreamingUsageCompat(...)` und `applyProviderNativeStreamingUsageCompat(...)` erkennen die Unterstützung aus der Endpunkt-Fähigkeits-Map, sodass native Endpunkte im Stil von Moonshot/DashScope weiterhin opt-in sind, selbst wenn ein Plugin eine benutzerdefinierte Anbieter-ID verwendet.

  </Step>

  <Step title="Dynamische Modellauflösung hinzufügen">
    Wenn Ihr Anbieter beliebige Modell-IDs akzeptiert (wie ein Proxy oder Router), fügen Sie `resolveDynamicModel` hinzu:

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

    Wenn die Auflösung einen Netzwerkaufruf erfordert, verwenden Sie `prepareDynamicModel` für asynchrones Warm-up — `resolveDynamicModel` wird erneut ausgeführt, nachdem es abgeschlossen ist.

  </Step>

  <Step title="Laufzeit-Hooks hinzufügen (nach Bedarf)">
    Die meisten Anbieter benötigen nur `catalog` + `resolveDynamicModel`. Fügen Sie Hooks schrittweise hinzu, wenn Ihr Anbieter sie benötigt.

    Gemeinsame Helper-Builder decken jetzt die häufigsten Familien für Replay-/Tool-Kompatibilität ab, sodass Plugins normalerweise nicht jeden Hook einzeln verdrahten müssen:

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

    | Family | Was damit verdrahtet wird |
    | --- | --- |
    | `openai-compatible` | Gemeinsame Replay-Richtlinie im OpenAI-Stil für OpenAI-kompatible Transporte, einschließlich Tool-Call-ID-Bereinigung, Korrekturen für Assistant-first-Reihenfolge und generischer Gemini-Turn-Validierung, wo der Transport sie benötigt |
    | `anthropic-by-model` | Claude-bewusste Replay-Richtlinie, ausgewählt nach `modelId`, sodass Anthropic-Message-Transporte nur dann Claude-spezifische Bereinigung von Thinking-Blöcken erhalten, wenn das aufgelöste Modell tatsächlich eine Claude-ID ist |
    | `google-gemini` | Native Gemini-Replay-Richtlinie plus Bereinigung von Bootstrap-Replay und getaggter Ausgabemodus für Reasoning |
    | `passthrough-gemini` | Bereinigung von Gemini-Thought-Signaturen für Gemini-Modelle, die über OpenAI-kompatible Proxy-Transporte laufen; aktiviert weder native Gemini-Replay-Validierung noch Bootstrap-Umschreibungen |
    | `hybrid-anthropic-openai` | Hybride Richtlinie für Anbieter, die Anthropic-Message- und OpenAI-kompatible Modelloberflächen in einem Plugin mischen; optionales Entfernen Claude-spezifischer Thinking-Blöcke bleibt auf die Anthropic-Seite beschränkt |

    Echte gebündelte Beispiele:

    - `google` und `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode` und `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` und `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai` und `zai`: `openai-compatible`

    Heute verfügbare Stream-Familien:

    | Family | Was damit verdrahtet wird |
    | --- | --- |
    | `google-thinking` | Normalisierung der Gemini-Thinking-Payload auf dem gemeinsamen Stream-Pfad |
    | `kilocode-thinking` | Kilo-Reasoning-Wrapper auf dem gemeinsamen Proxy-Stream-Pfad, wobei `kilo/auto` und nicht unterstützte Proxy-Reasoning-IDs injiziertes Thinking überspringen |
    | `moonshot-thinking` | Moonshot-Mapping für binäre native Thinking-Payload aus Konfiguration + `/think`-Level |
    | `minimax-fast-mode` | Umschreiben von MiniMax-Modellen im Fast-Mode auf dem gemeinsamen Stream-Pfad |
    | `openai-responses-defaults` | Gemeinsame native OpenAI-/Codex-Responses-Wrapper: Attributions-Header, `/fast`/`serviceTier`, Textausführlichkeit, native Codex-Websuche, OpenAI-Reasoning-kompatibles Payload-Shaping und Responses-Kontextverwaltung |
    | `openrouter-thinking` | OpenRouter-Reasoning-Wrapper für Proxy-Routen, wobei Sprünge für nicht unterstützte Modelle/`auto` zentral behandelt werden |
    | `tool-stream-default-on` | Standardmäßig aktivierter `tool_stream`-Wrapper für Anbieter wie Z.AI, die Tool-Streaming wünschen, sofern es nicht explizit deaktiviert wird |

    Echte gebündelte Beispiele:

    - `google` und `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` und `minimax-portal`: `minimax-fast-mode`
    - `openai` und `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` exportiert außerdem das Enum für Replay-Familien sowie die gemeinsamen Helper, aus denen diese Familien aufgebaut werden. Häufige öffentliche Exporte umfassen:

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - gemeinsame Replay-Builder wie `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)` und
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini-Replay-Helper wie `sanitizeGoogleGeminiReplayHistory(...)`
      und `resolveTaggedReasoningOutputMode()`
    - Endpunkt-/Modell-Helper wie `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)` und
      `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` stellt sowohl den Familien-Builder als
    auch die öffentlichen Wrapper-Helper bereit, die diese Familien wiederverwenden. Häufige öffentliche Exporte umfassen:

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - gemeinsame OpenAI-/Codex-Wrapper wie
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)` und
      `createCodexNativeWebSearchWrapper(...)`
    - gemeinsame Proxy-/Anbieter-Wrapper wie `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)` und `createMinimaxFastModeWrapper(...)`

    Einige Stream-Helper bleiben absichtlich anbieterlokal. Aktuelles gebündeltes Beispiel: `@openclaw/anthropic-provider` exportiert
    `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` und die
    Anthropic-Wrapper-Builder auf niedriger Ebene aus seiner öffentlichen Nahtstelle `api.ts` / `contract-api.ts`. Diese Helper bleiben Anthropic-spezifisch, weil sie auch die Behandlung von Claude-OAuth-Betas und `context1m`-Gating kodieren.

    Andere gebündelte Anbieter behalten transportspezifische Wrapper ebenfalls lokal, wenn das Verhalten sich nicht sauber über Familien hinweg teilen lässt. Aktuelles Beispiel: Das gebündelte xAI-Plugin hält das native Shaping der xAI-Responses in seinem eigenen `wrapStreamFn`, einschließlich Umschreibungen von `/fast`-Aliasen, Standard-`tool_stream`, Bereinigung nicht unterstützter strikter Tools und Entfernung xAI-spezifischer Reasoning-Payload.

    `openclaw/plugin-sdk/provider-tools` stellt derzeit eine gemeinsame Tool-Schema-Familie plus gemeinsame Schema-/Kompatibilitäts-Helper bereit:

    - `ProviderToolCompatFamily` dokumentiert das aktuelle Inventar der gemeinsamen Familien.
    - `buildProviderToolCompatFamilyHooks("gemini")` verdrahtet Gemini-Schemabereinigung + Diagnose für Anbieter, die Gemini-sichere Tool-Schemas benötigen.
    - `normalizeGeminiToolSchemas(...)` und `inspectGeminiToolSchemas(...)` sind die zugrunde liegenden öffentlichen Gemini-Schema-Helper.
    - `resolveXaiModelCompatPatch()` gibt den gebündelten xAI-Kompatibilitätspatch zurück:
      `toolSchemaProfile: "xai"`, nicht unterstützte Schema-Schlüsselwörter, native Unterstützung für `web_search` und das Dekodieren HTML-entity-kodierter Tool-Call-Argumente.
    - `applyXaiModelCompat(model)` wendet denselben xAI-Kompatibilitätspatch auf ein aufgelöstes Modell an, bevor es den Runner erreicht.

    Echtes gebündeltes Beispiel: Das xAI-Plugin verwendet `normalizeResolvedModel` plus `contributeResolvedModelCompat`, um diese Kompatibilitätsmetadaten beim Anbieter zu halten, statt xAI-Regeln im Core fest zu codieren.

    Dasselbe Muster mit Paket-Root wird auch von anderen gebündelten Anbietern verwendet:

    - `@openclaw/openai-provider`: `api.ts` exportiert Anbieter-Builder,
      Helper für Standardmodelle und Builder für Realtime-Anbieter
    - `@openclaw/openrouter-provider`: `api.ts` exportiert den Anbieter-Builder
      plus Onboarding-/Konfigurations-Helper

    <Tabs>
      <Tab title="Token-Austausch">
        Für Anbieter, die vor jedem Inferenzaufruf einen Token-Austausch benötigen:

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
        Für Anbieter, die benutzerdefinierte Anfrage-Header oder Änderungen am Body benötigen:

        ```typescript
        // wrapStreamFn gibt eine von ctx.streamFn abgeleitete StreamFn zurück
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
        Für Anbieter, die native Anfrage-/Sitzungs-Header oder Metadaten auf
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
        Für Anbieter, die Usage-/Abrechnungsdaten verfügbar machen:

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

    <Accordion title="Alle verfügbaren Anbieter-Hooks">
      OpenClaw ruft Hooks in dieser Reihenfolge auf. Die meisten Anbieter verwenden nur 2–3:

      | # | Hook | Wann verwenden |
      | --- | --- | --- |
      | 1 | `catalog` | Modellkatalog oder Defaults für Basis-URL |
      | 2 | `applyConfigDefaults` | Anbieter-eigene globale Defaults während der Konfigurationsmaterialisierung |
      | 3 | `normalizeModelId` | Bereinigung von Legacy-/Vorschau-Modell-ID-Aliasen vor dem Lookup |
      | 4 | `normalizeTransport` | Bereinigung von `api` / `baseUrl` der Anbieterfamilie vor der generischen Modellzusammensetzung |
      | 5 | `normalizeConfig` | `models.providers.<id>`-Konfiguration normalisieren |
      | 6 | `applyNativeStreamingUsageCompat` | Native Streaming-Usage-Kompatibilitätsumschreibungen für Konfigurationsanbieter |
      | 7 | `resolveConfigApiKey` | Anbieter-eigene Auflösung von Env-Marker-Auth |
      | 8 | `resolveSyntheticAuth` | Synthetische Auth für lokal/self-hosted oder konfigurationsgestützte Fälle |
      | 9 | `shouldDeferSyntheticProfileAuth` | Gespeicherte synthetische Profil-Platzhalter hinter Env-/Konfigurations-Auth zurückstufen |
      | 10 | `resolveDynamicModel` | Beliebige Upstream-Modell-IDs akzeptieren |
      | 11 | `prepareDynamicModel` | Asynchroner Metadatenabruf vor der Auflösung |
      | 12 | `normalizeResolvedModel` | Transport-Umschreibungen vor dem Runner |

    Hinweise zum Laufzeit-Fallback:

    - `normalizeConfig` prüft zuerst den passenden Anbieter und dann andere
      hook-fähige Anbieter-Plugins, bis eines die Konfiguration tatsächlich ändert.
      Wenn kein Anbieter-Hook einen unterstützten Konfigurationseintrag der Google-Familie umschreibt, greift weiterhin der gebündelte Google-Konfigurationsnormalisierer.
    - `resolveConfigApiKey` verwendet den Anbieter-Hook, wenn er bereitgestellt wird. Der gebündelte Pfad `amazon-bedrock` hat hier außerdem einen eingebauten AWS-Env-Marker-Resolver, obwohl Bedrock-Laufzeit-Auth selbst weiterhin die AWS-SDK-Standardkette verwendet.
      | 13 | `contributeResolvedModelCompat` | Kompatibilitätsflags für Vendor-Modelle hinter einem anderen kompatiblen Transport |
      | 14 | `capabilities` | Legacy-statischer Capability-Bag; nur zur Kompatibilität |
      | 15 | `normalizeToolSchemas` | Anbieter-eigene Bereinigung von Tool-Schemas vor der Registrierung |
      | 16 | `inspectToolSchemas` | Anbieter-eigene Tool-Schema-Diagnose |
      | 17 | `resolveReasoningOutputMode` | Getaggter vs. nativer Vertrag für Reasoning-Ausgabe |
      | 18 | `prepareExtraParams` | Standard-Anfrageparameter |
      | 19 | `createStreamFn` | Vollständig benutzerdefinierter StreamFn-Transport |
      | 20 | `wrapStreamFn` | Benutzerdefinierte Header-/Body-Wrapper auf dem normalen Stream-Pfad |
      | 21 | `resolveTransportTurnState` | Native Header/Metadaten pro Turn |
      | 22 | `resolveWebSocketSessionPolicy` | Native WS-Sitzungs-Header/Cooldown |
      | 23 | `formatApiKey` | Benutzerdefinierte Form des Laufzeit-Tokens |
      | 24 | `refreshOAuth` | Benutzerdefiniertes OAuth-Refresh |
      | 25 | `buildAuthDoctorHint` | Hinweise zur Auth-Reparatur |
      | 26 | `matchesContextOverflowError` | Anbieter-eigene Erkennung von Überläufen |
      | 27 | `classifyFailoverReason` | Anbieter-eigene Klassifizierung von Rate-Limit/Überlastung |
      | 28 | `isCacheTtlEligible` | Gating für Prompt-Cache-TTL |
      | 29 | `buildMissingAuthMessage` | Benutzerdefinierter Hinweis für fehlende Auth |
      | 30 | `suppressBuiltInModel` | Veraltete Upstream-Zeilen ausblenden |
      | 31 | `augmentModelCatalog` | Synthetische Vorwärtskompatibilitäts-Zeilen |
      | 32 | `isBinaryThinking` | Binäres Thinking ein/aus |
      | 33 | `supportsXHighThinking` | Unterstützung für `xhigh`-Reasoning |
      | 34 | `supportsAdaptiveThinking` | Unterstützung für adaptives Thinking |
      | 35 | `supportsMaxThinking` | Unterstützung für `max`-Reasoning |
      | 36 | `resolveDefaultThinkingLevel` | Standardrichtlinie für `/think` |
      | 37 | `isModernModelRef` | Abgleich von Live-/Smoke-Modellen |
      | 38 | `prepareRuntimeAuth` | Token-Austausch vor der Inferenz |
      | 39 | `resolveUsageAuth` | Benutzerdefiniertes Parsing von Usage-Zugangsdaten |
      | 40 | `fetchUsageSnapshot` | Benutzerdefinierter Usage-Endpunkt |
      | 41 | `createEmbeddingProvider` | Anbieter-eigener Embedding-Adapter für Memory/Suche |
      | 42 | `buildReplayPolicy` | Benutzerdefinierte Richtlinie für Transcript-Replay/Compaction |
      | 43 | `sanitizeReplayHistory` | Anbieter-spezifische Replay-Umschreibungen nach generischer Bereinigung |
      | 44 | `validateReplayTurns` | Strikte Validierung von Replay-Turns vor dem eingebetteten Runner |
      | 45 | `onModelSelected` | Callback nach der Auswahl (z. B. Telemetrie) |

      Hinweis zur Prompt-Abstimmung:

      - `resolveSystemPromptContribution` erlaubt einem Anbieter, cache-bewusste
        Hinweise für den System-Prompt in einer Modellfamilie zu injizieren. Bevorzugen Sie es gegenüber `before_prompt_build`, wenn das Verhalten zu einer Anbieter-/Modellfamilie gehört und die stabile/dynamische Cache-Aufteilung erhalten bleiben soll.

      Ausführliche Beschreibungen und Beispiele aus der Praxis finden Sie unter
      [Internals: Provider Runtime Hooks](/de/plugins/architecture#provider-runtime-hooks).
    </Accordion>

  </Step>

  <Step title="Zusätzliche Fähigkeiten hinzufügen (optional)">
    <a id="step-5-add-extra-capabilities"></a>
    Ein Anbieter-Plugin kann Sprache, Realtime-Transkription, Realtime-Stimme,
    Medienverständnis, Bildgenerierung, Videogenerierung, Web-Fetch
    und Websuche neben der Textinferenz registrieren:

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

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
        describeImage: async (req) => ({ text: "Ein Foto von ..." }),
        transcribeAudio: async (req) => ({ text: "Transkript ..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* Bildergebnis */ }),
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
        hint: "Seiten über Acmes Rendering-Backend abrufen.",
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
          description: "Eine Seite über Acme Fetch abrufen.",
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

    OpenClaw klassifiziert dies als Plugin mit **hybrider Fähigkeit**. Das ist das empfohlene Muster für Firmen-Plugins (ein Plugin pro Anbieter). Siehe [Internals: Capability Ownership](/de/plugins/architecture#capability-ownership-model).

    Für die Videogenerierung bevorzugen Sie die oben gezeigte, modusbewusste Form der Fähigkeiten:
    `generate`, `imageToVideo` und `videoToVideo`. Flache aggregierte Felder wie
    `maxInputImages`, `maxInputVideos` und `maxDurationSeconds` reichen nicht aus, um Unterstützung oder deaktivierte Modi für Transformationsmodi sauber zu bewerben.

    Anbieter für Musikgenerierung sollten demselben Muster folgen:
    `generate` für promptbasierte Generierung und `edit` für referenzbildbasierte Generierung. Flache aggregierte Felder wie `maxInputImages`,
    `supportsLyrics` und `supportsFormat` reichen nicht aus, um Unterstützung für Bearbeitung zu bewerben; explizite Blöcke `generate` / `edit` sind der erwartete Vertrag.

  </Step>

  <Step title="Testen">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Exportieren Sie Ihr Anbieter-Konfigurationsobjekt aus index.ts oder einer dedizierten Datei
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("löst dynamische Modelle auf", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("gibt den Katalog zurück, wenn ein Schlüssel verfügbar ist", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("gibt null für den Katalog zurück, wenn kein Schlüssel vorhanden ist", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## In ClawHub veröffentlichen

Anbieter-Plugins werden wie jeder andere externe Code-Plugin veröffentlicht:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Verwenden Sie hier nicht den veralteten Publish-Alias nur für Skills; Plugin-Pakete sollten `clawhub package publish` verwenden.

## Dateistruktur

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers-Metadaten
├── openclaw.plugin.json      # Manifest mit Anbieter-Auth-Metadaten
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage-Endpunkt (optional)
```

## Referenz zur Katalogreihenfolge

`catalog.order` steuert, wann Ihr Katalog relativ zu eingebauten Anbietern zusammengeführt wird:

| Order     | Wann          | Anwendungsfall                                  |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | Erster Durchlauf | Einfache Anbieter mit API-Schlüssel           |
| `profile` | Nach simple   | Anbieter, die von Auth-Profilen abhängen        |
| `paired`  | Nach profile  | Mehrere verwandte Einträge synthetisieren       |
| `late`    | Letzter Durchlauf | Vorhandene Anbieter überschreiben (gewinnt bei Kollision) |

## Nächste Schritte

- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) — wenn Ihr Plugin auch einen Kanal bereitstellt
- [SDK Runtime](/de/plugins/sdk-runtime) — `api.runtime`-Helper (TTS, Suche, Subagent)
- [SDK-Überblick](/de/plugins/sdk-overview) — vollständige Referenz für Subpfad-Importe
- [Plugin-Internals](/de/plugins/architecture#provider-runtime-hooks) — Hook-Details und gebündelte Beispiele
