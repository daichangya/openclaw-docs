---
read_when:
    - Implementowanie hooków środowiska wykonawczego dostawcy, cyklu życia kanału lub packów pakietów
    - Debugowanie kolejności ładowania Pluginów lub stanu rejestru
    - Dodawanie nowej możliwości Pluginu lub Pluginu silnika kontekstu
summary: 'Wewnętrzne elementy architektury Pluginów: potok ładowania, rejestr, hooki środowiska wykonawczego, trasy HTTP i tabele referencyjne'
title: Wewnętrzne elementy architektury Pluginów
x-i18n:
    generated_at: "2026-04-26T11:36:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Informacje o publicznym modelu możliwości, kształtach Pluginów oraz kontraktach
własności/wykonania znajdziesz w [Architektura Pluginów](/pl/plugins/architecture). Ta strona jest
dokumentacją referencyjną wewnętrznych mechanizmów: potoku ładowania, rejestru, hooków środowiska wykonawczego,
tras HTTP Gateway, ścieżek importu i tabel schematów.

## Potok ładowania

Podczas uruchamiania OpenClaw wykonuje w przybliżeniu następujące kroki:

1. wykrywa kandydackie katalogi główne Pluginów
2. odczytuje natywne lub zgodne manifesty bundle oraz metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację Pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu każdego kandydata
6. ładuje włączone natywne moduły: zbudowane moduły dołączone używają natywnego loadera;
   niezbudowane natywne Pluginy używają jiti
7. wywołuje natywne hooki `register(api)` i zbiera rejestracje do rejestru Pluginów
8. udostępnia rejestr powierzchniom poleceń/środowiska wykonawczego

<Note>
`activate` to starszy alias dla `register` — loader rozwiązuje tę wersję, która jest obecna (`def.register ?? def.activate`) i wywołuje ją w tym samym miejscu. Wszystkie dołączone Pluginy używają `register`; dla nowych Pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem środowiska wykonawczego. Kandydaci są blokowani,
gdy entry wychodzi poza katalog główny Pluginu, ścieżka jest zapisywalna globalnie albo
własność ścieżki wygląda podejrzanie dla niedołączonych Pluginów.

### Zachowanie manifest-first

Manifest jest źródłem prawdy warstwy control plane. OpenClaw używa go do:

- identyfikacji Pluginu
- wykrywania deklarowanych kanałów/Skills/schematu konfiguracji lub możliwości bundle
- walidacji `plugins.entries.<id>.config`
- rozszerzania etykiet/placeholderów Control UI
- pokazywania metadanych instalacji/katalogu
- zachowywania tanich deskryptorów aktywacji i konfiguracji bez ładowania środowiska wykonawczego Pluginu

Dla natywnych Pluginów moduł środowiska wykonawczego jest częścią data plane. Rejestruje
rzeczywiste zachowanie, takie jak hooki, narzędzia, polecenia czy przepływy dostawców.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w control plane.
Są deskryptorami zawierającymi tylko metadane do planowania aktywacji i wykrywania konfiguracji;
nie zastępują rejestracji środowiska wykonawczego, `register(...)` ani `setupEntry`.
Pierwsi aktywni konsumenci aktywacji używają teraz podpowiedzi manifestu dotyczących poleceń, kanałów i dostawców,
aby zawęzić ładowanie Pluginów przed szerszą materializacją rejestru:

- ładowanie CLI zawęża się do Pluginów, które są właścicielami żądanego głównego polecenia
- rozwiązywanie konfiguracji kanału/Pluginu zawęża się do Pluginów, które są właścicielami żądanego
  identyfikatora kanału
- jawne rozwiązywanie konfiguracji/środowiska wykonawczego dostawcy zawęża się do Pluginów, które są właścicielami żądanego
  identyfikatora dostawcy

Planer aktywacji udostępnia zarówno API tylko z identyfikatorami dla istniejących wywołujących, jak i
API planu dla nowej diagnostyki. Wpisy planu raportują, dlaczego Plugin został wybrany,
oddzielając jawne podpowiedzi planera `activation.*` od fallbacku własności manifestu,
takiego jak `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` i hooki. Ten podział przyczyn stanowi granicę zgodności:
istniejące metadane Pluginu nadal działają, a nowy kod może wykrywać szerokie podpowiedzi
lub zachowanie fallback bez zmiany semantyki ładowania środowiska wykonawczego.

Wykrywanie konfiguracji preferuje teraz identyfikatory należące do deskryptora, takie jak `setup.providers` i
`setup.cliBackends`, aby zawęzić kandydackie Pluginy, zanim przejdzie do
`setup-api` dla Pluginów, które nadal potrzebują hooków środowiska wykonawczego w czasie konfiguracji. Listy konfiguracji dostawców
używają manifestu `providerAuthChoices`, wyborów konfiguracji pochodzących z deskryptora
oraz metadanych katalogu instalacji bez ładowania środowiska wykonawczego dostawcy. Jawne
`setup.requiresRuntime: false` jest punktem odcięcia tylko na poziomie deskryptora; pominięte
`requiresRuntime` zachowuje starszy fallback `setup-api` dla zgodności. Jeśli więcej
niż jeden wykryty Plugin zgłasza ten sam znormalizowany identyfikator dostawcy konfiguracji albo backendu CLI,
wyszukiwanie konfiguracji odrzuca niejednoznacznego właściciela zamiast polegać na
kolejności wykrywania. Gdy środowisko wykonawcze konfiguracji jednak się uruchamia, diagnostyka rejestru raportuje
rozbieżności między `setup.providers` / `setup.cliBackends` a dostawcami lub backendami CLI
zarejestrowanymi przez setup-api bez blokowania starszych Pluginów.

### Co loader przechowuje w pamięci podręcznej

OpenClaw utrzymuje krótkie cache w procesie dla:

- wyników wykrywania
- danych rejestru manifestów
- załadowanych rejestrów Pluginów

Te cache ograniczają skokowe koszty uruchamiania i narzut powtarzanych poleceń. Można o nich
myśleć jako o krótkotrwałych cache wydajnościowych, a nie trwałym magazynie.

Uwaga dotycząca wydajności:

- Ustaw `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` albo
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, aby wyłączyć te cache.
- Dostosuj okna cache przez `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` oraz
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model rejestru

Załadowane Pluginy nie modyfikują bezpośrednio przypadkowych globali rdzenia. Rejestrują się w
centralnym rejestrze Pluginów.

Rejestr śledzi:

- rekordy Pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze hooki i hooki typowane
- kanały
- dostawców
- handlery RPC Gateway
- trasy HTTP
- rejestratory CLI
- usługi w tle
- polecenia należące do Pluginów

Funkcje rdzenia odczytują następnie z tego rejestru zamiast rozmawiać z modułami Pluginów
bezpośrednio. Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł Pluginu -> rejestracja w rejestrze
- środowisko wykonawcze rdzenia -> konsumpcja rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni rdzenia potrzebuje
tylko jednego punktu integracji: „czytaj rejestr”, a nie „rób wyjątek dla każdego modułu Pluginu”.

## Callbacki powiązań rozmów

Pluginy, które wiążą rozmowę, mogą reagować po rozstrzygnięciu zatwierdzenia.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu lub odrzuceniu
żądania powiązania:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Istnieje teraz powiązanie dla tego Pluginu + rozmowy.
        console.log(event.binding?.conversationId);
        return;
      }

      // Żądanie zostało odrzucone; wyczyść lokalny stan oczekujący.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Pola ładunku callbacku:

- `status`: `"approved"` albo `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` albo `"deny"`
- `binding`: rozwiązane powiązanie dla zatwierdzonych żądań
- `request`: podsumowanie oryginalnego żądania, podpowiedź detach, identyfikator nadawcy oraz
  metadane rozmowy

Ten callback służy tylko do powiadamiania. Nie zmienia tego, kto może powiązać rozmowę,
i działa po zakończeniu obsługi zatwierdzenia przez rdzeń.

## Hooki środowiska wykonawczego dostawcy

Pluginy dostawców mają trzy warstwy:

- **Metadane manifestu** do taniego wyszukiwania przed uruchomieniem:
  `setup.providers[].envVars`, przestarzałe kompatybilnościowe `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` oraz `channelEnvVars`.
- **Hooki czasu konfiguracji**: `catalog` (starsze `discovery`) oraz
  `applyConfigDefaults`.
- **Hooki środowiska wykonawczego**: ponad 40 opcjonalnych hooków obejmujących
  uwierzytelnianie, rozwiązywanie modeli, opakowywanie strumieni, poziomy thinking,
  politykę replay i endpointy użycia. Pełną listę znajdziesz w
  [Kolejność i użycie hooków](#hook-order-and-usage).

OpenClaw nadal odpowiada za ogólną pętlę agenta, failover, obsługę transkryptów oraz
politykę narzędzi. Te hooki stanowią powierzchnię rozszerzeń dla zachowania specyficznego dla dostawcy bez
konieczności tworzenia całkowicie niestandardowego transportu inferencji.

Używaj manifestu `setup.providers[].envVars`, gdy dostawca ma poświadczenia oparte na zmiennych środowiskowych,
które powinny być widoczne dla ogólnych ścieżek auth/status/model-picker bez ładowania
środowiska wykonawczego Pluginu. Przestarzałe `providerAuthEnvVars` jest nadal odczytywane przez
adapter zgodności w okresie wygaszania, a niedołączone Pluginy, które go używają, otrzymują
diagnostykę manifestu. Używaj manifestu `providerAuthAliases`, gdy jeden identyfikator dostawcy
powinien ponownie używać zmiennych środowiskowych, profili uwierzytelniania, uwierzytelniania opartego na konfiguracji
i opcji onboardingu z kluczem API innego identyfikatora dostawcy. Używaj manifestu
`providerAuthChoices`, gdy onboarding/powierzchnie CLI do wyboru uwierzytelniania mają znać
identyfikator wyboru dostawcy, etykiety grup oraz proste uwierzytelnianie jednym przełącznikiem bez
ładowania środowiska wykonawczego dostawcy. Zachowaj runtime
`envVars` dostawcy dla wskazówek operatora, takich jak etykiety onboardingu albo zmienne
konfiguracji OAuth client-id/client-secret.

Używaj manifestu `channelEnvVars`, gdy kanał ma uwierzytelnianie lub konfigurację sterowaną env, które
ogólny fallback shell-env, kontrole config/status albo prompty konfiguracji powinny widzieć
bez ładowania środowiska wykonawczego kanału.

### Kolejność i użycie hooków

Dla Pluginów modelu/dostawcy OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” to szybki przewodnik decyzyjny.

| #   | Hook                              | Co robi                                                                                                        | Kiedy używać                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                       | Dostawca zarządza katalogiem albo domyślnymi wartościami `baseUrl`                                                                         |
| 2   | `applyConfigDefaults`             | Stosuje globalne domyślne ustawienia konfiguracji należące do dostawcy podczas materializacji konfiguracji    | Wartości domyślne zależą od trybu auth, env albo semantyki rodziny modeli dostawcy                                                        |
| --  | _(wbudowane wyszukiwanie modeli)_ | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                    | _(to nie jest hook Pluginu)_                                                                                                               |
| 3   | `normalizeModelId`                | Normalizuje starsze albo preview aliasy identyfikatorów modeli przed wyszukiwaniem                            | Dostawca zarządza porządkowaniem aliasów przed kanonicznym rozwiązywaniem modeli                                                           |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawców przed ogólnym składaniem modelu                               | Dostawca zarządza porządkowaniem transportu dla niestandardowych identyfikatorów dostawców w tej samej rodzinie transportowej            |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązywaniem środowiska wykonawczego/dostawcy                     | Dostawca potrzebuje porządkowania konfiguracji, które powinno znajdować się w Pluginie; dołączone helpery rodziny Google wspierają też obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje przepisania zgodności natywnego użycia streamingu do dostawców konfiguracji                            | Dostawca potrzebuje poprawek metadanych natywnego użycia streamingu zależnych od endpointu                                                |
| 7   | `resolveConfigApiKey`             | Rozwiązuje uwierzytelnianie env-marker dla dostawców konfiguracji przed załadowaniem runtime auth             | Dostawca ma własne rozwiązywanie klucza API env-marker; `amazon-bedrock` ma tu też wbudowany resolver env-marker AWS                     |
| 8   | `resolveSyntheticAuth`            | Udostępnia lokalne/self-hosted albo oparte na konfiguracji uwierzytelnianie bez utrwalania jawnym tekstem     | Dostawca może działać z syntetycznym/lokalnym znacznikiem poświadczeń                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile auth należące do dostawcy; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń auth bez utrwalania skopiowanych refresh tokenów; zadeklaruj `contracts.externalAuthProviders` w manifeście |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych placeholderów syntetycznych profili względem auth opartego na env/config          | Dostawca zapisuje syntetyczne placeholdery profili, które nie powinny wygrywać pierwszeństwa                                              |
| 11  | `resolveDynamicModel`             | Synchroniczny fallback dla identyfikatorów modeli należących do dostawcy, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli upstream                                                                                 |
| 12  | `prepareDynamicModel`             | Asynchroniczne przygotowanie, po czym `resolveDynamicModel` uruchamia się ponownie                            | Dostawca potrzebuje metadanych sieciowych przed rozwiązaniem nieznanych identyfikatorów                                                   |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozwiązanego modelu przez osadzony runner                                   | Dostawca potrzebuje przepisania transportu, ale nadal używa transportu rdzenia                                                            |
| 14  | `contributeResolvedModelCompat`   | Wnosi flagi zgodności dla modeli dostawców działających za innym zgodnym transportem                          | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania dostawcy                                                         |
| 15  | `capabilities`                    | Metadane transkryptu/narzędzi należące do dostawcy używane przez współdzieloną logikę rdzenia                | Dostawca potrzebuje niuansów transkryptu / rodziny dostawców                                                                              |
| 16  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je osadzony runner                                               | Dostawca potrzebuje porządkowania schematów rodziny transportowej                                                                         |
| 17  | `inspectToolSchemas`              | Udostępnia diagnostykę schematów należącą do dostawcy po normalizacji                                         | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia rdzenia reguł specyficznych dla dostawcy                                        |
| 18  | `resolveReasoningOutputMode`      | Wybiera kontrakt wyjścia rozumowania: natywny albo tagowany                                                   | Dostawca potrzebuje tagowanego wyjścia rozumowania/końcowego zamiast pól natywnych                                                        |
| 19  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji strumieniowania                               | Dostawca potrzebuje domyślnych parametrów żądania albo porządkowania parametrów per dostawca                                              |
| 20  | `createStreamFn`                  | Całkowicie zastępuje zwykłą ścieżkę strumieniowania niestandardowym transportem                               | Dostawca potrzebuje niestandardowego protokołu po stronie przewodowej, a nie tylko wrappera                                               |
| 21  | `wrapStreamFn`                    | Wrapper strumienia po zastosowaniu wrapperów ogólnych                                                         | Dostawca potrzebuje wrapperów zgodności nagłówków/treści/modeli bez niestandardowego transportu                                          |
| 22  | `resolveTransportTurnState`       | Dołącza natywne nagłówki lub metadane transportowe per tura                                                   | Dostawca chce, by ogólne transporty wysyłały natywną dla dostawcy tożsamość tury                                                          |
| 23  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket albo politykę cooldown sesji                                               | Dostawca chce, by ogólne transporty WS dostrajały nagłówki sesji albo politykę fallbacku                                                  |
| 24  | `formatApiKey`                    | Formatter auth-profile: zapisany profil staje się runtime stringiem `apiKey`                                  | Dostawca przechowuje dodatkowe metadane auth i potrzebuje niestandardowego kształtu tokenu runtime                                       |
| 25  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania albo polityki błędów odświeżania    | Dostawca nie pasuje do współdzielonych mechanizmów odświeżania `pi-ai`                                                                    |
| 26  | `buildAuthDoctorHint`             | Podpowiedź naprawy dołączana po niepowodzeniu odświeżania OAuth                                               | Dostawca potrzebuje własnych wskazówek naprawczych auth po błędzie odświeżania                                                            |
| 27  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstu należący do dostawcy                                                     | Dostawca ma surowe błędy przepełnienia, których nie wychwycą ogólne heurystyki                                                            |
| 28  | `classifyFailoverReason`          | Klasyfikacja przyczyny failover należąca do dostawcy                                                          | Dostawca może mapować surowe błędy API/transportu na rate-limit/przeciążenie/itp.                                                         |
| 29  | `isCacheTtlEligible`              | Polityka pamięci podręcznej promptów dla dostawców proxy/backhaul                                             | Dostawca potrzebuje bramkowania TTL cache specyficznego dla proxy                                                                          |
| 30  | `buildMissingAuthMessage`         | Zamiennik ogólnego komunikatu odzyskiwania po braku auth                                                      | Dostawca potrzebuje wskazówki odzyskiwania po braku auth specyficznej dla dostawcy                                                        |
| 31  | `suppressBuiltInModel`            | Wyciszanie nieaktualnego modelu upstream plus opcjonalna wskazówka błędu dla użytkownika                      | Dostawca potrzebuje ukryć nieaktualne wiersze upstream albo zastąpić je wskazówką dostawcy                                                |
| 32  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykrywaniu                                                  | Dostawca potrzebuje syntetycznych wierszy forward-compat w `models list` i pickerach                                                      |
| 33  | `resolveThinkingProfile`          | Zestaw poziomów `/think`, etykiety wyświetlane i domyślne specyficzne dla modelu                              | Dostawca udostępnia niestandardową drabinę thinking albo binarną etykietę dla wybranych modeli                                            |
| 34  | `isBinaryThinking`                | Hook zgodności przełącznika rozumowania w trybie włącz/wyłącz                                                 | Dostawca udostępnia tylko binarne thinking włącz/wyłącz                                                                                    |
| 35  | `supportsXHighThinking`           | Hook zgodności obsługi rozumowania `xhigh`                                                                    | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                           |
| 36  | `resolveDefaultThinkingLevel`     | Hook zgodności domyślnego poziomu `/think`                                                                    | Dostawca zarządza domyślną polityką `/think` dla rodziny modeli                                                                            |
| 37  | `isModernModelRef`                | Matcher nowoczesnego modelu dla filtrów aktywnych profili i wyboru testów dymnych                              | Dostawca zarządza dopasowaniem preferowanych modeli aktywnych/testów dymnych                                                                |
| 38  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz środowiska wykonawczego tuż przed inferencją | Dostawca potrzebuje wymiany tokenu albo krótkotrwałego poświadczenia żądania                                                                |
| 39  | `resolveUsageAuth`                | Rozwiązuje poświadczenia użycia/billing dla `/usage` i powiązanych powierzchni statusu                        | Dostawca potrzebuje niestandardowego parsowania tokenu użycia/limitu albo innego poświadczenia użycia                                      |
| 40  | `fetchUsageSnapshot`              | Pobiera i normalizuje migawki użycia/limitu specyficzne dla dostawcy po rozwiązaniu auth                      | Dostawca potrzebuje endpointu użycia albo parsera ładunku specyficznego dla dostawcy                                                       |
| 41  | `createEmbeddingProvider`         | Buduje adapter embeddingów należący do dostawcy dla pamięci/wyszukiwania                                      | Zachowanie embeddingów pamięci należy do Pluginu dostawcy                                                                                   |
| 42  | `buildReplayPolicy`               | Zwraca politykę replay sterującą obsługą transkryptu dla dostawcy                                             | Dostawca potrzebuje niestandardowej polityki transkryptu (na przykład usuwania bloków thinking)                                            |
| 43  | `sanitizeReplayHistory`           | Przepisuje historię replay po ogólnym czyszczeniu transkryptu                                                 | Dostawca potrzebuje przepisania replay specyficznego dla dostawcy poza współdzielonymi helperami Compaction                               |
| 44  | `validateReplayTurns`             | Końcowa walidacja albo przekształcenie tur replay przed osadzonym runnerem                                    | Transport dostawcy potrzebuje bardziej rygorystycznej walidacji tur po ogólnej sanityzacji                                                 |
| 45  | `onModelSelected`                 | Uruchamia efekty uboczne po wyborze modelu należące do dostawcy                                               | Dostawca potrzebuje telemetrii albo stanu należącego do dostawcy, gdy model staje się aktywny                                             |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany Plugin dostawcy, a następnie przechodzą przez inne Pluginy dostawców obsługujące hooki,
dopóki któryś faktycznie nie zmieni identyfikatora modelu albo transportu/konfiguracji. Dzięki temu
aliasy / shimy zgodności dostawców działają bez konieczności wiedzy po stronie wywołującego,
który dołączony Plugin jest właścicielem przepisywania. Jeśli żaden provider hook nie przepisze obsługiwanego
wpisu konfiguracji rodziny Google, dołączony normalizator konfiguracji Google nadal zastosuje
to porządkowanie zgodności.

Jeśli dostawca potrzebuje w pełni niestandardowego protokołu po stronie przewodowej albo niestandardowego wykonawcy żądań,
to jest to inna klasa rozszerzenia. Te hooki są przeznaczone dla zachowania dostawcy, które
nadal działa w zwykłej pętli inferencji OpenClaw.

### Przykład dostawcy

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

Dołączone Pluginy dostawców łączą powyższe hooki, aby dopasować się do potrzeb każdego dostawcy w zakresie katalogu,
uwierzytelniania, thinking, replay i usage. Autorytatywny zestaw hooków znajduje się przy
każdym Pluginie w `extensions/`; ta strona pokazuje kształty zamiast
powielać listę.

<AccordionGroup>
  <Accordion title="Dostawcy katalogów pass-through">
    OpenRouter, Kilocode, Z.AI, xAI rejestrują `catalog` oraz
    `resolveDynamicModel` / `prepareDynamicModel`, aby mogły udostępniać upstream
    identyfikatory modeli przed statycznym katalogiem OpenClaw.
  </Accordion>
  <Accordion title="Dostawcy OAuth i endpointów usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai łączą
    `prepareRuntimeAuth` albo `formatApiKey` z `resolveUsageAuth` +
    `fetchUsageSnapshot`, aby zarządzać wymianą tokenów i integracją `/usage`.
  </Accordion>
  <Accordion title="Rodziny replay i czyszczenia transkryptów">
    Współdzielone nazwane rodziny (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) pozwalają dostawcom wejść
    w politykę transkryptu przez `buildReplayPolicy` zamiast zmuszać każdy Plugin
    do ponownej implementacji czyszczenia.
  </Accordion>
  <Accordion title="Dostawcy tylko katalogowi">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` oraz
    `volcengine` rejestrują tylko `catalog` i korzystają ze współdzielonej pętli inferencji.
  </Accordion>
  <Accordion title="Helpery strumieni specyficzne dla Anthropic">
    Nagłówki beta, `/fast` / `serviceTier` oraz `context1m` znajdują się w
    publicznym seam `api.ts` / `contract-api.ts` Pluginu Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), a nie w
    ogólnym SDK.
  </Accordion>
</AccordionGroup>

## Helpery środowiska wykonawczego

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

- `textToSpeech` zwraca zwykły ładunek wyjściowy TTS rdzenia dla powierzchni plików/notatek głosowych.
- Używa konfiguracji rdzenia `messages.tts` i wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą przeskalować/zakodować dane dla dostawców.
- `listVoices` jest opcjonalne per dostawca. Używaj go dla selektorów głosów lub przepływów konfiguracji należących do dostawcy.
- Listy głosów mogą zawierać bogatsze metadane, takie jak locale, płeć i tagi osobowości dla selektorów świadomych dostawcy.
- OpenAI i ElevenLabs obsługują dziś telefonię. Microsoft nie.

Pluginy mogą również rejestrować dostawców mowy przez `api.registerSpeechProvider(...)`.

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
- Używaj dostawców mowy dla zachowania syntezy należącego do dostawcy.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden Plugin dostawcy może zarządzać
  tekstem, mową, obrazem i przyszłymi dostawcami mediów w miarę dodawania tych kontraktów możliwości przez OpenClaw.

Dla rozumienia obrazu/audio/wideo Pluginy rejestrują jednego typowanego
dostawcę rozumienia mediów zamiast ogólnego worka klucz/wartość:

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

- Zachowaj orkiestrację, fallback, konfigurację i połączenia kanałów w rdzeniu.
- Zachowaj zachowanie dostawcy w Pluginie dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyników, nowe opcjonalne możliwości.
- Generowanie wideo działa już według tego samego wzorca:
  - rdzeń zarządza kontraktem możliwości i helperem środowiska wykonawczego
  - Pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - Pluginy funkcji/kanałów korzystają z `api.runtime.videoGeneration.*`

Dla helperów środowiska wykonawczego rozumienia mediów Pluginy mogą wywoływać:

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

Dla transkrypcji audio Pluginy mogą używać albo środowiska wykonawczego rozumienia mediów,
albo starszego aliasu STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcjonalne, gdy MIME nie da się wiarygodnie wywnioskować:
  mime: "audio/ogg",
});
```

Uwagi:

- `api.runtime.mediaUnderstanding.*` to preferowana współdzielona powierzchnia dla
  rozumienia obrazu/audio/wideo.
- Używa konfiguracji audio rozumienia mediów rdzenia (`tools.media.audio`) oraz kolejności fallbacku dostawców.
- Zwraca `{ text: undefined }`, gdy nie powstaje wynik transkrypcji (na przykład przy pominiętym/nieobsługiwanym wejściu).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą też uruchamiać podagenty działające w tle przez `api.runtime.subagent`:

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
- Dla zapasowych uruchomień należących do Pluginu operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane Pluginy do konkretnych kanonicznych celów `provider/model`, albo `"*"` aby jawnie dopuścić dowolny cel.
- Uruchomienia podagentów z niezaufanych Pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast po cichu przechodzić do fallbacku.

Dla wyszukiwania web Pluginy mogą korzystać ze współdzielonego helpera środowiska wykonawczego zamiast
sięgać do warstwy narzędzia agenta:

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

Pluginy mogą też rejestrować dostawców wyszukiwania web przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Zachowaj wybór dostawcy, rozwiązywanie poświadczeń i współdzieloną semantykę żądań w rdzeniu.
- Używaj dostawców wyszukiwania web dla transportów wyszukiwania specyficznych dla dostawcy.
- `api.runtime.webSearch.*` to preferowana współdzielona powierzchnia dla Pluginów funkcji/kanałów, które potrzebują zachowania wyszukiwania bez zależności od wrappera narzędzia agenta.

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

- `generate(...)`: generuje obraz przy użyciu skonfigurowanego łańcucha dostawców generowania obrazów.
- `listProviders(...)`: wyświetla dostępnych dostawców generowania obrazów i ich możliwości.

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
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać zwykłego uwierzytelniania gateway, albo `"plugin"` dla auth/weryfikacji Webhooka zarządzanych przez Plugin.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu Pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania Pluginu. Użyj zamiast tego `api.registerHttpRoute(...)`.
- Trasy Pluginów muszą jawnie deklarować `auth`.
- Konflikty dokładnego `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden Plugin nie może zastąpić trasy innego Pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przejścia `exact`/`prefix` utrzymuj tylko na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie operatorskich zakresów runtime. Służą do Webhooków / weryfikacji podpisów zarządzanych przez Plugin, a nie do uprzywilejowanych wywołań helperów Gateway.
- Trasy `auth: "gateway"` działają w zakresie runtime żądania Gateway, ale zakres ten jest celowo konserwatywny:
  - bearer auth ze współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras Pluginów przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP niosące tożsamość (na przykład `trusted-proxy` albo `gateway.auth.mode = "none"` na prywatnym ingressie) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny w tych żądaniach tras Pluginów niosących tożsamość, zakres runtime wraca do `operator.write`
- Praktyczna zasada: nie zakładaj, że trasa Pluginu z auth gateway jest ukrytą powierzchnią administracyjną. Jeśli Twoja trasa potrzebuje zachowania tylko dla administratora, wymagaj trybu auth niosącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu SDK Pluginów

Przy tworzeniu nowych Pluginów używaj wąskich podścieżek SDK zamiast monolitycznego
głównego barrel `openclaw/plugin-sdk`. Główne podścieżki:

| Podścieżka                          | Cel                                                |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Prymitywy rejestracji Pluginu                      |
| `openclaw/plugin-sdk/channel-core`  | Helpery wejścia/budowania kanału                   |
| `openclaw/plugin-sdk/core`          | Ogólne współdzielone helpery i kontrakt zbiorczy   |
| `openclaw/plugin-sdk/config-schema` | Schemat Zod głównego `openclaw.json` (`OpenClawSchema`) |

Pluginy kanałów wybierają z rodziny wąskich seamów — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` oraz `channel-actions`. Zachowanie zatwierdzeń powinno konsolidować się
na jednym kontrakcie `approvalCapability` zamiast mieszać się między niepowiązanymi
polami Pluginu. Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).

Helpery runtime i konfiguracji znajdują się pod odpowiadającymi podścieżkami
`*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` itd.).

<Info>
`openclaw/plugin-sdk/channel-runtime` jest przestarzałe — to shim zgodności dla
starszych Pluginów. Nowy kod powinien importować węższe ogólne prymitywy.
</Info>

Punkty wejścia wewnątrz repozytorium (na katalog główny pakietu każdego dołączonego Pluginu):

- `index.js` — punkt wejścia dołączonego Pluginu
- `api.js` — barrel helperów/typów
- `runtime-api.js` — barrel tylko dla runtime
- `setup-entry.js` — punkt wejścia Pluginu konfiguracji

Zewnętrzne Pluginy powinny importować wyłącznie podścieżki `openclaw/plugin-sdk/*`. Nigdy
nie importuj `src/*` innego pakietu Pluginu z rdzenia ani z innego Pluginu.
Punkty wejścia ładowane przez fasadę preferują aktywną migawkę konfiguracji runtime, jeśli istnieje,
a następnie wracają do rozwiązanej konfiguracji na dysku.

Podścieżki specyficzne dla możliwości, takie jak `image-generation`, `media-understanding`
i `speech`, istnieją dlatego, że dołączone Pluginy używają ich już dziś. Nie są one
automatycznie długoterminowo zamrożonymi zewnętrznymi kontraktami — gdy na nich polegasz,
sprawdź odpowiednią stronę referencyjną SDK.

## Schematy narzędzia message

Pluginy powinny zarządzać wkładami schematu
`describeMessageTool(...)` specyficznymi dla kanału
dla prymitywów innych niż wiadomość, takich jak reakcje, odczyty i ankiety.
Współdzielona prezentacja wysyłki powinna używać ogólnego kontraktu `MessagePresentation`
zamiast natywnych dla dostawcy pól przycisków, komponentów, bloków czy kart.
Zobacz [Message Presentation](/pl/plugins/message-presentation), aby poznać kontrakt,
reguły fallbacku, mapowanie dostawców oraz checklistę autora Pluginu.

Pluginy zdolne do wysyłania deklarują, co potrafią renderować, przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań przypiętego dostarczania

Rdzeń decyduje, czy renderować prezentację natywnie, czy zdegradować ją do tekstu.
Nie udostępniaj natywnych dla dostawcy furtek UI z ogólnego narzędzia message.
Przestarzałe helpery SDK dla starszych natywnych schematów pozostają eksportowane dla istniejących
zewnętrznych Pluginów, ale nowe Pluginy nie powinny ich używać.

## Rozwiązywanie celów kanałów

Pluginy kanałów powinny zarządzać semantyką celów specyficzną dla kanału. Zachowaj współdzielony
host wychodzący jako ogólny i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` czy `channel` przed wyszukiwaniem katalogowym.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informuje rdzeń, czy
  wejście powinno przejść od razu do rozwiązywania w stylu identyfikatora zamiast wyszukiwania katalogowego.
- `messaging.targetResolver.resolveTarget(...)` to fallback Pluginu, gdy
  rdzeń potrzebuje końcowego rozwiązywania należącego do dostawcy po normalizacji albo po
  braku trafienia w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` zarządza budowaniem trasy sesji
  specyficznej dla dostawcy po rozwiązaniu celu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategoryzacyjnych, które powinny zapadać przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` do sprawdzania typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` do fallbacku normalizacji specyficznego dla dostawcy, a nie do
  szerokiego wyszukiwania katalogowego.
- Natywne dla dostawcy identyfikatory, takie jak chat ids, thread ids, JID, handles i room
  ids, utrzymuj wewnątrz wartości `target` albo parametrów specyficznych dla dostawcy, a nie w ogólnych
  polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogowe z konfiguracji, powinny utrzymywać tę logikę w
Pluginie i ponownie używać współdzielonych helperów z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery wiadomości prywatnych oparte na liście dozwolonej
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogowe ograniczone do konta

Współdzielone helpery w `directory-runtime` obsługują tylko operacje ogólne:

- filtrowanie zapytań
- stosowanie limitów
- helpery deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja kont i normalizacja identyfikatorów specyficzne dla kanału powinny pozostać w
implementacji Pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli do inferencji za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy Plugin zarządza identyfikatorami modeli specyficznymi dla dostawcy, wartościami domyślnymi `baseUrl`
albo metadanymi modeli ograniczonymi przez auth.

`catalog.order` kontroluje moment scalania katalogu Pluginu względem wbudowanych
niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy oparci na kluczu API albo env
- `profile`: dostawcy pojawiający się, gdy istnieją profile auth
- `paired`: dostawcy syntetyzujący wiele powiązanych wpisów dostawców
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc Pluginy mogą celowo nadpisywać
wbudowany wpis dostawcy o tym samym identyfikatorze dostawcy.

Zgodność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanałów tylko do odczytu

Jeśli Twój Plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` równolegle z `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` to ścieżka runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i może szybko zakończyć się błędem, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy doctor/naprawy konfiguracji
  nie powinny wymagać materializacji poświadczeń runtime tylko po to, by
  opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Dołączaj pola źródła/statusu poświadczeń, gdy mają znaczenie, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, by raportować dostępność tylko do odczytu.
  Zwrócenie `tokenStatus: "available"` (oraz odpowiadającego mu pola źródła)
  wystarcza dla poleceń w stylu statusu.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „skonfigurowane, ale niedostępne w tej ścieżce polecenia”
zamiast kończyć się błędem albo błędnie zgłaszać konto jako nieskonfigurowane.

## Packi pakietów

Katalog Pluginu może zawierać `package.json` z `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Każdy wpis staje się Pluginem. Jeśli pack zawiera wiele rozszerzeń, identyfikator Pluginu
przyjmuje postać `name/<fileBase>`.

Jeśli Twój Plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Zabezpieczenie bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu Pluginu
po rozwiązaniu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga dotycząca bezpieczeństwa: `openclaw plugins install` instaluje zależności Pluginu przez
lokalne dla projektu `npm install --omit=dev --ignore-scripts` (bez skryptów lifecycle,
bez zależności dev w runtime), ignorując odziedziczone globalne ustawienia instalacji npm.
Utrzymuj drzewa zależności Pluginu jako „czyste JS/TS” i unikaj pakietów, które wymagają
budowań `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego Pluginu kanału, albo
gdy Plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego punktu wejścia Pluginu. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główny punkt wejścia Pluginu podłącza też narzędzia, hooki albo inny kod tylko runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć dla Pluginu kanału tę samą ścieżkę `setupEntry` podczas fazy
uruchamiania gateway przed rozpoczęciem nasłuchu, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię uruchamiania, która musi istnieć
zanim gateway zacznie nasłuchiwać. W praktyce oznacza to, że punkt wejścia konfiguracji
musi rejestrować każdą możliwość należącą do kanału, od której zależy uruchamianie, taką jak:

- samą rejestrację kanału
- wszelkie trasy HTTP, które muszą być dostępne, zanim gateway zacznie nasłuchiwać
- wszelkie metody gateway, narzędzia albo usługi, które muszą istnieć w tym samym oknie

Jeśli pełny punkt wejścia nadal zarządza jakąkolwiek wymaganą możliwością uruchamiania, nie włączaj
tej flagi. Pozostaw Plugin przy zachowaniu domyślnym i pozwól OpenClaw załadować
pełny punkt wejścia podczas uruchamiania.

Dołączone kanały mogą też publikować helpery powierzchni kontraktu tylko do konfiguracji, które rdzeń
może konsultować, zanim pełne środowisko wykonawcze kanału zostanie załadowane. Obecna powierzchnia
promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Rdzeń używa tej powierzchni, gdy musi promować starszą konfigurację kanału z pojedynczym kontem
do `channels.<id>.accounts.*` bez ładowania pełnego punktu wejścia Pluginu.
Matrix jest obecnym dołączonym przykładem: przenosi tylko klucze auth/bootstrap do
nazwanego promowanego konta, gdy nazwane konta już istnieją, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery poprawek konfiguracji utrzymują leniwe wykrywanie powierzchni kontraktu dla dołączonych kanałów.
Czas importu pozostaje lekki; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu zamiast
ponownie wchodzić w uruchamianie dołączonego kanału podczas importu modułu.

Gdy te powierzchnie uruchamiania zawierają metody RPC gateway, utrzymuj je pod
prefiksem specyficznym dla Pluginu. Przestrzenie nazw administracyjnych rdzenia (`config.*`,
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

### Metadane katalogu kanałów

Pluginy kanałów mogą reklamować metadane konfiguracji/wykrywania przez `openclaw.channel` oraz
wskazówki instalacyjne przez `openclaw.install`. Dzięki temu dane katalogu rdzenia pozostają wolne od danych.

Przykład:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (hostowane samodzielnie)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Czat hostowany samodzielnie przez boty Webhook Nextcloud Talk.",
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

- `detailLabel`: etykieta pomocnicza dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: nadpisanie tekstu linku dla linku do dokumentacji
- `preferOver`: identyfikatory Pluginów/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki treści powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący Markdown na potrzeby decyzji o formatowaniu wychodzącym
- `exposure.configured`: ukrywa kanał z powierzchni listy skonfigurowanych kanałów, gdy ma wartość `false`
- `exposure.setup`: ukrywa kanał z interaktywnych pickerów konfiguracji/ustawiania, gdy ma wartość `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozwiązywaniu celów ogłoszeń

OpenClaw może też scalać **zewnętrzne katalogi kanałów** (na przykład eksport
rejestru MPM). Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (rozdzielanych przecinkiem/średnikiem/`PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje też `"packages"` albo `"plugins"` jako starsze aliasy klucza `"entries"`.

Wygenerowane wpisy katalogu kanałów i wpisy katalogu instalacji dostawców udostępniają
znormalizowane informacje o źródle instalacji obok surowego bloku `openclaw.install`. Te
znormalizowane informacje identyfikują, czy npm spec jest dokładną wersją, czy pływającym
selektorem, czy obecne są oczekiwane metadane integralności oraz czy dostępna jest
również lokalna ścieżka źródłowa. Gdy znana jest tożsamość katalogu/pakietu, znormalizowane
informacje ostrzegają, jeśli sparsowana nazwa pakietu npm odbiega od tej tożsamości.
Ostrzegają też, gdy `defaultChoice` jest nieprawidłowe albo wskazuje na źródło,
które nie jest dostępne, oraz gdy metadane integralności npm są obecne bez poprawnego źródła
npm. Konsumenci powinni traktować `installSource` jako dodatkowe opcjonalne pole, aby
ręcznie budowane wpisy i shim katalogu nie musiały go syntetyzować.
Pozwala to onboardingowi i diagnostyce wyjaśniać stan warstwy źródła bez
importowania środowiska wykonawczego Pluginu.

Oficjalne zewnętrzne wpisy npm powinny preferować dokładne `npmSpec` oraz
`expectedIntegrity`. Same nazwy pakietów i dist-tags nadal działają dla zgodności,
ale wyświetlają ostrzeżenia warstwy źródła, aby katalog mógł przechodzić w stronę
instalacji przypiętych i sprawdzanych integralnością bez psucia istniejących Pluginów.
Gdy onboarding instaluje z lokalnej ścieżki katalogu, zapisuje wpis indeksu
zarządzanego Pluginu z `source: "path"` oraz ścieżką `sourcePath` względną względem workspace,
gdy to możliwe. Bezwzględna operacyjna ścieżka ładowania pozostaje w
`plugins.load.paths`; rekord instalacji unika duplikowania lokalnych ścieżek
stacji roboczej w długowiecznej konfiguracji. Dzięki temu lokalne instalacje deweloperskie pozostają widoczne dla
diagnostyki warstwy źródła bez dodawania drugiej powierzchni ujawniania surowych ścieżek systemu plików.
Trwały indeks Pluginów `plugins/installs.json` jest źródłem prawdy dla źródła instalacji i może
być odświeżany bez ładowania modułów runtime Pluginów.
Jego mapa `installRecords` jest trwała nawet wtedy, gdy manifest Pluginu jest nieobecny albo
nieprawidłowy; jego tablica `plugins` jest widokiem manifestu/cache, który można odbudować.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu zarządzają orkiestracją kontekstu sesji dla ingestii, składania
i Compaction. Rejestruj je z Pluginu przez
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Używaj tego, gdy Twój Plugin musi zastąpić albo rozszerzyć domyślny potok
kontekstu zamiast tylko dodawać wyszukiwanie pamięci albo hooki.

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

Jeśli Twój silnik **nie** zarządza algorytmem Compaction, pozostaw `compact()`
zaimplementowane i jawnie deleguj je dalej:

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

Gdy Plugin potrzebuje zachowania, które nie mieści się w bieżącym API, nie omijaj
systemu Pluginów prywatnym sięganiem do wnętrza. Dodaj brakującą możliwość.

Zalecana sekwencja:

1. zdefiniuj kontrakt rdzenia
   Zdecyduj, jakim współdzielonym zachowaniem powinien zarządzać rdzeń: polityką, fallbackiem, scalaniem konfiguracji,
   cyklem życia, semantyką od strony kanału i kształtem helpera runtime.
2. dodaj typowane powierzchnie rejestracji/runtime Pluginu
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię możliwości.
3. podłącz konsumentów rdzenia + kanału/funkcji
   Kanały i Pluginy funkcji powinny konsumować nową możliwość przez rdzeń,
   a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców rejestrują następnie swoje backendy względem tej możliwości.
5. dodaj pokrycie kontraktu
   Dodaj testy, aby własność i kształt rejestracji pozostały jawne w czasie.

To właśnie pozwala OpenClaw pozostać systemem z wyraźnym zdaniem, bez twardego zakodowania
pod obraz jednego dostawcy. Zobacz [Capability Cookbook](/pl/plugins/architecture),
aby znaleźć konkretną checklistę plików i działający przykład.

### Checklista możliwości

Gdy dodajesz nową możliwość, implementacja zwykle powinna dotykać razem tych
powierzchni:

- typy kontraktów rdzenia w `src/<capability>/types.ts`
- runner/helper runtime rdzenia w `src/<capability>/runtime.ts`
- powierzchnia rejestracji API Pluginu w `src/plugins/types.ts`
- podłączenie rejestru Pluginów w `src/plugins/registry.ts`
- ekspozycja runtime Pluginu w `src/plugins/runtime/*`, gdy Pluginy funkcji/kanałów
  muszą z niej korzystać
- helpery przechwytywania/testowe w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacja operatora/Pluginu w `docs/`

Jeśli którejś z tych powierzchni brakuje, zwykle oznacza to, że możliwość
nie jest jeszcze w pełni zintegrowana.

### Szablon możliwości

Minimalny wzorzec:

```ts
// kontrakt rdzenia
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API Pluginu
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// współdzielony helper runtime dla Pluginów funkcji/kanałów
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Wzorzec testu kontraktu:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Dzięki temu reguła pozostaje prosta:

- rdzeń zarządza kontraktem możliwości + orkiestracją
- Pluginy dostawców zarządzają implementacjami dostawców
- Pluginy funkcji/kanałów korzystają z helperów runtime
- testy kontraktowe utrzymują własność w jawnej formie

## Powiązane

- [Architektura Pluginów](/pl/plugins/architecture) — publiczny model możliwości i kształty
- [Podścieżki SDK Pluginów](/pl/plugins/sdk-subpaths)
- [Konfiguracja SDK Pluginów](/pl/plugins/sdk-setup)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
