---
read_when:
    - Implementowanie hooków środowiska wykonawczego providera, cyklu życia kanału lub pakietów pack
    - Debugowanie kolejności ładowania Plugin lub stanu rejestru
    - Dodawanie nowej możliwości Plugin lub Plugin silnika kontekstu
summary: 'Wewnętrzna architektura Plugin: potok ładowania, rejestr, hooki środowiska wykonawczego, trasy HTTP i tabele referencyjne'
title: Wewnętrzna architektura Plugin
x-i18n:
    generated_at: "2026-04-25T13:52:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

W przypadku publicznego modelu możliwości, kształtów Plugin oraz kontraktów
własności/wykonania zobacz [Plugin architecture](/pl/plugins/architecture). Ta strona jest
dokumentacją referencyjną wewnętrznej mechaniki: potoku ładowania, rejestru, hooków środowiska wykonawczego,
tras HTTP Gateway, ścieżek importu i tabel schematów.

## Potok ładowania

Przy starcie OpenClaw robi mniej więcej to:

1. wykrywa kandydackie katalogi główne Plugin
2. odczytuje natywne lub zgodne manifesty bundle oraz metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu dla każdego kandydata
6. ładuje włączone moduły natywne: zbudowane moduły dołączone używają natywnego loadera;
   niezbudowane natywne Pluginy używają jiti
7. wywołuje natywne hooki `register(api)` i zbiera rejestracje do rejestru Plugin
8. udostępnia rejestr powierzchniom poleceń/runtime

<Note>
`activate` to starszy alias `register` — loader rozwiązuje, który z nich jest obecny (`def.register ?? def.activate`) i wywołuje go w tym samym miejscu. Wszystkie dołączone Pluginy używają `register`; dla nowych Plugin preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem w runtime. Kandydaci są blokowani,
gdy wpis wychodzi poza katalog główny Plugin, ścieżka jest zapisywalna dla wszystkich albo
własność ścieżki wygląda podejrzanie dla niedołączonych Plugin.

### Zachowanie manifest-first

Manifest jest źródłem prawdy płaszczyzny sterowania. OpenClaw używa go do:

- identyfikacji Plugin
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości bundle
- walidacji `plugins.entries.<id>.config`
- rozszerzania etykiet/placeholderów interfejsu Control UI
- wyświetlania metadanych instalacji/katalogu
- zachowania tanich deskryptorów aktywacji i konfiguracji bez ładowania runtime Plugin

Dla natywnych Plugin moduł runtime jest częścią płaszczyzny danych. Rejestruje
rzeczywiste zachowanie, takie jak hooki, narzędzia, polecenia lub przepływy providerów.

Opcjonalne bloki manifestu `activation` i `setup` pozostają na płaszczyźnie sterowania.
Są to deskryptory wyłącznie metadanych dla planowania aktywacji i wykrywania konfiguracji;
nie zastępują rejestracji runtime, `register(...)` ani `setupEntry`.
Pierwsi aktywni konsumenci aktywacji używają teraz wskazówek manifestu dla poleceń, kanałów i providerów,
aby zawęzić ładowanie Plugin przed szerszą materializacją rejestru:

- Ładowanie CLI zawęża się do Plugin, które są właścicielami żądanego głównego polecenia
- Konfiguracja kanału/rozwiązywanie Plugin zawęża się do Plugin, które są właścicielami żądanego
  identyfikatora kanału
- Jawne rozwiązywanie konfiguracji/runtime providera zawęża się do Plugin, które są właścicielami
  żądanego identyfikatora providera

Planer aktywacji udostępnia zarówno API tylko z identyfikatorami dla istniejących wywołujących, jak i
API planu dla nowej diagnostyki. Wpisy planu raportują, dlaczego Plugin został wybrany,
oddzielając jawne wskazówki planera `activation.*` od zapasowego ustalania własności z manifestu,
takiego jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki. Ten podział przyczyn jest granicą zgodności:
istniejące metadane Plugin nadal działają, a nowy kod może wykrywać szerokie wskazówki
lub zachowanie awaryjne bez zmiany semantyki ładowania runtime.

Wykrywanie konfiguracji preferuje teraz identyfikatory należące do deskryptora, takie jak
`setup.providers` i `setup.cliBackends`, aby zawęzić kandydackie Plugin, zanim wróci do
`setup-api` dla Plugin, które nadal potrzebują hooków runtime podczas konfiguracji. Przepływ konfiguracji providera
używa najpierw manifestu `providerAuthChoices`, a następnie wraca do wyborów kreatora runtime
i wyborów katalogu instalacji dla zgodności. Jawne
`setup.requiresRuntime: false` jest punktem odcięcia wyłącznie deskryptora; pominięte
`requiresRuntime` zachowuje starszy fallback `setup-api` dla zgodności. Jeśli więcej
niż jeden wykryty Plugin zgłasza własność tego samego znormalizowanego identyfikatora providera konfiguracji lub CLI
backendu, wyszukiwanie konfiguracji odmawia wyboru niejednoznacznego właściciela zamiast polegać na
kolejności wykrywania. Gdy runtime konfiguracji jest wykonywany, diagnostyka rejestru raportuje
dryf między `setup.providers` / `setup.cliBackends` a providerami lub CLI
backendami zarejestrowanymi przez `setup-api`, bez blokowania starszych Plugin.

### Co cache'uje loader

OpenClaw utrzymuje krótkie cache'e in-process dla:

- wyników wykrywania
- danych rejestru manifestów
- załadowanych rejestrów Plugin

Te cache'e ograniczają skokowe koszty startu i koszty powtarzanych poleceń. Można o nich bezpiecznie
myśleć jako o krótkotrwałych cache'ach wydajnościowych, a nie trwałości.

Uwaga dotycząca wydajności:

- Ustaw `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` albo
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, aby wyłączyć te cache'e.
- Dostrajaj okna cache przez `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` i
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model rejestru

Załadowane Pluginy nie mutują bezpośrednio losowych globali rdzenia. Rejestrują się w
centralnym rejestrze Plugin.

Rejestr śledzi:

- rekordy Plugin (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze hooki i hooki typowane
- kanały
- providerów
- handlery RPC Gateway
- trasy HTTP
- rejestratory CLI
- usługi w tle
- polecenia należące do Plugin

Funkcje rdzenia odczytują następnie z tego rejestru zamiast rozmawiać bezpośrednio z modułami Plugin.
To utrzymuje jednokierunkowość ładowania:

- moduł Plugin -> rejestracja w rejestrze
- runtime rdzenia -> konsumpcja rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni rdzenia potrzebuje
tylko jednego punktu integracji: „czytaj rejestr”, a nie „obsługuj specjalnie każdy moduł Plugin”.

## Callbacki powiązania rozmowy

Pluginy, które wiążą rozmowę, mogą reagować po rozstrzygnięciu zatwierdzenia.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu lub odrzuceniu
żądania powiązania:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Pola payload callbacku:

- `status`: `"approved"` albo `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` albo `"deny"`
- `binding`: rozstrzygnięte powiązanie dla zatwierdzonych żądań
- `request`: podsumowanie oryginalnego żądania, wskazówka detach, identyfikator nadawcy oraz
  metadane rozmowy

Ten callback służy tylko do powiadamiania. Nie zmienia tego, kto może powiązać rozmowę,
i uruchamia się po zakończeniu obsługi zatwierdzenia przez rdzeń.

## Hooki runtime providera

Pluginy providerów mają trzy warstwy:

- **Metadane manifestu** do tanich wyszukiwań przed runtime:
  `setup.providers[].envVars`, przestarzałe zgodnościowe `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` i `channelEnvVars`.
- **Hooki czasu konfiguracji**: `catalog` (starsze `discovery`) oraz
  `applyConfigDefaults`.
- **Hooki runtime**: ponad 40 opcjonalnych hooków obejmujących auth, rozwiązywanie modeli,
  opakowywanie strumieni, poziomy myślenia, politykę replay i endpointy użycia. Zobacz
  pełną listę w sekcji [Kolejność hooków i użycie](#hook-order-and-usage).

OpenClaw nadal odpowiada za generyczną pętlę agenta, failover, obsługę transkryptu i
politykę narzędzi. Te hooki są powierzchnią rozszerzeń dla zachowań specyficznych dla providera bez
potrzeby całego niestandardowego transportu inferencji.

Używaj manifestu `setup.providers[].envVars`, gdy provider ma poświadczenia oparte na env,
które ogólne ścieżki auth/status/model-picker powinny widzieć bez ładowania runtime Plugin. Przestarzałe `providerAuthEnvVars` jest nadal odczytywane przez adapter zgodności w czasie okresu deprecacji, a niedołączone Pluginy, które go używają, otrzymują diagnostykę manifestu. Używaj manifestu `providerAuthAliases`, gdy jeden identyfikator providera ma ponownie używać env vars, profili uwierzytelniania, auth opartego na konfiguracji i wyboru onboardingu klucza API innego identyfikatora providera. Używaj manifestu `providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru auth mają znać identyfikator wyboru providera, etykiety grup i proste okablowanie auth jednym flagiem bez ładowania runtime providera. Pozostaw runtime providera
`envVars` dla wskazówek skierowanych do operatora, takich jak etykiety onboardingu albo zmienne konfiguracji
client-id/client-secret OAuth.

Używaj manifestu `channelEnvVars`, gdy kanał ma auth lub konfigurację opartą na env, którą
ogólny fallback shell-env, kontrole config/status lub prompty konfiguracji powinny widzieć
bez ładowania runtime kanału.

### Kolejność hooków i użycie

Dla Plugin modeli/providerów OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” to szybki przewodnik decyzyjny.

| #   | Hook                              | Co robi                                                                                                       | Kiedy używać                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację providera do `models.providers` podczas generowania `models.json`                      | Provider jest właścicielem katalogu lub domyślnych wartości `baseUrl`                                                                         |
| 2   | `applyConfigDefaults`             | Stosuje globalne wartości domyślne konfiguracji należące do providera podczas materializacji konfiguracji     | Wartości domyślne zależą od trybu auth, env lub semantyki rodziny modeli providera                                                            |
| --  | _(wbudowane wyszukiwanie modelu)_ | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                   | _(to nie jest hook Plugin)_                                                                                                                    |
| 3   | `normalizeModelId`                | Normalizuje starsze aliasy model-id lub aliasy preview przed wyszukiwaniem                                     | Provider jest właścicielem czyszczenia aliasów przed kanonicznym rozwiązywaniem modelu                                                        |
| 4   | `normalizeTransport`              | Normalizuje rodzinę providera `api` / `baseUrl` przed generycznym składaniem modelu                           | Provider jest właścicielem czyszczenia transportu dla niestandardowych identyfikatorów providera w tej samej rodzinie transportu             |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązywaniem runtime/providera                                     | Provider potrzebuje czyszczenia konfiguracji, które powinno mieszkać z Plugin; dołączone helpery rodziny Google dodatkowo wspierają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje kompatybilnościowe przepisania natywnego użycia streamingu do providerów konfiguracji                 | Provider potrzebuje poprawek metadanych natywnego użycia streamingu zależnych od endpointu                                                    |
| 7   | `resolveConfigApiKey`             | Rozwiązuje auth env-marker dla providerów konfiguracji przed ładowaniem auth runtime                           | Provider ma należące do providera rozwiązywanie klucza API env-marker; `amazon-bedrock` ma tu także wbudowany resolver env-marker AWS       |
| 8   | `resolveSyntheticAuth`            | Ujawnia auth lokalne/self-hosted lub oparte na konfiguracji bez utrwalania jawnego tekstu                     | Provider może działać z syntetycznym/lokalnym znacznikiem poświadczeń                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Nakłada należące do providera zewnętrzne profile auth; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Provider ponownie używa zewnętrznych poświadczeń auth bez utrwalania skopiowanych refresh tokenów; zadeklaruj `contracts.externalAuthProviders` w manifeście |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet placeholderów zapisanych syntetycznych profili względem auth opartego na env/konfiguracji    | Provider przechowuje syntetyczne profile placeholderów, które nie powinny wygrywać priorytetu                                                 |
| 11  | `resolveDynamicModel`             | Fallback synchroniczny dla należących do providera identyfikatorów modeli, których nie ma jeszcze w lokalnym rejestrze | Provider akceptuje dowolne identyfikatory modeli upstream                                                                                      |
| 12  | `prepareDynamicModel`             | Asynchroniczne rozgrzanie, po czym `resolveDynamicModel` uruchamia się ponownie                                | Provider potrzebuje metadanych sieciowych przed rozwiązywaniem nieznanych identyfikatorów                                                     |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozwiązanego modelu przez osadzony runner                                    | Provider potrzebuje przepisania transportu, ale nadal używa transportu rdzenia                                                                |
| 14  | `contributeResolvedModelCompat`   | Dokłada flagi kompatybilności dla modeli dostawców stojących za innym kompatybilnym transportem               | Provider rozpoznaje własne modele na transportach proxy bez przejmowania roli providera                                                       |
| 15  | `capabilities`                    | Metadane transkryptu/narzędzi należące do providera używane przez współdzieloną logikę rdzenia                | Provider potrzebuje niuansów transkryptu/rodziny providera                                                                                     |
| 16  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je osadzony runner                                                | Provider potrzebuje czyszczenia schematów dla rodziny transportu                                                                               |
| 17  | `inspectToolSchemas`              | Ujawnia diagnostykę schematów należącą do providera po normalizacji                                            | Provider chce ostrzeżeń o słowach kluczowych bez uczenia rdzenia reguł specyficznych dla providera                                            |
| 18  | `resolveReasoningOutputMode`      | Wybiera kontrakt wyjścia reasoning: natywny albo tagowany                                                      | Provider potrzebuje tagowanego wyjścia reasoning/final zamiast pól natywnych                                                                   |
| 19  | `prepareExtraParams`              | Normalizacja parametrów żądania przed generycznymi wrapperami opcji streamu                                    | Provider potrzebuje domyślnych parametrów żądania albo czyszczenia parametrów per provider                                                    |
| 20  | `createStreamFn`                  | W pełni zastępuje normalną ścieżkę streamu niestandardowym transportem                                         | Provider potrzebuje niestandardowego protokołu na drucie, a nie tylko wrappera                                                                |
| 21  | `wrapStreamFn`                    | Wrapper streamu po zastosowaniu generycznych wrapperów                                                          | Provider potrzebuje wrapperów kompatybilności nagłówków/body/modelu bez niestandardowego transportu                                           |
| 22  | `resolveTransportTurnState`       | Dołącza natywne nagłówki transportu per tura albo metadane                                                     | Provider chce, aby generyczne transporty wysyłały natywną dla providera tożsamość tury                                                        |
| 23  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket albo politykę cooldown sesji                                                | Provider chce, aby generyczne transporty WS dostrajały nagłówki sesji albo politykę fallbacku                                                 |
| 24  | `formatApiKey`                    | Formatter profilu auth: zapisany profil staje się runtime'owym ciągiem `apiKey`                               | Provider przechowuje dodatkowe metadane auth i potrzebuje niestandardowego kształtu tokenu runtime                                            |
| 25  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania albo polityki błędów odświeżania     | Provider nie pasuje do współdzielonych refresherów `pi-ai`                                                                                     |
| 26  | `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana przy niepowodzeniu odświeżenia OAuth                                             | Provider potrzebuje wskazówek naprawy auth należących do providera po błędzie odświeżenia                                                     |
| 27  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstowego należący do providera                                                 | Provider ma surowe błędy przepełnienia, których generyczne heurystyki by nie wykryły                                                          |
| 28  | `classifyFailoverReason`          | Klasyfikacja przyczyny failover należąca do providera                                                           | Provider może mapować surowe błędy API/transportu na rate-limit/overload itd.                                                                 |
| 29  | `isCacheTtlEligible`              | Polityka cache TTL promptów dla providerów proxy/backhaul                                                      | Provider potrzebuje bramkowania TTL cache specyficznego dla proxy                                                                              |
| 30  | `buildMissingAuthMessage`         | Zamiennik dla generycznego komunikatu odzyskiwania po braku auth                                               | Provider potrzebuje wskazówki odzyskiwania po braku auth specyficznej dla providera                                                           |
| 31  | `suppressBuiltInModel`            | Tłumienie nieaktualnych modeli upstream plus opcjonalna wskazówka błędu dla użytkownika                       | Provider musi ukrywać nieaktualne wiersze upstream albo zastępować je wskazówką dostawcy                                                      |
| 32  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykryciu                                                     | Provider potrzebuje syntetycznych wierszy forward-compat w `models list` i selektorach                                                        |
| 33  | `resolveThinkingProfile`          | Zestaw poziomów `/think`, etykiety wyświetlane i wartość domyślna specyficzne dla modelu                      | Provider udostępnia niestandardową drabinę myślenia albo etykietę binarną dla wybranych modeli                                                |
| 34  | `isBinaryThinking`                | Hook kompatybilności dla przełącznika reasoning on/off                                                         | Provider udostępnia tylko binarne myślenie włącz/wyłącz                                                                                        |
| 35  | `supportsXHighThinking`           | Hook kompatybilności obsługi reasoning `xhigh`                                                                 | Provider chce `xhigh` tylko dla podzbioru modeli                                                                                               |
| 36  | `resolveDefaultThinkingLevel`     | Hook kompatybilności domyślnego poziomu `/think`                                                               | Provider jest właścicielem domyślnej polityki `/think` dla rodziny modeli                                                                     |
| 37  | `isModernModelRef`                | Matcher nowoczesnych referencji modeli dla filtrów aktywnych profili i wyboru smoke                            | Provider jest właścicielem dopasowywania preferowanych modeli live/smoke                                                                      |
| 38  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz runtime tuż przed inferencją                  | Provider potrzebuje wymiany tokenu albo krótkotrwałego poświadczenia żądania                                                                  |
| 39  | `resolveUsageAuth`                | Rozwiązuje poświadczenia użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu                      | Provider potrzebuje niestandardowego parsowania tokenu użycia/limitu albo innych poświadczeń użycia                                          |
| 40  | `fetchUsageSnapshot`              | Pobiera i normalizuje migawki użycia/limitu specyficzne dla providera po rozwiązaniu auth                     | Provider potrzebuje endpointu użycia specyficznego dla providera albo parsera payloadu                                                       |
| 41  | `createEmbeddingProvider`         | Buduje należący do providera adapter embeddings dla memory/search                                               | Zachowanie embeddings pamięci należy do Plugin providera                                                                                      |
| 42  | `buildReplayPolicy`               | Zwraca politykę replay kontrolującą obsługę transkryptu dla providera                                          | Provider potrzebuje niestandardowej polityki transkryptu (na przykład usuwania bloków myślenia)                                              |
| 43  | `sanitizeReplayHistory`           | Przepisuje historię replay po generycznym czyszczeniu transkryptu                                              | Provider potrzebuje przepisania replay specyficznego dla providera poza współdzielonymi helperami Compaction                                |
| 44  | `validateReplayTurns`             | Końcowa walidacja lub przekształcanie tur replay przed osadzonym runnerem                                      | Transport providera potrzebuje bardziej rygorystycznej walidacji tur po generycznym oczyszczeniu                                             |
| 45  | `onModelSelected`                 | Uruchamia należące do providera efekty uboczne po wyborze                                                      | Provider potrzebuje telemetrii albo stanu należącego do providera, gdy model staje się aktywny                                              |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany Plugin providera, a następnie przechodzą przez inne Pluginy providera zdolne do hooków,
dopóki któryś rzeczywiście nie zmieni identyfikatora modelu albo transportu/konfiguracji. Dzięki temu
shim'y aliasów/providerów kompatybilności nadal działają bez wymagania, by wywołujący wiedział,
który dołączony Plugin jest właścicielem przepisania. Jeśli żaden hook providera nie przepisze
obsługiwanego wpisu konfiguracji rodziny Google, dołączony normalizator konfiguracji Google nadal stosuje to czyszczenie kompatybilności.

Jeśli provider potrzebuje w pełni niestandardowego protokołu wire albo niestandardowego wykonawcy żądań,
to jest inna klasa rozszerzenia. Te hooki służą do zachowania providera, które nadal działa
na zwykłej pętli inferencji OpenClaw.

### Przykład providera

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Wbudowane przykłady

Dołączone Pluginy providerów łączą powyższe hooki, aby dopasować się do potrzeb każdego dostawcy w zakresie katalogu,
auth, myślenia, replay i użycia. Autorytatywny zestaw hooków znajduje się w
każdym Plugin pod `extensions/`; ta strona ilustruje kształty zamiast
odzwierciedlać listę.

<AccordionGroup>
  <Accordion title="Providerzy katalogu pass-through">
    OpenRouter, Kilocode, Z.AI, xAI rejestrują `catalog` oraz
    `resolveDynamicModel` / `prepareDynamicModel`, aby mogły ujawniać identyfikatory modeli upstream
    przed statycznym katalogiem OpenClaw.
  </Accordion>
  <Accordion title="Providerzy endpointów OAuth i użycia">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai łączą
    `prepareRuntimeAuth` albo `formatApiKey` z `resolveUsageAuth` +
    `fetchUsageSnapshot`, aby przejąć wymianę tokenów i integrację `/usage`.
  </Accordion>
  <Accordion title="Rodziny replay i czyszczenia transkryptu">
    Współdzielone nazwane rodziny (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) pozwalają providerom wejść w
    politykę transkryptu przez `buildReplayPolicy` zamiast zmuszać każdy Plugin
    do ponownej implementacji czyszczenia.
  </Accordion>
  <Accordion title="Providerzy tylko katalogowi">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` oraz
    `volcengine` rejestrują tylko `catalog` i korzystają ze współdzielonej pętli inferencji.
  </Accordion>
  <Accordion title="Helpery streamu specyficzne dla Anthropic">
    Nagłówki beta, `/fast` / `serviceTier` oraz `context1m` żyją wewnątrz
    publicznego seam `api.ts` / `contract-api.ts` Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), a nie w
    generycznym SDK.
  </Accordion>
</AccordionGroup>

## Helpery runtime

Pluginy mogą uzyskiwać dostęp do wybranych helperów rdzenia przez `api.runtime`. Dla TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Uwagi:

- `textToSpeech` zwraca zwykły payload wyjściowy TTS rdzenia dla powierzchni plików/notatek głosowych.
- Używa konfiguracji i wyboru providera rdzenia `messages.tts`.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą resamplować/kodować dla providerów.
- `listVoices` jest opcjonalne per provider. Używaj go dla należących do dostawcy selektorów głosów albo przepływów konfiguracji.
- Listy głosów mogą zawierać bogatsze metadane, takie jak locale, gender i znaczniki osobowości dla selektorów świadomych providera.
- OpenAI i ElevenLabs obsługują dziś telefonię. Microsoft nie.

Pluginy mogą też rejestrować providerów mowy przez `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Uwagi:

- Zachowaj politykę TTS, fallback i dostarczanie odpowiedzi w rdzeniu.
- Używaj providerów mowy dla zachowania syntezy należącego do dostawcy.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora providera `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden Plugin dostawcy może być właścicielem
  providerów tekstu, mowy, obrazu i przyszłych mediów, gdy OpenClaw doda te
  kontrakty możliwości.

Dla rozumienia obrazu/audio/wideo Pluginy rejestrują jednego typowanego
providera rozumienia mediów zamiast generycznego worka klucz/wartość:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Uwagi:

- Zachowaj orkiestrację, fallback, konfigurację i okablowanie kanałów w rdzeniu.
- Zachowaj zachowanie dostawcy w Plugin providera.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyniku, nowe opcjonalne capabilities.
- Generowanie wideo już stosuje ten sam wzorzec:
  - rdzeń jest właścicielem kontraktu możliwości i helpera runtime
  - Pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - Pluginy funkcji/kanałów konsumują `api.runtime.videoGeneration.*`

Dla helperów runtime rozumienia mediów Pluginy mogą wywoływać:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Dla transkrypcji audio Pluginy mogą używać runtime rozumienia mediów
albo starszego aliasu STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Uwagi:

- `api.runtime.mediaUnderstanding.*` to preferowana współdzielona powierzchnia dla
  rozumienia obrazu/audio/wideo.
- Używa konfiguracji audio rdzenia dla rozumienia mediów (`tools.media.audio`) oraz kolejności fallbacków providera.
- Zwraca `{ text: undefined }`, gdy nie powstanie wynik transkrypcji (na przykład pominięte/nieobsługiwane wejście).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą też uruchamiać subagenty w tle przez `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Uwagi:

- `provider` i `model` to opcjonalne nadpisania per uruchomienie, a nie trwałe zmiany sesji.
- OpenClaw honoruje te pola nadpisania tylko dla zaufanych wywołujących.
- Dla należących do Plugin uruchomień fallback operatorzy muszą jawnie wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane Pluginy do określonych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny cel.
- Niezaufane uruchomienia subagentów przez Plugin nadal działają, ale żądania nadpisania są odrzucane zamiast po cichu przechodzić do fallbacku.

Dla wyszukiwania w sieci Pluginy mogą używać współdzielonego helpera runtime zamiast
sięgać do okablowania narzędzia agenta:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Pluginy mogą też rejestrować providerów web-search przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Zachowaj wybór providera, rozwiązywanie poświadczeń i współdzieloną semantykę żądań w rdzeniu.
- Używaj providerów web-search dla transportów wyszukiwania specyficznych dla dostawcy.
- `api.runtime.webSearch.*` to preferowana współdzielona powierzchnia dla Plugin funkcji/kanałów, które potrzebują zachowania wyszukiwania bez zależności od wrappera narzędzia agenta.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: generuje obraz przy użyciu skonfigurowanego łańcucha providerów generowania obrazów.
- `listProviders(...)`: wypisuje dostępnych providerów generowania obrazów i ich możliwości.

## Trasy HTTP Gateway

Pluginy mogą udostępniać endpointy HTTP przez `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Pola trasy:

- `path`: ścieżka trasy pod serwerem HTTP gateway.
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać zwykłego auth gateway, albo `"plugin"` dla auth zarządzanego przez Plugin / weryfikacji webhooków.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu Plugin zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwraca `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania Plugin. Użyj zamiast tego `api.registerHttpRoute(...)`.
- Trasy Plugin muszą jawnie deklarować `auth`.
- Konflikty dokładnego `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden Plugin nie może zastąpić trasy innego Plugin.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Utrzymuj łańcuchy przechodzenia `exact`/`prefix` tylko na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie operatorskich zakresów runtime. Służą do webhooków/weryfikacji podpisów zarządzanych przez Plugin, a nie uprzywilejowanych wywołań helperów Gateway.
- Trasy `auth: "gateway"` działają wewnątrz zakresu runtime żądania Gateway, ale ten zakres jest celowo zachowawczy:
  - bearer auth ze współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras Plugin przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP niosące tożsamość (na przykład `trusted-proxy` albo `gateway.auth.mode = "none"` na prywatnym ingressie) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` nie występuje w takich żądaniach tras Plugin niosących tożsamość, zakres runtime wraca do `operator.write`
- Praktyczna zasada: nie zakładaj, że trasa Plugin z auth gateway jest niejawną powierzchnią administracyjną. Jeśli Twoja trasa wymaga zachowania tylko dla admina, wymagaj trybu auth niosącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu SDK Plugin

Przy tworzeniu nowych Plugin używaj wąskich podścieżek SDK zamiast monolitycznego
barrela głównego `openclaw/plugin-sdk`. Podstawowe podścieżki:

| Podścieżka                         | Przeznaczenie                                      |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Prymitywy rejestracji Plugin                       |
| `openclaw/plugin-sdk/channel-core` | Helpery wejścia/budowy kanału                      |
| `openclaw/plugin-sdk/core`         | Generyczne współdzielone helpery i kontrakt zbiorczy |
| `openclaw/plugin-sdk/config-schema` | Schemat Zod głównego `openclaw.json` (`OpenClawSchema`) |

Pluginy kanałowe wybierają z rodziny wąskich seamów — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` i `channel-actions`. Zachowanie zatwierdzania powinno być konsolidowane
na jednym kontrakcie `approvalCapability` zamiast mieszać je w niezwiązanych
polach Plugin. Zobacz [Channel plugins](/pl/plugins/sdk-channel-plugins).

Helpery runtime i konfiguracji znajdują się pod odpowiadającymi im podścieżkami `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` itd.).

<Info>
`openclaw/plugin-sdk/channel-runtime` jest przestarzałe — to shim zgodności dla
starszych Plugin. Nowy kod powinien importować węższe generyczne prymitywy.
</Info>

Repo-wewnętrzne punkty wejścia (dla każdego katalogu głównego pakietu dołączonego Plugin):

- `index.js` — wejście dołączonego Plugin
- `api.js` — barrel helperów/typów
- `runtime-api.js` — barrel wyłącznie runtime
- `setup-entry.js` — wejście Plugin konfiguracji

Zewnętrzne Pluginy powinny importować tylko podścieżki `openclaw/plugin-sdk/*`. Nigdy
nie importuj `src/*` innego pakietu Plugin z rdzenia ani z innego Plugin.
Punkty wejścia ładowane przez facade preferują aktywną migawkę konfiguracji runtime, gdy taka
istnieje, a w przeciwnym razie wracają do rozwiązanego pliku konfiguracji na dysku.

Podścieżki specyficzne dla możliwości, takie jak `image-generation`, `media-understanding`
i `speech`, istnieją, ponieważ dołączone Pluginy używają ich dziś. Nie są to
automatycznie długoterminowo zamrożone zewnętrzne kontrakty — sprawdź odpowiednią stronę
dokumentacji referencyjnej SDK, gdy na nich polegasz.

## Schematy narzędzia wiadomości

Pluginy powinny być właścicielem wkładów do schematu `describeMessageTool(...)`
specyficznych dla kanału dla prymitywów innych niż wiadomości, takich jak reakcje, odczyty i ankiety.
Współdzielona prezentacja wysyłki powinna używać generycznego kontraktu `MessagePresentation`
zamiast natywnych dla dostawcy pól przycisków, komponentów, bloków lub kart.
Kontrakt, reguły fallbacku, mapowanie providerów i checklistę dla autorów Plugin znajdziesz w [Message Presentation](/pl/plugins/message-presentation).

Pluginy zdolne do wysyłania deklarują, co potrafią renderować przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań dostarczenia z przypięciem

Rdzeń decyduje, czy renderować prezentację natywnie, czy zdegradować ją do tekstu.
Nie ujawniaj natywnych dla dostawcy ścieżek ucieczki UI z generycznego narzędzia wiadomości.
Przestarzałe helpery SDK dla starszych schematów natywnych nadal są eksportowane dla istniejących
zewnętrznych Plugin, ale nowe Pluginy nie powinny ich używać.

## Rozwiązywanie celów kanałów

Pluginy kanałowe powinny być właścicielem semantyki celów specyficznej dla kanału. Zachowaj współdzielony
host wychodzący jako generyczny i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` czy `channel` przed wyszukiwaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi rdzeniowi, czy
  wejście powinno przejść od razu do rozwiązywania podobnego do identyfikatora zamiast przeszukiwania katalogu.
- `messaging.targetResolver.resolveTarget(...)` to fallback Plugin, gdy
  rdzeń potrzebuje końcowego rozstrzygnięcia należącego do dostawcy po normalizacji albo po
  braku trafienia w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` jest właścicielem konstrukcji trasy sesji
  specyficznej dla dostawcy, gdy cel zostanie rozwiązany.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategorialnych, które powinny zapaść przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` do kontroli typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` jako fallbacku normalizacji specyficznej dla dostawcy, a nie do
  szerokiego wyszukiwania katalogowego.
- Utrzymuj natywne dla dostawcy identyfikatory, takie jak chat ids, thread ids, JIDs, handle i room
  ids wewnątrz wartości `target` albo parametrów specyficznych dla dostawcy, a nie w generycznych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
samym Plugin i ponownie używać współdzielonych helperów z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery DM sterowane allowlistą
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogu o zakresie konta

Współdzielone helpery w `directory-runtime` obsługują tylko operacje generyczne:

- filtrowanie zapytań
- nakładanie limitów
- deduplikację/helpery normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja kont specyficzna dla kanału i normalizacja identyfikatorów powinny pozostać w
implementacji Plugin.

## Katalogi providerów

Pluginy providerów mogą definiować katalogi modeli do inferencji przez
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu providera
- `{ providers }` dla wielu wpisów providerów

Używaj `catalog`, gdy Plugin jest właścicielem identyfikatorów modeli specyficznych dla providera, domyślnych wartości `baseUrl` albo metadanych modeli bramkowanych auth.

`catalog.order` kontroluje, kiedy katalog Plugin scala się względem wbudowanych
niejawnych providerów OpenClaw:

- `simple`: providerzy oparty wyłącznie na kluczach API lub env
- `profile`: providerzy pojawiający się, gdy istnieją profile auth
- `paired`: providerzy syntetyzujący wiele powiązanych wpisów providerów
- `late`: ostatnie przejście, po innych niejawnych providerach

Późniejsi providerzy wygrywają przy kolizji kluczy, więc Pluginy mogą celowo nadpisywać
wbudowany wpis providera z tym samym identyfikatorem providera.

Zgodność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowane są oba `catalog` i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanałów tylko do odczytu

Jeśli Twój Plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` to ścieżka runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i szybko kończyć się błędem, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy napraw doctor/config,
  nie powinny wymagać materializowania poświadczeń runtime tylko po to, aby
  opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Dołączaj pola źródła/statusu poświadczeń, gdy mają znaczenie, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, by raportować dostępność
  tylko do odczytu. Zwrócenie `tokenStatus: "available"` (oraz odpowiadającego pola źródła)
  wystarcza dla poleceń typu status.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „configured but unavailable in this command
path” zamiast zawieszać się albo błędnie zgłaszać konto jako nieskonfigurowane.

## Package packi

Katalog Plugin może zawierać `package.json` z `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Każdy wpis staje się Pluginem. Jeśli pack wypisuje wiele rozszerzeń, identyfikator Plugin
staje się `name/<fileBase>`.

Jeśli Twój Plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Zabezpieczenie bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu Plugin
po rozwiązaniu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga dotycząca bezpieczeństwa: `openclaw plugins install` instaluje zależności Plugin przez
`npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia, bez zależności dev w runtime). Utrzymuj drzewa zależności Plugin jako „czyste JS/TS” i unikaj pakietów wymagających buildów `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego Plugin kanału albo
gdy Plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego wejścia Plugin. Dzięki temu start i konfiguracja są lżejsze,
gdy główne wejście Plugin podłącza też narzędzia, hooki lub inny kod wyłącznie runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pozwala Pluginowi kanału wejść na tę samą ścieżkę `setupEntry` podczas
fazy startowej gateway przed listen, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię startową, która musi istnieć
zanim gateway zacznie nasłuchiwać. W praktyce oznacza to, że wpis konfiguracji
musi zarejestrować każdą możliwość należącą do kanału, od której zależy start, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne przed rozpoczęciem nasłuchiwania przez gateway
- wszelkie metody gateway, narzędzia lub usługi, które muszą istnieć w tym samym oknie

Jeśli Twoje pełne wejście nadal jest właścicielem jakiejkolwiek wymaganej możliwości startowej, nie włączaj
tej flagi. Pozostaw Plugin na domyślnym zachowaniu i pozwól OpenClaw ładować
pełne wejście podczas startu.

Dołączone kanały mogą także publikować helpery powierzchni kontraktu tylko do konfiguracji, które rdzeń
może konsultować przed załadowaniem pełnego runtime kanału. Obecna powierzchnia
promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Rdzeń używa tej powierzchni, gdy musi promować starszą konfigurację kanału jednokontowego
do `channels.<id>.accounts.*` bez ładowania pełnego wejścia Plugin.
Matrix jest bieżącym dołączonym przykładem: przenosi tylko klucze auth/bootstrap do
nazwanego promowanego konta, gdy nazwane konta już istnieją, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery patchy konfiguracji utrzymują leniwe wykrywanie powierzchni kontraktu dołączonych kanałów. Czas importu pozostaje lekki; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu zamiast ponownie wchodzić w start dołączonego kanału przy imporcie modułu.

Gdy te powierzchnie startowe zawierają metody RPC gateway, trzymaj je na
prefiksie specyficznym dla Plugin. Przestrzenie nazw administracyjnych rdzenia (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zarezerwowane i zawsze rozwiązują się
do `operator.admin`, nawet jeśli Plugin żąda węższego zakresu.

Przykład:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadane katalogu kanału

Pluginy kanałowe mogą reklamować metadane konfiguracji/wykrywania przez `openclaw.channel` oraz
wskazówki instalacji przez `openclaw.install`. Dzięki temu dane katalogowe rdzenia pozostają puste.

Przykład:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Przydatne pola `openclaw.channel` poza minimalnym przykładem:

- `detailLabel`: etykieta drugorzędna dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: nadpisuje tekst linku do dokumentacji
- `preferOver`: identyfikatory Plugin/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki tekstu dla powierzchni wyboru
- `markdownCapable`: oznacza kanał jako zdolny do markdown dla decyzji formatowania wychodzącego
- `exposure.configured`: ukrywa kanał z powierzchni listowania skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał z interaktywnych selektorów setup/configure, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozwiązywaniu celów announce

OpenClaw może także scalać **zewnętrzne katalogi kanałów** (na przykład eksport
rejestru MPM). Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (oddzielanych przecinkiem/średnikiem/`PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje także `"packages"` albo `"plugins"` jako starsze aliasy klucza `"entries"`.

Wygenerowane wpisy katalogu kanałów i wpisy katalogu instalacji providerów ujawniają
znormalizowane fakty źródeł instalacji obok surowego bloku `openclaw.install`. Te
znormalizowane fakty identyfikują, czy spec npm jest dokładną wersją czy pływającym
selektorem, czy obecne są oczekiwane metadane integralności oraz czy dostępna jest
również lokalna ścieżka źródłowa. Gdy tożsamość katalogu/pakietu jest znana, te
znormalizowane fakty ostrzegają, jeśli sparsowana nazwa pakietu npm dryfuje od tej tożsamości.
Ostrzegają też, gdy `defaultChoice` jest nieprawidłowe albo wskazuje źródło, które
nie jest dostępne, oraz gdy obecne są metadane integralności npm bez prawidłowego źródła npm.
Konsumenci powinni traktować `installSource` jako addytywne pole opcjonalne, aby
starsze ręcznie budowane wpisy i shimy zgodności nie musiały go syntetyzować.
Dzięki temu onboarding i diagnostyka mogą wyjaśniać stan płaszczyzny źródła bez
importowania runtime Plugin.

Oficjalne zewnętrzne wpisy npm powinny preferować dokładne `npmSpec` plus
`expectedIntegrity`. Gołe nazwy pakietów i dist-tagi nadal działają dla
zgodności, ale pokazują ostrzeżenia płaszczyzny źródła, aby katalog mógł przejść
w stronę przypiętych instalacji sprawdzanych integralnością bez psucia istniejących Plugin.
Gdy onboarding instaluje z lokalnej ścieżki katalogu, zapisuje
wpis `plugins.installs` z `source: "path"` i ścieżką `sourcePath` względną do obszaru roboczego,
gdy to możliwe. Bezwzględna operacyjna ścieżka ładowania pozostaje w
`plugins.load.paths`; rekord instalacji unika duplikowania lokalnych ścieżek stacji roboczej
w długowiecznej konfiguracji. Dzięki temu lokalne instalacje developerskie pozostają widoczne dla
diagnostyki płaszczyzny źródła bez dodawania drugiej surowej powierzchni ujawniania ścieżek systemu plików.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu są właścicielem orkiestracji kontekstu sesji dla ingestu, składania
i Compaction. Rejestruj je ze swojego Plugin przez
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Używaj tego, gdy Twój Plugin musi zastąpić lub rozszerzyć domyślny potok kontekstu,
a nie tylko dodać wyszukiwanie pamięci lub hooki.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Jeśli Twój silnik **nie** jest właścicielem algorytmu Compaction, zachowaj implementację
`compact()` i jawnie ją deleguj:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Dodawanie nowej możliwości

Gdy Plugin potrzebuje zachowania, które nie mieści się w obecnym API, nie omijaj
systemu Plugin prywatnym sięgnięciem do wnętrza. Dodaj brakującą możliwość.

Zalecana sekwencja:

1. zdefiniuj kontrakt rdzenia
   Zdecyduj, jakie współdzielone zachowanie powinien posiadać rdzeń: politykę, fallback, scalanie konfiguracji,
   cykl życia, semantykę skierowaną do kanału i kształt helpera runtime.
2. dodaj typowane powierzchnie rejestracji/runtime Plugin
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię możliwości.
3. podłącz rdzeń + konsumentów kanałów/funkcji
   Kanały i Pluginy funkcji powinny konsumować nową możliwość przez rdzeń,
   a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców rejestrują następnie swoje backendy względem tej możliwości.
5. dodaj pokrycie kontraktu
   Dodaj testy, aby własność i kształt rejestracji pozostały z czasem jawne.

W ten sposób OpenClaw pozostaje opiniotwórczy, nie stając się zakodowanym na sztywno
pod światopogląd jednego dostawcy. Konkretna checklista plików i przepracowany przykład:
[Capability Cookbook](/pl/plugins/architecture).

### Checklista możliwości

Gdy dodajesz nową możliwość, implementacja zwykle powinna dotykać razem tych
powierzchni:

- typy kontraktów rdzenia w `src/<capability>/types.ts`
- runner/helper runtime rdzenia w `src/<capability>/runtime.ts`
- powierzchnia rejestracji API Plugin w `src/plugins/types.ts`
- okablowanie rejestru Plugin w `src/plugins/registry.ts`
- ekspozycja runtime Plugin w `src/plugins/runtime/*`, gdy Pluginy funkcji/kanałów
  muszą ją konsumować
- helpery capture/test w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacja operatora/Plugin w `docs/`

Jeśli jednej z tych powierzchni brakuje, zwykle jest to znak, że możliwość
nie jest jeszcze w pełni zintegrowana.

### Szablon możliwości

Minimalny wzorzec:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Wzorzec testu kontraktowego:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

To utrzymuje prostą regułę:

- rdzeń jest właścicielem kontraktu możliwości + orkiestracji
- Pluginy dostawców są właścicielami implementacji dostawców
- Pluginy funkcji/kanałów konsumują helpery runtime
- testy kontraktowe utrzymują jawność własności

## Powiązane

- [Plugin architecture](/pl/plugins/architecture) — publiczny model możliwości i kształty
- [Plugin SDK subpaths](/pl/plugins/sdk-subpaths)
- [Plugin SDK setup](/pl/plugins/sdk-setup)
- [Building plugins](/pl/plugins/building-plugins)
