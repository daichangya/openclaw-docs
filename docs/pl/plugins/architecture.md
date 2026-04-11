---
read_when:
    - Tworzenie lub debugowanie natywnych pluginów OpenClaw
    - Zrozumienie modelu możliwości pluginów lub granic własności
    - Praca nad potokiem ładowania pluginów lub rejestrem
    - Implementowanie hooków środowiska uruchomieniowego dostawcy lub pluginów kanałów
sidebarTitle: Internals
summary: 'Wewnętrzne elementy pluginów: model możliwości, własność, kontrakty, potok ładowania i pomocniki środowiska uruchomieniowego'
title: Wewnętrzne elementy pluginów
x-i18n:
    generated_at: "2026-04-11T15:16:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7cac67984d0d729c0905bcf5c18372fb0d9b02bbd3a531580b7e2ef483ef40a6
    source_path: plugins/architecture.md
    workflow: 15
---

# Wewnętrzne elementy pluginów

<Info>
  To jest **szczegółowy opis architektury**. Praktyczne przewodniki znajdziesz tutaj:
  - [Instalacja i używanie pluginów](/pl/tools/plugin) — przewodnik użytkownika
  - [Pierwsze kroki](/pl/plugins/building-plugins) — samouczek tworzenia pierwszego pluginu
  - [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie kanału komunikacyjnego
  - [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — tworzenie dostawcy modeli
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
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`               |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`   | `openai`                             |
| Rozumienie multimediów | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| Generowanie obrazów   | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki    | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Generowanie wideo     | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Pobieranie z sieci    | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Wyszukiwanie w sieci  | `api.registerWebSearchProvider(...)`            | `google`                             |
| Kanał / komunikacja   | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Plugin, który rejestruje zero możliwości, ale udostępnia hooki, narzędzia lub
usługi, jest pluginem **legacy hook-only**. Ten wzorzec nadal jest w pełni obsługiwany.

### Stanowisko dotyczące zgodności zewnętrznej

Model możliwości jest już wdrożony w rdzeniu i używany dziś przez
bundled/native plugins, ale zgodność zewnętrznych pluginów nadal wymaga
bardziej rygorystycznego podejścia niż „jest eksportowane, więc jest zamrożone”.

Aktualne wytyczne:

- **istniejące pluginy zewnętrzne:** zachowuj działanie integracji opartych na hookach; traktuj
  to jako bazowy poziom zgodności
- **nowe bundled/native plugins:** preferuj jawną rejestrację możliwości zamiast
  specyficznych dla dostawcy sięgnięć do wnętrza lub nowych projektów opartych wyłącznie na hookach
- **pluginy zewnętrzne przyjmujące rejestrację możliwości:** dozwolone, ale
  traktuj powierzchnie pomocnicze specyficzne dla możliwości jako rozwijające się, chyba że dokumentacja wyraźnie oznacza dany kontrakt jako stabilny

Praktyczna zasada:

- API rejestracji możliwości to zamierzony kierunek
- legacy hooks pozostają najbezpieczniejszą ścieżką bez ryzyka złamania zgodności dla pluginów zewnętrznych podczas
  przejścia
- eksportowane ścieżki pomocnicze nie są równoważne; preferuj wąski, udokumentowany
  kontrakt, a nie przypadkowo eksportowane helpery

### Kształty pluginów

OpenClaw klasyfikuje każdy załadowany plugin do określonego kształtu na podstawie jego rzeczywistego
zachowania rejestracyjnego (a nie tylko statycznych metadanych):

- **plain-capability** -- rejestruje dokładnie jeden typ możliwości (na przykład
  plugin wyłącznie dostawcy, taki jak `mistral`)
- **hybrid-capability** -- rejestruje wiele typów możliwości (na przykład
  `openai` obsługuje wnioskowanie tekstowe, mowę, rozumienie multimediów i generowanie
  obrazów)
- **hook-only** -- rejestruje tylko hooki (typowane lub własne), bez możliwości,
  narzędzi, komend ani usług
- **non-capability** -- rejestruje narzędzia, komendy, usługi lub trasy, ale bez
  możliwości

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu i podział
możliwości. Szczegóły znajdziesz w [dokumentacji CLI](/cli/plugins#inspect).

### Legacy hooks

Hook `before_agent_start` pozostaje obsługiwany jako ścieżka zgodności dla
pluginów typu hook-only. Nadal zależą od niego rzeczywiste pluginy legacy.

Kierunek:

- utrzymać jego działanie
- dokumentować go jako legacy
- dla pracy związanej z nadpisywaniem modelu/dostawcy preferować `before_model_resolve`
- dla modyfikowania promptów preferować `before_prompt_build`
- usuwać dopiero wtedy, gdy rzeczywiste użycie spadnie, a pokrycie testami fixture potwierdzi bezpieczeństwo migracji

### Sygnały zgodności

Po uruchomieniu `openclaw doctor` lub `openclaw plugins inspect <id>` możesz zobaczyć
jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                    |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfiguracja poprawnie się parsuje i pluginy są rozwiązywane |
| **compatibility advisory** | Plugin używa obsługiwanego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, który jest przestarzały   |
| **hard error**             | Konfiguracja jest nieprawidłowa lub nie udało się załadować pluginu |

Ani `hook-only`, ani `before_agent_start` nie spowodują dziś awarii Twojego pluginu --
`hook-only` ma charakter informacyjny, a `before_agent_start` wywołuje jedynie ostrzeżenie. Te
sygnały pojawiają się również w `openclaw status --all` i `openclaw plugins doctor`.

## Przegląd architektury

System pluginów OpenClaw ma cztery warstwy:

1. **Manifest + wykrywanie**
   OpenClaw znajduje kandydackie pluginy w skonfigurowanych ścieżkach, katalogach głównych workspace,
   globalnych katalogach rozszerzeń i bundled extensions. Wykrywanie najpierw odczytuje natywne
   manifesty `openclaw.plugin.json` oraz obsługiwane manifesty bundle.
2. **Włączanie + walidacja**
   Rdzeń decyduje, czy wykryty plugin jest włączony, wyłączony, zablokowany czy
   wybrany do ekskluzywnego slotu, takiego jak pamięć.
3. **Ładowanie środowiska uruchomieniowego**
   Natywne pluginy OpenClaw są ładowane w procesie przez jiti i rejestrują
   możliwości w centralnym rejestrze. Zgodne bundle są normalizowane do rekordów
   rejestru bez importowania kodu środowiska uruchomieniowego.
4. **Konsumpcja powierzchni**
   Pozostałe części OpenClaw odczytują rejestr, aby udostępnić narzędzia, kanały, konfigurację
   dostawców, hooki, trasy HTTP, komendy CLI i usługi.

W przypadku CLI pluginów wykrywanie komend głównych jest podzielone na dwa etapy:

- metadane w czasie parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- rzeczywisty moduł CLI pluginu może pozostać leniwy i rejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do pluginu pozostaje w pluginie, a OpenClaw nadal może
zarezerwować nazwy komend głównych przed parsowaniem.

Ważna granica projektowa:

- wykrywanie i walidacja konfiguracji powinny działać na podstawie **metadanych manifestu/schematu**
  bez wykonywania kodu pluginu
- natywne zachowanie środowiska uruchomieniowego pochodzi ze ścieżki `register(api)` modułu pluginu

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone pluginy i
budować podpowiedzi UI/schematu, zanim pełne środowisko uruchomieniowe stanie się aktywne.

### Pluginy kanałów i współdzielone narzędzie wiadomości

Pluginy kanałów nie muszą rejestrować osobnego narzędzia wysyłania/edycji/reakcji dla
standardowych działań czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w rdzeniu,
a pluginy kanałów odpowiadają za specyficzne dla kanału wykrywanie i wykonanie za nim.

Obecna granica wygląda tak:

- rdzeń odpowiada za host współdzielonego narzędzia `message`, powiązanie z promptami, prowadzenie sesji/wątków
  oraz dyspozycję wykonania
- pluginy kanałów odpowiadają za wykrywanie działań w danym zakresie, wykrywanie możliwości oraz wszelkie
  fragmenty schematu specyficzne dla kanału
- pluginy kanałów odpowiadają za gramatykę konwersacji sesji specyficzną dla dostawcy, na przykład
  za to, jak identyfikatory konwersacji kodują identyfikatory wątków lub dziedziczą po konwersacjach nadrzędnych
- pluginy kanałów wykonują końcowe działanie przez swój adapter działań

W przypadku pluginów kanałów powierzchnią SDK jest
`ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie wykrywania
pozwala pluginowi zwrócić widoczne działania, możliwości i wkłady do schematu
razem, aby te elementy się nie rozjeżdżały.

Rdzeń przekazuje zakres środowiska uruchomieniowego do tego kroku wykrywania. Ważne pola obejmują:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufany przychodzący `requesterSenderId`

Ma to znaczenie dla pluginów zależnych od kontekstu. Kanał może ukrywać lub udostępniać
działania wiadomości na podstawie aktywnego konta, bieżącego pokoju/wątku/wiadomości albo
zaufanej tożsamości żądającego, bez twardego kodowania gałęzi specyficznych dla kanału w
narzędziu rdzeniowym `message`.

Dlatego zmiany routingu embedded-runner nadal są pracą po stronie pluginów: runner
odpowiada za przekazywanie bieżącej tożsamości czatu/sesji do granicy wykrywania pluginu,
aby współdzielone narzędzie `message` udostępniało właściwą powierzchnię należącą do kanału
dla bieżącej tury.

W przypadku helperów wykonawczych należących do kanału bundled plugins powinny utrzymywać logikę wykonania
środowiska uruchomieniowego we własnych modułach rozszerzeń. Rdzeń nie odpowiada już za środowiska uruchomieniowe
działań wiadomości Discord, Slack, Telegram ani WhatsApp w `src/agents/tools`.
Nie publikujemy osobnych ścieżek `plugin-sdk/*-action-runtime`, a bundled
plugins powinny importować własny lokalny kod środowiska uruchomieniowego bezpośrednio ze swoich
modułów należących do rozszerzenia.

Ta sama granica obowiązuje ogólnie dla ścieżek SDK nazwanych od dostawcy: rdzeń nie powinien
importować wygodnych barreli specyficznych dla kanałów, takich jak Slack, Discord, Signal,
WhatsApp czy podobne rozszerzenia. Jeśli rdzeń potrzebuje jakiegoś zachowania, powinien albo
korzystać z własnego barrel `api.ts` / `runtime-api.ts` bundled pluginu, albo podnieść tę potrzebę
do wąskiej, generycznej możliwości we współdzielonym SDK.

W przypadku ankiet istnieją konkretnie dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów pasujących do wspólnego
  modelu ankiet
- `actions.handleAction("poll")` to preferowana ścieżka dla semantyki ankiet specyficznej dla kanału
  lub dodatkowych parametrów ankiety

Rdzeń odkłada teraz współdzielone parsowanie ankiet do czasu, aż dyspozycja ankiety pluginu odrzuci
działanie, dzięki czemu obsługujące ankiety handlery należące do pluginu mogą akceptować pola ankiet
specyficzne dla kanału bez wcześniejszego blokowania przez generyczny parser ankiet.

Pełną sekwencję uruchamiania znajdziesz w sekcji [Potok ładowania](#load-pipeline).

## Model własności możliwości

OpenClaw traktuje natywny plugin jako granicę własności dla **firmy** albo
**funkcji**, a nie jako zbiór niepowiązanych integracji.

Oznacza to, że:

- plugin firmy powinien zwykle posiadać wszystkie powierzchnie OpenClaw skierowane do tej firmy
- plugin funkcji powinien zwykle posiadać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny korzystać ze współdzielonych możliwości rdzenia zamiast doraźnie ponownie implementować zachowanie dostawców

Przykłady:

- bundled plugin `openai` posiada zachowanie dostawcy modeli OpenAI oraz zachowanie OpenAI dla
  mowy + głosu w czasie rzeczywistym + rozumienia multimediów + generowania obrazów
- bundled plugin `elevenlabs` posiada zachowanie mowy ElevenLabs
- bundled plugin `microsoft` posiada zachowanie mowy Microsoft
- bundled plugin `google` posiada zachowanie dostawcy modeli Google oraz zachowanie Google dla
  rozumienia multimediów + generowania obrazów + wyszukiwania w sieci
- bundled plugin `firecrawl` posiada zachowanie pobierania z sieci Firecrawl
- bundled pluginy `minimax`, `mistral`, `moonshot` i `zai` posiadają swoje
  backendy rozumienia multimediów
- bundled plugin `qwen` posiada zachowanie dostawcy tekstu Qwen oraz
  rozumienie multimediów i generowanie wideo
- plugin `voice-call` jest pluginem funkcji: posiada transport połączeń, narzędzia,
  CLI, trasy i mostkowanie strumienia mediów Twilio, ale korzysta ze współdzielonych możliwości mowy
  oraz transkrypcji i głosu w czasie rzeczywistym zamiast bezpośrednio importować pluginy dostawców

Zamierzony stan docelowy jest następujący:

- OpenAI znajduje się w jednym pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i
  przyszłe wideo
- inny dostawca może zrobić to samo dla własnego obszaru powierzchni
- kanały nie interesują się tym, który plugin dostawcy jest właścicielem danego dostawcy; korzystają ze
  współdzielonego kontraktu możliwości udostępnianego przez rdzeń

To jest kluczowe rozróżnienie:

- **plugin** = granica własności
- **capability** = kontrakt rdzenia, który wiele pluginów może implementować lub wykorzystywać

Jeśli więc OpenClaw doda nową domenę, taką jak wideo, pierwsze pytanie nie brzmi
„który dostawca powinien mieć na sztywno zakodowaną obsługę wideo?”. Pierwsze pytanie brzmi:
„jaki jest kontrakt możliwości wideo w rdzeniu?”. Gdy taki kontrakt już istnieje, pluginy dostawców
mogą się względem niego rejestrować, a pluginy kanałów/funkcji mogą z niego korzystać.

Jeśli dana możliwość jeszcze nie istnieje, właściwym ruchem jest zwykle:

1. zdefiniowanie brakującej możliwości w rdzeniu
2. udostępnienie jej przez API/runtime pluginów w sposób typowany
3. podłączenie kanałów/funkcji do tej możliwości
4. umożliwienie pluginom dostawców rejestracji implementacji

To utrzymuje jawną własność, jednocześnie unikając zachowania rdzenia zależnego od
jednego dostawcy lub jednorazowej ścieżki kodu specyficznej dla pluginu.

### Warstwowanie możliwości

Używaj tego modelu myślowego przy decydowaniu, gdzie powinien znaleźć się kod:

- **warstwa możliwości rdzenia**: współdzielona orkiestracja, polityka, fallback, zasady
  scalania konfiguracji, semantyka dostarczania i typowane kontrakty
- **warstwa pluginu dostawcy**: API specyficzne dla dostawcy, uwierzytelnianie, katalogi modeli, synteza mowy,
  generowanie obrazów, przyszłe backendy wideo, endpointy użycia
- **warstwa pluginu kanału/funkcji**: integracja ze Slack/Discord/voice-call itd.,
  która wykorzystuje możliwości rdzenia i udostępnia je na swojej powierzchni

Na przykład TTS ma następującą strukturę:

- rdzeń odpowiada za politykę TTS w czasie odpowiedzi, kolejność fallbacku, preferencje i dostarczanie przez kanały
- `openai`, `elevenlabs` i `microsoft` odpowiadają za implementacje syntezy
- `voice-call` wykorzystuje helper środowiska uruchomieniowego TTS dla telefonii

Ten sam wzorzec należy preferować dla przyszłych możliwości.

### Przykład pluginu firmy z wieloma możliwościami

Plugin firmy powinien sprawiać wrażenie spójnego z zewnątrz. Jeśli OpenClaw ma współdzielone
kontrakty dla modeli, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia
multimediów, generowania obrazów, generowania wideo, pobierania z sieci i wyszukiwania w sieci,
dostawca może posiadać wszystkie swoje powierzchnie w jednym miejscu:

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

Znaczenie mają nie tyle dokładne nazwy helperów. Liczy się struktura:

- jeden plugin jest właścicielem powierzchni dostawcy
- rdzeń nadal jest właścicielem kontraktów możliwości
- kanały i pluginy funkcji korzystają z helperów `api.runtime.*`, a nie z kodu dostawcy
- testy kontraktowe mogą sprawdzać, że plugin zarejestrował możliwości, których własność
  deklaruje

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazów/audio/wideo jako jedną współdzieloną
możliwość. Ten sam model własności obowiązuje również tutaj:

1. rdzeń definiuje kontrakt media-understanding
2. pluginy dostawców rejestrują odpowiednio `describeImage`, `transcribeAudio` oraz
   `describeVideo`
3. kanały i pluginy funkcji korzystają ze współdzielonego zachowania rdzenia zamiast
   łączyć się bezpośrednio z kodem dostawcy

Pozwala to uniknąć zaszywania założeń jednego dostawcy dotyczących wideo w rdzeniu. Plugin jest właścicielem
powierzchni dostawcy; rdzeń jest właścicielem kontraktu możliwości i zachowania fallbacku.

Generowanie wideo już używa tej samej sekwencji: rdzeń jest właścicielem typowanego
kontraktu możliwości i helpera środowiska uruchomieniowego, a pluginy dostawców rejestrują
implementacje `api.registerVideoGenerationProvider(...)` względem niego.

Potrzebujesz konkretnej listy wdrożeniowej? Zobacz
[Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API pluginów jest celowo typowana i scentralizowana w
`OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji oraz
helpery środowiska uruchomieniowego, na których plugin może polegać.

Dlaczego to ma znaczenie:

- autorzy pluginów otrzymują jeden stabilny standard wewnętrzny
- rdzeń może odrzucać duplikaty własności, takie jak dwa pluginy rejestrujące ten sam
  identyfikator dostawcy
- podczas uruchamiania można pokazać użyteczne diagnostyki dla nieprawidłowej rejestracji
- testy kontraktowe mogą wymuszać własność bundled-pluginów i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

1. **egzekwowanie rejestracji w czasie wykonywania**
   Rejestr pluginów waliduje rejestracje podczas ładowania pluginów. Przykłady:
   zduplikowane identyfikatory dostawców, zduplikowane identyfikatory dostawców mowy i nieprawidłowe
   rejestracje powodują diagnostyki pluginów zamiast niezdefiniowanego zachowania.
2. **testy kontraktowe**
   Bundled plugins są przechwytywane w rejestrach kontraktowych podczas uruchomień testów, aby
   OpenClaw mógł jednoznacznie sprawdzać własność. Obecnie jest to używane dla
   dostawców modeli, dostawców mowy, dostawców wyszukiwania w sieci oraz własności
   rejestracji bundled pluginów.

Praktyczny efekt jest taki, że OpenClaw z góry wie, który plugin jest właścicielem której
powierzchni. Dzięki temu rdzeń i kanały mogą składać się bezproblemowo, ponieważ własność jest
zadeklarowana, typowana i testowalna, a nie domyślna.

### Co powinno należeć do kontraktu

Dobre kontrakty pluginów są:

- typowane
- małe
- specyficzne dla możliwości
- należące do rdzenia
- wielokrotnego użytku przez wiele pluginów
- możliwe do wykorzystania przez kanały/funkcje bez wiedzy o dostawcy

Złe kontrakty pluginów to:

- polityka specyficzna dla dostawcy ukryta w rdzeniu
- jednorazowe furtki dla pluginów omijające rejestr
- kod kanału sięgający bezpośrednio do implementacji dostawcy
- doraźne obiekty runtime, które nie są częścią `OpenClawPluginApi` ani
  `api.runtime`

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj możliwość, a potem
pozwól pluginom się do niej podłączać.

## Model wykonania

Natywne pluginy OpenClaw działają **w procesie** razem z Gateway. Nie są
izolowane. Załadowany natywny plugin ma tę samą granicę zaufania na poziomie procesu co
kod rdzenia.

Konsekwencje:

- natywny plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi
- błąd natywnego pluginu może spowodować awarię lub destabilizację gateway
- złośliwy natywny plugin jest równoważny dowolnemu wykonaniu kodu wewnątrz
  procesu OpenClaw

Zgodne bundle są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je
jako pakiety metadanych/treści. W obecnych wydaniach oznacza to głównie bundled
Skills.

Dla pluginów, które nie są bundled, używaj list dozwolonych i jawnych ścieżek instalacji/ładowania. Traktuj
pluginy workspace jako kod czasu programowania, a nie domyślne ustawienie produkcyjne.

W przypadku nazw pakietów bundled workspace utrzymuj identyfikator pluginu zakotwiczony w nazwie npm:
domyślnie `@openclaw/<id>` albo zatwierdzony typowany sufiks, taki jak
`-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy
pakiet celowo udostępnia węższą rolę pluginu.

Ważna uwaga dotycząca zaufania:

- `plugins.allow` ufa **identyfikatorom pluginów**, a nie pochodzeniu źródła.
- Plugin workspace o tym samym identyfikatorze co bundled plugin celowo zasłania
  bundled copy, gdy ten plugin workspace jest włączony/znajduje się na liście dozwolonych.
- To normalne i przydatne przy lokalnym programowaniu, testowaniu poprawek i hotfixach.

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodne szczegóły implementacyjne.

Pozostaw publiczną rejestrację możliwości. Ogranicz eksport helperów niebędących częścią kontraktu:

- ścieżki helperów specyficznych dla bundled pluginów
- ścieżki logiki runtime, które nie są przeznaczone jako publiczne API
- helpery wygody specyficzne dla dostawcy
- helpery konfiguracji/onboardingu będące szczegółami implementacyjnymi

Niektóre ścieżki helperów bundled pluginów nadal pozostają w wygenerowanej mapie eksportów SDK
ze względu na zgodność i utrzymanie bundled pluginów. Obecne przykłady to
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz kilka ścieżek `plugin-sdk/matrix*`. Traktuj je jako
zastrzeżone eksporty szczegółów implementacyjnych, a nie jako zalecany wzorzec SDK dla
nowych pluginów zewnętrznych.

## Potok ładowania

Podczas uruchamiania OpenClaw w przybliżeniu wykonuje następujące kroki:

1. wykrywa katalogi główne kandydackich pluginów
2. odczytuje natywne manifesty lub manifesty zgodnych bundle oraz metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. podejmuje decyzję o włączeniu dla każdego kandydata
6. ładuje włączone moduły natywne przez jiti
7. wywołuje natywne hooki `register(api)` (lub `activate(api)` — alias legacy) i zbiera rejestracje do rejestru pluginów
8. udostępnia rejestr powierzchniom komend/runtime

<Note>
`activate` to alias legacy dla `register` — loader rozwiązuje ten, który jest obecny (`def.register ?? def.activate`) i wywołuje go w tym samym miejscu. Wszystkie bundled plugins używają `register`; dla nowych pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem kodu runtime. Kandydaci są blokowani,
gdy entry wychodzi poza katalog główny pluginu, ścieżka ma prawa world-writable albo
własność ścieżki wygląda podejrzanie w przypadku pluginów, które nie są bundled.

### Zachowanie manifest-first

Manifest jest źródłem prawdy dla warstwy control plane. OpenClaw używa go do:

- identyfikacji pluginu
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości bundle
- walidacji `plugins.entries.<id>.config`
- wzbogacania etykiet i placeholderów w Control UI
- pokazywania metadanych instalacji/katalogu
- zachowywania lekkich deskryptorów aktywacji i konfiguracji bez ładowania runtime pluginu

W przypadku natywnych pluginów moduł runtime jest częścią data plane. Rejestruje
rzeczywiste zachowania, takie jak hooki, narzędzia, komendy czy przepływy dostawców.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w control plane.
Są to deskryptory wyłącznie metadanych do planowania aktywacji i wykrywania konfiguracji;
nie zastępują rejestracji runtime, `register(...)` ani `setupEntry`.

### Co loader przechowuje w pamięci podręcznej

OpenClaw utrzymuje krótkotrwałe pamięci podręczne w procesie dla:

- wyników wykrywania
- danych rejestru manifestów
- załadowanych rejestrów pluginów

Te pamięci podręczne ograniczają skokowe obciążenie przy starcie i narzut powtarzanych komend. Można je bezpiecznie
traktować jako krótkotrwałe cache wydajnościowe, a nie trwałe przechowywanie.

Uwaga dotycząca wydajności:

- Ustaw `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` albo
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, aby wyłączyć te pamięci podręczne.
- Dostosuj okna cache za pomocą `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` i
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model rejestru

Załadowane pluginy nie mutują bezpośrednio przypadkowych globali rdzenia. Rejestrują się w
centralnym rejestrze pluginów.

Rejestr śledzi:

- rekordy pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- legacy hooks i typowane hooki
- kanały
- dostawców
- handlery Gateway RPC
- trasy HTTP
- rejestratory CLI
- usługi działające w tle
- komendy należące do pluginów

Funkcje rdzenia odczytują następnie dane z tego rejestru zamiast komunikować się z modułami pluginów
bezpośrednio. Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- runtime rdzenia -> konsumpcja rejestru

To rozdzielenie ma znaczenie dla utrzymania. Oznacza, że większość powierzchni rdzenia potrzebuje tylko
jednego punktu integracji: „odczytaj rejestr”, a nie „obsłuż specjalnie każdy moduł
pluginu”.

## Callbacki wiązania konwersacji

Pluginy, które wiążą konwersację, mogą reagować po rozstrzygnięciu zatwierdzenia.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu
lub odrzuceniu żądania powiązania:

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
konwersację, i działa po zakończeniu obsługi zatwierdzenia przez rdzeń.

## Hooki środowiska uruchomieniowego dostawcy

Pluginy dostawców mają teraz dwie warstwy:

- metadane manifestu: `providerAuthEnvVars` do taniego wyszukiwania uwierzytelniania dostawcy z env
  przed załadowaniem runtime, `providerAuthAliases` dla wariantów dostawcy współdzielących
  uwierzytelnianie, `channelEnvVars` do taniego wyszukiwania uwierzytelniania/konfiguracji kanału z env przed
  załadowaniem runtime, a także `providerAuthChoices` do tanich etykiet onboardingu/wyboru uwierzytelniania i
  metadanych flag CLI przed załadowaniem runtime
- hooki czasu konfiguracji: `catalog` / legacy `discovery` oraz `applyConfigDefaults`
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
politykę narzędzi. Te hooki stanowią powierzchnię rozszerzeń dla zachowań specyficznych dla dostawców bez
potrzeby tworzenia całego niestandardowego transportu wnioskowania.

Używaj manifestu `providerAuthEnvVars`, gdy dostawca ma poświadczenia oparte na env,
które generyczne ścieżki uwierzytelniania/statusu/wyboru modelu powinny widzieć bez ładowania runtime pluginu.
Używaj manifestu `providerAuthAliases`, gdy jeden identyfikator dostawcy ma ponownie wykorzystywać
zmienne env, profile uwierzytelniania, uwierzytelnianie oparte na konfiguracji oraz wybór onboardingowy klucza API
innego identyfikatora dostawcy. Używaj manifestu `providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru uwierzytelniania
powinny znać identyfikator wyboru dostawcy, etykiety grup i proste
powiązanie uwierzytelniania z jedną flagą bez ładowania runtime dostawcy. Pozostaw runtime dostawcy
`envVars` dla wskazówek widocznych dla operatora, takich jak etykiety onboardingu lub zmienne konfiguracji
client-id/client-secret OAuth.

Używaj manifestu `channelEnvVars`, gdy kanał ma uwierzytelnianie lub konfigurację sterowane przez env, które
generyczny fallback do env powłoki, sprawdzenia konfiguracji/statusu lub prompty konfiguracji powinny widzieć
bez ładowania runtime kanału.

### Kolejność hooków i sposób użycia

W przypadku pluginów modeli/dostawców OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” jest krótkim przewodnikiem decyzyjnym.

| #   | Hook                              | Co robi                                                                                                        | Kiedy używać                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                       | Dostawca posiada katalog lub domyślne wartości `base URL`                                                                                  |
| 2   | `applyConfigDefaults`             | Stosuje globalne domyślne ustawienia konfiguracji należące do dostawcy podczas materializacji konfiguracji    | Wartości domyślne zależą od trybu uwierzytelniania, env lub semantyki rodziny modeli dostawcy                                             |
| --  | _(built-in model lookup)_         | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                    | _(to nie jest hook pluginu)_                                                                                                               |
| 3   | `normalizeModelId`                | Normalizuje aliasy legacy lub preview identyfikatorów modeli przed wyszukaniem                                | Dostawca odpowiada za porządkowanie aliasów przed rozstrzygnięciem kanonicznego modelu                                                    |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny dostawcy przed generycznym złożeniem modelu                             | Dostawca odpowiada za porządkowanie transportu dla niestandardowych identyfikatorów dostawców w tej samej rodzinie transportu             |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozstrzygnięciem runtime/dostawcy                                   | Dostawca potrzebuje porządkowania konfiguracji, które powinno znajdować się przy pluginie; bundled helpery rodziny Google dodatkowo wspierają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje przepisywanie zgodności natywnego użycia streamingu do dostawców konfiguracji                         | Dostawca potrzebuje poprawek metadanych natywnego użycia streamingu zależnych od endpointu                                               |
| 7   | `resolveConfigApiKey`             | Rozstrzyga uwierzytelnianie env-marker dla dostawców konfiguracji przed załadowaniem uwierzytelniania runtime | Dostawca ma należące do niego rozstrzyganie klucza API opartego na env-marker; `amazon-bedrock` ma tu również wbudowany resolver env-marker AWS |
| 8   | `resolveSyntheticAuth`            | Udostępnia lokalne/self-hosted lub oparte na konfiguracji uwierzytelnianie bez utrwalania jawnego tekstu     | Dostawca może działać z syntetycznym/lokalnym markerem poświadczeń                                                                         |
| 9   | `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile uwierzytelniania należące do dostawcy; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie wykorzystuje zewnętrzne poświadczenia uwierzytelniania bez utrwalania skopiowanych tokenów odświeżania                 |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet przechowywanych syntetycznych placeholderów profili względem uwierzytelniania opartego na env/konfiguracji | Dostawca przechowuje syntetyczne placeholdery profili, które nie powinny mieć pierwszeństwa                                              |
| 11  | `resolveDynamicModel`             | Synchroniczny fallback dla identyfikatorów modeli należących do dostawcy, których jeszcze nie ma w lokalnym rejestrze | Dostawca akceptuje dowolne identyfikatory modeli z upstream                                                                                |
| 12  | `prepareDynamicModel`             | Asynchroniczne rozgrzanie, po którym `resolveDynamicModel` uruchamia się ponownie                             | Dostawca potrzebuje metadanych sieciowych przed rozstrzygnięciem nieznanych identyfikatorów                                               |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozstrzygniętego modelu przez embedded runner                               | Dostawca potrzebuje przepisań transportu, ale nadal używa transportu rdzenia                                                              |
| 14  | `contributeResolvedModelCompat`   | Dodaje flagi zgodności dla modeli dostawcy działających za innym zgodnym transportem                          | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania roli dostawcy                                                    |
| 15  | `capabilities`                    | Metadane transkryptu/narzędzi należące do dostawcy, używane przez współdzieloną logikę rdzenia               | Dostawca potrzebuje niuansów specyficznych dla transkryptu/rodziny dostawcy                                                               |
| 16  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je embedded runner                                               | Dostawca potrzebuje porządkowania schematów specyficznego dla rodziny transportu                                                          |
| 17  | `inspectToolSchemas`              | Udostępnia diagnostykę schematów należącą do dostawcy po normalizacji                                         | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia rdzenia reguł specyficznych dla dostawcy                                        |
| 18  | `resolveReasoningOutputMode`      | Wybiera natywny kontrakt wyjścia reasoning albo kontrakt oznaczony tagami                                     | Dostawca potrzebuje oznaczonego reasoning/final output zamiast natywnych pól                                                              |
| 19  | `prepareExtraParams`              | Normalizacja parametrów żądania przed generycznymi wrapperami opcji streamingu                                | Dostawca potrzebuje domyślnych parametrów żądania lub porządkowania parametrów specyficznego dla dostawcy                                |
| 20  | `createStreamFn`                  | Całkowicie zastępuje normalną ścieżkę streamingu niestandardowym transportem                                  | Dostawca potrzebuje niestandardowego protokołu połączenia, a nie tylko wrappera                                                           |
| 21  | `wrapStreamFn`                    | Wrapper streamingu po zastosowaniu generycznych wrapperów                                                     | Dostawca potrzebuje wrapperów zgodności nagłówków/treści/modeli żądania bez niestandardowego transportu                                  |
| 22  | `resolveTransportTurnState`       | Dołącza natywne nagłówki transportu lub metadane na turę                                                      | Dostawca chce, aby generyczne transporty wysyłały natywną tożsamość tury dostawcy                                                        |
| 23  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę schładzania sesji                                             | Dostawca chce, aby generyczne transporty WS dostrajały nagłówki sesji lub politykę fallbacku                                             |
| 24  | `formatApiKey`                    | Formatter profilu uwierzytelniania: zapisany profil staje się ciągiem `apiKey` w runtime                     | Dostawca przechowuje dodatkowe metadane uwierzytelniania i potrzebuje niestandardowego kształtu tokenu runtime                          |
| 25  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania lub polityki błędu odświeżania      | Dostawca nie pasuje do współdzielonych mechanizmów odświeżania `pi-ai`                                                                    |
| 26  | `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana, gdy odświeżenie OAuth się nie powiedzie                                        | Dostawca potrzebuje własnych wskazówek naprawy uwierzytelniania po nieudanym odświeżeniu                                                 |
| 27  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstu należący do dostawcy                                                     | Dostawca ma surowe błędy przepełnienia, których generyczne heurystyki nie wykryją                                                        |
| 28  | `classifyFailoverReason`          | Klasyfikacja przyczyny failover należąca do dostawcy                                                          | Dostawca potrafi mapować surowe błędy API/transportu na rate-limit, overload itp.                                                        |
| 29  | `isCacheTtlEligible`              | Polityka prompt-cache dla dostawców proxy/backhaul                                                            | Dostawca potrzebuje bramkowania TTL cache specyficznego dla proxy                                                                         |
| 30  | `buildMissingAuthMessage`         | Zamiennik generycznego komunikatu odzyskiwania po brakującym uwierzytelnianiu                                | Dostawca potrzebuje własnej wskazówki odzyskiwania po brakującym uwierzytelnianiu                                                        |
| 31  | `suppressBuiltInModel`            | Ukrywanie nieaktualnych modeli z upstream plus opcjonalna wskazówka błędu dla użytkownika                    | Dostawca musi ukryć nieaktualne wiersze z upstream lub zastąpić je wskazówką dostawcy                                                    |
| 32  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dodawane po wykryciu                                                     | Dostawca potrzebuje syntetycznych wierszy zgodności do przodu w `models list` i selektorach                                              |
| 33  | `isBinaryThinking`                | Przełącznik reasoning w trybie włącz/wyłącz dla dostawców binary-thinking                                     | Dostawca udostępnia tylko binarne włączanie/wyłączanie thinking                                                                           |
| 34  | `supportsXHighThinking`           | Obsługa reasoning `xhigh` dla wybranych modeli                                                                | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                          |
| 35  | `resolveDefaultThinkingLevel`     | Domyślny poziom `/think` dla określonej rodziny modeli                                                        | Dostawca odpowiada za domyślną politykę `/think` dla rodziny modeli                                                                       |
| 36  | `isModernModelRef`                | Matcher nowoczesnych modeli dla filtrów live profile i wyboru smoke                                           | Dostawca odpowiada za dopasowywanie preferowanych modeli live/smoke                                                                       |
| 37  | `prepareRuntimeAuth`              | Zamienia skonfigurowane poświadczenie na rzeczywisty token/klucz runtime tuż przed wnioskowaniem             | Dostawca potrzebuje wymiany tokenu lub krótkotrwałego poświadczenia żądania                                                               |
| 38  | `resolveUsageAuth`                | Rozstrzyga poświadczenia użycia/rozliczeń dla `/usage` i powiązanych powierzchni statusu                      | Dostawca potrzebuje niestandardowego parsowania tokenu użycia/limitu lub innego poświadczenia użycia                                      |
| 39  | `fetchUsageSnapshot`              | Pobiera i normalizuje snapshoty użycia/limitu specyficzne dla dostawcy po rozstrzygnięciu uwierzytelniania   | Dostawca potrzebuje endpointu użycia specyficznego dla dostawcy lub parsera ładunku                                                       |
| 40  | `createEmbeddingProvider`         | Tworzy adapter embeddingów należący do dostawcy dla pamięci/wyszukiwania                                       | Zachowanie embeddingów pamięci należy do pluginu dostawcy                                                                                  |
| 41  | `buildReplayPolicy`               | Zwraca politykę replay kontrolującą obsługę transkryptu dla dostawcy                                           | Dostawca potrzebuje własnej polityki transkryptu (na przykład usuwania bloków thinking)                                                   |
| 42  | `sanitizeReplayHistory`           | Przepisuje historię replay po generycznym oczyszczeniu transkryptu                                             | Dostawca potrzebuje przepisań replay specyficznych dla dostawcy wykraczających poza współdzielone helpery kompaktowania                  |
| 43  | `validateReplayTurns`             | Końcowa walidacja lub przekształcenie tur replay przed embedded runnerem                                       | Transport dostawcy potrzebuje bardziej rygorystycznej walidacji tur po generycznej sanitizacji                                            |
| 44  | `onModelSelected`                 | Uruchamia skutki uboczne po wyborze modelu należące do dostawcy                                                | Dostawca potrzebuje telemetrii lub stanu należącego do dostawcy, gdy model staje się aktywny                                             |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany plugin dostawcy, a następnie przechodzą przez inne pluginy dostawców obsługujące hooki,
dopóki któryś faktycznie nie zmieni identyfikatora modelu albo transportu/konfiguracji. Dzięki temu
shimy aliasów/dostawców zgodności nadal działają bez wymagania od wywołującego wiedzy,
który bundled plugin jest właścicielem danego przepisania. Jeśli żaden hook dostawcy nie przepisze
obsługiwanego wpisu konfiguracji z rodziny Google, bundled normalizer konfiguracji Google nadal zastosuje
to czyszczenie zgodności.

Jeśli dostawca potrzebuje całkowicie niestandardowego protokołu połączenia lub własnego wykonawcy żądań,
to jest inna klasa rozszerzenia. Te hooki są przeznaczone dla zachowania dostawcy, które nadal
działa w normalnej pętli wnioskowania OpenClaw.

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
  i `wrapStreamFn`, ponieważ odpowiada za zgodność do przodu Claude 4.6,
  wskazówki rodziny dostawcy, wskazówki naprawy uwierzytelniania, integrację z
  endpointem użycia, kwalifikację prompt-cache, domyślne ustawienia konfiguracji uwzględniające uwierzytelnianie,
  domyślną/adaptacyjną politykę thinking dla Claude oraz kształtowanie streamingu specyficzne dla Anthropic dla
  nagłówków beta, `/fast` / `serviceTier` i `context1m`.
- Helpery streamingu specyficzne dla Claude w Anthropic pozostają na razie we własnej
  publicznej granicy `api.ts` / `contract-api.ts` bundled pluginu. Ta powierzchnia pakietu
  eksportuje `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz pomocnicze buildery wrapperów
  Anthropic niższego poziomu zamiast rozszerzać generyczne SDK o reguły nagłówków beta jednego
  dostawcy.
- OpenAI używa `resolveDynamicModel`, `normalizeResolvedModel` i
  `capabilities`, a także `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` i `isModernModelRef`,
  ponieważ odpowiada za zgodność do przodu GPT-5.4, bezpośrednią normalizację OpenAI
  `openai-completions` -> `openai-responses`, wskazówki uwierzytelniania uwzględniające Codex,
  ukrywanie Spark, syntetyczne wiersze list OpenAI oraz politykę thinking /
  modeli live dla GPT-5; rodzina streamingu `openai-responses-defaults` odpowiada za
  współdzielone natywne wrappery OpenAI Responses dla nagłówków atrybucji,
  `/fast`/`serviceTier`, szczegółowości tekstu, natywnego wyszukiwania w sieci Codex,
  kształtowania ładunku reasoning-compat i zarządzania kontekstem Responses.
- OpenRouter używa `catalog`, a także `resolveDynamicModel` i
  `prepareDynamicModel`, ponieważ dostawca jest pass-through i może udostępniać nowe
  identyfikatory modeli zanim statyczny katalog OpenClaw zostanie zaktualizowany; używa też
  `capabilities`, `wrapStreamFn` i `isCacheTtlEligible`, aby trzymać
  nagłówki żądań, metadane routingu, poprawki reasoning i politykę prompt-cache specyficzne dla dostawcy poza rdzeniem. Jego polityka replay pochodzi z
  rodziny `passthrough-gemini`, a rodzina streamingu `openrouter-thinking`
  odpowiada za wstrzykiwanie reasoning przez proxy oraz pomijanie nieobsługiwanych modeli i `auto`.
- GitHub Copilot używa `catalog`, `auth`, `resolveDynamicModel` i
  `capabilities`, a także `prepareRuntimeAuth` i `fetchUsageSnapshot`,
  ponieważ potrzebuje należącego do dostawcy logowania urządzenia, zachowania fallbacku modeli, niuansów transkryptu Claude,
  wymiany tokena GitHub -> token Copilot oraz należącego do dostawcy endpointu użycia.
- OpenAI Codex używa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` i `augmentModelCatalog`, a także
  `prepareExtraParams`, `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ
  nadal działa na transportach rdzenia OpenAI, ale odpowiada za normalizację
  transportu/base URL, politykę fallbacku odświeżania OAuth, domyślny wybór transportu,
  syntetyczne wiersze katalogu Codex oraz integrację z endpointem użycia ChatGPT; współdzieli
  tę samą rodzinę streamingu `openai-responses-defaults` co bezpośrednie OpenAI.
- Google AI Studio i Gemini CLI OAuth używają `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` i `isModernModelRef`, ponieważ rodzina replay
  `google-gemini` odpowiada za fallback zgodności do przodu Gemini 3.1,
  natywną walidację replay Gemini, sanitizację bootstrap replay,
  tryb wyjścia reasoning oznaczony tagami oraz dopasowywanie nowoczesnych modeli, podczas gdy
  rodzina streamingu `google-thinking` odpowiada za normalizację ładunku thinking Gemini;
  Gemini CLI OAuth używa również `formatApiKey`, `resolveUsageAuth` i
  `fetchUsageSnapshot` do formatowania tokenów, parsowania tokenów i
  podłączenia endpointu limitu.
- Anthropic Vertex używa `buildReplayPolicy` poprzez
  rodzinę replay `anthropic-by-model`, aby czyszczenie replay specyficzne dla Claude pozostało
  ograniczone do identyfikatorów Claude zamiast obejmować każdy transport `anthropic-messages`.
- Amazon Bedrock używa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` i `resolveDefaultThinkingLevel`, ponieważ odpowiada za
  klasyfikację błędów throttle/not-ready/context-overflow specyficzną dla Bedrock
  dla ruchu Anthropic-on-Bedrock; jego polityka replay nadal współdzieli tę samą
  ochronę `anthropic-by-model` tylko dla Claude.
- OpenRouter, Kilocode, Opencode i Opencode Go używają `buildReplayPolicy`
  poprzez rodzinę replay `passthrough-gemini`, ponieważ proxy’ują modele Gemini
  przez transporty zgodne z OpenAI i potrzebują sanitizacji
  thought-signature Gemini bez natywnej walidacji replay Gemini ani
  przepisań bootstrap.
- MiniMax używa `buildReplayPolicy` poprzez
  rodzinę replay `hybrid-anthropic-openai`, ponieważ jeden dostawca obsługuje zarówno
  semantykę wiadomości Anthropic, jak i zgodną z OpenAI; zachowuje usuwanie bloków
  thinking tylko dla Claude po stronie Anthropic, jednocześnie nadpisując tryb wyjścia
  reasoning z powrotem na natywny, a rodzina streamingu `minimax-fast-mode` odpowiada za
  przepisywanie modeli fast-mode na współdzielonej ścieżce streamingu.
- Moonshot używa `catalog` oraz `wrapStreamFn`, ponieważ nadal korzysta ze współdzielonego
  transportu OpenAI, ale potrzebuje normalizacji ładunku thinking należącej do dostawcy; rodzina streamingu
  `moonshot-thinking` mapuje konfigurację i stan `/think` na natywny binarny ładunek thinking.
- Kilocode używa `catalog`, `capabilities`, `wrapStreamFn` i
  `isCacheTtlEligible`, ponieważ potrzebuje nagłówków żądań należących do dostawcy,
  normalizacji ładunku reasoning, wskazówek dla transkryptu Gemini oraz bramkowania
  cache-TTL Anthropic; rodzina streamingu `kilocode-thinking` utrzymuje wstrzykiwanie Kilo thinking
  na współdzielonej ścieżce streamingu proxy, jednocześnie pomijając `kilo/auto` i
  inne identyfikatory modeli proxy, które nie obsługują jawnych ładunków reasoning.
- Z.AI używa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ odpowiada za fallback GLM-5,
  domyślne `tool_stream`, binarne UX thinking, dopasowywanie nowoczesnych modeli oraz zarówno
  uwierzytelnianie użycia, jak i pobieranie limitu; rodzina streamingu `tool-stream-default-on` utrzymuje
  wrapper `tool_stream` domyślnie włączony poza ręcznie pisanym klejem dla poszczególnych dostawców.
- xAI używa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` i `isModernModelRef`,
  ponieważ odpowiada za normalizację natywnego transportu xAI Responses, przepisywanie aliasów
  Grok fast-mode, domyślne `tool_stream`, czyszczenie strict-tool / ładunku reasoning,
  ponowne użycie fallbackowego uwierzytelniania dla narzędzi należących do pluginu, rozstrzyganie modeli Grok
  zgodne do przodu oraz poprawki zgodności należące do dostawcy, takie jak profil schematu narzędzi xAI,
  nieobsługiwane słowa kluczowe schematu, natywne `web_search` i dekodowanie argumentów wywołań narzędzi z encjami HTML.
- Mistral, OpenCode Zen i OpenCode Go używają tylko `capabilities`, aby utrzymać
  niuanse transkryptu/narzędzi poza rdzeniem.
- Bundled dostawcy wyłącznie katalogowi, tacy jak `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` i `volcengine`, używają
  tylko `catalog`.
- Qwen używa `catalog` dla swojego dostawcy tekstowego oraz współdzielonych rejestracji
  media-understanding i video-generation dla swoich powierzchni multimodalnych.
- MiniMax i Xiaomi używają `catalog` oraz hooków użycia, ponieważ ich zachowanie `/usage`
  należy do pluginu, mimo że samo wnioskowanie nadal działa przez współdzielone transporty.

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

- `textToSpeech` zwraca standardowy ładunek wyjściowy TTS rdzenia dla powierzchni plików/notatek głosowych.
- Używa konfiguracji rdzenia `messages.tts` i wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą przeprowadzać resampling/kodowanie dla dostawców.
- `listVoices` jest opcjonalne dla każdego dostawcy. Używaj go dla selektorów głosów lub przepływów konfiguracji należących do dostawcy.
- Listy głosów mogą zawierać bogatsze metadane, takie jak ustawienia regionalne, płeć i tagi osobowości dla selektorów świadomych dostawcy.
- OpenAI i ElevenLabs obsługują dziś telefonię. Microsoft nie.

Pluginy mogą też rejestrować dostawców mowy przez `api.registerSpeechProvider(...)`.

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

- Utrzymuj politykę TTS, fallback i dostarczanie odpowiedzi w rdzeniu.
- Używaj dostawców mowy do zachowania syntezy należącego do dostawcy.
- Legacy input Microsoft `edge` jest normalizowany do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden plugin dostawcy może posiadać
  tekst, mowę, obrazy i przyszłych dostawców mediów wraz z dodawaniem przez OpenClaw odpowiednich
  kontraktów możliwości.

W przypadku rozumienia obrazów/audio/wideo pluginy rejestrują jednego typowanego
dostawcę media-understanding zamiast generycznego worka klucz/wartość:

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

- Zachowaj orkiestrację, fallback, konfigurację i powiązanie z kanałami w rdzeniu.
- Zachowaj zachowanie dostawcy w pluginie dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyniku, nowe opcjonalne możliwości.
- Generowanie wideo już postępuje według tego samego wzorca:
  - rdzeń jest właścicielem kontraktu możliwości i helpera runtime
  - pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - pluginy funkcji/kanałów korzystają z `api.runtime.videoGeneration.*`

Dla helperów runtime media-understanding pluginy mogą wywoływać:

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

Do transkrypcji audio pluginy mogą używać albo runtime media-understanding,
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
- Używa konfiguracji audio media-understanding z rdzenia (`tools.media.audio`) oraz kolejności fallbacku dostawców.
- Zwraca `{ text: undefined }`, gdy nie zostanie wygenerowany wynik transkrypcji (na przykład przy pominiętym/nieobsługiwanym wejściu).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą także uruchamiać podagentów w tle przez `api.runtime.subagent`:

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

- `provider` i `model` to opcjonalne nadpisania dla pojedynczego uruchomienia, a nie trwałe zmiany sesji.
- OpenClaw honoruje te pola nadpisania tylko dla zaufanych wywołujących.
- W przypadku uruchomień fallback należących do pluginu operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane pluginy do określonych kanonicznych celów `provider/model`, albo `"*"` w celu jawnego dopuszczenia dowolnego celu.
- Uruchomienia podagentów z niezaufanych pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast cicho przechodzić do fallbacku.

W przypadku wyszukiwania w sieci pluginy mogą korzystać ze współdzielonego helpera runtime zamiast
sięgać do logiki narzędzi agenta:

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

Pluginy mogą też rejestrować dostawców wyszukiwania w sieci przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Zachowaj wybór dostawcy, rozstrzyganie poświadczeń i współdzieloną semantykę żądań w rdzeniu.
- Używaj dostawców wyszukiwania w sieci dla transportów wyszukiwania specyficznych dla dostawcy.
- `api.runtime.webSearch.*` to preferowana współdzielona powierzchnia dla pluginów funkcji/kanałów, które potrzebują zachowania wyszukiwania bez zależności od wrappera narzędzia agenta.

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
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać zwykłego uwierzytelniania gateway, albo `"plugin"` dla uwierzytelniania/werfikacji webhooków zarządzanych przez plugin.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania pluginu. Zamiast tego używaj `api.registerHttpRoute(...)`.
- Trasy pluginów muszą jawnie deklarować `auth`.
- Konflikty dokładnego `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Utrzymuj łańcuchy przejścia `exact`/`prefix` tylko w obrębie tego samego poziomu auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie zakresów runtime operatora. Są przeznaczone do webhooków/weryfikacji podpisów zarządzanych przez plugin, a nie do uprzywilejowanych wywołań helperów Gateway.
- Trasy `auth: "gateway"` działają w zakresie runtime żądania Gateway, ale ten zakres jest celowo konserwatywny:
  - uwierzytelnianie bearer ze współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime tras pluginów przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP przenoszące tożsamość (na przykład `trusted-proxy` lub `gateway.auth.mode = "none"` przy prywatnym ingressie) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny przy takich żądaniach tras pluginów przenoszących tożsamość, zakres runtime wraca do `operator.write`
- Praktyczna zasada: nie zakładaj, że trasa pluginu uwierzytelniana przez gateway jest domyślnie powierzchnią administracyjną. Jeśli Twoja trasa wymaga zachowania tylko dla administratora, wymagaj trybu uwierzytelniania przenoszącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu Plugin SDK

Podczas tworzenia pluginów używaj podścieżek SDK zamiast monolitycznego importu `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` dla prymitywów rejestracji pluginów.
- `openclaw/plugin-sdk/core` dla generycznego współdzielonego kontraktu skierowanego do pluginów.
- `openclaw/plugin-sdk/config-schema` dla eksportu schematu Zod głównego `openclaw.json`
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
  `openclaw/plugin-sdk/secret-input` oraz
  `openclaw/plugin-sdk/webhook-ingress` dla współdzielonej logiki konfiguracji/uwierzytelniania/odpowiedzi/webhooków.
  `channel-inbound` jest współdzielonym miejscem dla debounce, dopasowywania wzmianek,
  helperów polityki wzmianek przychodzących, formatowania kopert i helperów kontekstu
  kopert przychodzących.
  `channel-setup` to wąska granica konfiguracji opcjonalnej instalacji.
  `setup-runtime` to bezpieczna dla runtime powierzchnia konfiguracji używana przez `setupEntry` /
  odroczone uruchamianie, w tym adaptery poprawek konfiguracji bezpieczne dla importu.
  `setup-adapter-runtime` to granica adaptera konfiguracji kont uwzględniającego env.
  `setup-tools` to mała granica helperów CLI/archiwów/dokumentacji (`formatCliCommand`,
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
  `openclaw/plugin-sdk/runtime-store` oraz
  `openclaw/plugin-sdk/directory-runtime` dla współdzielonych helperów runtime/konfiguracji.
  `telegram-command-config` to wąska publiczna granica dla normalizacji/walidacji niestandardowych
  komend Telegram i pozostaje dostępna nawet wtedy, gdy bundled
  powierzchnia kontraktu Telegram jest tymczasowo niedostępna.
  `text-runtime` to współdzielona granica tekstu/Markdown/logowania, obejmująca
  usuwanie tekstu widocznego dla asystenta, helpery renderowania/dzielenia Markdown, helpery redakcji,
  helpery tagów dyrektyw oraz bezpieczne narzędzia tekstowe.
- Powierzchnie kanałów specyficzne dla zatwierdzeń powinny preferować jeden kontrakt `approvalCapability`
  w pluginie. Rdzeń odczytuje wtedy uwierzytelnianie, dostarczanie, renderowanie,
  natywny routing i zachowanie leniwego natywnego handlera zatwierdzeń przez tę jedną możliwość
  zamiast mieszać zachowanie zatwierdzeń z niepowiązanymi polami pluginu.
- `openclaw/plugin-sdk/channel-runtime` jest przestarzałe i pozostaje tylko jako
  shim zgodności dla starszych pluginów. Nowy kod powinien importować węższe
  generyczne prymitywy, a kod repo nie powinien dodawać nowych importów tego shimu.
- Wewnętrzne elementy bundled extension pozostają prywatne. Pluginy zewnętrzne powinny używać tylko
  podścieżek `openclaw/plugin-sdk/*`. Kod rdzenia/testów OpenClaw może używać repozytoryjnych
  publicznych punktów wejścia pod katalogiem głównym pakietu pluginu, takich jak `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` i wąsko wyspecjalizowane pliki, takie jak
  `login-qr-api.js`. Nigdy nie importuj `src/*` pakietu pluginu z rdzenia ani z
  innego rozszerzenia.
- Podział punktów wejścia repo:
  `<plugin-package-root>/api.js` to barrel helperów/typów,
  `<plugin-package-root>/runtime-api.js` to barrel tylko dla runtime,
  `<plugin-package-root>/index.js` to punkt wejścia bundled pluginu,
  a `<plugin-package-root>/setup-entry.js` to punkt wejścia pluginu konfiguracji.
- Bieżące przykłady bundled dostawców:
  - Anthropic używa `api.js` / `contract-api.js` dla helperów streamingu Claude, takich
    jak `wrapAnthropicProviderStream`, helpery nagłówków beta oraz parsowanie `service_tier`.
  - OpenAI używa `api.js` dla builderów dostawcy, helperów domyślnego modelu i
    builderów dostawców realtime.
  - OpenRouter używa `api.js` dla swojego buildera dostawcy oraz helperów onboardingu/konfiguracji,
    podczas gdy `register.runtime.js` może nadal reeksportować generyczne
    helpery `plugin-sdk/provider-stream` do użytku lokalnego w repo.
- Publiczne punkty wejścia ładowane przez fasadę preferują aktywny snapshot konfiguracji runtime,
  gdy taki istnieje, a następnie przechodzą do rozstrzygniętego pliku konfiguracji na dysku, gdy
  OpenClaw nie udostępnia jeszcze snapshotu runtime.
- Generyczne współdzielone prymitywy pozostają preferowanym publicznym kontraktem SDK. Nadal istnieje
  mały zastrzeżony zestaw powierzchni helperów oznaczonych markami bundled kanałów służących zgodności. Traktuj je jako powierzchnie utrzymaniowe/zgodnościowe dla bundled pluginów, a nie jako nowe cele importu dla podmiotów trzecich; nowe kontrakty międzykanałowe nadal powinny trafiać do
  generycznych podścieżek `plugin-sdk/*` albo do lokalnych barrelów pluginu `api.js` /
  `runtime-api.js`.

Uwaga dotycząca zgodności:

- Unikaj rootowego barrelu `openclaw/plugin-sdk` w nowym kodzie.
- Najpierw preferuj wąskie, stabilne prymitywy. Nowsze podścieżki setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool są zamierzonym kontraktem dla nowych prac nad
  bundled i zewnętrznymi pluginami.
  Parsowanie/dopasowywanie celów należy do `openclaw/plugin-sdk/channel-targets`.
  Bramki działań wiadomości i helpery message-id reakcji należą do
  `openclaw/plugin-sdk/channel-actions`.
- Barrele helperów specyficznych dla bundled extension nie są domyślnie stabilne. Jeśli
  helper jest potrzebny tylko bundled extension, trzymaj go za lokalną granicą
  `api.js` lub `runtime-api.js` tego rozszerzenia zamiast promować go do
  `openclaw/plugin-sdk/<extension>`.
- Nowe współdzielone granice helperów powinny być generyczne, a nie oznaczone marką kanału. Współdzielone parsowanie celów
  należy do `openclaw/plugin-sdk/channel-targets`; elementy wewnętrzne specyficzne dla kanału
  pozostają za lokalną granicą `api.js` lub `runtime-api.js` należącą do danego pluginu.
- Podścieżki specyficzne dla możliwości, takie jak `image-generation`,
  `media-understanding` i `speech`, istnieją, ponieważ bundled/native plugins używają
  ich już dziś. Ich obecność sama w sobie nie oznacza, że każdy eksportowany helper jest
  długoterminowym zamrożonym kontraktem zewnętrznym.

## Schematy narzędzia wiadomości

Pluginy powinny być właścicielami wkładów do schematu `describeMessageTool(...)` specyficznych dla kanału.
Pola specyficzne dla dostawcy trzymaj w pluginie, a nie we współdzielonym rdzeniu.

W przypadku współdzielonych przenośnych fragmentów schematu ponownie używaj generycznych helperów eksportowanych przez
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` dla ładunków w stylu siatki przycisków
- `createMessageToolCardSchema()` dla ustrukturyzowanych ładunków kart

Jeśli dany kształt schematu ma sens tylko dla jednego dostawcy, zdefiniuj go w
źródle tego pluginu zamiast promować go do współdzielonego SDK.

## Rozstrzyganie celów kanałów

Pluginy kanałów powinny być właścicielami semantyki celów specyficznej dla kanału. Zachowaj współdzielony
host outbound jako generyczny i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` czy `channel` przed wyszukiwaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informuje rdzeń, czy dane
  wejście powinno przejść od razu do rozstrzygania podobnego do identyfikatora zamiast wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` to fallback pluginu, gdy
  rdzeń potrzebuje końcowego rozstrzygnięcia należącego do dostawcy po normalizacji albo po
  nieudanym wyszukiwaniu w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` odpowiada za specyficzne dla dostawcy budowanie trasy sesji
  po rozstrzygnięciu celu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategorycznych, które powinny zapadać przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` do sprawdzeń typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` do fallbacku normalizacji specyficznego dla dostawcy, a nie do
  szerokiego wyszukiwania w katalogu.
- Natywne identyfikatory dostawcy, takie jak chat ids, thread ids, JIDs, handle i room
  ids, trzymaj wewnątrz wartości `target` albo parametrów specyficznych dla dostawcy, a nie w generycznych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
pluginie i ponownie używać współdzielonych helperów z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery DM sterowane przez allowlist
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogów o zakresie konta

Współdzielone helpery w `directory-runtime` obsługują tylko operacje generyczne:

- filtrowanie zapytań
- stosowanie limitów
- helpery deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja kont specyficzna dla kanału i normalizacja identyfikatorów powinny pozostać w
implementacji pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli do wnioskowania za pomocą
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawcy

Używaj `catalog`, gdy plugin jest właścicielem identyfikatorów modeli specyficznych dla dostawcy, domyślnych
wartości base URL lub metadanych modeli ograniczonych uwierzytelnianiem.

`catalog.order` kontroluje, kiedy katalog pluginu jest scalany względem
wbudowanych niejawnych dostawców OpenClaw:

- `simple`: dostawcy oparti na zwykłym kluczu API lub env
- `profile`: dostawcy pojawiający się, gdy istnieją profile uwierzytelniania
- `paired`: dostawcy syntetyzujący wiele powiązanych wpisów dostawcy
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc pluginy mogą celowo nadpisywać
wbudowany wpis dostawcy z tym samym identyfikatorem dostawcy.

Zgodność:

- `discovery` nadal działa jako alias legacy
- jeśli zarejestrowane są zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanału tylko do odczytu

Jeśli Twój plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` to ścieżka runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i może szybko kończyć się błędem, gdy brakuje wymaganych sekretów.
- Ścieżki komend tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy
  naprawy doctor/config, nie powinny wymagać materializacji poświadczeń runtime tylko po to,
  aby opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Dołączaj pola źródła/statusu poświadczeń, gdy ma to znaczenie, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, by raportować dostępność tylko do odczytu.
  Wystarczy zwrócić `tokenStatus: "available"` (oraz odpowiadające mu pole źródła)
  dla komend w stylu statusu.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce komendy.

Dzięki temu komendy tylko do odczytu mogą raportować „skonfigurowane, ale niedostępne w tej ścieżce komendy”
zamiast kończyć się awarią lub błędnie zgłaszać, że konto nie jest skonfigurowane.

## Pakiety zbiorcze

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

Każdy wpis staje się pluginem. Jeśli pakiet zbiorczy zawiera wiele rozszerzeń, identyfikator pluginu
przyjmuje postać `name/<fileBase>`.

Jeśli Twój plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Bariera bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu pluginu
po rozstrzygnięciu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga bezpieczeństwa: `openclaw plugins install` instaluje zależności pluginu przez
`npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia i bez zależności dev w runtime). Utrzymuj drzewa zależności pluginu jako „czyste JS/TS” i unikaj pakietów wymagających kompilacji przez `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł przeznaczony tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego pluginu kanału albo
gdy plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego punktu wejścia pluginu. Dzięki temu uruchamianie i konfiguracja są lżejsze,
gdy główny punkt wejścia pluginu podłącza też narzędzia, hooki lub inny kod tylko dla runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć plugin kanału do używania tej samej ścieżki `setupEntry` w fazie
uruchamiania gateway przed nasłuchem, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię uruchamiania, która musi istnieć
przed rozpoczęciem nasłuchu przez gateway. W praktyce oznacza to, że punkt wejścia konfiguracji
musi rejestrować każdą możliwość należącą do kanału, od której zależy uruchamianie, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne przed rozpoczęciem nasłuchu przez gateway
- wszelkie metody Gateway, narzędzia lub usługi, które muszą istnieć w tym samym oknie czasowym

Jeśli Twój pełny punkt wejścia nadal jest właścicielem jakiejkolwiek wymaganej możliwości uruchamiania, nie włączaj
tej flagi. Pozostaw plugin przy zachowaniu domyślnym i pozwól OpenClaw ładować
pełny punkt wejścia podczas uruchamiania.

Bundled kanały mogą też publikować helpery powierzchni kontraktu tylko do konfiguracji, z których rdzeń
może korzystać przed załadowaniem pełnego runtime kanału. Obecna powierzchnia
promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Rdzeń używa tej powierzchni, gdy musi promować legacy konfigurację kanału z jednym kontem do
`channels.<id>.accounts.*` bez ładowania pełnego punktu wejścia pluginu.
Matrix jest obecnym przykładem bundled: przenosi tylko klucze uwierzytelniania/bootstrap do
nazwanego promowanego konta, gdy istnieją już nazwane konta, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery poprawek konfiguracji utrzymują leniwe wykrywanie powierzchni kontraktu bundled. Czas
importu pozostaje niski; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu zamiast
ponownie wchodzić w uruchamianie bundled kanału przy imporcie modułu.

Gdy te powierzchnie uruchamiania obejmują metody Gateway RPC, utrzymuj je pod
prefiksem specyficznym dla pluginu. Przestrzenie nazw administracyjnych rdzenia (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zastrzeżone i zawsze są rozstrzygane
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
wskazówki instalacyjne przez `openclaw.install`. Dzięki temu podstawowe dane katalogu nie muszą być trzymane w rdzeniu.

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

Przydatne pola `openclaw.channel` wykraczające poza minimalny przykład:

- `detailLabel`: etykieta dodatkowa dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: nadpisuje tekst linku do dokumentacji
- `preferOver`: identyfikatory pluginów/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: elementy sterujące kopiami na powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący Markdown dla decyzji o formatowaniu outbound
- `exposure.configured`: ukrywa kanał z powierzchni list skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał z interaktywnych selektorów konfiguracji, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: aliasy legacy nadal akceptowane ze względu na zgodność; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta, nawet gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozstrzyganiu celów ogłoszeń

OpenClaw może też scalać **zewnętrzne katalogi kanałów** (na przykład eksport
rejestru MPM). Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Lub wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (albo `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (rozdzielanych przecinkami, średnikami albo jak w `PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje również `"packages"` lub `"plugins"` jako aliasy legacy dla klucza `"entries"`.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu są właścicielami orkiestracji kontekstu sesji dla ingestu, składania
i kompaktowania. Rejestruj je ze swojego pluginu przez
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Używaj tego, gdy Twój plugin musi zastąpić lub rozszerzyć domyślny potok
kontekstu, zamiast tylko dodać wyszukiwanie w pamięci lub hooki.

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

Jeśli Twój silnik **nie** jest właścicielem algorytmu kompaktowania, pozostaw
zaimplementowane `compact()` i jawnie deleguj je dalej:

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

Gdy plugin potrzebuje zachowania, które nie pasuje do bieżącego API, nie omijaj
systemu pluginów prywatnym sięgnięciem do wnętrza. Dodaj brakującą możliwość.

Zalecana sekwencja:

1. zdefiniuj kontrakt rdzenia
   Zdecyduj, jakie współdzielone zachowanie powinien posiadać rdzeń: politykę, fallback, scalanie konfiguracji,
   cykl życia, semantykę skierowaną do kanałów i kształt helpera runtime.
2. dodaj typowane powierzchnie rejestracji/runtime dla pluginów
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię możliwości.
3. podłącz konsumentów rdzenia + kanałów/funkcji
   Kanały i pluginy funkcji powinny korzystać z nowej możliwości przez rdzeń,
   a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców rejestrują wtedy swoje backendy względem tej możliwości.
5. dodaj pokrycie kontraktowe
   Dodaj testy, aby własność i kształt rejestracji z czasem pozostawały jawne.

W ten sposób OpenClaw zachowuje opiniotwórczość, nie stając się przy tym sztywno związany z
wizją świata jednego dostawcy. Zobacz [Capability Cookbook](/pl/plugins/architecture),
aby znaleźć konkretną listę plików i pełny przykład.

### Lista kontrolna możliwości

Gdy dodajesz nową możliwość, implementacja powinna zwykle jednocześnie dotknąć tych
powierzchni:

- typy kontraktu rdzenia w `src/<capability>/types.ts`
- helper runnera/runtime rdzenia w `src/<capability>/runtime.ts`
- powierzchnia rejestracji API pluginów w `src/plugins/types.ts`
- podłączenie rejestru pluginów w `src/plugins/registry.ts`
- ekspozycja runtime pluginów w `src/plugins/runtime/*`, gdy pluginy funkcji/kanałów
  muszą z niej korzystać
- helpery przechwytywania/testów w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacja operatora/pluginów w `docs/`

Jeśli którejś z tych powierzchni brakuje, zwykle oznacza to, że możliwość nie jest jeszcze
w pełni zintegrowana.

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

- rdzeń jest właścicielem kontraktu możliwości + orkiestracji
- pluginy dostawców są właścicielami implementacji dostawców
- pluginy funkcji/kanałów korzystają z helperów runtime
- testy kontraktowe utrzymują jawną własność
