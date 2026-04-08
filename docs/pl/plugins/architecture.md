---
read_when:
    - Tworzenie lub debugowanie natywnych pluginów OpenClaw
    - Zrozumienie modelu możliwości pluginów lub granic własności
    - Praca nad potokiem ładowania pluginów lub rejestrem
    - Implementowanie haków runtime dostawców lub pluginów kanałów
sidebarTitle: Internals
summary: 'Wnętrze pluginów: model możliwości, własność, kontrakty, potok ładowania i pomocniki runtime'
title: Wnętrze pluginów
x-i18n:
    generated_at: "2026-04-08T02:21:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: c40ecf14e2a0b2b8d332027aed939cd61fb4289a489f4cd4c076c96d707d1138
    source_path: plugins/architecture.md
    workflow: 15
---

# Wnętrze pluginów

<Info>
  To jest **szczegółowe odniesienie do architektury**. Praktyczne przewodniki znajdziesz tutaj:
  - [Instalowanie i używanie pluginów](/pl/tools/plugin) — przewodnik użytkownika
  - [Pierwsze kroki](/pl/plugins/building-plugins) — samouczek pierwszego pluginu
  - [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — budowanie kanału wiadomości
  - [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — budowanie dostawcy modeli
  - [Przegląd SDK](/pl/plugins/sdk-overview) — mapa importów i API rejestracji
</Info>

Ta strona opisuje wewnętrzną architekturę systemu pluginów OpenClaw.

## Publiczny model możliwości

Możliwości to publiczny model **natywnych pluginów** w OpenClaw. Każdy
natywny plugin OpenClaw rejestruje się względem co najmniej jednego typu możliwości:

| Możliwość             | Metoda rejestracji                             | Przykładowe pluginy                |
| --------------------- | ---------------------------------------------- | ---------------------------------- |
| Wnioskowanie tekstowe | `api.registerProvider(...)`                    | `openai`, `anthropic`              |
| Backend wnioskowania CLI | `api.registerCliBackend(...)`               | `openai`, `anthropic`              |
| Mowa                  | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`          |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`               |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`  | `openai`                           |
| Rozumienie mediów     | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                 |
| Generowanie obrazów   | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki    | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                |
| Generowanie wideo     | `api.registerVideoGenerationProvider(...)`     | `qwen`                             |
| Pobieranie z sieci    | `api.registerWebFetchProvider(...)`            | `firecrawl`                        |
| Wyszukiwanie w sieci  | `api.registerWebSearchProvider(...)`           | `google`                           |
| Kanał / wiadomości    | `api.registerChannel(...)`                     | `msteams`, `matrix`                |

Plugin, który rejestruje zero możliwości, ale udostępnia hooki, narzędzia lub
usługi, jest **starszym pluginem tylko z hookami**. Ten wzorzec nadal jest w pełni wspierany.

### Stanowisko wobec zgodności zewnętrznej

Model możliwości jest wdrożony w rdzeniu i używany przez pluginy
bundlowane/natywne już dziś, ale zgodność zewnętrznych pluginów nadal wymaga
wyższego progu niż „jest eksportowane, więc jest zamrożone”.

Obecne wytyczne:

- **istniejące pluginy zewnętrzne:** utrzymuj działanie integracji opartych na hookach; traktuj
  to jako bazowy poziom zgodności
- **nowe pluginy bundlowane/natywne:** preferuj jawną rejestrację możliwości zamiast
  dostępu przez reach-in specyficzny dla dostawcy lub nowych projektów wyłącznie hookowych
- **zewnętrzne pluginy przyjmujące rejestrację możliwości:** dozwolone, ale
  traktuj powierzchnie pomocnicze specyficzne dla możliwości jako rozwijające się, chyba że dokumentacja jawnie oznacza
  dany kontrakt jako stabilny

Praktyczna zasada:

- API rejestracji możliwości to zamierzony kierunek
- starsze hooki pozostają najbezpieczniejszą ścieżką bez zrywania zgodności dla pluginów zewnętrznych w czasie
  przejścia
- eksportowane podścieżki pomocnicze nie są sobie równe; preferuj wąski udokumentowany
  kontrakt, a nie przypadkowe eksporty pomocnicze

### Kształty pluginów

OpenClaw klasyfikuje każdy załadowany plugin do jednego z kształtów na podstawie jego rzeczywistego
zachowania rejestracyjnego (a nie tylko statycznych metadanych):

- **plain-capability** -- rejestruje dokładnie jeden typ możliwości (na przykład
  plugin tylko dostawcy, taki jak `mistral`)
- **hybrid-capability** -- rejestruje wiele typów możliwości (na przykład
  `openai` obsługuje wnioskowanie tekstowe, mowę, rozumienie mediów oraz generowanie
  obrazów)
- **hook-only** -- rejestruje tylko hooki (typowane lub niestandardowe), bez możliwości,
  narzędzi, poleceń ani usług
- **non-capability** -- rejestruje narzędzia, polecenia, usługi lub trasy, ale nie
  możliwości

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu i rozkład
możliwości. Szczegóły znajdziesz w [odniesieniu do CLI](/cli/plugins#inspect).

### Starsze hooki

Hook `before_agent_start` pozostaje wspierany jako ścieżka zgodności dla
pluginów tylko z hookami. Starsze rzeczywiste pluginy nadal od niego zależą.

Kierunek:

- utrzymać jego działanie
- udokumentować go jako starszy
- preferować `before_model_resolve` do pracy nad nadpisywaniem modelu/dostawcy
- preferować `before_prompt_build` do modyfikacji promptu
- usunąć dopiero wtedy, gdy rzeczywiste użycie spadnie, a pokrycie fixture’ów potwierdzi bezpieczeństwo migracji

### Sygnały zgodności

Po uruchomieniu `openclaw doctor` albo `openclaw plugins inspect <id>` możesz zobaczyć
jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Konfiguracja parsuje się poprawnie, a pluginy są rozwiązywane |
| **compatibility advisory** | Plugin używa wspieranego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, które jest przestarzałe  |
| **hard error**             | Konfiguracja jest nieprawidłowa albo plugin nie załadował się |

Ani `hook-only`, ani `before_agent_start` nie zepsują dziś Twojego pluginu --
`hook-only` ma charakter doradczy, a `before_agent_start` wywołuje tylko ostrzeżenie. Te
sygnały pojawiają się także w `openclaw status --all` i `openclaw plugins doctor`.

## Przegląd architektury

System pluginów OpenClaw ma cztery warstwy:

1. **Manifest + wykrywanie**
   OpenClaw znajduje kandydackie pluginy na podstawie skonfigurowanych ścieżek, korzeni
   workspace, globalnych korzeni rozszerzeń i bundlowanych rozszerzeń. Wykrywanie najpierw odczytuje natywne
   manifesty `openclaw.plugin.json` oraz wspierane manifesty bundle.
2. **Włączanie + walidacja**
   Rdzeń decyduje, czy wykryty plugin jest włączony, wyłączony, zablokowany, czy
   wybrany do ekskluzywnego slotu, takiego jak pamięć.
3. **Ładowanie runtime**
   Natywne pluginy OpenClaw są ładowane w tym samym procesie przez jiti i rejestrują
   możliwości w centralnym rejestrze. Zgodne bundle są normalizowane do
   rekordów rejestru bez importowania kodu runtime.
4. **Konsumpcja powierzchni**
   Reszta OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację
   dostawców, hooki, trasy HTTP, polecenia CLI i usługi.

Konkretnie dla CLI pluginów, wykrywanie poleceń głównych jest podzielone na dwie fazy:

- metadane czasu parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- właściwy moduł CLI pluginu może pozostać leniwy i zarejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do pluginu pozostaje w pluginie, a OpenClaw nadal może
zarezerwować nazwy poleceń głównych przed parsowaniem.

Istotna granica projektowa:

- wykrywanie + walidacja konfiguracji powinny działać na podstawie **metadanych manifestu/schematu**
  bez wykonywania kodu pluginu
- natywne zachowanie runtime pochodzi ze ścieżki `register(api)` modułu pluginu

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone pluginy i
budować podpowiedzi UI/schematu zanim pełne runtime stanie się aktywne.

### Pluginy kanałów i współdzielone narzędzie message

Pluginy kanałów nie muszą rejestrować osobnego narzędzia send/edit/react dla
zwykłych działań czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w rdzeniu, a
pluginy kanałów odpowiadają za specyficzne dla kanału wykrywanie i wykonanie za nim.

Obecna granica jest następująca:

- rdzeń odpowiada za host współdzielonego narzędzia `message`, integrację promptu, księgowanie
  sesji/wątków i dyspozycję wykonania
- pluginy kanałów odpowiadają za wykrywanie działań w zakresie, wykrywanie możliwości i wszelkie
  fragmenty schematu specyficzne dla kanału
- pluginy kanałów odpowiadają za gramatykę konwersacji sesji specyficzną dla dostawcy, na przykład
  za to, jak identyfikatory konwersacji kodują identyfikatory wątków lub dziedziczą po konwersacjach nadrzędnych
- pluginy kanałów wykonują końcowe działanie przez swój adapter działań

Dla pluginów kanałów powierzchnią SDK jest
`ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie wykrywania
pozwala pluginowi zwrócić widoczne działania, możliwości i wkład do schematu
razem, aby te elementy nie zaczęły się rozjeżdżać.

Rdzeń przekazuje zakres runtime do tego kroku wykrywania. Ważne pola to:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufany przychodzący `requesterSenderId`

Ma to znaczenie dla pluginów zależnych od kontekstu. Kanał może ukrywać lub ujawniać
działania message na podstawie aktywnego konta, bieżącego pokoju/wątku/wiadomości albo
zaufanej tożsamości nadawcy żądania bez twardego kodowania gałęzi specyficznych dla kanału w
narzędziu rdzeniowym `message`.

Dlatego zmiany routingu embedded-runner nadal należą do pracy pluginu: runner jest
odpowiedzialny za przekazywanie bieżącej tożsamości czatu/sesji do granicy wykrywania pluginu,
aby współdzielone narzędzie `message` ujawniało właściwą powierzchnię należącą do kanału
dla bieżącego kroku.

W przypadku pomocników wykonania należących do kanału, bundlowane pluginy powinny utrzymywać runtime wykonania
we własnych modułach rozszerzeń. Rdzeń nie odpowiada już za runtime działań wiadomości Discord,
Slack, Telegram ani WhatsApp w `src/agents/tools`.
Nie publikujemy oddzielnych podścieżek `plugin-sdk/*-action-runtime`, a bundlowane
pluginy powinny importować własny lokalny kod runtime bezpośrednio ze swoich
modułów rozszerzeń.

Ta sama granica dotyczy ogólnie nazwanych przez dostawcę szczelin SDK: rdzeń nie powinien
importować wygodnych barrelów specyficznych dla kanału dla Slack, Discord, Signal,
WhatsApp ani podobnych rozszerzeń. Jeśli rdzeń potrzebuje jakiegoś zachowania, powinien albo
skorzystać z własnego barrela `api.ts` / `runtime-api.ts` bundlowanego pluginu, albo awansować tę potrzebę
do wąskiej ogólnej możliwości we współdzielonym SDK.

Konkretnie dla ankiet istnieją dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów, które pasują do wspólnego
  modelu ankiet
- `actions.handleAction("poll")` to preferowana ścieżka dla semantyki ankiet specyficznej dla kanału
  albo dodatkowych parametrów ankiet

Rdzeń odracza teraz współdzielone parsowanie ankiet do momentu, gdy dyspozycja ankiety pluginu odrzuci
działanie, dzięki czemu obsługujące ankiety należące do pluginu mogą akceptować pola ankiet specyficzne dla kanału
bez wcześniejszego blokowania przez ogólny parser ankiet.

Pełną sekwencję uruchamiania znajdziesz w [Potoku ładowania](#load-pipeline).

## Model własności możliwości

OpenClaw traktuje natywny plugin jako granicę własności dla **firmy** albo
**funkcji**, a nie jako zbiór niezwiązanych integracji.

To oznacza, że:

- plugin firmy powinien zwykle posiadać wszystkie powierzchnie OpenClaw-facing tej firmy
- plugin funkcji powinien zwykle posiadać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny korzystać ze współdzielonych możliwości rdzenia zamiast doraźnie ponownie implementować
  zachowanie dostawcy

Przykłady:

- bundlowany plugin `openai` obsługuje zachowanie dostawcy modeli OpenAI oraz OpenAI
  speech + realtime-voice + media-understanding + image-generation
- bundlowany plugin `elevenlabs` obsługuje zachowanie mowy ElevenLabs
- bundlowany plugin `microsoft` obsługuje zachowanie mowy Microsoft
- bundlowany plugin `google` obsługuje zachowanie dostawcy modeli Google oraz Google
  media-understanding + image-generation + web-search
- bundlowany plugin `firecrawl` obsługuje zachowanie web-fetch Firecrawl
- bundlowane pluginy `minimax`, `mistral`, `moonshot` i `zai` obsługują swoje
  backendy media-understanding
- plugin `voice-call` jest pluginem funkcji: obsługuje transport połączeń, narzędzia,
  CLI, trasy i mostkowanie strumieni mediów Twilio, ale korzysta ze współdzielonych możliwości speech
  oraz realtime-transcription i realtime-voice zamiast bezpośrednio importować pluginy dostawców

Zamierzony stan końcowy jest następujący:

- OpenAI znajduje się w jednym pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i
  przyszłe wideo
- inny dostawca może zrobić to samo dla własnego obszaru
- kanały nie obchodzą szczegóły tego, który plugin dostawcy obsługuje danego providera; korzystają ze
  współdzielonego kontraktu możliwości udostępnianego przez rdzeń

To jest kluczowe rozróżnienie:

- **plugin** = granica własności
- **możliwość** = kontrakt rdzenia, który może być implementowany lub używany przez wiele pluginów

Jeśli więc OpenClaw doda nową domenę, taką jak wideo, pierwszym pytaniem nie jest
„który dostawca powinien na sztywno obsłużyć wideo?”. Pierwsze pytanie brzmi: „jaki jest
rdzeniowy kontrakt możliwości wideo?”. Gdy ten kontrakt istnieje, pluginy dostawców
mogą się względem niego rejestrować, a pluginy kanałów/funkcji mogą z niego korzystać.

Jeśli możliwość jeszcze nie istnieje, właściwy ruch to zwykle:

1. zdefiniować brakującą możliwość w rdzeniu
2. udostępnić ją przez API/runtime pluginów w sposób typowany
3. podłączyć kanały/funkcje do tej możliwości
4. pozwolić pluginom dostawców rejestrować implementacje

Dzięki temu własność pozostaje jawna, a jednocześnie unika się zachowania rdzenia zależnego od
jednego dostawcy albo jednorazowej ścieżki kodu specyficznej dla pluginu.

### Warstwowanie możliwości

Użyj tego modelu mentalnego przy decydowaniu, gdzie powinien znajdować się kod:

- **warstwa możliwości rdzenia**: współdzielona orkiestracja, polityka, fallback, zasady
  łączenia konfiguracji, semantyka dostarczania i typowane kontrakty
- **warstwa pluginu dostawcy**: API specyficzne dla dostawcy, auth, katalogi modeli, synteza mowy,
  generowanie obrazów, przyszłe backendy wideo, endpointy użycia
- **warstwa pluginu kanału/funkcji**: integracja Slack/Discord/voice-call itd.,
  która zużywa możliwości rdzenia i prezentuje je na powierzchni

Na przykład TTS ma następującą strukturę:

- rdzeń obsługuje politykę TTS podczas odpowiedzi, kolejność fallback, preferencje i dostarczanie na kanał
- `openai`, `elevenlabs` i `microsoft` obsługują implementacje syntezy
- `voice-call` korzysta z pomocnika runtime TTS dla telefonii

Ten sam wzorzec należy preferować dla przyszłych możliwości.

### Przykład pluginu firmy z wieloma możliwościami

Plugin firmy powinien sprawiać wrażenie spójnego z zewnątrz. Jeśli OpenClaw ma współdzielone
kontrakty dla modeli, mowy, transkrypcji w czasie rzeczywistym, głosu w czasie rzeczywistym, rozumienia
mediów, generowania obrazów, generowania wideo, web fetch i web search,
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
      // hooki auth/katalogu modeli/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // konfiguracja mowy dostawcy — zaimplementuj bezpośrednio interfejs SpeechProviderPlugin
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
        // logika poświadczeń + pobierania
      }),
    );
  },
};

export default plugin;
```

Nie są istotne dokładne nazwy pomocników. Liczy się kształt:

- jeden plugin posiada powierzchnię dostawcy
- rdzeń nadal posiada kontrakty możliwości
- kanały i pluginy funkcji korzystają z pomocników `api.runtime.*`, a nie z kodu dostawcy
- testy kontraktowe mogą potwierdzić, że plugin zarejestrował możliwości, które
  deklaruje jako własne

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazów/audio/wideo jako jedną współdzieloną
możliwość. Ten sam model własności ma tu zastosowanie:

1. rdzeń definiuje kontrakt media-understanding
2. pluginy dostawców rejestrują `describeImage`, `transcribeAudio` i
   `describeVideo` w zależności od potrzeb
3. kanały i pluginy funkcji korzystają ze współdzielonego zachowania rdzenia zamiast
   podpinać się bezpośrednio do kodu dostawcy

To zapobiega wbudowywaniu założeń jednego dostawcy dotyczących wideo do rdzenia. Plugin posiada
powierzchnię dostawcy; rdzeń posiada kontrakt możliwości i zachowanie fallback.

Generowanie wideo już używa tej samej sekwencji: rdzeń posiada typowany
kontrakt możliwości i pomocnik runtime, a pluginy dostawców rejestrują
implementacje `api.registerVideoGenerationProvider(...)` względem niego.

Potrzebujesz konkretnej listy wdrożeniowej? Zobacz
[Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API pluginów jest celowo typowana i scentralizowana w
`OpenClawPluginApi`. Ten kontrakt definiuje wspierane punkty rejestracji i
pomocniki runtime, na których plugin może polegać.

Dlaczego to ważne:

- autorzy pluginów dostają jeden stabilny wewnętrzny standard
- rdzeń może odrzucić duplikaty własności, na przykład dwa pluginy rejestrujące ten sam
  identyfikator dostawcy
- uruchamianie może pokazać praktyczną diagnostykę dla błędnej rejestracji
- testy kontraktowe mogą egzekwować własność bundlowanych pluginów i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

1. **egzekwowanie rejestracji runtime**
   Rejestr pluginów waliduje rejestracje podczas ładowania pluginów. Przykłady:
   duplikaty identyfikatorów dostawców, duplikaty identyfikatorów dostawców mowy i błędne
   rejestracje generują diagnostykę pluginów zamiast niezdefiniowanego zachowania.
2. **testy kontraktowe**
   Bundlowane pluginy są przechwytywane w rejestrach kontraktów podczas uruchomień testów, aby
   OpenClaw mógł jawnie potwierdzać własność. Dziś jest to używane dla
   dostawców modeli, dostawców mowy, dostawców web search i własności bundlowanej rejestracji.

Praktyczny efekt jest taki, że OpenClaw z góry wie, który plugin odpowiada za którą
powierzchnię. To pozwala rdzeniowi i kanałom płynnie się składać, bo własność jest
zadeklarowana, typowana i testowalna, a nie ukryta.

### Co należy do kontraktu

Dobre kontrakty pluginów są:

- typowane
- małe
- specyficzne dla możliwości
- należące do rdzenia
- wielokrotnego użytku przez wiele pluginów
- używalne przez kanały/funkcje bez wiedzy o dostawcy

Złe kontrakty pluginów to:

- polityka specyficzna dla dostawcy ukryta w rdzeniu
- jednorazowe furtki ucieczki specyficzne dla pluginu, które omijają rejestr
- kod kanału sięgający bezpośrednio do implementacji dostawcy
- doraźne obiekty runtime, które nie są częścią `OpenClawPluginApi` ani
  `api.runtime`

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj możliwość, a potem
pozwól pluginom się do niej podłączać.

## Model wykonania

Natywne pluginy OpenClaw działają **w tym samym procesie** co Gateway. Nie są
sandboxowane. Załadowany natywny plugin ma tę samą granicę zaufania na poziomie procesu co
kod rdzenia.

Konsekwencje:

- natywny plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi
- błąd natywnego pluginu może spowodować awarię lub destabilizację gatewaya
- złośliwy natywny plugin jest równoważny dowolnemu wykonaniu kodu wewnątrz
  procesu OpenClaw

Zgodne bundle są bezpieczniejsze domyślnie, bo OpenClaw obecnie traktuje je
jako pakiety metadanych/treści. W bieżących wydaniach oznacza to głównie bundlowane
Skills.

Dla pluginów niebundlowanych używaj allowlist i jawnych ścieżek instalacji/ładowania. Traktuj
pluginy workspace jako kod deweloperski, a nie produkcyjne ustawienia domyślne.

Dla nazw pakietów bundlowanego workspace utrzymuj identyfikator pluginu zakotwiczony w nazwie
npm: domyślnie `@openclaw/<id>` albo zatwierdzony typowany sufiks taki jak
`-provider`, `-plugin`, `-speech`, `-sandbox` albo `-media-understanding`, gdy
pakiet celowo wystawia węższą rolę pluginu.

Ważna uwaga o zaufaniu:

- `plugins.allow` ufa **identyfikatorom pluginów**, a nie pochodzeniu źródła.
- Plugin workspace z tym samym identyfikatorem co bundlowany plugin celowo przesłania
  bundlowaną kopię, gdy ten plugin workspace jest włączony/na allowliście.
- Jest to normalne i przydatne dla lokalnego rozwoju, testów łatek i hotfixów.

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodę implementacji.

Utrzymuj publiczną rejestrację możliwości. Ogranicz eksport pomocników niebędących kontraktem:

- podścieżki specyficzne dla bundlowanych pluginów
- podścieżki mechaniki runtime nieprzeznaczone jako publiczne API
- pomocniki wygodne specyficzne dla dostawcy
- pomocniki setup/onboarding będące szczegółami implementacji

Niektóre podścieżki pomocnicze bundlowanych pluginów nadal pozostają w wygenerowanej mapie
eksportów SDK ze względu na zgodność i utrzymanie bundlowanych pluginów. Obecne przykłady obejmują
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz kilka szczelin `plugin-sdk/matrix*`. Traktuj je jako
zastrzeżone eksporty szczegółów implementacyjnych, a nie zalecany wzorzec SDK dla
nowych zewnętrznych pluginów.

## Potok ładowania

Podczas uruchamiania OpenClaw wykonuje w przybliżeniu następujące kroki:

1. wykrywa kandydackie korzenie pluginów
2. odczytuje natywne albo zgodne manifesty bundle oraz metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu dla każdego kandydata
6. ładuje włączone natywne moduły przez jiti
7. wywołuje natywne hooki `register(api)` (lub `activate(api)` — starszy alias) i zbiera rejestracje do rejestru pluginów
8. udostępnia rejestr powierzchniom poleceń/runtime

<Note>
`activate` jest starszym aliasem dla `register` — loader rozwiązuje to, co jest obecne (`def.register ?? def.activate`) i wywołuje w tym samym miejscu. Wszystkie bundlowane pluginy używają `register`; dla nowych pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem runtime. Kandydaci są blokowani,
gdy entry wychodzi poza korzeń pluginu, ścieżka jest zapisywalna dla wszystkich albo
własność ścieżki wygląda podejrzanie w przypadku pluginów niebundlowanych.

### Zachowanie manifest-first

Manifest jest źródłem prawdy warstwy control-plane. OpenClaw używa go do:

- identyfikacji pluginu
- wykrywania zadeklarowanych kanałów/Skills/schematu konfiguracji lub możliwości bundle
- walidacji `plugins.entries.<id>.config`
- rozszerzania etykiet/placeholderów w Control UI
- wyświetlania metadanych instalacji/katalogu

W przypadku natywnych pluginów moduł runtime jest częścią data-plane. Rejestruje
rzeczywiste zachowania, takie jak hooki, narzędzia, polecenia albo przepływy dostawcy.

### Co loader przechowuje w cache

OpenClaw utrzymuje krótkie cache w pamięci procesu dla:

- wyników wykrywania
- danych rejestru manifestów
- załadowanych rejestrów pluginów

Te cache zmniejszają koszt gwałtownego uruchamiania i powtarzanych poleceń. Są bezpieczne
do traktowania jako krótkotrwałe cache wydajnościowe, a nie trwałe przechowywanie.

Uwaga o wydajności:

- Ustaw `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` albo
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, aby wyłączyć te cache.
- Dostosuj okna cache za pomocą `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` i
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model rejestru

Załadowane pluginy nie mutują bezpośrednio losowych globali rdzenia. Rejestrują się w
centralnym rejestrze pluginów.

Rejestr śledzi:

- rekordy pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- starsze hooki i typowane hooki
- kanały
- dostawców
- handlery Gateway RPC
- trasy HTTP
- rejestratory CLI
- usługi w tle
- polecenia należące do pluginów

Funkcje rdzenia następnie odczytują z tego rejestru zamiast komunikować się z modułami pluginów
bezpośrednio. Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- runtime rdzenia -> konsumpcja rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni rdzenia potrzebuje
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
        // Powiązanie istnieje teraz dla tego pluginu + konwersacji.
        console.log(event.binding?.conversationId);
        return;
      }

      // Żądanie zostało odrzucone; wyczyść lokalny stan oczekujący.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Pola payload callbacka:

- `status`: `"approved"` albo `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` albo `"deny"`
- `binding`: rozstrzygnięte powiązanie dla zatwierdzonych żądań
- `request`: oryginalne podsumowanie żądania, wskazówka odłączenia, identyfikator nadawcy i
  metadane konwersacji

Ten callback służy wyłącznie do powiadomień. Nie zmienia tego, kto może powiązać
konwersację, i uruchamia się po zakończeniu obsługi zatwierdzenia przez rdzeń.

## Hooki runtime dostawców

Pluginy dostawców mają teraz dwie warstwy:

- metadane manifestu: `providerAuthEnvVars` dla taniego wyszukiwania auth dostawcy w env
  przed załadowaniem runtime, `channelEnvVars` dla taniego wyszukiwania env/setup kanału
  przed załadowaniem runtime oraz `providerAuthChoices` dla tanich etykiet
  onboarding/auth-choice i metadanych flag CLI przed załadowaniem runtime
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

OpenClaw nadal odpowiada za ogólną pętlę agenta, failover, obsługę transkryptów i
politykę narzędzi. Te hooki są powierzchnią rozszerzeń dla zachowań specyficznych dla dostawcy bez
potrzeby posiadania całkowicie własnego transportu wnioskowania.

Używaj manifestowego `providerAuthEnvVars`, gdy dostawca ma poświadczenia oparte na env,
które ogólne ścieżki auth/status/model-picker powinny widzieć bez ładowania runtime pluginu.
Używaj manifestowego `providerAuthChoices`, gdy powierzchnie onboarding/auth-choice CLI
powinny znać identyfikator wyboru dostawcy, etykiety grup i proste
uwierzytelnianie jednym przełącznikiem bez ładowania runtime dostawcy. Runtime dostawcy
`envVars` zachowaj dla wskazówek skierowanych do operatora, takich jak etykiety onboardingu albo
zmienne setup dla OAuth client-id/client-secret.

Używaj manifestowego `channelEnvVars`, gdy kanał ma auth lub setup sterowane przez env, które
ogólny fallback shell-env, kontrole config/status albo prompty setup powinny widzieć
bez ładowania runtime kanału.

### Kolejność hooków i zastosowanie

W przypadku pluginów modeli/dostawców OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” to szybki przewodnik decyzyjny.

| #   | Hook                              | Co robi                                                                                                       | Kiedy używać                                                                                                                               |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Publikuje konfigurację dostawcy do `models.providers` podczas generowania `models.json`                     | Dostawca posiada katalog albo wartości domyślne `baseUrl`                                                                                 |
| 2   | `applyConfigDefaults`             | Stosuje globalne wartości domyślne konfiguracji należące do dostawcy podczas materializacji konfiguracji     | Wartości domyślne zależą od trybu auth, env albo semantyki rodziny modeli dostawcy                                                       |
| --  | _(wbudowane wyszukiwanie modeli)_ | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                   | _(to nie jest hook pluginu)_                                                                                                              |
| 3   | `normalizeModelId`                | Normalizuje starsze albo preview aliasy `model-id` przed wyszukaniem                                          | Dostawca posiada czyszczenie aliasów przed kanonicznym rozstrzyganiem modelu                                                              |
| 4   | `normalizeTransport`              | Normalizuje rodzinę dostawców `api` / `baseUrl` przed ogólnym składaniem modelu                              | Dostawca posiada czyszczenie transportu dla niestandardowych identyfikatorów dostawców w tej samej rodzinie transportu                   |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozstrzygnięciem runtime/dostawcy                                   | Dostawca potrzebuje czyszczenia konfiguracji, które powinno żyć wraz z pluginem; bundlowane pomocniki rodziny Google dodatkowo wspierają wspierane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje przepisywanie zgodności z użyciem natywnego streamingu do dostawców konfiguracji                      | Dostawca potrzebuje poprawek metadanych użycia natywnego streamingu zależnych od endpointu                                              |
| 7   | `resolveConfigApiKey`             | Rozwiązuje auth typu env-marker dla dostawców konfiguracji przed załadowaniem runtime auth                    | Dostawca ma własne rozwiązywanie klucza API env-marker; `amazon-bedrock` ma tu również wbudowany resolver env-marker AWS                |
| 8   | `resolveSyntheticAuth`            | Ujawnia lokalne/self-hosted lub oparte na konfiguracji auth bez utrwalania jawnego tekstu                     | Dostawca może działać z syntetycznym/lokalnym markerem poświadczeń                                                                        |
| 9   | `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile auth należące do dostawcy; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Dostawca ponownie używa zewnętrznych poświadczeń auth bez utrwalania skopiowanych tokenów odświeżania                                     |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet przechowywanych placeholderów syntetycznych profili względem auth opartego na env/config    | Dostawca przechowuje syntetyczne placeholdery profili, które nie powinny mieć pierwszeństwa                                              |
| 11  | `resolveDynamicModel`             | Synchroniczny fallback dla identyfikatorów modeli należących do dostawcy, których nie ma jeszcze w lokalnym rejestrze | Dostawca akceptuje dowolne upstreamowe identyfikatory modeli                                                                        |
| 12  | `prepareDynamicModel`             | Asynchroniczne rozgrzanie, po czym `resolveDynamicModel` uruchamia się ponownie                               | Dostawca potrzebuje metadanych sieciowych przed rozstrzygnięciem nieznanych identyfikatorów                                              |
| 13  | `normalizeResolvedModel`          | Końcowe przepisanie przed użyciem rozstrzygniętego modelu przez embedded runner                               | Dostawca potrzebuje przepisań transportu, ale nadal używa transportu rdzenia                                                             |
| 14  | `contributeResolvedModelCompat`   | Dodaje flagi zgodności dla modeli dostawcy za innym zgodnym transportem                                        | Dostawca rozpoznaje własne modele na transportach proxy bez przejmowania roli dostawcy                                                   |
| 15  | `capabilities`                    | Metadane transkryptów/narzędzi należące do dostawcy używane przez współdzieloną logikę rdzenia               | Dostawca potrzebuje specyficznych zachowań transkryptu/rodziny dostawcy                                                                  |
| 16  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi przed przekazaniem ich do embedded runnera                                      | Dostawca potrzebuje czyszczenia schematu rodziny transportu                                                                              |
| 17  | `inspectToolSchemas`              | Ujawnia diagnostykę schematów należącą do dostawcy po normalizacji                                            | Dostawca chce ostrzeżeń o słowach kluczowych bez uczenia rdzenia reguł specyficznych dla dostawcy                                       |
| 18  | `resolveReasoningOutputMode`      | Wybiera natywny albo oznaczany kontrakt wyjścia reasoning                                                     | Dostawca potrzebuje oznaczanego reasoning/końcowego wyjścia zamiast natywnych pól                                                       |
| 19  | `prepareExtraParams`              | Normalizacja parametrów żądania przed ogólnymi wrapperami opcji streamu                                       | Dostawca potrzebuje domyślnych parametrów żądania albo czyszczenia parametrów per dostawca                                              |
| 20  | `createStreamFn`                  | W pełni zastępuje zwykłą ścieżkę streamu niestandardowym transportem                                          | Dostawca potrzebuje niestandardowego protokołu na przewodzie, a nie tylko wrappera                                                      |
| 21  | `wrapStreamFn`                    | Wrapper streamu po zastosowaniu ogólnych wrapperów                                                            | Dostawca potrzebuje wrapperów nagłówków/treści/zgodności modelu bez niestandardowego transportu                                         |
| 22  | `resolveTransportTurnState`       | Dołącza natywne nagłówki lub metadane transportu per turn                                                     | Dostawca chce, aby ogólne transporty wysyłały natywną tożsamość tury dostawcy                                                            |
| 23  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę cooldown sesji                                                | Dostawca chce, aby ogólne transporty WS dostrajały nagłówki sesji albo politykę fallback                                                |
| 24  | `formatApiKey`                    | Formater profilu auth: zapisany profil staje się runtime stringiem `apiKey`                                  | Dostawca przechowuje dodatkowe metadane auth i potrzebuje niestandardowego kształtu tokena runtime                                      |
| 25  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania albo polityki błędów odświeżania    | Dostawca nie pasuje do współdzielonych mechanizmów odświeżania `pi-ai`                                                                   |
| 26  | `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana po niepowodzeniu odświeżania OAuth                                              | Dostawca potrzebuje własnych wskazówek naprawy auth po błędzie odświeżenia                                                               |
| 27  | `matchesContextOverflowError`     | Dopasowywanie przepełnienia okna kontekstu należące do dostawcy                                               | Dostawca ma surowe błędy przepełnienia, których ogólne heurystyki nie wykryją                                                            |
| 28  | `classifyFailoverReason`          | Klasyfikacja przyczyny failover należąca do dostawcy                                                          | Dostawca może mapować surowe błędy API/transportu na rate-limit/przeciążenie itd.                                                        |
| 29  | `isCacheTtlEligible`              | Polityka prompt-cache dla dostawców proxy/backhaul                                                            | Dostawca potrzebuje bramkowania TTL cache specyficznego dla proxy                                                                         |
| 30  | `buildMissingAuthMessage`         | Zastąpienie ogólnego komunikatu odzyskiwania przy braku auth                                                  | Dostawca potrzebuje komunikatu odzyskiwania przy braku auth specyficznego dla dostawcy                                                   |
| 31  | `suppressBuiltInModel`            | Tłumienie nieaktualnych modeli upstream plus opcjonalna wskazówka błędu dla użytkownika                      | Dostawca musi ukryć nieaktualne wiersze upstream albo zastąpić je wskazówką dostawcy                                                     |
| 32  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykryciu                                                    | Dostawca potrzebuje syntetycznych wierszy zgodności z przyszłością w `models list` i pickerach                                           |
| 33  | `isBinaryThinking`                | Przełącznik on/off reasoning dla dostawców binarnego thinking                                                 | Dostawca udostępnia tylko binarne włącz/wyłącz thinking                                                                                   |
| 34  | `supportsXHighThinking`           | Wsparcie reasoning `xhigh` dla wybranych modeli                                                               | Dostawca chce `xhigh` tylko dla podzbioru modeli                                                                                          |
| 35  | `resolveDefaultThinkingLevel`     | Domyślny poziom `/think` dla konkretnej rodziny modeli                                                        | Dostawca posiada domyślną politykę `/think` dla rodziny modeli                                                                            |
| 36  | `isModernModelRef`                | Dopasowywanie nowoczesnych modeli dla filtrów live profili i wyboru smoke                                     | Dostawca posiada preferowane dopasowywanie modeli live/smoke                                                                              |
| 37  | `prepareRuntimeAuth`              | Wymienia skonfigurowane poświadczenie na właściwy token/klucz runtime tuż przed wnioskowaniem                | Dostawca potrzebuje wymiany tokena lub krótkotrwałego poświadczenia żądania                                                              |
| 38  | `resolveUsageAuth`                | Rozwiązuje poświadczenia użycia/rozliczeń dla `/usage` i pokrewnych powierzchni statusu                      | Dostawca potrzebuje niestandardowego parsowania tokena użycia/kwoty albo innych poświadczeń użycia                                      |
| 39  | `fetchUsageSnapshot`              | Pobiera i normalizuje snapshoty użycia/kwot specyficzne dla dostawcy po rozstrzygnięciu auth                 | Dostawca potrzebuje endpointu użycia specyficznego dla dostawcy albo parsera payloadu                                                   |
| 40  | `createEmbeddingProvider`         | Buduje adapter embeddingów należący do dostawcy dla pamięci/wyszukiwania                                     | Zachowanie embeddingów pamięci należy do pluginu dostawcy                                                                                |
| 41  | `buildReplayPolicy`               | Zwraca politykę replay kontrolującą obsługę transkryptu dla dostawcy                                          | Dostawca potrzebuje niestandardowej polityki transkryptu (na przykład usuwania bloków thinking)                                         |
| 42  | `sanitizeReplayHistory`           | Przepisuje historię replay po ogólnym czyszczeniu transkryptu                                                 | Dostawca potrzebuje przepisań replay specyficznych dla dostawcy wykraczających poza współdzielone pomocniki kompaktowania               |
| 43  | `validateReplayTurns`             | Końcowa walidacja albo przekształcenie tur replay przed embedded runnerem                                     | Transport dostawcy potrzebuje bardziej rygorystycznej walidacji tur po ogólnej sanityzacji                                               |
| 44  | `onModelSelected`                 | Uruchamia skutki uboczne po wyborze modelu należące do dostawcy                                               | Dostawca potrzebuje telemetrii albo stanu należącego do dostawcy, gdy model staje się aktywny                                           |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany plugin dostawcy, a następnie przechodzą do innych pluginów dostawców zdolnych do obsługi hooków,
dopóki któryś faktycznie nie zmieni identyfikatora modelu albo transportu/konfiguracji. Dzięki temu
shimy aliasów/zgodności dostawców działają bez konieczności wiedzy po stronie wywołującego, który
bundlowany plugin jest właścicielem przepisywania. Jeśli żaden hook dostawcy nie przepisze wspieranego
wpisu konfiguracji rodziny Google, bundlowany normalizator konfiguracji Google nadal stosuje
to czyszczenie zgodności.

Jeśli dostawca potrzebuje w pełni niestandardowego protokołu na przewodzie albo własnego wykonawcy żądań,
to jest to inna klasa rozszerzenia. Te hooki są przeznaczone dla zachowań dostawcy,
które nadal działają na zwykłej pętli wnioskowania OpenClaw.

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
  i `wrapStreamFn`, ponieważ obsługuje zgodność z przyszłością Claude 4.6,
  wskazówki dotyczące rodziny dostawcy, wskazówki naprawy auth, integrację z endpointem użycia,
  kwalifikowalność prompt-cache, domyślne ustawienia konfiguracji świadome auth, domyślną/adaptacyjną
  politykę thinking Claude oraz kształtowanie streamu specyficzne dla Anthropic dla
  nagłówków beta, `/fast` / `serviceTier` i `context1m`.
- Pomocniki streamów specyficzne dla Claude w Anthropic pozostają na razie w
  publicznej szczelinie `api.ts` / `contract-api.ts` należącej do bundlowanego pluginu. Ta
  powierzchnia pakietu eksportuje `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` oraz niższego poziomu
  buildery wrapperów Anthropic zamiast rozszerzać ogólne SDK wokół reguł nagłówków beta jednego
  dostawcy.
- OpenAI używa `resolveDynamicModel`, `normalizeResolvedModel` i
  `capabilities` oraz `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` i `isModernModelRef`,
  ponieważ obsługuje zgodność z przyszłością GPT-5.4, bezpośrednią normalizację OpenAI
  `openai-completions` -> `openai-responses`, wskazówki auth świadome Codex,
  tłumienie Spark, syntetyczne wiersze list OpenAI oraz politykę thinking / modeli live GPT-5;
  rodzina streamów `openai-responses-defaults` obsługuje współdzielone natywne wrappery OpenAI Responses dla
  nagłówków atrybucji, `/fast`/`serviceTier`, gadatliwości tekstu, natywnego Codex web search,
  kształtowania payload zgodności reasoning oraz zarządzania kontekstem Responses.
- OpenRouter używa `catalog` oraz `resolveDynamicModel` i
  `prepareDynamicModel`, ponieważ dostawca jest pass-through i może ujawniać nowe
  identyfikatory modeli zanim zaktualizuje się statyczny katalog OpenClaw; używa też
  `capabilities`, `wrapStreamFn` i `isCacheTtlEligible`, aby trzymać
  specyficzne dla dostawcy nagłówki żądań, metadane routingu, poprawki reasoning i
  politykę prompt-cache poza rdzeniem. Jego polityka replay pochodzi z rodziny
  `passthrough-gemini`, podczas gdy rodzina streamów `openrouter-thinking`
  obsługuje wstrzykiwanie proxy reasoning oraz pomijanie nieobsługiwanych modeli i `auto`.
- GitHub Copilot używa `catalog`, `auth`, `resolveDynamicModel` i
  `capabilities` oraz `prepareRuntimeAuth` i `fetchUsageSnapshot`, ponieważ
  potrzebuje logowania urządzenia należącego do dostawcy, zachowania fallback modeli,
  specyficznych zachowań transkryptu Claude, wymiany tokena GitHub -> token Copilot oraz
  endpointu użycia należącego do dostawcy.
- OpenAI Codex używa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` i `augmentModelCatalog` oraz
  `prepareExtraParams`, `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ
  nadal działa na transportach rdzeniowych OpenAI, ale obsługuje własną normalizację
  transportu/base URL, politykę fallback odświeżania OAuth, domyślny wybór transportu,
  syntetyczne wiersze katalogu Codex oraz integrację z endpointem użycia ChatGPT; współdzieli
  tę samą rodzinę streamów `openai-responses-defaults` co bezpośrednie OpenAI.
- Google AI Studio i Gemini CLI OAuth używają `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` i `isModernModelRef`, ponieważ
  rodzina replay `google-gemini` obsługuje fallback zgodności z przyszłością Gemini 3.1,
  natywną walidację replay Gemini, sanityzację replay bootstrap,
  tryb oznaczanego wyjścia reasoning oraz dopasowanie nowoczesnych modeli, podczas gdy
  rodzina streamów `google-thinking` obsługuje normalizację payload thinking Gemini;
  Gemini CLI OAuth używa też `formatApiKey`, `resolveUsageAuth` i
  `fetchUsageSnapshot` do formatowania tokena, parsowania tokena i
  podłączania endpointu quota.
- Anthropic Vertex używa `buildReplayPolicy` przez rodzinę replay
  `anthropic-by-model`, aby czyszczenie replay specyficzne dla Claude pozostało
  ograniczone do identyfikatorów Claude zamiast każdego transportu `anthropic-messages`.
- Amazon Bedrock używa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` i `resolveDefaultThinkingLevel`, ponieważ obsługuje
  klasyfikację błędów throttle/not-ready/context-overflow specyficzną dla Bedrock
  dla ruchu Anthropic-on-Bedrock; jego polityka replay nadal współdzieli tę samą
  osłonę `anthropic-by-model` tylko dla Claude.
- OpenRouter, Kilocode, Opencode i Opencode Go używają `buildReplayPolicy`
  przez rodzinę replay `passthrough-gemini`, ponieważ pośredniczą modele Gemini
  przez transporty zgodne z OpenAI i potrzebują sanityzacji
  thought-signature Gemini bez natywnej walidacji replay Gemini ani
  przepisań bootstrap.
- MiniMax używa `buildReplayPolicy` przez rodzinę replay
  `hybrid-anthropic-openai`, ponieważ jeden dostawca obsługuje zarówno semantykę
  Anthropic-message, jak i zgodną z OpenAI; zachowuje usuwanie bloków thinking
  tylko dla Claude po stronie Anthropic, a jednocześnie nadpisuje tryb wyjścia reasoning z powrotem na natywny, zaś rodzina streamów `minimax-fast-mode` obsługuje
  przepisywania modeli trybu fast na współdzielonej ścieżce streamu.
- Moonshot używa `catalog` oraz `wrapStreamFn`, ponieważ nadal używa współdzielonego
  transportu OpenAI, ale potrzebuje normalizacji payload thinking należącej do dostawcy; rodzina streamów
  `moonshot-thinking` mapuje konfigurację oraz stan `/think` na swój
  natywny binarny payload thinking.
- Kilocode używa `catalog`, `capabilities`, `wrapStreamFn` i
  `isCacheTtlEligible`, ponieważ potrzebuje nagłówków żądań należących do dostawcy,
  normalizacji payload reasoning, wskazówek dla transkryptu Gemini oraz bramkowania
  cache-TTL Anthropic; rodzina streamów `kilocode-thinking` utrzymuje wstrzykiwanie
  Kilo thinking na współdzielonej ścieżce streamu proxy, jednocześnie pomijając `kilo/auto` i
  inne identyfikatory modeli proxy, które nie obsługują jawnych payloadów reasoning.
- Z.AI używa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` i `fetchUsageSnapshot`, ponieważ obsługuje fallback GLM-5,
  domyślne `tool_stream`, UX binarnego thinking, dopasowywanie nowoczesnych modeli oraz zarówno
  usage auth, jak i pobieranie quota; rodzina streamów `tool-stream-default-on` utrzymuje
  wrapper `tool_stream` włączony domyślnie poza ręcznie pisanym glue per dostawca.
- xAI używa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` i `isModernModelRef`,
  ponieważ obsługuje natywną normalizację transportu xAI Responses, przepisywanie aliasów
  trybu fast Grok, domyślne `tool_stream`, czyszczenie strict-tool / reasoning-payload,
  ponowne użycie fallback auth dla narzędzi należących do pluginu, rozstrzyganie modeli Grok zgodne z przyszłością
  oraz poprawki zgodności należące do dostawcy, takie jak profil schematu narzędzi xAI,
  nieobsługiwane słowa kluczowe schematu, natywne `web_search` i dekodowanie argumentów wywołań narzędzi z encji HTML.
- Mistral, OpenCode Zen i OpenCode Go używają tylko `capabilities`, aby trzymać
  specyficzne zachowania transkryptów/narzędzi poza rdzeniem.
- Bundlowani dostawcy tylko katalogowi, tacy jak `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` i `volcengine`, używają
  tylko `catalog`.
- Qwen używa `catalog` dla swojego dostawcy tekstu oraz współdzielonych rejestracji
  media-understanding i video-generation dla swoich powierzchni multimodalnych.
- MiniMax i Xiaomi używają `catalog` oraz hooków użycia, ponieważ ich zachowanie `/usage`
  należy do pluginu, mimo że wnioskowanie nadal działa przez współdzielone transporty.

## Pomocniki runtime

Pluginy mogą uzyskać dostęp do wybranych pomocników rdzenia przez `api.runtime`. Dla TTS:

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
- Używa konfiguracji rdzeniowej `messages.tts` oraz wyboru dostawcy.
- Zwraca bufor audio PCM + częstotliwość próbkowania. Pluginy muszą przeskalować/zakodować je dla dostawców.
- `listVoices` jest opcjonalne per dostawca. Używaj go w pickerach głosów lub przepływach setup należących do dostawcy.
- Listy głosów mogą zawierać bogatsze metadane, takie jak locale, płeć i tagi osobowości dla pickerów świadomych dostawcy.
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

- Zachowaj politykę TTS, fallback i dostarczanie odpowiedzi w rdzeniu.
- Używaj dostawców mowy do zachowań syntezy należących do dostawcy.
- Starsze wejście Microsoft `edge` jest normalizowane do identyfikatora dostawcy `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden plugin dostawcy może posiadać
  dostawców tekstu, mowy, obrazów i przyszłych mediów, gdy OpenClaw dodaje te
  kontrakty możliwości.

W przypadku rozumienia obrazów/audio/wideo pluginy rejestrują jednego typowanego
dostawcę media-understanding zamiast ogólnego worka klucz/wartość:

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

- Zachowaj orkiestrację, fallback, konfigurację i integrację kanałów w rdzeniu.
- Zachowaj zachowanie dostawcy w pluginie dostawcy.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyniku, nowe opcjonalne możliwości.
- Generowanie wideo już podąża za tym samym wzorcem:
  - rdzeń posiada kontrakt możliwości i pomocnik runtime
  - pluginy dostawców rejestrują `api.registerVideoGenerationProvider(...)`
  - pluginy funkcji/kanałów korzystają z `api.runtime.videoGeneration.*`

Dla pomocników runtime media-understanding pluginy mogą wywoływać:

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

W przypadku transkrypcji audio pluginy mogą używać albo runtime media-understanding,
albo starszego aliasu STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcjonalne, gdy nie można wiarygodnie wywnioskować MIME:
  mime: "audio/ogg",
});
```

Uwagi:

- `api.runtime.mediaUnderstanding.*` to preferowana współdzielona powierzchnia dla
  rozumienia obrazów/audio/wideo.
- Używa konfiguracji audio media-understanding rdzenia (`tools.media.audio`) oraz kolejności fallback dostawców.
- Zwraca `{ text: undefined }`, gdy nie został wygenerowany wynik transkrypcji (na przykład przy pominiętym/nieobsługiwanym wejściu).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą także uruchamiać w tle przebiegi subagenta przez `api.runtime.subagent`:

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
- W przypadku przebiegów fallback należących do pluginu operatorzy muszą wyrazić zgodę przez `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane pluginy do określonych kanonicznych celów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny cel.
- Przebiegi subagentów z niezaufanych pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast cicho przechodzić na fallback.

W przypadku web search pluginy mogą korzystać ze współdzielonego pomocnika runtime zamiast
sięgać do integracji narzędzia agenta:

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

Pluginy mogą też rejestrować dostawców web-search przez
`api.registerWebSearchProvider(...)`.

Uwagi:

- Zachowaj wybór dostawcy, rozwiązywanie poświadczeń i współdzieloną semantykę żądań w rdzeniu.
- Używaj dostawców web-search dla transportów wyszukiwania specyficznych dla dostawcy.
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

- `generate(...)`: generuje obraz z użyciem skonfigurowanego łańcucha dostawców generowania obrazów.
- `listProviders(...)`: wyświetla dostępnych dostawców generowania obrazów i ich możliwości.

## Trasy HTTP Gatewaya

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

- `path`: ścieżka trasy pod serwerem HTTP gatewaya.
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać zwykłego auth gatewaya, albo `"plugin"` dla auth/weryfikacji webhooka zarządzanych przez plugin.
- `match`: opcjonalne. `"exact"` (domyślnie) albo `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwraca `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania pluginu. Użyj zamiast tego `api.registerHttpRoute(...)`.
- Trasy pluginów muszą jawnie deklarować `auth`.
- Konflikty dokładnych `path + match` są odrzucane, chyba że `replaceExisting: true`, a jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy z różnymi poziomami `auth` są odrzucane. Łańcuchy przejść `exact`/`prefix` utrzymuj tylko na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie operatorowych zakresów runtime. Służą do webhooków/weryfikacji podpisów zarządzanych przez plugin, a nie uprzywilejowanych wywołań pomocników Gatewaya.
- Trasy `auth: "gateway"` działają wewnątrz zakresu runtime żądania Gatewaya, ale ten zakres jest celowo konserwatywny:
  - uwierzytelnianie bearer współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje zakresy runtime trasy pluginu przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP niosące tożsamość (na przykład `trusted-proxy` albo `gateway.auth.mode = "none"` na prywatnym ingressie) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny w takich żądaniach trasy pluginu niosących tożsamość, zakres runtime wraca do `operator.write`
- Praktyczna zasada: nie zakładaj, że trasa pluginu z auth gatewaya jest domyślnie powierzchnią administracyjną. Jeśli Twoja trasa wymaga zachowania tylko dla admina, wymagaj trybu auth niosącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu Plugin SDK

Podczas tworzenia pluginów używaj podścieżek SDK zamiast monolitycznego importu `openclaw/plugin-sdk`:

- `openclaw/plugin-sdk/plugin-entry` dla prymitywów rejestracji pluginów.
- `openclaw/plugin-sdk/core` dla ogólnego współdzielonego kontraktu skierowanego do pluginów.
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
  `openclaw/plugin-sdk/secret-input` i
  `openclaw/plugin-sdk/webhook-ingress` dla współdzielonej integracji setup/auth/reply/webhook.
  `channel-inbound` to współdzielony dom dla debounce, dopasowywania wzmianek,
  pomocników polityki wzmianek przychodzących, formatowania kopert i pomocników
  kontekstu kopert przychodzących.
  `channel-setup` to wąska szczelina setup z opcjonalną instalacją.
  `setup-runtime` to bezpieczna dla runtime powierzchnia setup używana przez `setupEntry` /
  odroczone uruchamianie, w tym adaptery łatek setup bezpieczne przy imporcie.
  `setup-adapter-runtime` to szczelina adaptera setup kont świadoma env.
  `setup-tools` to mała szczelina pomocników CLI/archive/docs (`formatCliCommand`,
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
  `openclaw/plugin-sdk/directory-runtime` dla współdzielonych pomocników runtime/config.
  `telegram-command-config` to wąska publiczna szczelina do normalizacji/walidacji niestandardowych
  poleceń Telegram i pozostaje dostępna nawet wtedy, gdy powierzchnia kontraktu bundlowanego
  Telegram jest tymczasowo niedostępna.
  `text-runtime` to współdzielona szczelina tekst/markdown/logowanie, w tym
  usuwanie tekstu widocznego dla asystenta, pomocniki renderowania/dzielenia markdown,
  pomocniki redakcji, pomocniki tagów dyrektyw i bezpieczne narzędzia tekstowe.
- Szczeliny kanałów specyficzne dla zatwierdzeń powinny preferować jeden kontrakt
  `approvalCapability` na pluginie. Rdzeń odczytuje wtedy auth zatwierdzeń, dostarczanie, renderowanie,
  natywne routowanie i leniwe zachowanie natywnego handlera przez tę jedną możliwość
  zamiast mieszać zachowanie zatwierdzeń z niezwiązanymi polami pluginu.
- `openclaw/plugin-sdk/channel-runtime` jest przestarzałe i pozostaje jedynie jako
  shim zgodności dla starszych pluginów. Nowy kod powinien importować węższe ogólne prymitywy, a kod repo nie powinien dodawać nowych importów tego shimu.
- Wnętrza bundlowanych rozszerzeń pozostają prywatne. Zewnętrzne pluginy powinny używać wyłącznie podścieżek `openclaw/plugin-sdk/*`. Kod rdzenia/testów OpenClaw może używać publicznych punktów wejścia repo pod korzeniem pakietu pluginu, takich jak `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` oraz wąsko zakresowanych plików takich jak
  `login-qr-api.js`. Nigdy nie importuj `src/*` pakietu pluginu z rdzenia ani z
  innego rozszerzenia.
- Podział punktów wejścia repo:
  `<plugin-package-root>/api.js` to barrel pomocników/typów,
  `<plugin-package-root>/runtime-api.js` to barrel tylko runtime,
  `<plugin-package-root>/index.js` to punkt wejścia bundlowanego pluginu,
  a `<plugin-package-root>/setup-entry.js` to punkt wejścia pluginu setup.
- Obecne przykłady bundlowanych dostawców:
  - Anthropic używa `api.js` / `contract-api.js` dla pomocników streamów Claude, takich
    jak `wrapAnthropicProviderStream`, pomocników nagłówków beta i parsowania `service_tier`.
  - OpenAI używa `api.js` dla builderów dostawców, pomocników modeli domyślnych i
    builderów dostawców realtime.
  - OpenRouter używa `api.js` dla swojego buildera dostawcy oraz pomocników onboarding/config,
    podczas gdy `register.runtime.js` może nadal reeksportować ogólne
    pomocniki `plugin-sdk/provider-stream` do lokalnego użycia w repo.
- Publiczne punkty wejścia ładowane przez fasadę preferują aktywny snapshot konfiguracji runtime,
  jeśli istnieje, a następnie wracają do rozstrzygniętego pliku konfiguracji na dysku, gdy
  OpenClaw nie udostępnia jeszcze snapshotu runtime.
- Ogólne współdzielone prymitywy pozostają preferowanym publicznym kontraktem SDK. Nadal istnieje mały
  zastrzeżony zestaw zgodności pomocniczych szczelin markowanych przez bundlowane kanały. Traktuj je jako
  szczeliny utrzymania bundli/zgodności, a nie nowe cele importu dla stron trzecich; nowe kontrakty
  międzykanałowe powinny nadal trafiać do ogólnych podścieżek `plugin-sdk/*` albo do lokalnych barrelów pluginu `api.js` /
  `runtime-api.js`.

Uwaga o zgodności:

- Unikaj głównego barrela `openclaw/plugin-sdk` w nowym kodzie.
- Najpierw preferuj wąskie stabilne prymitywy. Nowsze podścieżki setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool to zamierzony kontrakt dla nowych
  bundlowanych i zewnętrznych pluginów.
  Parsowanie/dopasowywanie celów należy do `openclaw/plugin-sdk/channel-targets`.
  Bramki działań message i pomocniki identyfikatora wiadomości reakcji należą do
  `openclaw/plugin-sdk/channel-actions`.
- Barrels pomocnicze specyficzne dla bundlowanych rozszerzeń nie są domyślnie stabilne. Jeśli
  jakiś pomocnik jest potrzebny tylko bundlowanemu rozszerzeniu, trzymaj go za lokalną szczeliną
  `api.js` albo `runtime-api.js` tego rozszerzenia zamiast promować go do
  `openclaw/plugin-sdk/<extension>`.
- Nowe współdzielone szczeliny pomocnicze powinny być ogólne, a nie markowane przez kanał. Współdzielone parsowanie celów należy do `openclaw/plugin-sdk/channel-targets`; wnętrza specyficzne dla kanału pozostają za lokalną szczeliną `api.js` albo `runtime-api.js`
  należącą do odpowiedniego pluginu.
- Podścieżki specyficzne dla możliwości, takie jak `image-generation`,
  `media-understanding` i `speech`, istnieją, ponieważ bundlowane/natywne pluginy używają
  ich już dziś. Ich obecność nie oznacza sama w sobie, że każdy eksportowany pomocnik jest
  długoterminowym zamrożonym kontraktem zewnętrznym.

## Schematy narzędzia message

Pluginy powinny posiadać wkład do schematu `describeMessageTool(...)` specyficzny dla kanału.
Pola specyficzne dla dostawcy trzymaj w pluginie, a nie we współdzielonym rdzeniu.

Dla współdzielonych przenośnych fragmentów schematu używaj ogólnych pomocników eksportowanych przez
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` dla payloadów w stylu siatki przycisków
- `createMessageToolCardSchema()` dla payloadów ustrukturyzowanych kart

Jeśli jakiś kształt schematu ma sens tylko dla jednego dostawcy, definiuj go w
własnym źródle tego pluginu, zamiast promować go do współdzielonego SDK.

## Rozstrzyganie celów kanału

Pluginy kanałów powinny posiadać semantykę celów specyficzną dla kanału. Zachowaj
współdzielonego hosta outbound jako ogólnego i używaj powierzchni adaptera wiadomości dla reguł dostawcy:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany cel
  powinien być traktowany jako `direct`, `group` czy `channel` przed wyszukaniem w katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi rdzeniowi, czy dane
  wejście powinno od razu przejść do rozstrzygania podobnego do identyfikatora zamiast do wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` to fallback pluginu, gdy
  rdzeń potrzebuje ostatecznego rozstrzygnięcia należącego do dostawcy po normalizacji albo po
  braku trafienia w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` obsługuje budowę trasy sesji
  specyficznej dla dostawcy po rozstrzygnięciu celu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategorycznych, które powinny nastąpić przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` do sprawdzeń typu „traktuj to jako jawny/natywny identyfikator celu”.
- Używaj `resolveTarget` jako fallback normalizacji specyficzny dla dostawcy, a nie do
  szerokiego wyszukiwania katalogowego.
- Natywne identyfikatory dostawcy, takie jak identyfikatory czatu, identyfikatory wątków, JID-y, handle i identyfikatory pokojów trzymaj w wartościach `target` albo parametrach specyficznych dla dostawcy, a nie w ogólnych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny utrzymywać tę logikę w
pluginie i ponownie wykorzystywać współdzielone pomocniki z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery DM oparte na allowliście
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogu w zakresie konta

Współdzielone pomocniki w `directory-runtime` obsługują tylko operacje ogólne:

- filtrowanie zapytań
- stosowanie limitów
- pomocniki deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja kont specyficzna dla kanału i normalizacja identyfikatorów powinny pozostać w implementacji pluginu.

## Katalogi dostawców

Pluginy dostawców mogą definiować katalogi modeli dla wnioskowania przez
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu dostawcy
- `{ providers }` dla wielu wpisów dostawców

Używaj `catalog`, gdy plugin posiada identyfikatory modeli specyficzne dla dostawcy, wartości domyślne `baseUrl` albo metadane modeli chronione auth.

`catalog.order` steruje tym, kiedy katalog pluginu łączy się względem
wbudowanych niejawnych dostawców OpenClaw:

- `simple`: zwykli dostawcy oparci na kluczu API albo env
- `profile`: dostawcy pojawiający się, gdy istnieją profile auth
- `paired`: dostawcy, którzy syntetyzują wiele powiązanych wpisów dostawców
- `late`: ostatnie przejście, po innych niejawnych dostawcach

Późniejsi dostawcy wygrywają przy kolizji kluczy, więc pluginy mogą celowo nadpisywać
wbudowany wpis dostawcy z tym samym identyfikatorem dostawcy.

Zgodność:

- `discovery` nadal działa jako starszy alias
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Inspekcja kanałów tylko do odczytu

Jeśli Twój plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` to ścieżka runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane i może szybko kończyć się błędem, gdy brakuje wymaganych sekretów.
- Ścieżki poleceń tylko do odczytu, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` i przepływy doctor/naprawy konfiguracji
  nie powinny wymagać materializacji poświadczeń runtime tylko po to, by opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Dołączaj pola źródła/statusu poświadczeń, gdy to istotne, na przykład:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, by raportować dostępność tylko do odczytu. Zwrócenie `tokenStatus: "available"` (i pasującego pola źródła) wystarczy dla poleceń w stylu statusu.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale niedostępne
  w bieżącej ścieżce polecenia.

Dzięki temu polecenia tylko do odczytu mogą raportować „skonfigurowane, ale niedostępne w tej ścieżce polecenia” zamiast kończyć się awarią albo błędnie zgłaszać, że konto nie jest skonfigurowane.

## Pakiety pack

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

Jeśli Twój plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Bariera bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu pluginu
po rozstrzygnięciu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga bezpieczeństwa: `openclaw plugins install` instaluje zależności pluginu przez
`npm install --omit=dev --ignore-scripts` (bez skryptów cyklu życia, bez zależności deweloperskich w runtime). Utrzymuj drzewa zależności pluginów jako „czyste JS/TS” i unikaj pakietów wymagających buildów `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać lekki moduł tylko do setup.
Gdy OpenClaw potrzebuje powierzchni setup dla wyłączonego pluginu kanału albo
gdy plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry` zamiast pełnego wpisu pluginu. Dzięki temu uruchamianie i setup są lżejsze,
gdy główny wpis pluginu rejestruje również narzędzia, hooki lub inny kod tylko runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć plugin kanału do tej samej ścieżki `setupEntry` podczas fazy
uruchamiania gatewaya przed nasłuchem, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię uruchamiania, która musi istnieć
zanim gateway zacznie nasłuchiwać. W praktyce oznacza to, że wpis setup
musi rejestrować każdą możliwość należącą do kanału, od której zależy uruchamianie, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne, zanim gateway zacznie nasłuchiwać
- wszelkie metody gatewaya, narzędzia lub usługi, które muszą istnieć w tym samym oknie

Jeśli Twój pełny wpis nadal posiada jakąkolwiek wymaganą możliwość uruchamiania, nie włączaj
tej flagi. Pozostaw plugin przy zachowaniu domyślnym i pozwól OpenClaw załadować
pełny wpis podczas uruchamiania.

Bundlowane kanały mogą także publikować pomocniki powierzchni kontraktowej tylko do setup, z których rdzeń
może korzystać przed załadowaniem pełnego runtime kanału. Obecna powierzchnia promocji setup to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Rdzeń używa tej powierzchni, gdy musi awansować starszą konfigurację kanału z jednym kontem do
`channels.<id>.accounts.*` bez ładowania pełnego wpisu pluginu.
Matrix jest obecnym bundlowanym przykładem: przenosi tylko klucze auth/bootstrap do
nazwanego awansowanego konta, gdy nazwane konta już istnieją, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery łatek setup utrzymują leniwe wykrywanie powierzchni kontraktowej bundli. Czas
importu pozostaje lekki; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu zamiast
ponownie wchodzić w uruchamianie bundlowanego kanału przy imporcie modułu.

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

### Metadane katalogu kanału

Pluginy kanałów mogą reklamować metadane setup/wykrywania przez `openclaw.channel` oraz
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

- `detailLabel`: etykieta pomocnicza dla bogatszych powierzchni katalogu/statusu
- `docsLabel`: nadpisanie tekstu linku do dokumentacji
- `preferOver`: identyfikatory pluginów/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki tekstu dla powierzchni wyboru
- `markdownCapable`: oznacza kanał jako zdolny do markdown na potrzeby decyzji o formatowaniu outbound
- `exposure.configured`: ukrywa kanał przed powierzchniami listowania skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał przed interaktywnymi pickerami setup/configure, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu szybkiego startu `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta nawet wtedy, gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje wyszukiwanie sesji przy rozstrzyganiu celów announce

OpenClaw może też łączyć **zewnętrzne katalogi kanałów** (na przykład eksport rejestru MPM).
Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Albo ustaw `OPENCLAW_PLUGIN_CATALOG_PATHS` (lub `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (rozdzielanych przecinkiem/średnikiem/`PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje także `"packages"` albo `"plugins"` jako starsze aliasy klucza `"entries"`.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu posiadają orkiestrację kontekstu sesji dla ingestu, składania
i kompaktowania. Rejestruj je z poziomu pluginu przez
`api.registerContextEngine(id, factory)`, a następnie wybieraj aktywny silnik przez
`plugins.slots.contextEngine`.

Używaj tego, gdy Twój plugin musi zastąpić lub rozszerzyć domyślny potok kontekstu
zamiast tylko dodawać memory search albo hooki.

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

Jeśli Twój silnik **nie** posiada algorytmu kompaktowania, zachowaj implementację `compact()`
i jawnie do niego deleguj:

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

Gdy plugin potrzebuje zachowania, które nie mieści się w obecnym API, nie omijaj
systemu pluginów przez prywatny reach-in. Dodaj brakującą możliwość.

Zalecana sekwencja:

1. zdefiniuj kontrakt rdzenia
   Zdecyduj, jakie współdzielone zachowanie powinien posiadać rdzeń: polityka, fallback, łączenie konfiguracji,
   cykl życia, semantyka skierowana do kanałów i kształt pomocników runtime.
2. dodaj typowane powierzchnie rejestracji/runtime pluginów
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię możliwości.
3. podłącz konsumentów rdzenia i kanałów/funkcji
   Kanały i pluginy funkcji powinny korzystać z nowej możliwości przez rdzeń,
   a nie przez bezpośredni import implementacji dostawcy.
4. zarejestruj implementacje dostawców
   Pluginy dostawców następnie rejestrują swoje backendy względem tej możliwości.
5. dodaj pokrycie kontraktowe
   Dodaj testy, aby własność i kształt rejestracji pozostawały jawne w czasie.

Tak OpenClaw pozostaje opiniotwórczy bez twardego zakodowania jednego
światopoglądu dostawcy. Zobacz [Capability Cookbook](/pl/plugins/architecture),
aby znaleźć konkretną listę plików i gotowy przykład.

### Lista kontrolna możliwości

Gdy dodajesz nową możliwość, implementacja zwykle powinna wspólnie dotknąć tych
powierzchni:

- typów kontraktu rdzenia w `src/<capability>/types.ts`
- runnera/pomocnika runtime rdzenia w `src/<capability>/runtime.ts`
- powierzchni rejestracji API pluginów w `src/plugins/types.ts`
- integracji rejestru pluginów w `src/plugins/registry.ts`
- udostępnienia runtime pluginów w `src/plugins/runtime/*`, gdy pluginy funkcji/kanałów
  muszą z tego korzystać
- pomocników przechwytywania/testów w `src/test-utils/plugin-registration.ts`
- asercji własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacji operatora/pluginów w `docs/`

Jeśli którejś z tych powierzchni brakuje, zwykle oznacza to, że możliwość nie jest jeszcze
w pełni zintegrowana.

### Szablon możliwości

Minimalny wzorzec:

```ts
// kontrakt rdzenia
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API pluginu
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// współdzielony pomocnik runtime dla pluginów funkcji/kanałów
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

- rdzeń posiada kontrakt możliwości + orkiestrację
- pluginy dostawców posiadają implementacje dostawców
- pluginy funkcji/kanałów korzystają z pomocników runtime
- testy kontraktowe utrzymują jawną własność
