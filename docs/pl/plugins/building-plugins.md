---
read_when:
    - Chcesz utworzyć nowy Plugin OpenClaw
    - Potrzebujesz szybkiego startu do tworzenia Pluginów
    - Dodajesz nowy kanał, providera, narzędzie lub inną capability do OpenClaw
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Tworzenie Pluginów
x-i18n:
    generated_at: "2026-04-25T13:52:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

Pluginy rozszerzają OpenClaw o nowe capabilities: kanały, providery modeli,
mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym, rozumienie multimediów, generowanie obrazów, generowanie wideo, pobieranie z sieci, wyszukiwanie w sieci, narzędzia agenta albo
dowolną kombinację tych elementów.

Nie musisz dodawać swojego Plugin do repozytorium OpenClaw. Opublikuj go w
[ClawHub](/pl/tools/clawhub) lub npm, a użytkownicy zainstalują go przez
`openclaw plugins install <package-name>`. OpenClaw najpierw próbuje ClawHub, a potem
automatycznie przechodzi do npm.

## Wymagania wstępne

- Node >= 22 i menedżer pakietów (npm lub pnpm)
- Znajomość TypeScript (ESM)
- Dla Pluginów w repo: sklonowane repozytorium i wykonane `pnpm install`

## Jaki rodzaj Plugin?

<CardGroup cols={3}>
  <Card title="Plugin kanału" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą komunikacyjną (Discord, IRC itp.)
  </Card>
  <Card title="Plugin providera" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj providera modeli (LLM, proxy lub własny endpoint)
  </Card>
  <Card title="Plugin narzędzia / hooka" icon="wrench" href="/pl/plugins/hooks">
    Rejestruj narzędzia agenta, hooki zdarzeń lub usługi — kontynuuj poniżej
  </Card>
</CardGroup>

Dla Plugin kanału, który nie ma gwarancji instalacji podczas uruchamiania onboarding/setup,
użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy to adapter konfiguracji + parę kreatora,
która informuje o wymaganiu instalacji i kończy działanie bezpieczną odmową przy rzeczywistych zapisach konfiguracji,
dopóki Plugin nie zostanie zainstalowany.

## Szybki start: Plugin narzędzia

Ten przewodnik tworzy minimalny Plugin, który rejestruje narzędzie agenta. Pluginy kanałów
i providerów mają dedykowane przewodniki podlinkowane powyżej.

<Steps>
  <Step title="Utwórz pakiet i manifest">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
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
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Każdy Plugin potrzebuje manifestu, nawet bez konfiguracji. Zobacz
    [Manifest](/pl/plugins/manifest), aby poznać pełny schemat. Kanoniczne fragmenty publikacji
    w ClawHub znajdują się w `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Napisz punkt wejścia">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` służy do Pluginów innych niż kanały. Dla kanałów użyj
    `defineChannelPluginEntry` — zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).
    Pełne opcje punktu wejścia znajdziesz w [Punkty wejścia](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Testuj i publikuj">

    **Pluginy zewnętrzne:** zweryfikuj i opublikuj w ClawHub, a następnie zainstaluj:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw sprawdza też ClawHub przed npm dla zwykłych specyfikacji pakietów takich jak
    `@myorg/openclaw-my-plugin`.

    **Pluginy w repo:** umieść w drzewie obszaru roboczego dołączonych Pluginów — zostaną wykryte automatycznie.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Capabilities Pluginów

Pojedynczy Plugin może zarejestrować dowolną liczbę capabilities przez obiekt `api`:

| Capability             | Metoda rejestracji                              | Szczegółowy przewodnik                                                         |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| Inferencja tekstu (LLM)   | `api.registerProvider(...)`                      | [Pluginy providerów](/pl/plugins/sdk-provider-plugins)                               |
| Backend inferencji CLI  | `api.registerCliBackend(...)`                    | [Backendy CLI](/pl/gateway/cli-backends)                                           |
| Kanał / wiadomości    | `api.registerChannel(...)`                       | [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)                                 |
| Mowa (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos w czasie rzeczywistym         | `api.registerRealtimeVoiceProvider(...)`         | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozumienie multimediów    | `api.registerMediaUnderstandingProvider(...)`    | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie obrazów       | `api.registerImageGenerationProvider(...)`       | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie muzyki       | `api.registerMusicGenerationProvider(...)`       | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie wideo       | `api.registerVideoGenerationProvider(...)`       | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pobieranie z sieci              | `api.registerWebFetchProvider(...)`              | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Wyszukiwanie w sieci             | `api.registerWebSearchProvider(...)`             | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware wyniku narzędzia | `api.registerAgentToolResultMiddleware(...)`     | [Przegląd SDK](/pl/plugins/sdk-overview#registration-api)                          |
| Narzędzia agenta            | `api.registerTool(...)`                          | Poniżej                                                                          |
| Polecenia niestandardowe        | `api.registerCommand(...)`                       | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |
| Hooki Pluginów           | `api.on(...)`                                    | [Hooki Pluginów](/pl/plugins/hooks)                                                  |
| Wewnętrzne hooki zdarzeń   | `api.registerHook(...)`                          | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |
| Trasy HTTP            | `api.registerHttpRoute(...)`                     | [Wewnętrzne informacje](/pl/plugins/architecture-internals#gateway-http-routes)                |
| Podpolecenia CLI        | `api.registerCli(...)`                           | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |

Pełne API rejestracji znajdziesz w [Przegląd SDK](/pl/plugins/sdk-overview#registration-api).

Dołączone Pluginy mogą używać `api.registerAgentToolResultMiddleware(...)`, gdy
potrzebują asynchronicznego przepisywania wyników narzędzi, zanim model zobaczy wynik. Zadeklaruj
docelowe runtime w `contracts.agentToolResultMiddleware`, na przykład
`["pi", "codex"]`. To zaufana powierzchnia dla dołączonych Pluginów; zewnętrzne
Pluginy powinny preferować zwykłe hooki Pluginów OpenClaw, chyba że OpenClaw rozwinie
jawne zasady zaufania dla tej capability.

Jeśli Twój Plugin rejestruje własne metody Gateway RPC, utrzymuj je pod
prefiksem specyficznym dla Plugin. Główne przestrzenie nazw administratora (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozwiązują się do
`operator.admin`, nawet jeśli Plugin prosi o węższy zakres.

Semantyka strażników hooków, o której warto pamiętać:

- `before_tool_call`: `{ block: true }` jest rozstrzygające i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jako brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzeń exec, przyciski Telegram, interakcje Discord lub polecenie `/approve` na dowolnym kanale.
- `before_install`: `{ block: true }` jest rozstrzygające i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jako brak decyzji.
- `message_sending`: `{ cancel: true }` jest rozstrzygające i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jako brak decyzji.
- `message_received`: preferuj typizowane pole `threadId`, gdy potrzebujesz routingu przychodzącego wątku/tematu. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: preferuj typizowane pola routingu `replyToId` / `threadId` zamiast kluczy metadanych specyficznych dla kanału.

Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i zatwierdzenia Pluginów z ograniczonym fallbackiem: gdy identyfikator zatwierdzenia exec nie zostanie znaleziony, OpenClaw ponawia ten sam identyfikator przez zatwierdzenia Pluginów. Przekazywanie zatwierdzeń Pluginów można konfigurować niezależnie przez `approvals.plugin` w konfiguracji.

Jeśli niestandardowa logika zatwierdzeń musi wykrywać ten sam przypadek ograniczonego fallbacku,
preferuj `isApprovalNotFoundError` z `openclaw/plugin-sdk/error-runtime`
zamiast ręcznego dopasowywania ciągów wygaśnięcia zatwierdzeń.

Przykłady i dokumentację hooków znajdziesz w [Hooki Pluginów](/pl/plugins/hooks).

## Rejestrowanie narzędzi agenta

Narzędzia to typizowane funkcje, które LLM może wywoływać. Mogą być wymagane (zawsze
dostępne) lub opcjonalne (opt-in użytkownika):

```typescript
register(api) {
  // Narzędzie wymagane — zawsze dostępne
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Narzędzie opcjonalne — użytkownik musi dodać do allowlisty
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Użytkownicy włączają narzędzia opcjonalne w konfiguracji:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nazwy narzędzi nie mogą kolidować z podstawowymi narzędziami (konflikty są pomijane)
- Używaj `optional: true` dla narzędzi z efektami ubocznymi lub dodatkowymi wymaganiami binarnymi
- Użytkownicy mogą włączyć wszystkie narzędzia z Plugin, dodając identyfikator Plugin do `tools.allow`

## Konwencje importu

Zawsze importuj z ukierunkowanych ścieżek `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Niepoprawnie: monolityczny root (przestarzałe, zostanie usunięte)
import { ... } from "openclaw/plugin-sdk";
```

Pełną dokumentację podścieżek znajdziesz w [Przegląd SDK](/pl/plugins/sdk-overview).

Wewnątrz swojego Plugin używaj lokalnych plików barrel (`api.ts`, `runtime-api.ts`) dla
importów wewnętrznych — nigdy nie importuj własnego Plugin przez jego ścieżkę SDK.

W przypadku Pluginów providerów utrzymuj helpery specyficzne dla providera w tych
barrelach na poziomie głównym pakietu, chyba że dana powierzchnia jest naprawdę ogólna. Bieżące dołączone przykłady:

- Anthropic: opakowania strumienia Claude oraz helpery `service_tier` / beta
- OpenAI: buildery providerów, helpery modeli domyślnych, providery realtime
- OpenRouter: builder providera oraz helpery onboardingu/konfiguracji

Jeśli helper jest przydatny tylko wewnątrz jednego dołączonego pakietu providera, utrzymuj go na tej
powierzchni poziomu głównego pakietu zamiast promować do `openclaw/plugin-sdk/*`.

Niektóre wygenerowane powierzchnie helperów `openclaw/plugin-sdk/<bundled-id>` nadal istnieją dla
utrzymania dołączonych Pluginów i zgodności, na przykład
`plugin-sdk/feishu-setup` lub `plugin-sdk/zalo-setup`. Traktuj je jako
zarezerwowane powierzchnie, a nie jako domyślny wzorzec dla nowych zewnętrznych Pluginów.

## Lista kontrolna przed wysłaniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** jest obecny i prawidłowy</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` albo `definePluginEntry`</Check>
<Check>Wszystkie importy używają ukierunkowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają modułów lokalnych, a nie samoodwołań przez SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` przechodzi (Pluginy w repo)</Check>

## Testowanie wersji beta

1. Śledź tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i zasubskrybuj przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz też włączyć powiadomienia dla oficjalnego konta OpenClaw X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój Plugin względem tagu beta, gdy tylko się pojawi. Okno przed stable zwykle trwa tylko kilka godzin.
3. Po testach napisz w wątku swojego Plugin na kanale Discord `plugin-forum`, czy jest `all good`, czy co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz lub zaktualizuj issue zatytułowane `Beta blocker: <plugin-name> - <summary>` i nadaj etykietę `beta-blocker`. Umieść link do issue w swoim wątku.
5. Otwórz PR do `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i podlinkuj issue zarówno w PR, jak i w swoim wątku Discord. Współtwórcy nie mogą etykietować PR, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR są mergowane; blokery bez PR mogą mimo to trafić do wydania. Maintainerzy obserwują te wątki podczas testowania wersji beta.
6. Cisza oznacza zielone światło. Jeśli przegapisz okno, Twoja poprawka prawdopodobnie trafi do następnego cyklu.

## Następne kroki

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj Plugin kanału wiadomości
  </Card>
  <Card title="Pluginy providerów" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj Plugin providera modeli
  </Card>
  <Card title="Przegląd SDK" icon="book-open" href="/pl/plugins/sdk-overview">
    Mapa importów i dokumentacja API rejestracji
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, wyszukiwanie, subagent przez api.runtime
  </Card>
  <Card title="Testowanie" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowe
  </Card>
  <Card title="Manifest Plugin" icon="file-json" href="/pl/plugins/manifest">
    Pełna dokumentacja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Architektura Pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury wewnętrznej
- [Przegląd SDK](/pl/plugins/sdk-overview) — dokumentacja SDK Pluginów
- [Manifest](/pl/plugins/manifest) — format manifestu Plugin
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie Pluginów kanałów
- [Pluginy providerów](/pl/plugins/sdk-provider-plugins) — tworzenie Pluginów providerów
