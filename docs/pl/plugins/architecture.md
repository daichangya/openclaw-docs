---
read_when:
    - Tworzenie lub debugowanie natywnych pluginów OpenClaw
    - Zrozumienie modelu możliwości pluginów lub granic własności
    - Praca nad potokiem ładowania pluginów lub rejestrem
    - Implementowanie hooków środowiska uruchomieniowego dostawcy lub pluginów kanałów
sidebarTitle: Internals
summary: 'Wewnętrzne elementy Plugin: model możliwości, własność, kontrakty, potok ładowania i narzędzia pomocnicze środowiska uruchomieniowego'
title: Wewnętrzne elementy Plugin
x-i18n:
    generated_at: "2026-04-15T09:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86798b5d2b0ad82d2397a52a6c21ed37fe6eee1dd3d124a9e4150c4f630b841
    source_path: plugins/architecture.md
    workflow: 15
---

# Wewnętrzne elementy Plugin

<Info>
  To jest **szczegółowe odniesienie do architektury**. Praktyczne przewodniki znajdziesz tutaj:
  - [Zainstaluj i używaj pluginów](/pl/tools/plugin) — przewodnik użytkownika
  - [Pierwsze kroki](/pl/plugins/building-plugins) — samouczek tworzenia pierwszego pluginu
  - [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — zbuduj kanał wiadomości
  - [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — zbuduj dostawcę modeli
  - [Przegląd SDK](/pl/plugins/sdk-overview) — mapa importów i API rejestracji
</Info>

Ta strona opisuje wewnętrzną architekturę systemu pluginów OpenClaw.

## Publiczny model możliwości

Możliwości to publiczny model **natywnych pluginów** w OpenClaw. Każdy
natywny plugin OpenClaw rejestruje się względem co najmniej jednego typu możliwości:

| Możliwość             | Metoda rejestracji                              | Przykładowe pluginy                  |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| Wnioskowanie tekstowe | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend wnioskowania CLI  | `api.registerCliBackend(...)`               | `openai`, `anthropic`                |
| Mowa                  | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                 |
| Głos w czasie rzeczywistym         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                 |
| Rozumienie mediów     | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Generowanie obrazów   | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki    | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Generowanie wideo     | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Pobieranie z sieci    | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Wyszukiwanie w sieci  | `api.registerWebSearchProvider(...)`            | `google`                             |
| Kanał / wiadomości    | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Plugin, który rejestruje zero możliwości, ale dostarcza hooki, narzędzia lub
usługi, jest pluginem **legacy tylko z hookami**. Ten wzorzec jest nadal w pełni obsługiwany.

### Stan kompatybilności zewnętrznej

Model możliwości jest już wdrożony w core i używany dziś przez pluginy
bundled/natywne, ale zgodność zewnętrznych pluginów nadal wymaga wyższego
progu niż „jest eksportowane, więc jest zamrożone”.

Aktualne wytyczne:

- **istniejące zewnętrzne pluginy:** zachowaj działanie integracji opartych na hookach; traktuj
  to jako bazowy poziom kompatybilności
- **nowe pluginy bundled/natywne:** preferuj jawną rejestrację możliwości zamiast
  zależnych od dostawcy wejść w implementację lub nowych projektów tylko z hookami
- **zewnętrzne pluginy przyjmujące rejestrację możliwości:** dozwolone, ale traktuj
  pomocnicze powierzchnie specyficzne dla możliwości jako ewoluujące, chyba że dokumentacja wyraźnie oznacza
  dany kontrakt jako stabilny

Praktyczna zasada:

- API rejestracji możliwości to zamierzony kierunek
- legacy hooki pozostają najbezpieczniejszą ścieżką bez naruszania zgodności dla zewnętrznych pluginów w trakcie
  przejścia
- eksportowane podścieżki pomocnicze nie są równorzędne; preferuj wąski, udokumentowany
  kontrakt, a nie przypadkowe eksporty pomocnicze

### Kształty pluginów

OpenClaw klasyfikuje każdy załadowany plugin do określonego kształtu na podstawie jego
rzeczywistego zachowania rejestracyjnego (a nie tylko statycznych metadanych):

- **plain-capability** -- rejestruje dokładnie jeden typ możliwości (na przykład
  plugin tylko dostawcy, taki jak `mistral`)
- **hybrid-capability** -- rejestruje wiele typów możliwości (na przykład
  `openai` obsługuje wnioskowanie tekstowe, mowę, rozumienie mediów i generowanie obrazów)
- **hook-only** -- rejestruje tylko hooki (typowane lub własne), bez możliwości,
  narzędzi, poleceń ani usług
- **non-capability** -- rejestruje narzędzia, polecenia, usługi lub trasy, ale bez
  możliwości

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu i podział
możliwości. Szczegóły znajdziesz w [dokumentacji CLI](/cli/plugins#inspect).

### Legacy hooki

Hook `before_agent_start` pozostaje obsługiwany jako ścieżka kompatybilności dla
pluginów tylko z hookami. Nadal zależą od niego starsze pluginy używane w praktyce.

Kierunek:

- utrzymać jego działanie
- dokumentować go jako legacy
- dla pracy z nadpisywaniem modelu/dostawcy preferować `before_model_resolve`
- dla modyfikacji promptów preferować `before_prompt_build`
- usunąć dopiero wtedy, gdy realne użycie spadnie, a pokrycie fixture potwierdzi bezpieczeństwo migracji

### Sygnały kompatybilności

Po uruchomieniu `openclaw doctor` lub `openclaw plugins inspect <id>` możesz zobaczyć
jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                    |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfiguracja poprawnie się parsuje, a pluginy są rozwiązywane |
| **compatibility advisory** | Plugin używa wspieranego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, które jest przestarzałe   |
| **hard error**             | Konfiguracja jest nieprawidłowa lub nie udało się załadować pluginu |

Ani `hook-only`, ani `before_agent_start` nie spowodują dziś uszkodzenia pluginu --
`hook-only` ma charakter doradczy, a `before_agent_start` wywołuje jedynie ostrzeżenie. Te
sygnały pojawiają się również w `openclaw status --all` i `openclaw plugins doctor`.

## Przegląd architektury

System pluginów OpenClaw ma cztery warstwy:

1. **Manifest + wykrywanie**
   OpenClaw znajduje kandydackie pluginy w skonfigurowanych ścieżkach, katalogach głównych workspace,
   globalnych katalogach rozszerzeń i bundled extensions. Wykrywanie najpierw odczytuje natywne
   manifesty `openclaw.plugin.json` oraz obsługiwane manifesty pakietów.
2. **Włączanie + walidacja**
   Core decyduje, czy wykryty plugin jest włączony, wyłączony, zablokowany czy
   wybrany do ekskluzywnego slotu, takiego jak pamięć.
3. **Ładowanie środowiska uruchomieniowego**
   Natywne pluginy OpenClaw są ładowane w procesie przez jiti i rejestrują
   możliwości w centralnym rejestrze. Zgodne pakiety są normalizowane do
   rekordów rejestru bez importowania kodu środowiska uruchomieniowego.
4. **Konsumpcja powierzchni**
   Pozostała część OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację
   dostawców, hooki, trasy HTTP, polecenia CLI i usługi.

Konkretnie dla CLI pluginów odkrywanie komend głównych jest podzielone na dwa etapy:

- metadane na etapie parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- rzeczywisty moduł CLI pluginu może pozostać lazy i zarejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do pluginu pozostaje wewnątrz pluginu, a jednocześnie OpenClaw
może zarezerwować nazwy komend głównych przed parsowaniem.

Ważna granica projektowa:

- wykrywanie + walidacja konfiguracji powinny działać na podstawie **metadanych manifestu/schematu**
  bez wykonywania kodu pluginu
- natywne zachowanie środowiska uruchomieniowego pochodzi ze ścieżki modułu pluginu `register(api)`

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone pluginy i
budować wskazówki UI/schematu, zanim pełne środowisko uruchomieniowe stanie się aktywne.

### Pluginy kanałów i współdzielone narzędzie wiadomości

Pluginy kanałów nie muszą rejestrować osobnego narzędzia send/edit/react dla
zwykłych działań czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w core, a
pluginy kanałów odpowiadają za specyficzne dla kanału wykrywanie i wykonanie za nim.

Obecna granica wygląda tak:

- core odpowiada za host współdzielonego narzędzia `message`, połączenie z promptami, prowadzenie
  sesji/wątków i dyspozycję wykonania
- pluginy kanałów odpowiadają za wykrywanie działań w danym zakresie, wykrywanie możliwości oraz wszelkie
  fragmenty schematu specyficzne dla kanału
- pluginy kanałów odpowiadają za gramatykę rozmów sesji specyficzną dla dostawcy, na przykład
  sposób, w jaki identyfikatory konwersacji kodują identyfikatory wątków lub dziedziczą po konwersacjach nadrzędnych
- pluginy kanałów wykonują końcowe działanie przez swój adapter działań

Dla pluginów kanałów powierzchnią SDK jest
`ChannelMessageActionAdapter.describeMessageTool(...)`. To zunifikowane wywołanie wykrywania
pozwala pluginowi zwrócić widoczne działania, możliwości i wkłady do schematu
razem, aby te elementy nie rozjeżdżały się między sobą.

Gdy parametr narzędzia wiadomości specyficzny dla kanału zawiera źródło mediów, takie jak
lokalna ścieżka lub zdalny URL mediów, plugin powinien również zwrócić
`mediaSourceParams` z `describeMessageTool(...)`. Core używa tej jawnej
listy, aby stosować normalizację ścieżek sandbox i wskazówki dotyczące wychodzącego dostępu do mediów
bez hardkodowania nazw parametrów należących do pluginu.
Preferuj tam mapy ograniczone do działań, a nie jedną płaską listę dla całego kanału, aby
parametr mediów przeznaczony tylko dla profilu nie był normalizowany przy niezwiązanych działaniach, takich jak
`send`.

Core przekazuje zakres środowiska uruchomieniowego do tego kroku wykrywania. Ważne pola obejmują:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufane przychodzące `requesterSenderId`

Ma to znaczenie dla pluginów zależnych od kontekstu. Kanał może ukrywać lub ujawniać
działania wiadomości na podstawie aktywnego konta, bieżącego pokoju/wątku/wiadomości lub
zaufanej tożsamości nadawcy żądania bez hardkodowania gałęzi specyficznych dla kanału w
narzędziu `message` w core.

Właśnie dlatego zmiany routingu embedded-runner nadal należą do pracy nad pluginami: runner
odpowiada za przekazywanie bieżącej tożsamości czatu/sesji do granicy wykrywania pluginu, aby
współdzielone narzędzie `message` ujawniało właściwą powierzchnię należącą do kanału dla
bieżącego kroku.

W przypadku narzędzi pomocniczych wykonania należących do kanału, bundled pluginy powinny utrzymywać
środowisko uruchomieniowe wykonania wewnątrz własnych modułów rozszerzeń. Core nie odpowiada już za
środowiska uruchomieniowe działań wiadomości Discord, Slack, Telegram czy WhatsApp pod `src/agents/tools`.
Nie publikujemy osobnych podścieżek `plugin-sdk/*-action-runtime`, a bundled
pluginy powinny importować swój lokalny kod środowiska uruchomieniowego bezpośrednio z modułów
należących do ich rozszerzeń.

Ta sama granica dotyczy ogólnie ścieżek SDK nazwanych według dostawców: core nie powinien
importować wygodnych barrelów specyficznych dla kanałów takich jak Slack, Discord, Signal,
WhatsApp lub podobnych rozszerzeń. Jeśli core potrzebuje jakiegoś zachowania, powinien albo
zużyć własny barrel `api.ts` / `runtime-api.ts` danego bundled pluginu, albo wynieść tę potrzebę
do wąskiej, ogólnej możliwości we współdzielonym SDK.

Konkretnie dla ankiet istnieją dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów pasujących do wspólnego
  modelu ankiet
- `actions.handleAction("poll")` to preferowana ścieżka dla semantyki ankiet specyficznej dla kanału
  lub dodatkowych parametrów ankiet

Core odracza teraz wspólne parsowanie ankiet do chwili, gdy dyspozycja ankiety pluginu odrzuci
działanie, dzięki czemu obsługujące ankiety pluginu mogą akceptować pola ankiet specyficzne dla kanału
bez wcześniejszego blokowania przez ogólny parser ankiet.

Pełną sekwencję uruchamiania znajdziesz w sekcji [Potok ładowania](#load-pipeline).

## Model własności możliwości

OpenClaw traktuje natywny plugin jako granicę własności dla **firmy** lub
**funkcji**, a nie jako zbiór przypadkowo powiązanych integracji.

Oznacza to, że:

- plugin firmowy powinien zwykle obsługiwać wszystkie powierzchnie OpenClaw skierowane do tej firmy
- plugin funkcjonalny powinien zwykle obsługiwać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny korzystać ze współdzielonych możliwości core zamiast doraźnie ponownie implementować zachowanie dostawców

Przykłady:

- bundled plugin `openai` odpowiada za zachowanie dostawcy modeli OpenAI oraz za zachowanie OpenAI dotyczące
  mowy + głosu w czasie rzeczywistym + rozumienia mediów + generowania obrazów
- bundled plugin `elevenlabs` odpowiada za zachowanie ElevenLabs dotyczące mowy
- bundled plugin `microsoft` odpowiada za zachowanie Microsoft dotyczące mowy
- bundled plugin `google` odpowiada za zachowanie dostawcy modeli Google oraz za zachowanie Google dotyczące
  rozumienia mediów + generowania obrazów + wyszukiwania w sieci
- bundled plugin `firecrawl` odpowiada za zachowanie Firecrawl dotyczące pobierania z sieci
- bundled pluginy `minimax`, `mistral`, `moonshot` i `zai` odpowiadają za swoje
  backendy rozumienia mediów
- bundled plugin `qwen` odpowiada za zachowanie dostawcy tekstowego Qwen oraz za
  rozumienie mediów i generowanie wideo
- plugin `voice-call` jest pluginem funkcjonalnym: odpowiada za transport połączeń, narzędzia,
  CLI, trasy i mostkowanie strumienia mediów Twilio, ale korzysta ze współdzielonych możliwości mowy
  oraz transkrypcji w czasie rzeczywistym i głosu w czasie rzeczywistym zamiast
  bezpośrednio importować pluginy dostawców

Zamierzony stan końcowy jest następujący:

- OpenAI znajduje się w jednym pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i
  przyszłe wideo
- inny dostawca może zrobić to samo dla własnego obszaru funkcjonalnego
- kanały nie muszą wiedzieć, który plugin dostawcy jest właścicielem dostawcy; korzystają ze
  współdzielonego kontraktu możliwości udostępnianego przez core

To jest kluczowe rozróżnienie:

- **plugin** = granica własności
- **możliwość** = kontrakt core, który wiele pluginów może implementować lub wykorzystywać

Jeśli więc OpenClaw doda nową domenę, taką jak wideo, pierwsze pytanie nie brzmi
„który dostawca powinien na sztywno obsługiwać wideo?”. Pierwsze pytanie brzmi „jaki jest
kontrakt możliwości wideo w core?”. Gdy ten kontrakt już istnieje, pluginy dostawców
mogą się względem niego rejestrować, a pluginy kanałów/funkcji mogą z niego korzystać.

Jeśli taka możliwość jeszcze nie istnieje, właściwym krokiem jest zwykle:

1. zdefiniowanie brakującej możliwości w core
2. udostępnienie jej przez API/runtime pluginów w sposób typowany
3. podłączenie kanałów/funkcji do tej możliwości
4. pozwolenie pluginom dostawców na rejestrowanie implementacji

Pozwala to zachować jawną własność, a jednocześnie unika zachowania core, które zależy od
jednego dostawcy lub jednorazowej ścieżki kodu specyficznej dla pluginu.

### Warstwowanie możliwości

Używaj tego modelu mentalnego przy podejmowaniu decyzji, gdzie powinien znajdować się kod:

- **warstwa możliwości core**: współdzielona orkiestracja, polityka, fallback, reguły
  scalania konfiguracji, semantyka dostarczania i typowane kontrakty
- **warstwa pluginów dostawców**: API specyficzne dla dostawcy, autoryzacja, katalogi modeli, synteza mowy,
  generowanie obrazów, przyszłe backendy wideo, endpointy użycia
- **warstwa pluginów kanałów/funkcji**: integracje Slack/Discord/voice-call itd.,
  które wykorzystują możliwości core i prezentują je na określonej powierzchni

Na przykład TTS ma taki układ:

- core odpowiada za politykę TTS w czasie odpowiedzi, kolejność fallbacków, preferencje i dostarczanie przez kanały
- `openai`, `elevenlabs` i `microsoft` odpowiadają za implementacje syntezy
- `voice-call` wykorzystuje pomocnik środowiska uruchomieniowego TTS dla telefonii

Ten sam wzorzec powinien być preferowany dla przyszłych możliwości.

### Przykład pluginu firmy z wieloma możliwościami

Plugin firmy powinien z zewnątrz sprawiać wrażenie spójnego. Jeśli OpenClaw ma współdzielone
kontrakty dla modeli, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia mediów,
generowania obrazów, generowania wideo, pobierania z sieci i wyszukiwania w sieci,
dostawca może obsługiwać wszystkie swoje powierzchnie w jednym miejscu:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Znaczenie nie mają dokładne nazwy helperów. Znaczenie ma kształt:

- jeden plugin jest właścicielem powierzchni dostawcy
- core nadal jest właścicielem kontraktów możliwości
- kanały i pluginy funkcjonalne wykorzystują helpery `api.runtime.*`, a nie kod dostawcy
- testy kontraktowe mogą sprawdzać, że plugin zarejestrował możliwości, do których
  przyznaje się jako właściciel

### Przykład możliwości: rozumienie wideo

OpenClaw już teraz traktuje rozumienie obrazów/audio/wideo jako jedną współdzieloną
możliwość. Obowiązuje tu ten sam model własności:

1. core definiuje kontrakt rozumienia mediów
2. pluginy dostawców rejestrują `describeImage`, `transcribeAudio` i
   `describeVideo`, jeśli dotyczy
3. kanały i pluginy funkcjonalne wykorzystują współdzielone zachowanie core zamiast
   podłączać się bezpośrednio do kodu dostawcy

Pozwala to uniknąć utrwalania założeń jednego dostawcy dotyczących wideo w core. Plugin odpowiada za
powierzchnię dostawcy; core odpowiada za kontrakt możliwości i zachowanie fallback.

Generowanie wideo już używa tej samej sekwencji: core odpowiada za typowany
kontrakt możliwości i helper środowiska uruchomieniowego, a pluginy dostawców rejestrują
implementacje `api.registerVideoGenerationProvider(...)` względem niego.

Potrzebujesz konkretnej listy kontrolnej wdrożenia? Zobacz
[Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API pluginów jest celowo typowana i scentralizowana w
`OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji oraz
pomocniki środowiska uruchomieniowego, na których plugin może polegać.

Dlaczego to ma znaczenie:

- autorzy pluginów otrzymują jeden stabilny wewnętrzny standard
- core może odrzucać duplikaty własności, na przykład gdy dwa pluginy rejestrują ten sam identyfikator
  dostawcy
- uruchamianie może pokazywać użyteczne diagnostyki dla nieprawidłowej rejestracji
- testy kontraktowe mogą wymuszać własność bundled pluginów i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

1. **egzekwowanie rejestracji w czasie działania**
   Rejestr pluginów waliduje rejestracje podczas ładowania pluginów. Przykłady:
   zduplikowane identyfikatory dostawców, zduplikowane identyfikatory dostawców mowy i nieprawidłowe
   rejestracje powodują diagnostyki pluginów zamiast niezdefiniowanego zachowania.
2. **testy kontraktowe**
   Bundled pluginy są przechwytywane w rejestrach kontraktowych podczas uruchamiania testów, dzięki czemu
   OpenClaw może jawnie sprawdzać własność. Dziś jest to używane dla dostawców modeli,
   dostawców mowy, dostawców wyszukiwania w sieci oraz własności rejestracji bundled
   pluginów.

Praktyczny efekt jest taki, że OpenClaw z góry wie, który plugin jest właścicielem której
powierzchni. Dzięki temu core i kanały mogą płynnie się składać, ponieważ własność jest
zadeklarowana, typowana i testowalna, a nie dorozumiana.

### Co należy do kontraktu

Dobre kontrakty pluginów są:

- typowane
- małe
- specyficzne dla możliwości
- należące do core
- wielokrotnego użytku przez wiele pluginów
- możliwe do wykorzystania przez kanały/funkcje bez wiedzy o dostawcy

Złe kontrakty pluginów to:

- polityka specyficzna dla dostawcy ukryta w core
- jednorazowe furtki dla pluginów, które omijają rejestr
- kod kanału sięgający bezpośrednio do implementacji dostawcy
- doraźne obiekty środowiska uruchomieniowego, które nie są częścią `OpenClawPluginApi` ani
  `api.runtime`

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj możliwość, a potem
pozwól pluginom podłączyć się do niej.

## Model wykonania

Natywne pluginy OpenClaw działają **w procesie** razem z Gateway. Nie są
sandboxowane. Załadowany natywny plugin ma tę samą granicę zaufania na poziomie procesu co
kod core.

Konsekwencje:

- natywny plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi
- błąd natywnego pluginu może spowodować awarię lub destabilizację gateway
- złośliwy natywny plugin jest równoważny dowolnemu wykonaniu kodu wewnątrz
  procesu OpenClaw

Zgodne pakiety są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je
jako pakiety metadanych/treści. W obecnych wydaniach dotyczy to głównie bundled
Skills.

W przypadku pluginów innych niż bundled używaj allowlist i jawnych ścieżek instalacji/ładowania. Traktuj
pluginy workspace jako kod czasu programowania, a nie domyślne rozwiązania produkcyjne.

W przypadku nazw pakietów bundled workspace identyfikator pluginu powinien być zakotwiczony w nazwie npm:
domyślnie `@openclaw/<id>` lub zatwierdzony typowany sufiks, taki jak
`-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy
pakiet celowo udostępnia węższą rolę pluginu.

Ważna uwaga dotycząca zaufania:

- `plugins.allow` ufa **identyfikatorom pluginów**, a nie pochodzeniu źródła.
- Plugin workspace z tym samym identyfikatorem co bundled plugin celowo przesłania
  bundled kopię, gdy taki plugin workspace jest włączony/znajduje się na allowliście.
- To normalne i przydatne dla lokalnego programowania, testowania poprawek i hotfixów.

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodne implementacje.

Zachowaj publiczną rejestrację możliwości. Ogranicz eksporty helperów spoza kontraktu:

- podścieżki pomocnicze specyficzne dla bundled pluginów
- podścieżki infrastruktury runtime, które nie są przeznaczone jako publiczne API
- helpery wygody specyficzne dla dostawców
- helpery konfiguracji/onboardingu, które są szczegółami implementacji

Niektóre podścieżki pomocnicze bundled pluginów nadal pozostają w wygenerowanej mapie eksportów SDK
ze względu na kompatybilność i utrzymanie bundled pluginów. Aktualne przykłady to
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz kilka ścieżek `plugin-sdk/matrix*`. Traktuj je jako
zastrzeżone eksporty będące szczegółami implementacji, a nie jako zalecany wzorzec SDK dla
nowych pluginów zewnętrznych.

## Potok ładowania

Podczas uruchamiania OpenClaw wykonuje w przybliżeniu następujące kroki:

1. wykrywa katalogi główne kandydackich pluginów
2. odczytuje natywne lub zgodne manifesty pakietów i metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu dla każdego kandydata
6. ładuje włączone natywne moduły przez jiti
7. wywołuje natywne hooki `register(api)` (lub `activate(api)` — starszy alias) i zbiera rejestracje do rejestru pluginów
8. udostępnia rejestr powierzchniom poleceń/runtime

<Note>
`activate` to starszy alias dla `register` — loader rozwiązuje, który z nich jest obecny (`def.register ?? def.activate`) i wywołuje go w tym samym miejscu. Wszystkie bundled pluginy używają `register`; dla nowych pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem runtime. Kandydaci są blokowani,
gdy entry wychodzi poza katalog główny pluginu, ścieżka ma uprawnienia world-writable lub
w przypadku pluginów innych niż bundled własność ścieżki wygląda podejrzanie.

### Zachowanie manifest-first

Manifest jest źródłem prawdy dla płaszczyzny sterowania. OpenClaw używa go do:

- identyfikacji pluginu
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości pakietu
- walidacji `plugins.entries.<id>.config`
- uzupełniania etykiet/placeholderów w Control UI
- wyświetlania metadanych instalacji/katalogu
- zachowania tanich deskryptorów aktywacji i konfiguracji bez ładowania runtime pluginu

W przypadku natywnych pluginów moduł runtime jest częścią płaszczyzny danych. Rejestruje
rzeczywiste zachowanie, takie jak hooki, narzędzia, polecenia czy przepływy dostawców.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w płaszczyźnie sterowania.
Są to wyłącznie deskryptory metadanych dla planowania aktywacji i wykrywania konfiguracji;
nie zastępują rejestracji runtime, `register(...)` ani `setupEntry`.
Pierwsi konsumenci aktywacji na żywo używają teraz wskazówek manifestu dotyczących poleceń, kanałów i dostawców,
aby zawężać ładowanie pluginów przed szerszą materializacją rejestru:

- ładowanie CLI zawęża się do pluginów, które są właścicielami żądanej głównej komendy
- rozwiązywanie konfiguracji kanałów/pluginów zawęża się do pluginów, które są właścicielami żądanego
  identyfikatora kanału
- jawne rozwiązywanie konfiguracji/runtime dostawców zawęża się do pluginów, które są właścicielami
  żądanego identyfikatora dostawcy

Wykrywanie konfiguracji preferuje teraz identyfikatory należące do deskryptorów, takie jak `setup.providers` i
`setup.cliBackends`, aby zawężać kandydackie pluginy, zanim nastąpi powrót do
`setup-api` dla pluginów, które nadal potrzebują hooków runtime w czasie konfiguracji. Jeśli więcej niż
jeden wykryty plugin zgłasza ten sam znormalizowany identyfikator dostawcy konfiguracji lub backendu CLI,
wyszukiwanie konfiguracji odrzuca niejednoznacznego właściciela zamiast polegać na kolejności wykrywania.

### Co loader przechowuje w pamięci podręcznej

OpenClaw utrzymuje krótkotrwałe pamięci podręczne w procesie dla:

- wyników wykrywania
- danych rejestru manifestów
- załadowanych rejestrów pluginów

Te pamięci podręczne zmniejszają koszt skokowego uruchamiania i wielokrotnego wykonywania poleceń. Można o nich
bezpiecznie myśleć jako o krótkotrwałych pamięciach podręcznych wydajności, a nie o trwałym stanie.

Uwaga dotycząca wydajności:

- Ustaw `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` lub
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, aby wyłączyć te pamięci podręczne.
- Dostosuj okna pamięci podręcznej za pomocą `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` i
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model rejestru

Załadowane pluginy nie modyfikują bezpośrednio przypadkowych globalnych elementów core. Rejestrują się w
centralnym rejestrze pluginów.

Rejestr śledzi:

- rekordy pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- legacy hooki i hooki typowane
- kanały
- dostawców
- handlery RPC Gateway
- trasy HTTP
- rejestratory CLI
- usługi działające w tle
- polecenia należące do pluginów

Funkcje core następnie odczytują dane z tego rejestru zamiast komunikować się bezpośrednio z modułami pluginów.
Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- runtime core -> konsumpcja rejestru

To rozdzielenie ma znaczenie dla łatwości utrzymania. Oznacza, że większość powierzchni core potrzebuje
tylko jednego punktu integracji: „odczytaj rejestr”, a nie „obsłuż specjalnie każdy moduł pluginu”.

## Callbacki powiązania konwersacji

Pluginy, które wiążą konwersację, mogą reagować, gdy zatwierdzenie zostanie rozstrzygnięte.

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

Pola ładunku callbacku:

- `status`: `"approved"` lub `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` lub `"deny"`
- `binding`: rozstrzygnięte powiązanie dla zatwierdzonych żądań
- `request`: podsumowanie oryginalnego żądania, wskazówka odłączenia, identyfikator nadawcy oraz
  metadane konwersacji

Ten callback służy wyłącznie do powiadamiania. Nie zmienia tego, kto może powiązać
konwersację, i działa po zakończeniu obsługi zatwierdzenia przez core.

## Hooki środowiska uruchomieniowego dostawcy

Pluginy dostawców mają teraz dwie warstwy:

- metadane manifestu: `providerAuthEnvVars` dla taniego wyszukiwania uwierzytelniania dostawcy przez env
  przed załadowaniem runtime, `providerAuthAliases` dla wariantów dostawcy współdzielących
  uwierzytelnianie, `channelEnvVars` dla taniego wyszukiwania env/konfiguracji kanału przed
  załadowaniem runtime oraz `providerAuthChoices` dla tanich etykiet onboardingu/wyboru uwierzytelniania i
  metadanych flag CLI przed załadowaniem runtime
- hooki czasu konfiguracji: `catalog` / starsze `discovery` oraz `applyConfigDefaults`
- hooki runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw nadal odpowiada za ogólną pętlę agenta, failover, obsługę transkryptu i
politykę narzędzi. Te hooki stanowią powierzchnię rozszerzeń dla zachowań specyficznych dla dostawcy bez
konieczności tworzenia całkowicie własnego transportu wnioskowania.

Użyj manifestu `providerAuthEnvVars`, gdy dostawca ma poświadczenia oparte na env,
które ogólne ścieżki auth/status/wyboru modelu powinny widzieć bez ładowania runtime pluginu. Użyj manifestu
`providerAuthAliases`, gdy jeden identyfikator dostawcy ma ponownie używać zmiennych env innego
identyfikatora dostawcy, profili auth, auth opartego na konfiguracji i opcji onboardingu klucza API. Użyj manifestu
`providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru auth powinny znać identyfikator opcji dostawcy,
etykiety grup i proste połączenie auth z użyciem jednej flagi bez ładowania runtime dostawcy. Zachowaj runtime dostawcy
`envVars` dla wskazówek skierowanych do operatora, takich jak etykiety onboardingu lub zmienne konfiguracji
client-id/client-secret dla OAuth.

Użyj manifestu `channelEnvVars`, gdy kanał ma auth lub konfigurację sterowaną przez env, które
ogólny fallback shell-env, kontrole config/status lub prompty konfiguracji powinny widzieć
bez ładowania runtime kanału.

### Kolejność hooków i sposób użycia

W przypadku pluginów modeli/dostawców OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” to szybki przewodnik decyzyjny.

| #   | Hook                              | Co robi                                                                                                        | Kiedy używać                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                       | Dostawca jest właścicielem katalogu lub domyślnych wartości `base URL`                                                                     |
| 2   | `applyConfigDefaults`             | Stosuje globalne domyślne wartości konfiguracji należące do dostawcy podczas materializacji konfiguracji      | Wartości domyślne zależą od trybu auth, env lub semantyki rodziny modeli dostawcy                                                          |
| --  | _(built-in model lookup)_         | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                    | _(to nie jest hook pluginu)_                                                                                                               |
| 3   | `normalizeModelId`                | Normalizuje starsze aliasy identyfikatorów modeli lub aliasy wersji preview przed wyszukaniem                 | Dostawca jest właścicielem czyszczenia aliasów przed rozstrzygnięciem kanonicznego modelu                                                 |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawców przed ogólnym składaniem modelu                               | Dostawca odpowiada za czyszczenie transportu dla niestandardowych identyfikatorów dostawców w tej samej rodzinie transportu               |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozstrzygnięciem runtime/dostawcy                                    | Dostawca potrzebuje czyszczenia konfiguracji, które powinno znajdować się razem z pluginem; bundled helpery rodziny Google pełnią też rolę zabezpieczenia dla obsługiwanych wpisów konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje zgodnościowe przekształcenia użycia natywnego streamingu do dostawców konfiguracji                    | Dostawca potrzebuje poprawek metadanych użycia natywnego streamingu zależnych od endpointu                                                |
| 7   | `resolveConfigApiKey`             | Rozstrzyga auth typu env-marker dla dostawców konfiguracji przed załadowaniem auth runtime                    | Dostawca ma własne rozstrzyganie klucza API env-marker; `amazon-bedrock` ma tu również wbudowany resolver env-marker AWS                  |
| 8   | `resolveSyntheticAuth`            | Udostępnia auth lokalne/self-hosted lub oparte na konfiguracji bez utrwalania jawnego tekstu                  | Dostawca może działać z syntetycznym/lokalnym znacznikiem poświadczeń                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile auth należące do dostawcy; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń auth bez utrwalania skopiowanych tokenów odświeżania                                     |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych placeholderów profili względem auth opartego na env/konfiguracji    | Dostawca przechowuje syntetyczne profile-placeholdery, które nie powinny mieć pierwszeństwa                                               |
| 11  | `resolveDynamicModel`             | Synchroniczny fallback dla należących do dostawcy identyfikatorów modeli, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli z upstreamu                                                                          |
| 12  | `prepareDynamicModel`             | Asynchroniczne rozgrzanie, po czym `resolveDynamicModel` uruchamia się ponownie                               | Dostawca potrzebuje metadanych sieciowych przed rozstrzygnięciem nieznanych identyfikatorów                                               |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozstrzygniętego modelu przez embedded runner                               | Dostawca potrzebuje przekształceń transportu, ale nadal używa transportu core                                                             |
| 14  | `contributeResolvedModelCompat`   | Dodaje flagi zgodności dla modeli dostawcy działających za innym zgodnym transportem                          | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania własności dostawcy                                               |
| 15  | `capabilities`                    | Metadane transkryptu/narzędzi należące do dostawcy, używane przez współdzieloną logikę core                  | Dostawca potrzebuje niuansów związanych z transkryptem/rodziną dostawców                                                                  |
| 16  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je embedded runner                                               | Dostawca potrzebuje czyszczenia schematów na poziomie rodziny transportu                                                                  |
| 17  | `inspectToolSchemas`              | Udostępnia diagnostykę schematów należącą do dostawcy po normalizacji                                         | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia core reguł specyficznych dla dostawcy                                           |
| 18  | `resolveReasoningOutputMode`      | Wybiera kontrakt wyjścia rozumowania: natywny lub otagowany                                                   | Dostawca potrzebuje otagowanego rozumowania/końcowego wyjścia zamiast natywnych pól                                                      |
| 19  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji streamu                                       | Dostawca potrzebuje domyślnych parametrów żądania lub czyszczenia parametrów dla konkretnego dostawcy                                    |
| 20  | `createStreamFn`                  | Całkowicie zastępuje zwykłą ścieżkę streamu niestandardowym transportem                                       | Dostawca potrzebuje własnego protokołu przewodowego, a nie tylko wrappera                                                                 |
| 21  | `wrapStreamFn`                    | Wrapper streamu po zastosowaniu wrapperów ogólnych                                                            | Dostawca potrzebuje wrapperów zgodności dla nagłówków/treści/modelu żądania bez własnego transportu                                      |
| 22  | `resolveTransportTurnState`       | Dołącza natywne nagłówki transportu na turę lub metadane                                                      | Dostawca chce, aby ogólne transporty wysyłały natywną tożsamość tury dostawcy                                                             |
| 23  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę cooldown sesji                                                | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji lub politykę fallback                                                   |
| 24  | `formatApiKey`                    | Formater profilu auth: zapisany profil staje się ciągiem `apiKey` w runtime                                  | Dostawca przechowuje dodatkowe metadane auth i potrzebuje niestandardowego kształtu tokenu w runtime                                     |
| 25  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania lub polityki błędów odświeżania     | Dostawca nie pasuje do współdzielonych mechanizmów odświeżania `pi-ai`                                                                    |
| 26  | `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana po nieudanym odświeżeniu OAuth                                                  | Dostawca potrzebuje własnych wskazówek naprawy auth po błędzie odświeżania                                                                |
| 27  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstu należący do dostawcy                                                     | Dostawca ma surowe błędy przepełnienia, których nie wykryją ogólne heurystyki                                                             |
| 28  | `classifyFailoverReason`          | Klasyfikacja przyczyny failover należąca do dostawcy                                                          | Dostawca może mapować surowe błędy API/transportu na rate-limit/przeciążenie itd.                                                         |
| 29  | `isCacheTtlEligible`              | Polityka prompt-cache dla dostawców proxy/backhaul                                                            | Dostawca potrzebuje bramkowania TTL cache specyficznego dla proxy                                                                          |
| 30  | `buildMissingAuthMessage`         | Zastępstwo dla ogólnego komunikatu odzyskiwania po brakującym auth                                            | Dostawca potrzebuje własnej wskazówki odzyskiwania po brakującym auth                                                                      |
| 31  | `suppressBuiltInModel`            | Tłumienie nieaktualnych modeli z upstreamu plus opcjonalna wskazówka błędu dla użytkownika                   | Dostawca musi ukryć nieaktualne wiersze upstreamu lub zastąpić je wskazówką od dostawcy                                                   |
| 32  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dodawane po wykryciu                                                    | Dostawca potrzebuje syntetycznych wierszy forward-compat w `models list` i selektorach                                                    |
| 33  | `isBinaryThinking`                | Przełącznik rozumowania włącz/wyłącz dla dostawców binary-thinking                                            | Dostawca udostępnia tylko binarne włączanie/wyłączanie rozumowania                                                                         |
| 34  | `supportsXHighThinking`           | Obsługa rozumowania `xhigh` dla wybranych modeli                                                              | Dostawca chce `xhigh` tylko dla części modeli                                                                                              |
| 35  | `resolveDefaultThinkingLevel`     | Domyślny poziom `/think` dla konkretnej rodziny modeli                                                        | Dostawca odpowiada za domyślną politykę `/think` dla rodziny modeli                                                                        |
| 36  | `isModernModelRef`                | Matcher nowoczesnych modeli dla filtrów profili live i wyboru smoke                                           | Dostawca odpowiada za dopasowywanie preferowanych modeli live/smoke                                                                        |
| 37  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na rzeczywisty token/klucz runtime tuż przed wnioskowaniem             | Dostawca potrzebuje wymiany tokenu lub krótkotrwałego poświadczenia żądania                                                                |
| 38  | `resolveUsageAuth`                | Rozstrzyga poświadczenia użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu                      | Dostawca potrzebuje niestandardowego parsowania tokenu użycia/limitu lub innego poświadczenia użycia                                      |
| 39  | `fetchUsageSnapshot`              | Pobiera i normalizuje snapshoty użycia/limitów specyficzne dla dostawcy po rozstrzygnięciu auth              | Dostawca potrzebuje endpointu użycia specyficznego dla dostawcy lub parsera ładunku                                                       |
| 40  | `createEmbeddingProvider`         | Buduje adapter embeddingów należący do dostawcy dla pamięci/wyszukiwania                                      | Zachowanie embeddingów pamięci należy do pluginu dostawcy                                                                                  |
| 41  | `buildReplayPolicy`               | Zwraca politykę replay kontrolującą obsługę transkryptu dla dostawcy                                          | Dostawca potrzebuje własnej polityki transkryptu (na przykład usuwania bloków rozumowania)                                                |
| 42  | `sanitizeReplayHistory`           | Przepisuje historię replay po ogólnym czyszczeniu transkryptu                                                 | Dostawca potrzebuje przekształceń replay specyficznych dla dostawcy wykraczających poza współdzielone helpery Compaction                  |
| 43  | `validateReplayTurns`             | Końcowa walidacja lub przekształcanie tur replay przed embedded runnerem                                      | Transport dostawcy potrzebuje bardziej rygorystycznej walidacji tur po ogólnej sanityzacji                                                |
| 44  | `onModelSelected`                 | Uruchamia skutki uboczne po wyborze modelu należące do dostawcy                                               | Dostawca potrzebuje telemetrii lub stanu należącego do dostawcy, gdy model staje się aktywny                                              |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany plugin dostawcy, a następnie przechodzą do innych pluginów dostawców obsługujących hooki,
dopóki któryś rzeczywiście nie zmieni identyfikatora modelu albo transportu/konfiguracji. Dzięki temu
shimy aliasów/zgodności dostawców nadal działają bez wymagania, aby wywołujący wiedział, który
bundled plugin jest właścicielem przepisania. Jeśli żaden hook dostawcy nie przepisze obsługiwanego
wpisu konfiguracji z rodziny Google, bundled normalizator konfiguracji Google nadal zastosuje
to czyszczenie zgodności.

Jeśli dostawca potrzebuje w pełni niestandardowego protokołu przewodowego lub własnego wykonawcy żądań,
jest to inna klasa rozszerzenia. Te hooki służą do zachowań dostawcy, które nadal działają
w zwykłej pętli wnioskowania OpenClaw.

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

- Anthropic używa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  i `wrapStreamFn`, ponieważ odpowiada za zgodność forward-compat Claude 4.6,
  wskazówki dotyczące rodziny dostawców, wskazówki naprawy auth, integrację
  endpointu użycia, kwalifikowalność prompt-cache, domyślne wartości konfiguracji zależne od auth, domyślną/adaptacyjną
  politykę rozumowania Claude oraz kształtowanie streamu specyficzne dla Anthropic dla
  nagłówków beta, `/fast` / `serviceTier` i `context1m`.
- Helpery streamu Anthropic specyficzne dla Claude pozostają na razie we własnej
  publicznej powierzchni `api.ts` / `contract-api.ts` bundled pluginu. Ta powierzchnia pakietu
  eksportuje `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz niższopoziomowe
  konstruktory wrapperów Anthropic zamiast rozszerzać ogólne SDK o reguły nagłówków beta
  jednego dostawcy.
- OpenAI używa `resolveDynamicModel`, `normalizeResolvedModel` i
  `capabilities`, a także `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` i `isModernModelRef`,
  ponieważ odpowiada za zgodność forward-compat GPT-5.4, bezpośrednią normalizację OpenAI
  `openai-completions` -> `openai-responses`, wskazówki auth świadome Codex,
  tłumienie Spark, syntetyczne wiersze listy OpenAI oraz politykę rozumowania / modeli live GPT-5; rodzina streamów
  `openai-responses-defaults` odpowiada za współdzielone natywne wrappery OpenAI Responses dla
  nagłówków atrybucji, `/fast`/`serviceTier`, szczegółowości tekstu, natywnego wyszukiwania w sieci Codex,
  kształtowania ładunku reasoning-compat oraz zarządzania kontekstem Responses.
- OpenRouter używa `catalog`, a także `resolveDynamicModel` i
  `prepareDynamicModel`, ponieważ dostawca działa jako pass-through i może udostępniać nowe
  identyfikatory modeli przed aktualizacją statycznego katalogu OpenClaw; używa także
  `capabilities`, `wrapStreamFn` i `isCacheTtlEligible`, aby utrzymać
  nagłówki żądań specyficzne dla dostawcy, metadane routingu, poprawki rozumowania i
  politykę prompt-cache poza core. Jego polityka replay pochodzi z rodziny
  `passthrough-gemini`, podczas gdy rodzina streamów `openrouter-thinking`
  odpowiada za wstrzykiwanie rozumowania proxy oraz pomijanie nieobsługiwanych modeli / `auto`.
- GitHub Copilot używa `catalog`, `auth`, `resolveDynamicModel` i
  `capabilities`, a także `prepareRuntimeAuth` i `fetchUsageSnapshot`, ponieważ
  potrzebuje logowania urządzenia należącego do dostawcy, zachowania fallback modeli, niuansów
  transkryptu Claude, wymiany tokenu GitHub -> token Copilot oraz endpointu użycia należącego do dostawcy.
- OpenAI Codex używa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` i `augmentModelCatalog`, a także
  `prepareExtraParams`, `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ
  nadal działa na transportach core OpenAI, ale odpowiada za własną normalizację
  transportu/base URL, politykę fallback odświeżania OAuth, domyślny wybór transportu,
  syntetyczne wiersze katalogu Codex oraz integrację endpointu użycia ChatGPT; współdzieli
  tę samą rodzinę streamów `openai-responses-defaults` co bezpośrednie OpenAI.
- Google AI Studio i Gemini CLI OAuth używają `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` i `isModernModelRef`, ponieważ
  rodzina replay `google-gemini` odpowiada za fallback zgodności forward-compat Gemini 3.1,
  natywną walidację replay Gemini, sanityzację bootstrap replay, tryb wyjścia rozumowania z tagami
  oraz dopasowywanie nowoczesnych modeli, podczas gdy rodzina streamów
  `google-thinking` odpowiada za normalizację ładunku rozumowania Gemini;
  Gemini CLI OAuth używa również `formatApiKey`, `resolveUsageAuth` i
  `fetchUsageSnapshot` do formatowania tokenu, parsowania tokenu i połączenia
  endpointu limitów.
- Anthropic Vertex używa `buildReplayPolicy` przez rodzinę replay
  `anthropic-by-model`, dzięki czemu czyszczenie replay specyficzne dla Claude pozostaje
  ograniczone do identyfikatorów Claude, a nie do każdego transportu `anthropic-messages`.
- Amazon Bedrock używa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` i `resolveDefaultThinkingLevel`, ponieważ odpowiada za
  klasyfikację błędów throttle/not-ready/context-overflow specyficznych dla Bedrock
  dla ruchu Anthropic-on-Bedrock; jego polityka replay nadal współdzieli tę samą
  ochronę tylko dla Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode i Opencode Go używają `buildReplayPolicy`
  przez rodzinę replay `passthrough-gemini`, ponieważ przekazują modele Gemini
  przez transporty zgodne z OpenAI i potrzebują sanityzacji sygnatur myśli Gemini
  bez natywnej walidacji replay Gemini ani przekształceń bootstrap.
- MiniMax używa `buildReplayPolicy` przez rodzinę replay
  `hybrid-anthropic-openai`, ponieważ jeden dostawca odpowiada zarówno za semantykę
  wiadomości Anthropic, jak i zgodność z OpenAI; zachowuje usuwanie bloków rozumowania tylko dla Claude
  po stronie Anthropic, jednocześnie nadpisując tryb wyjścia rozumowania z powrotem na natywny, a rodzina streamów
  `minimax-fast-mode` odpowiada za przepisania modeli trybu fast na współdzielonej ścieżce streamu.
- Moonshot używa `catalog` oraz `wrapStreamFn`, ponieważ nadal korzysta ze współdzielonego
  transportu OpenAI, ale potrzebuje normalizacji ładunku rozumowania należącej do dostawcy; rodzina streamów
  `moonshot-thinking` mapuje konfigurację oraz stan `/think` na swój natywny binarny ładunek rozumowania.
- Kilocode używa `catalog`, `capabilities`, `wrapStreamFn` i
  `isCacheTtlEligible`, ponieważ potrzebuje nagłówków żądań należących do dostawcy,
  normalizacji ładunku rozumowania, wskazówek transkryptu Gemini oraz
  bramkowania cache-TTL Anthropic; rodzina streamów `kilocode-thinking` utrzymuje wstrzykiwanie rozumowania Kilo
  na współdzielonej ścieżce streamu proxy, jednocześnie pomijając `kilo/auto` i
  inne identyfikatory modeli proxy, które nie obsługują jawnych ładunków rozumowania.
- Z.AI używa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ odpowiada za fallback GLM-5,
  domyślne wartości `tool_stream`, UX binary thinking, dopasowywanie nowoczesnych modeli oraz zarówno
  auth użycia, jak i pobieranie limitów; rodzina streamów `tool-stream-default-on` utrzymuje
  wrapper `tool_stream` domyślnie włączony poza ręcznie pisanym kodem specyficznym dla dostawcy.
- xAI używa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` i `isModernModelRef`,
  ponieważ odpowiada za normalizację natywnego transportu xAI Responses, przepisania
  aliasów trybu fast Grok, domyślne `tool_stream`, czyszczenie strict-tool / ładunku rozumowania,
  ponowne użycie auth fallback dla narzędzi należących do pluginu, rozstrzyganie modeli Grok zgodne z forward-compat
  oraz poprawki zgodności należące do dostawcy, takie jak profil schematu narzędzi xAI,
  nieobsługiwane słowa kluczowe schematu, natywne `web_search` i dekodowanie argumentów wywołań narzędzi z encji HTML.
- Mistral, OpenCode Zen i OpenCode Go używają tylko `capabilities`, aby utrzymać
  niuanse transkryptu/narzędzi poza core.
- Bundled dostawcy tylko katalogowi, tacy jak `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` i `volcengine`, używają
  tylko `catalog`.
- Qwen używa `catalog` dla swojego dostawcy tekstowego oraz współdzielonych rejestracji rozumienia mediów i
  generowania wideo dla swoich powierzchni multimodalnych.
- MiniMax i Xiaomi używają `catalog` oraz hooków użycia, ponieważ ich zachowanie `/usage`
  należy do pluginu, mimo że wnioskowanie nadal działa przez współdzielone transporty.

## Narzędzia pomocnicze środowiska uruchomieniowego

Pluginy mogą uzyskiwać dostęp do wybranych helperów core przez `api.runtime`. Dla TTS:

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

- `textToSpeech` zwraca zwykły ładunek wyjściowy TTS z core dla powierzchni plików/notatek głosowych.
- Używa konfiguracji core `messages.tts` i wyboru dostawcy.
- Zwraca bufor dźwięku PCM + częstotliwość próbkowania. Pluginy muszą przeprowadzić resampling/kodowanie dla dostawców.
- `listVoices` jest opcjonalne dla każdego dostawcy. Używaj go dla selektorów głosów lub przepływów konfiguracji należących do dostawcy.
- Listy głosów mogą zawierać bogatsze metadane, takie jak locale, płeć i tagi osobowości dla selektorów świadomych dostawcy.
- OpenAI i ElevenLabs obsługują dziś telefonię. Microsoft nie.

Pluginy mogą także rejestrować dostawców mowy przez `api.registerSpeechProvider(...)`.

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

- Zachowaj politykę TTS, fallback i dostarczanie odpowiedzi w core.
- Używaj dostawców mowy dla zachowania syntezy należącego do dostawcy.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden plugin dostawcy może obsługiwać
  tekst, mowę, obrazy i przyszłych dostawców mediów, gdy OpenClaw dodaje te
  kontrakty możliwości.

W przypadku rozumienia obrazów/audio/wideo pluginy rejestrują jednego typowanego
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

- Zachowaj orkiestrację, fallback, konfigurację i podłączenie kanałów w core.
- Zachowaj zachowanie dostawcy w pluginie dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyników, nowe opcjonalne możliwości.
- Generowanie wideo już stosuje ten sam wzorzec:
  - core jest właścicielem kontraktu możliwości i helpera runtime
  - pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - pluginy funkcjonalne/kanałowe wykorzystują `api.runtime.videoGeneration.*`

W przypadku helperów runtime rozumienia mediów pluginy mogą wywoływać:

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

W przypadku transkrypcji audio pluginy mogą używać albo runtime rozumienia mediów,
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
  rozumienia obrazów/audio/wideo.
- Używa konfiguracji audio rozumienia mediów z core (`tools.media.audio`) oraz kolejności fallback dostawców.
- Zwraca `{ text: undefined }`, gdy nie powstanie wynik transkrypcji (na przykład w przypadku pominiętego/nieobsługiwanego wejścia).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą również uruchamiać podrzędne przebiegi subagenta w tle przez `api.runtime.subagent`:

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

- `provider` i `model` to opcjonalne nadpisania dla pojedynczego przebiegu, a nie trwałe zmiany sesji.
- OpenClaw honoruje te pola nadpisania tylko dla zaufanych wywołujących.
- W przypadku przebiegów fallback należących do pluginu operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane pluginy do określonych kanonicznych celów `provider/model`, lub `"*"` aby jawnie dopuścić dowolny cel.
- Niezaufane przebiegi subagenta pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast po cichu przechodzić do fallback.

W przypadku wyszukiwania w sieci pluginy mogą korzystać ze współdzielonego helpera runtime zamiast
sięgać do podłączenia narzędzia agenta:

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

Pluginy mogą także rejestrować dostawców wyszukiwania w sieci przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Zachowaj wybór dostawcy, rozstrzyganie poświadczeń i współdzieloną semantykę żądań w core.
- Używaj dostawców wyszukiwania w sieci dla transportów wyszukiwania specyficznych dla dostawcy.
- `api.runtime.webSearch.*` to preferowana współdzielona powierzchnia dla pluginów funkcjonalnych/kanałowych, które potrzebują zachowania wyszukiwania bez zależności od wrappera narzędzia agenta.

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

Pluginy mogą udostępniać endpointy HTTP za pomocą `api.registerHttpRoute(...)`.

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
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać zwykłego auth gateway, lub `"plugin"` dla auth zarządzanego przez plugin / weryfikacji Webhook.
- `match`: opcjonalne. `"exact"` (domyślnie) lub `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania pluginu. Zamiast tego użyj `api.registerHttpRoute(...)`.
- Trasy pluginów muszą jawnie deklarować `auth`.
- Konflikty dokładnych `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przejścia `exact`/`prefix` utrzymuj tylko na tym samym poziomie `auth`.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów runtime operatora. Służą do webhooków / weryfikacji podpisów zarządzanych przez plugin, a nie do uprzywilejowanych wywołań helperów Gateway.
- Trasy `auth: "gateway"` działają wewnątrz zakresu runtime żądania Gateway, ale ten zakres jest celowo konserwatywny:
  - auth bearer oparty na współdzielonym sekrecie (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras pluginów przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP przekazujące tożsamość (na przykład `trusted-proxy` lub `gateway.auth.mode = "none"` na prywatnym ingressie) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny w takich żądaniach tras pluginów z przekazywaną tożsamością, zakres runtime wraca do `operator.write`
- Praktyczna zasada: nie zakładaj, że trasa pluginu z auth gateway jest niejawnie powierzchnią administracyjną. Jeśli twoja trasa potrzebuje zachowania tylko dla administratora, wymagaj trybu auth przekazującego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu Plugin SDK

Podczas tworzenia pluginów używaj podścieżek SDK zamiast monolitycznego importu `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` dla prymitywów rejestracji pluginów.
- `openclaw/plugin-sdk/core` dla ogólnego współdzielonego kontraktu skierowanego do pluginów.
- `openclaw/plugin-sdk/config-schema` dla eksportu głównego schematu Zod `openclaw.json`
  (`OpenClawSchema`).
- Stabilne prymitywy kanałów, takie jak `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` i
  `openclaw/plugin-sdk/webhook-ingress` dla współdzielonego podłączenia
  konfiguracji/auth/odpowiedzi/Webhook. `channel-inbound` jest wspólnym miejscem dla debounce, dopasowywania wzmianek,
  helperów polityki wzmianek przychodzących, formatowania kopert przychodzących oraz helperów kontekstu
  kopert przychodzących.
  `channel-setup` to wąska ścieżka konfiguracji opcjonalnej instalacji.
  `setup-runtime` to bezpieczna dla runtime powierzchnia konfiguracji używana przez `setupEntry` /
  odroczone uruchamianie, w tym bezpieczne importowo adaptery łatek konfiguracji.
  `setup-adapter-runtime` to świadoma env ścieżka adaptera konfiguracji konta.
  `setup-tools` to mała ścieżka helperów CLI/archiwów/dokumentacji (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Podścieżki domenowe, takie jak `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` i
  `openclaw/plugin-sdk/directory-runtime` dla współdzielonych helperów runtime/konfiguracji.
  `telegram-command-config` to wąska publiczna ścieżka dla normalizacji/walidacji niestandardowych poleceń Telegram i pozostaje dostępna nawet wtedy, gdy bundled
  powierzchnia kontraktu Telegram jest tymczasowo niedostępna.
  `text-runtime` to współdzielona ścieżka tekstu/Markdown/logowania, obejmująca
  usuwanie tekstu widocznego dla asystenta, helpery renderowania/dzielenia Markdown, helpery redakcji,
  helpery tagów dyrektyw oraz bezpieczne narzędzia tekstowe.
- Powierzchnie kanałów specyficzne dla zatwierdzeń powinny preferować jeden kontrakt
  `approvalCapability` w pluginie. Core odczytuje wtedy auth zatwierdzeń, dostarczanie, renderowanie,
  natywne routowanie i leniwe zachowanie natywnego handlera przez tę jedną możliwość
  zamiast mieszać zachowanie zatwierdzeń z niezwiązanymi polami pluginu.
- `openclaw/plugin-sdk/channel-runtime` jest przestarzałe i pozostaje jedynie
  jako shima zgodności dla starszych pluginów. Nowy kod powinien importować węższe
  prymitywy ogólne, a kod repo nie powinien dodawać nowych importów tej shimy.
- Wewnętrzne elementy bundled extensions pozostają prywatne. Zewnętrzne pluginy powinny używać tylko podścieżek `openclaw/plugin-sdk/*`. Kod core/testów OpenClaw może używać publicznych punktów wejścia repo
  pod katalogiem głównym pakietu pluginu, takich jak `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` oraz wąsko ukierunkowane pliki, takie jak
  `login-qr-api.js`. Nigdy nie importuj `src/*` pakietu pluginu z core ani z
  innego rozszerzenia.
- Podział punktów wejścia repo:
  `<plugin-package-root>/api.js` to barrel helperów/typów,
  `<plugin-package-root>/runtime-api.js` to barrel tylko runtime,
  `<plugin-package-root>/index.js` to punkt wejścia bundled pluginu,
  a `<plugin-package-root>/setup-entry.js` to punkt wejścia pluginu konfiguracji.
- Aktualne przykłady bundled dostawców:
  - Anthropic używa `api.js` / `contract-api.js` dla helperów streamu Claude, takich
    jak `wrapAnthropicProviderStream`, helpery nagłówków beta i parsowanie `service_tier`.
  - OpenAI używa `api.js` dla konstruktorów dostawców, helperów modeli domyślnych i
    konstruktorów dostawców realtime.
  - OpenRouter używa `api.js` dla swojego konstruktora dostawcy oraz helperów onboardingu/konfiguracji,
    podczas gdy `register.runtime.js` może nadal ponownie eksportować ogólne
    helpery `plugin-sdk/provider-stream` do użytku lokalnego w repo.
- Publiczne punkty wejścia ładowane przez fasadę preferują aktywny snapshot konfiguracji runtime,
  gdy taki istnieje, a następnie wracają do rozstrzygniętego pliku konfiguracji na dysku, gdy
  OpenClaw nie udostępnia jeszcze snapshotu runtime.
- Ogólne współdzielone prymitywy pozostają preferowanym publicznym kontraktem SDK. Nadal istnieje mały
  zastrzeżony zestaw zgodności helperów oznaczonych marką bundled kanałów. Traktuj je jako
  powierzchnie utrzymaniowe/zgodnościowe dla bundled, a nie nowe cele importu dla podmiotów trzecich; nowe kontrakty międzykanałowe powinny nadal trafiać do
  ogólnych podścieżek `plugin-sdk/*` albo lokalnych barrelów pluginu `api.js` /
  `runtime-api.js`.

Uwaga dotycząca kompatybilności:

- Unikaj głównego barrelu `openclaw/plugin-sdk` w nowym kodzie.
- Najpierw preferuj wąskie, stabilne prymitywy. Nowsze podścieżki setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool są zamierzonym kontraktem dla nowych prac nad
  bundled i zewnętrznymi pluginami.
  Parsowanie/dopasowywanie celów należy do `openclaw/plugin-sdk/channel-targets`.
  Bramki działań wiadomości i helpery identyfikatorów wiadomości reakcji należą do
  `openclaw/plugin-sdk/channel-actions`.
- Barrele helperów specyficznych dla bundled extensions nie są domyślnie stabilne. Jeśli
  helper jest potrzebny tylko bundled extension, trzymaj go za lokalną
  warstwą `api.js` lub `runtime-api.js` tego rozszerzenia zamiast promować go do
  `openclaw/plugin-sdk/<extension>`.
- Nowe współdzielone ścieżki helperów powinny być ogólne, a nie oznaczone marką kanału. Wspólne parsowanie
  celów należy do `openclaw/plugin-sdk/channel-targets`; elementy wewnętrzne specyficzne dla kanału
  pozostają za lokalną warstwą `api.js` lub `runtime-api.js` należącego pluginu.
- Podścieżki specyficzne dla możliwości, takie jak `image-generation`,
  `media-understanding` i `speech`, istnieją, ponieważ bundled/natywne pluginy używają
  ich już dziś. Ich obecność sama w sobie nie oznacza, że każdy eksportowany helper jest
  długoterminowym zamrożonym kontraktem zewnętrznym.

## Schematy narzędzia wiadomości

Pluginy powinny być właścicielami wkładów do schematu `describeMessageTool(...)` specyficznych dla kanału.
Pola specyficzne dla dostawcy trzymaj w pluginie, a nie we współdzielonym core.

Dla współdzielonych przenośnych fragmentów schematu używaj ponownie ogólnych helperów eksportowanych przez
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` dla ładunków w stylu siatki przycisków
- `createMessageToolCardSchema()` dla strukturalnych ładunków kart

Jeśli dany kształt schematu ma sens tylko dla jednego dostawcy, zdefiniuj go we
własnym kodzie źródłowym tego pluginu zamiast promować go do współdzielonego SDK.

## Rozstrzyganie celów kanału

Pluginy kanałów powinny być właścicielami semantyki celów specyficznych dla kanału. Zachowaj współdzielony
host outbound jako ogólny i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` czy `channel` przed wyszukaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi core, czy dane
  wejście powinno pominąć bezpośrednio do rozstrzygania podobnego do identyfikatora zamiast wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` to fallback pluginu, gdy
  core potrzebuje końcowego rozstrzygnięcia należącego do dostawcy po normalizacji lub po
  braku trafienia w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` odpowiada za konstruowanie trasy sesji
  specyficzne dla dostawcy po rozstrzygnięciu celu.

Zalecany podział:

- Używaj `inferTargetChatType` dla decyzji kategorialnych, które powinny zapadać przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` do sprawdzeń typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` dla fallbacku normalizacji specyficznego dla dostawcy, a nie dla
  szerokiego wyszukiwania w katalogu.
- Natywne identyfikatory dostawcy, takie jak identyfikatory czatów, identyfikatory wątków, JID-y, handle i
  identyfikatory pokoi, przechowuj wewnątrz wartości `target` lub parametrów specyficznych dla dostawcy, a nie w ogólnych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny trzymać tę logikę w
pluginie i wykorzystywać współdzielone helpery z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery DM sterowane allowlistą
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogów ograniczone do konta

Współdzielone helpery w `directory-runtime` obsługują tylko ogólne operacje:

- filtrowanie zapytań
- stosowanie limitów
- deduplikację/helpery normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja konta specyficzna dla kanału i normalizacja identyfikatorów powinny pozostać w
implementacji pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli do wnioskowania za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy plugin jest właścicielem identyfikatorów modeli specyficznych dla dostawcy, domyślnych
wartości `base URL` lub metadanych modeli zależnych od auth.

`catalog.order` kontroluje, kiedy katalog pluginu jest scalany względem
wbudowanych niejawnych dostawców OpenClaw:

- `simple`: dostawcy używający zwykłego klucza API lub env
- `profile`: dostawcy pojawiający się, gdy istnieją profile auth
- `paired`: dostawcy syntetyzujący wiele powiązanych wpisów dostawców
- `late`: ostatni przebieg, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają w przypadku kolizji kluczy, więc pluginy mogą celowo nadpisać
wbudowany wpis dostawcy tym samym identyfikatorem dostawcy.

Kompatybilność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Kanałowa inspekcja tylko do odczytu

Jeśli twój plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` to ścieżka runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane i może szybko zakończyć się błędem, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy
  naprawy doctor/config, nie powinny wymagać materializacji poświadczeń runtime tylko po to,
  by opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Dołączaj pola źródła/statusu poświadczeń, gdy ma to znaczenie, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, by raportować dostępność
  tylko do odczytu. Zwrócenie `tokenStatus: "available"` (oraz odpowiadającego mu pola źródła)
  wystarcza dla poleceń typu status.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Pozwala to poleceniom tylko do odczytu raportować „skonfigurowane, ale niedostępne w tej ścieżce polecenia”
zamiast powodować awarię lub błędnie raportować konto jako nieskonfigurowane.

## Package packi

Katalog pluginu może zawierać `package.json` z `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Każdy wpis staje się pluginem. Jeśli pack zawiera wiele rozszerzeń, identyfikator pluginu
przyjmuje postać `name/<fileBase>`.

Jeśli twój plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Barierka bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu pluginu
po rozstrzygnięciu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga dotycząca bezpieczeństwa: `openclaw plugins install` instaluje zależności pluginów za pomocą
`npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia, bez zależności deweloperskich w runtime). Utrzymuj drzewa zależności pluginów jako „czyste JS/TS” i unikaj pakietów wymagających kompilacji przez `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego pluginu kanału albo
gdy plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego punktu wejścia pluginu. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główny punkt wejścia pluginu podłącza również narzędzia, hooki lub inny kod tylko runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć plugin kanału do tej samej ścieżki `setupEntry` w fazie
uruchamiania gateway przed `listen`, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię uruchamiania, która musi istnieć
zanim gateway zacznie nasłuchiwać. W praktyce oznacza to, że punkt wejścia konfiguracji
musi rejestrować każdą możliwość należącą do kanału, od której zależy uruchamianie, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne zanim gateway zacznie nasłuchiwać
- wszelkie metody Gateway, narzędzia lub usługi, które muszą istnieć w tym samym oknie czasowym

Jeśli twój pełny punkt wejścia nadal jest właścicielem jakiejkolwiek wymaganej możliwości uruchamiania, nie włączaj
tej flagi. Pozostaw plugin przy domyślnym zachowaniu i pozwól OpenClaw ładować
pełny punkt wejścia podczas uruchamiania.

Bundled kanały mogą także publikować helpery powierzchni kontraktowej tylko do konfiguracji, z których core
może korzystać przed załadowaniem pełnego runtime kanału. Obecna powierzchnia
promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core używa tej powierzchni, gdy musi promować starszą konfigurację kanału z pojedynczym kontem
do `channels.<id>.accounts.*` bez ładowania pełnego punktu wejścia pluginu.
Matrix jest obecnym bundled przykładem: przenosi tylko klucze auth/bootstrap do
nazwanego promowanego konta, gdy nazwane konta już istnieją, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery łatek konfiguracji utrzymują leniwe wykrywanie powierzchni kontraktowej bundled. Czas
importu pozostaje lekki; powierzchnia promocji jest ładowana tylko przy pierwszym użyciu zamiast
ponownie wchodzić w uruchamianie bundled kanału podczas importu modułu.

Gdy te powierzchnie uruchamiania zawierają metody RPC Gateway, utrzymuj je pod
prefiksem specyficznym dla pluginu. Przestrzenie nazw administratora core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zastrzeżone i zawsze rozstrzygają się
do `operator.admin`, nawet jeśli plugin żąda węższego zakresu.

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
wskazówki instalacji przez `openclaw.install`. Dzięki temu dane katalogu core pozostają wolne od danych.

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

- `detailLabel`: etykieta dodatkowa dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: nadpisuje tekst linku do dokumentacji
- `preferOver`: identyfikatory pluginów/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki tekstu dla powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący Markdown dla decyzji o formatowaniu outbound
- `exposure.configured`: ukrywa kanał z powierzchni listowania skonfigurowanych kanałów, gdy ustawiono `false`
- `exposure.setup`: ukrywa kanał z interaktywnych selektorów konfiguracji/ustawiania, gdy ustawiono `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla kompatybilności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu `allowFrom` szybkiego startu
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozstrzyganiu celów ogłoszeń

OpenClaw może także scalać **zewnętrzne katalogi kanałów** (na przykład eksport
rejestru MPM). Umieść plik JSON w jednej z poniższych lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Lub wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (albo `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (rozdzielanych przecinkami/średnikami/`PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje również `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu są właścicielami orkiestracji kontekstu sesji dla ingestu, składania
i Compaction. Rejestruj je z pluginu przez
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik za pomocą
`plugins.slots.contextEngine`.

Użyj tego, gdy plugin musi zastąpić lub rozszerzyć domyślny
potok kontekstu, zamiast jedynie dodawać wyszukiwanie pamięci lub hooki.

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

Jeśli twój silnik **nie** jest właścicielem algorytmu Compaction, pozostaw `compact()`
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

Gdy plugin potrzebuje zachowania, które nie pasuje do obecnego API, nie omijaj
systemu pluginów przez prywatne sięgnięcie do środka. Dodaj brakującą możliwość.

Zalecana sekwencja:

1. zdefiniuj kontrakt core
   Zdecyduj, jakim współdzielonym zachowaniem powinien zarządzać core: polityką, fallbackiem, scalaniem konfiguracji,
   cyklem życia, semantyką skierowaną do kanałów i kształtem helpera runtime.
2. dodaj typowane powierzchnie rejestracji/runtime pluginów
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię możliwości.
3. podłącz konsumentów core + kanałów/funkcji
   Kanały i pluginy funkcjonalne powinny korzystać z nowej możliwości przez core,
   a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców następnie rejestrują swoje backendy względem tej możliwości.
5. dodaj pokrycie kontraktowe
   Dodaj testy, aby własność i kształt rejestracji pozostawały jawne w czasie.

W ten sposób OpenClaw zachowuje zdecydowane podejście bez stawania się rozwiązaniem zakodowanym pod
światopogląd jednego dostawcy. Zobacz [Capability Cookbook](/pl/plugins/architecture),
aby uzyskać konkretną listę plików i gotowy przykład.

### Lista kontrolna możliwości

Gdy dodajesz nową możliwość, implementacja powinna zwykle dotykać tych
powierzchni jednocześnie:

- typy kontraktów core w `src/<capability>/types.ts`
- helper runtime/runner core w `src/<capability>/runtime.ts`
- powierzchnia rejestracji API pluginów w `src/plugins/types.ts`
- podłączenie rejestru pluginów w `src/plugins/registry.ts`
- udostępnienie runtime pluginów w `src/plugins/runtime/*`, gdy pluginy funkcjonalne/kanałowe
  muszą z niej korzystać
- helpery przechwytywania/testów w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktów w `src/plugins/contracts/registry.ts`
- dokumentacja operatora/pluginów w `docs/`

Jeśli którejś z tych powierzchni brakuje, zwykle oznacza to, że możliwość nie jest
jeszcze w pełni zintegrowana.

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

To utrzymuje prostą zasadę:

- core jest właścicielem kontraktu możliwości + orkiestracji
- pluginy dostawców są właścicielami implementacji dostawców
- pluginy funkcjonalne/kanałowe korzystają z helperów runtime
- testy kontraktowe utrzymują jawną własność
