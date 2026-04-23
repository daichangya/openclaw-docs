---
read_when:
    - Chcesz utworzyć nowy Plugin OpenClaw
    - Potrzebujesz szybkiego startu do tworzenia Pluginów
    - Dodajesz nowy kanał, provider, narzędzie lub inną funkcję do OpenClaw
sidebarTitle: Getting Started
summary: Utwórz swój pierwszy Plugin OpenClaw w kilka minut
title: Tworzenie Pluginów
x-i18n:
    generated_at: "2026-04-23T10:03:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35faa4e2722a58aa12330103b42d2dd6e14e56ee46720883d0945a984d991f79
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Tworzenie Pluginów

Pluginy rozszerzają OpenClaw o nowe możliwości: kanały, providery modeli,
mowę, transkrypcję w czasie rzeczywistym, głos w czasie rzeczywistym, rozumienie mediów, generowanie obrazów,
generowanie wideo, web fetch, web search, narzędzia agenta lub dowolną
kombinację tych funkcji.

Nie musisz dodawać swojego Plugin do repozytorium OpenClaw. Opublikuj go w
[ClawHub](/pl/tools/clawhub) lub npm, a użytkownicy zainstalują go poleceniem
`openclaw plugins install <package-name>`. OpenClaw najpierw próbuje ClawHub, a
następnie automatycznie wraca do npm.

## Wymagania wstępne

- Node >= 22 i menedżer pakietów (npm lub pnpm)
- Znajomość TypeScript (ESM)
- Dla Pluginów w repo: sklonowane repozytorium i wykonane `pnpm install`

## Jaki rodzaj Plugin?

<CardGroup cols={3}>
  <Card title="Plugin kanału" icon="messages-square" href="/pl/plugins/sdk-channel-plugins">
    Połącz OpenClaw z platformą wiadomości (Discord, IRC itp.)
  </Card>
  <Card title="Plugin providera" icon="cpu" href="/pl/plugins/sdk-provider-plugins">
    Dodaj providera modeli (LLM, proxy lub niestandardowy punkt końcowy)
  </Card>
  <Card title="Plugin narzędzia / hooka" icon="wrench">
    Rejestruj narzędzia agenta, hooki zdarzeń lub usługi — kontynuuj poniżej
  </Card>
</CardGroup>

Jeśli Plugin kanału jest opcjonalny i może nie być zainstalowany, gdy działa onboarding/setup,
użyj `createOptionalChannelSetupSurface(...)` z
`openclaw/plugin-sdk/channel-setup`. Tworzy adapter konfiguracji + parę kreatora,
która komunikuje wymaganie instalacji i bezpiecznie odmawia rzeczywistych zapisów konfiguracji,
dopóki Plugin nie zostanie zainstalowany.

## Szybki start: Plugin narzędzia

To omówienie tworzy minimalny Plugin rejestrujący narzędzie agenta. Pluginy kanałów
i providerów mają osobne przewodniki podlinkowane powyżej.

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
      "description": "Dodaje niestandardowe narzędzie do OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Każdy Plugin potrzebuje manifestu, nawet bez konfiguracji. Zobacz
    [Manifest](/pl/plugins/manifest), aby poznać pełny schemat. Kanoniczne snippet-y
    publikacji w ClawHub znajdują się w `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` jest przeznaczone dla Pluginów innych niż kanałowe. Dla kanałów użyj
    `defineChannelPluginEntry` — zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).
    Aby poznać pełne opcje punktu wejścia, zobacz [Punkty wejścia](/pl/plugins/sdk-entrypoints).

  </Step>

  <Step title="Przetestuj i opublikuj">

    **Pluginy zewnętrzne:** zwaliduj i opublikuj w ClawHub, a następnie zainstaluj:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw sprawdza też ClawHub przed npm dla zwykłych specyfikacji pakietów, takich jak
    `@myorg/openclaw-my-plugin`.

    **Pluginy w repo:** umieść w drzewie obszaru roboczego dołączonych Pluginów — będą automatycznie wykrywane.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Możliwości Plugin

Pojedynczy Plugin może zarejestrować dowolną liczbę możliwości przez obiekt `api`:

| Możliwość             | Metoda rejestracji                             | Szczegółowy przewodnik                                                           |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Inferencja tekstowa (LLM)   | `api.registerProvider(...)`                      | [Pluginy providerów](/pl/plugins/sdk-provider-plugins)                               |
| Backend inferencji CLI  | `api.registerCliBackend(...)`                    | [Backendy CLI](/pl/gateway/cli-backends)                                           |
| Kanał / wiadomości    | `api.registerChannel(...)`                       | [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)                                 |
| Mowa (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Głos w czasie rzeczywistym         | `api.registerRealtimeVoiceProvider(...)`         | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozumienie mediów    | `api.registerMediaUnderstandingProvider(...)`    | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie obrazów       | `api.registerImageGenerationProvider(...)`       | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie muzyki       | `api.registerMusicGenerationProvider(...)`       | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generowanie wideo       | `api.registerVideoGenerationProvider(...)`       | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Pluginy providerów](/pl/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Rozszerzenie Embedded Pi  | `api.registerEmbeddedExtensionFactory(...)`      | [Przegląd SDK](/pl/plugins/sdk-overview#registration-api)                          |
| Narzędzia agenta            | `api.registerTool(...)`                          | Poniżej                                                                           |
| Polecenia niestandardowe        | `api.registerCommand(...)`                       | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |
| Hooki zdarzeń            | `api.registerHook(...)`                          | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |
| Trasy HTTP            | `api.registerHttpRoute(...)`                     | [Wewnętrzne elementy](/pl/plugins/architecture#gateway-http-routes)                          |
| Podpolecenia CLI        | `api.registerCli(...)`                           | [Punkty wejścia](/pl/plugins/sdk-entrypoints)                                        |

Pełne API rejestracji znajdziesz w [Przeglądzie SDK](/pl/plugins/sdk-overview#registration-api).

Używaj `api.registerEmbeddedExtensionFactory(...)`, gdy Plugin potrzebuje natywnych dla Pi
hooków embedded-runner, takich jak asynchroniczne przepisywanie `tool_result` przed emisją końcowej
wiadomości z wynikiem narzędzia. Preferuj zwykłe hooki Plugin OpenClaw, gdy
ta praca nie wymaga czasowania rozszerzenia Pi.

Jeśli Twój Plugin rejestruje niestandardowe metody RPC gateway, utrzymuj je pod
prefiksem specyficznym dla Pluginu. Główne przestrzenie nazw administracyjnych (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozstrzygają się do
`operator.admin`, nawet jeśli Plugin żąda węższego zakresu.

Semantyka zabezpieczeń hooków, o której warto pamiętać:

- `before_tool_call`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_tool_call`: `{ block: false }` jest traktowane jako brak decyzji.
- `before_tool_call`: `{ requireApproval: true }` wstrzymuje wykonanie agenta i prosi użytkownika o zatwierdzenie przez nakładkę zatwierdzeń exec, przyciski Telegram, interakcje Discord lub polecenie `/approve` w dowolnym kanale.
- `before_install`: `{ block: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `before_install`: `{ block: false }` jest traktowane jako brak decyzji.
- `message_sending`: `{ cancel: true }` jest końcowe i zatrzymuje handlery o niższym priorytecie.
- `message_sending`: `{ cancel: false }` jest traktowane jako brak decyzji.
- `message_received`: preferuj typowane pole `threadId`, gdy potrzebujesz routingu przychodzących wątków/tematów. Zachowaj `metadata` dla dodatków specyficznych dla kanału.
- `message_sending`: preferuj typowane pola routingu `replyToId` / `threadId` zamiast kluczy metadanych specyficznych dla kanału.

Polecenie `/approve` obsługuje zarówno zatwierdzenia exec, jak i Plugin z ograniczonym fallbackiem: gdy identyfikator zatwierdzenia exec nie zostanie znaleziony, OpenClaw ponawia próbę z tym samym identyfikatorem przez zatwierdzenia Plugin. Przekazywanie zatwierdzeń Plugin można konfigurować niezależnie przez `approvals.plugin` w konfiguracji.

Jeśli niestandardowa logika zatwierdzeń musi wykryć ten sam przypadek ograniczonego fallbacku,
preferuj `isApprovalNotFoundError` z `openclaw/plugin-sdk/error-runtime`
zamiast ręcznie dopasowywać ciągi wygaśnięcia zatwierdzeń.

Szczegóły znajdziesz w [Semantyce decyzji hooków w przeglądzie SDK](/pl/plugins/sdk-overview#hook-decision-semantics).

## Rejestrowanie narzędzi agenta

Narzędzia to typowane funkcje, które LLM może wywołać. Mogą być wymagane (zawsze
dostępne) albo opcjonalne (wymagają zgody użytkownika):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
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

Użytkownicy włączają opcjonalne narzędzia w konfiguracji:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nazwy narzędzi nie mogą kolidować z głównymi narzędziami (konflikty są pomijane)
- Używaj `optional: true` dla narzędzi mających efekty uboczne lub dodatkowe wymagania binarne
- Użytkownicy mogą włączyć wszystkie narzędzia z Plugin przez dodanie identyfikatora Pluginu do `tools.allow`

## Konwencje importu

Zawsze importuj z ukierunkowanych ścieżek `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Pełną referencję subpath znajdziesz w [Przeglądzie SDK](/pl/plugins/sdk-overview).

We własnym Pluginie używaj lokalnych plików barrel (`api.ts`, `runtime-api.ts`) dla
importów wewnętrznych — nigdy nie importuj własnego Pluginu przez jego ścieżkę SDK.

Dla Pluginów providerów trzymaj helpery specyficzne dla providera w tych barrelach
w katalogu głównym pakietu, chyba że dany interfejs jest naprawdę ogólny. Obecne dołączone przykłady:

- Anthropic: wrappery strumienia Claude oraz helpery `service_tier` / beta
- OpenAI: buildery providerów, helpery modeli domyślnych, providery czasu rzeczywistego
- OpenRouter: builder providera oraz helpery onboardingu/konfiguracji

Jeśli helper jest przydatny tylko wewnątrz jednego dołączonego pakietu providera, trzymaj go na tym
interfejsie katalogu głównego pakietu zamiast promować go do `openclaw/plugin-sdk/*`.

Niektóre wygenerowane interfejsy pomocnicze `openclaw/plugin-sdk/<bundled-id>` nadal istnieją dla
utrzymania zgodności i konserwacji dołączonych Pluginów, na przykład
`plugin-sdk/feishu-setup` lub `plugin-sdk/zalo-setup`. Traktuj je jako zarezerwowane
powierzchnie, a nie domyślny wzorzec dla nowych zewnętrznych Pluginów.

## Lista kontrolna przed zgłoszeniem

<Check>**package.json** ma poprawne metadane `openclaw`</Check>
<Check>Manifest **openclaw.plugin.json** istnieje i jest prawidłowy</Check>
<Check>Punkt wejścia używa `defineChannelPluginEntry` lub `definePluginEntry`</Check>
<Check>Wszystkie importy używają ukierunkowanych ścieżek `plugin-sdk/<subpath>`</Check>
<Check>Importy wewnętrzne używają modułów lokalnych, a nie samoodwołań przez SDK</Check>
<Check>Testy przechodzą (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>Przechodzi `pnpm check` (Pluginy w repo)</Check>

## Testowanie wydań beta

1. Obserwuj tagi wydań GitHub w [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) i zasubskrybuj przez `Watch` > `Releases`. Tagi beta wyglądają jak `v2026.3.N-beta.1`. Możesz także włączyć powiadomienia dla oficjalnego konta OpenClaw X [@openclaw](https://x.com/openclaw), aby otrzymywać ogłoszenia o wydaniach.
2. Przetestuj swój Plugin z tagiem beta, gdy tylko się pojawi. Okno przed wydaniem stabilnym trwa zwykle tylko kilka godzin.
3. Po testach napisz w wątku swojego Pluginu na kanale Discord `plugin-forum`, podając `all good` albo opis tego, co się zepsuło. Jeśli nie masz jeszcze wątku, utwórz go.
4. Jeśli coś się zepsuje, otwórz lub zaktualizuj issue zatytułowane `Beta blocker: <plugin-name> - <summary>` i nadaj etykietę `beta-blocker`. Umieść link do issue w swoim wątku.
5. Otwórz PR do `main` zatytułowany `fix(<plugin-id>): beta blocker - <summary>` i podlinkuj issue zarówno w PR, jak i w swoim wątku Discord. Współtwórcy nie mogą nadawać etykiet PR, więc tytuł jest sygnałem po stronie PR dla maintainerów i automatyzacji. Blokery z PR są scalane; blokery bez PR mogą mimo to zostać wydane. Maintainerzy obserwują te wątki podczas testów beta.
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
    Referencja mapy importów i API rejestracji
  </Card>
  <Card title="Helpery runtime" icon="settings" href="/pl/plugins/sdk-runtime">
    TTS, search, subagent przez api.runtime
  </Card>
  <Card title="Testowanie" icon="test-tubes" href="/pl/plugins/sdk-testing">
    Narzędzia i wzorce testowe
  </Card>
  <Card title="Manifest Pluginu" icon="file-json" href="/pl/plugins/manifest">
    Pełna referencja schematu manifestu
  </Card>
</CardGroup>

## Powiązane

- [Architektura Pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury wewnętrznej
- [Przegląd SDK](/pl/plugins/sdk-overview) — referencja SDK Pluginów
- [Manifest](/pl/plugins/manifest) — format manifestu pluginu
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie Pluginów kanałów
- [Pluginy providerów](/pl/plugins/sdk-provider-plugins) — tworzenie Pluginów providerów
