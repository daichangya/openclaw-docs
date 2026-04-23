---
read_when:
    - Budowanie lub debugowanie natywnych pluginów OpenClaw
    - Zrozumienie modelu możliwości pluginów lub granic własności
    - Praca nad pipeline ładowania pluginów lub rejestrem
    - Implementowanie hooków runtime providera lub pluginów kanałów
sidebarTitle: Internals
summary: 'Wnętrze pluginów: model możliwości, własność, kontrakty, pipeline ładowania i helpery runtime'
title: Wnętrze pluginów
x-i18n:
    generated_at: "2026-04-23T10:03:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5a766c267b2618140c744cbebd28f2b206568f26ce50095b898520f4663e21d
    source_path: plugins/architecture.md
    workflow: 15
---

# Wnętrze pluginów

<Info>
  To jest **szczegółowa dokumentacja referencyjna architektury**. Praktyczne przewodniki znajdziesz tutaj:
  - [Instalowanie i używanie pluginów](/pl/tools/plugin) — przewodnik użytkownika
  - [Pierwsze kroki](/pl/plugins/building-plugins) — pierwszy tutorial pluginu
  - [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — zbuduj kanał komunikacyjny
  - [Pluginy providerów](/pl/plugins/sdk-provider-plugins) — zbuduj provider modeli
  - [Przegląd SDK](/pl/plugins/sdk-overview) — mapa importów i API rejestracji
</Info>

Ta strona opisuje wewnętrzną architekturę systemu pluginów OpenClaw.

## Publiczny model możliwości

Możliwości to publiczny model **natywnych pluginów** wewnątrz OpenClaw. Każdy
natywny plugin OpenClaw rejestruje się względem jednego lub większej liczby typów możliwości:

| Możliwość             | Metoda rejestracji                              | Przykładowe pluginy                  |
| --------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferencja tekstowa   | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend inferencji CLI | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Mowa                  | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkrypcja realtime | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Głos realtime         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Rozumienie mediów     | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generowanie obrazów   | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki    | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generowanie wideo     | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pobieranie web        | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Wyszukiwanie web      | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanał / komunikacja   | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Plugin, który rejestruje zero możliwości, ale dostarcza hooki, narzędzia lub
usługi, jest pluginem **legacy hook-only**. Ten wzorzec nadal jest w pełni obsługiwany.

### Stanowisko wobec zgodności zewnętrznej

Model możliwości jest wdrożony w core i używany dziś przez bundlowane/natywne pluginy,
ale zgodność zewnętrznych pluginów nadal wymaga wyższego progu niż „jest eksportowane, więc jest zamrożone”.

Aktualne wskazówki:

- **istniejące pluginy zewnętrzne:** utrzymuj działanie integracji opartych na hookach; traktuj
  to jako bazową linię zgodności
- **nowe bundlowane/natywne pluginy:** preferuj jawną rejestrację możliwości zamiast
  sięgania do providerów w sposób vendor-specific lub nowych projektów hook-only
- **zewnętrzne pluginy adoptujące rejestrację możliwości:** dozwolone, ale traktuj
  powierzchnie helperów specyficzne dla możliwości jako ewoluujące, chyba że dokumentacja jawnie oznacza kontrakt jako stabilny

Praktyczna reguła:

- API rejestracji możliwości to zamierzony kierunek
- legacy hooki pozostają najbezpieczniejszą ścieżką bez psucia istniejących zewnętrznych pluginów podczas przejścia
- eksportowane podścieżki helperów nie są sobie równe; preferuj wąski udokumentowany
  kontrakt, a nie przypadkowo wyeksportowane helpery

### Kształty pluginów

OpenClaw klasyfikuje każdy załadowany plugin do określonego kształtu na podstawie jego rzeczywistego
zachowania rejestracyjnego (a nie tylko statycznych metadanych):

- **plain-capability** -- rejestruje dokładnie jeden typ możliwości (na przykład
  plugin tylko providera, taki jak `mistral`)
- **hybrid-capability** -- rejestruje wiele typów możliwości (na przykład
  `openai` obsługuje inferencję tekstową, mowę, rozumienie mediów i generowanie
  obrazów)
- **hook-only** -- rejestruje tylko hooki (typowane lub niestandardowe), bez
  możliwości, narzędzi, poleceń ani usług
- **non-capability** -- rejestruje narzędzia, polecenia, usługi lub trasy, ale nie
  możliwości

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt pluginu i rozkład możliwości.
Szczegóły znajdziesz w [Dokumentacji CLI](/pl/cli/plugins#inspect).

### Legacy hooki

Hook `before_agent_start` pozostaje obsługiwany jako ścieżka zgodności dla
pluginów hook-only. Nadal zależą od niego rzeczywiste legacy pluginy.

Kierunek:

- utrzymywać jego działanie
- dokumentować go jako legacy
- preferować `before_model_resolve` do pracy z nadpisywaniem modelu/providera
- preferować `before_prompt_build` do pracy z mutacją promptu
- usuwać dopiero wtedy, gdy realne użycie spadnie, a pokrycie fixture potwierdzi bezpieczeństwo migracji

### Sygnały zgodności

Gdy uruchamiasz `openclaw doctor` lub `openclaw plugins inspect <id>`, możesz zobaczyć
jedną z tych etykiet:

| Sygnał                     | Znaczenie                                                    |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfiguracja parsuje się poprawnie i pluginy są rozwiązywane |
| **compatibility advisory** | Plugin używa obsługiwanego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, które jest przestarzałe   |
| **hard error**             | Konfiguracja jest nieprawidłowa lub plugin nie załadował się |

Ani `hook-only`, ani `before_agent_start` nie zepsują dziś Twojego pluginu --
`hook-only` ma charakter doradczy, a `before_agent_start` wywołuje jedynie ostrzeżenie. Te
sygnały pojawiają się również w `openclaw status --all` i `openclaw plugins doctor`.

## Przegląd architektury

System pluginów OpenClaw ma cztery warstwy:

1. **Manifest + wykrywanie**
   OpenClaw znajduje kandydatów na pluginy w skonfigurowanych ścieżkach, katalogach głównych workspace,
   globalnych katalogach pluginów oraz wśród bundlowanych pluginów. Wykrywanie najpierw odczytuje
   natywne manifesty `openclaw.plugin.json` oraz obsługiwane manifesty bundli.
2. **Włączanie + walidacja**
   Core decyduje, czy wykryty plugin jest włączony, wyłączony, zablokowany czy
   wybrany do ekskluzywnego slotu, takiego jak pamięć.
3. **Ładowanie runtime**
   Natywne pluginy OpenClaw są ładowane in-process przez jiti i rejestrują
   możliwości w centralnym rejestrze. Zgodne bundle są normalizowane do rekordów
   rejestru bez importowania kodu runtime.
4. **Konsumpcja powierzchni**
   Reszta OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację
   providera, hooki, trasy HTTP, polecenia CLI i usługi.

W przypadku CLI pluginów wykrywanie poleceń głównych jest rozdzielone na dwie fazy:

- metadane czasu parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- właściwy moduł CLI pluginu może pozostać leniwy i rejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI należący do pluginu pozostaje w pluginie, a jednocześnie OpenClaw może
zarezerwować nazwy poleceń głównych przed parsowaniem.

Ważna granica projektowa:

- wykrywanie + walidacja konfiguracji powinny działać na podstawie **metadanych manifestu/schematu**
  bez wykonywania kodu pluginu
- natywne zachowanie runtime pochodzi ze ścieżki `register(api)` modułu pluginu

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone pluginy i
budować podpowiedzi UI/schematu zanim pełny runtime będzie aktywny.

### Pluginy kanałów i współdzielone narzędzie wiadomości

Pluginy kanałów nie muszą rejestrować osobnego narzędzia send/edit/react dla
zwykłych akcji czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w core, a
pluginy kanałów zarządzają specyficznym dla kanału wykrywaniem i wykonaniem za nim.

Aktualna granica wygląda tak:

- core zarządza hostem współdzielonego narzędzia `message`, okablowaniem promptów, ewidencją sesji/wątków
  oraz dyspozycją wykonania
- pluginy kanałów zarządzają wykrywaniem działań w swoim zakresie, wykrywaniem możliwości i wszelkimi
  fragmentami schematu specyficznymi dla kanału
- pluginy kanałów zarządzają specyficzną dla providera gramatyką konwersacji sesji, na przykład
  tym, jak identyfikatory konwersacji kodują identyfikatory wątków lub dziedziczą po konwersacjach nadrzędnych
- pluginy kanałów wykonują końcową akcję przez swój adapter działań

Dla pluginów kanałów powierzchnią SDK jest
`ChannelMessageActionAdapter.describeMessageTool(...)`. To zunifikowane wywołanie wykrywania pozwala pluginowi zwrócić widoczne akcje, możliwości i wkłady do schematu
razem, aby te elementy nie rozjeżdżały się.

Gdy parametr message-tool specyficzny dla kanału przenosi źródło mediów, takie jak
lokalna ścieżka lub zdalny URL mediów, plugin powinien również zwracać
`mediaSourceParams` z `describeMessageTool(...)`. Core używa tej jawnej
listy, aby zastosować normalizację ścieżek sandboxa i podpowiedzi dostępu do mediów wychodzących
bez hardcodowania nazw parametrów należących do pluginu.
Preferuj tam mapy scoped do akcji, a nie jedną płaską listę dla całego kanału, tak aby
parametr mediów dotyczący tylko profilu nie był normalizowany przy niezwiązanych akcjach, takich jak
`send`.

Core przekazuje zakres runtime do tego kroku wykrywania. Ważne pola obejmują:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufane przychodzące `requesterSenderId`

To ma znaczenie dla pluginów zależnych od kontekstu. Kanał może ukrywać lub ujawniać
akcje wiadomości na podstawie aktywnego konta, bieżącego pokoju/wątku/wiadomości lub
zaufanej tożsamości nadawcy żądania bez hardcodowania gałęzi specyficznych dla kanału w
narzędziu `message` w core.

Dlatego zmiany routingu embedded-runner nadal są pracą po stronie pluginu: runner odpowiada
za przekazywanie bieżącej tożsamości czatu/sesji do granicy wykrywania pluginu, aby
współdzielone narzędzie `message` ujawniało właściwą powierzchnię należącą do kanału dla bieżącej tury.

W przypadku helperów wykonania należących do kanału bundlowane pluginy powinny utrzymywać runtime wykonania
wewnątrz własnych modułów rozszerzeń. Core nie zarządza już runtime’ami akcji wiadomości
Discord, Slack, Telegram ani WhatsApp w `src/agents/tools`.
Nie publikujemy osobnych podścieżek `plugin-sdk/*-action-runtime`, a bundlowane
pluginy powinny importować własny lokalny kod runtime bezpośrednio ze swoich
modułów należących do rozszerzeń.

Ta sama granica dotyczy ogólnie nazwanych po providerach szczelin SDK: core nie
powinien importować wygodnych barrelów specyficznych dla kanałów Slack, Discord, Signal,
WhatsApp ani podobnych rozszerzeń. Jeśli core potrzebuje jakiegoś zachowania, powinien albo
użyć własnego barrela `api.ts` / `runtime-api.ts` bundlowanego pluginu, albo podnieść tę potrzebę
do wąskiej generycznej możliwości we współdzielonym SDK.

W przypadku ankiet istnieją dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów, które pasują do wspólnego
  modelu ankiet
- `actions.handleAction("poll")` to preferowana ścieżka dla semantyki ankiet specyficznej dla kanału
  lub dodatkowych parametrów ankiet

Core odkłada teraz współdzielone parsowanie ankiet aż do chwili, gdy dyspozycja ankiety pluginu odrzuci
akcję, tak aby handlery ankiet należące do pluginu mogły akceptować pola ankiet specyficzne dla kanału
bez wcześniejszego blokowania przez generyczny parser ankiet.

Pełną sekwencję startu znajdziesz w sekcji [Pipeline ładowania](#load-pipeline).

## Model własności możliwości

OpenClaw traktuje natywny plugin jako granicę własności dla **firmy** lub **funkcji**, a nie jako worek przypadkowych integracji.

Oznacza to, że:

- plugin firmy powinien zwykle posiadać wszystkie powierzchnie OpenClaw-facing tej firmy
- plugin funkcji powinien zwykle posiadać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny konsumować współdzielone możliwości core zamiast ad hoc ponownie implementować zachowanie providera

Przykłady:

- bundlowany plugin `openai` posiada zachowanie providera modeli OpenAI oraz zachowanie OpenAI dla
  mowy + realtime voice + rozumienia mediów + generowania obrazów
- bundlowany plugin `elevenlabs` posiada zachowanie mowy ElevenLabs
- bundlowany plugin `microsoft` posiada zachowanie mowy Microsoft
- bundlowany plugin `google` posiada zachowanie providera modeli Google oraz zachowanie Google dla
  rozumienia mediów + generowania obrazów + wyszukiwania web
- bundlowany plugin `firecrawl` posiada zachowanie Firecrawl dla web fetch
- bundlowane pluginy `minimax`, `mistral`, `moonshot` i `zai` posiadają swoje
  backendy rozumienia mediów
- bundlowany plugin `qwen` posiada zachowanie providera tekstowego Qwen oraz
  zachowanie rozumienia mediów i generowania wideo
- plugin `voice-call` jest pluginem funkcji: posiada transport połączeń, narzędzia,
  CLI, trasy i mostkowanie strumieni mediów Twilio, ale konsumuje współdzielone możliwości speech
  oraz realtime transcription i realtime voice zamiast bezpośrednio importować pluginy vendorów

Zamierzony stan końcowy to:

- OpenAI żyje w jednym pluginie, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i
  przyszłe wideo
- inny vendor może zrobić to samo dla własnej powierzchni
- kanały nie dbają o to, który plugin vendora posiada providera; konsumują
  współdzielony kontrakt możliwości udostępniany przez core

To jest kluczowe rozróżnienie:

- **plugin** = granica własności
- **capability** = kontrakt core, który wiele pluginów może implementować lub konsumować

Więc jeśli OpenClaw doda nową dziedzinę, taką jak wideo, pierwszym pytaniem nie jest
„który provider ma hardcodować obsługę wideo?” Pierwsze pytanie brzmi „jaki jest
kontrakt możliwości wideo w core?” Gdy taki kontrakt już istnieje, pluginy vendorów
mogą się względem niego rejestrować, a pluginy kanałów/funkcji mogą go konsumować.

Jeśli możliwość jeszcze nie istnieje, właściwy ruch zwykle wygląda tak:

1. zdefiniuj brakującą możliwość w core
2. udostępnij ją przez API/runtime pluginów w sposób typowany
3. podłącz kanały/funkcje do tej możliwości
4. pozwól pluginom vendorów rejestrować implementacje

Dzięki temu własność pozostaje jawna, a jednocześnie unika się zachowania core zależnego od
jednego vendora lub jednorazowej ścieżki kodu specyficznej dla pluginu.

### Warstwowanie możliwości

Używaj tego modelu myślowego przy podejmowaniu decyzji, gdzie powinien znajdować się kod:

- **warstwa możliwości core**: współdzielona orkiestracja, polityka, fallback, reguły
  scalania konfiguracji, semantyka dostarczania i typowane kontrakty
- **warstwa pluginu vendora**: API specyficzne dla vendora, uwierzytelnianie, katalogi modeli, synteza mowy,
  generowanie obrazów, przyszłe backendy wideo, endpointy użycia
- **warstwa pluginu kanału/funkcji**: integracja Slack/Discord/voice-call/etc.,
  która konsumuje możliwości core i prezentuje je na powierzchni

Na przykład TTS ma taki kształt:

- core zarządza polityką TTS w czasie odpowiedzi, kolejnością fallbacku, preferencjami i dostarczaniem do kanałów
- `openai`, `elevenlabs` i `microsoft` zarządzają implementacjami syntezy
- `voice-call` konsumuje helper runtime TTS dla telefonii

Ten sam wzorzec powinien być preferowany dla przyszłych możliwości.

### Przykład pluginu firmy z wieloma możliwościami

Plugin firmy powinien z zewnątrz sprawiać wrażenie spójnego. Jeśli OpenClaw ma współdzielone
kontrakty dla modeli, mowy, transkrypcji realtime, głosu realtime, rozumienia mediów, generowania obrazów, generowania wideo, web fetch i web search,
vendor może posiadać wszystkie swoje powierzchnie w jednym miejscu:

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

Nie chodzi o dokładne nazwy helperów. Liczy się kształt:

- jeden plugin posiada powierzchnię vendora
- core nadal posiada kontrakty możliwości
- kanały i pluginy funkcji konsumują helpery `api.runtime.*`, a nie kod vendora
- testy kontraktowe mogą potwierdzić, że plugin zarejestrował możliwości, które
  deklaruje jako należące do niego

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazu/audio/wideo jako jedną współdzieloną
możliwość. Ten sam model własności obowiązuje tutaj:

1. core definiuje kontrakt rozumienia mediów
2. pluginy vendorów rejestrują odpowiednio `describeImage`, `transcribeAudio` i
   `describeVideo`
3. kanały i pluginy funkcji konsumują współdzielone zachowanie core zamiast
   bezpośrednio podłączać się do kodu vendora

Dzięki temu założenia jednego providera dotyczące wideo nie są wbudowywane do core. Plugin posiada
powierzchnię vendora; core posiada kontrakt możliwości i zachowanie fallback.

Generowanie wideo już używa tej samej sekwencji: core posiada typowany
kontrakt możliwości i helper runtime, a pluginy vendorów rejestrują
implementacje `api.registerVideoGenerationProvider(...)` względem niego.

Potrzebujesz konkretnej checklisty wdrożenia? Zobacz
[Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API pluginów jest celowo typowana i scentralizowana w
`OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji i
helpery runtime, na których plugin może polegać.

Dlaczego to ma znaczenie:

- autorzy pluginów dostają jeden stabilny wewnętrzny standard
- core może odrzucać zduplikowaną własność, na przykład dwa pluginy rejestrujące to samo ID providera
- startup może ujawniać użyteczne diagnostyki dla nieprawidłowych rejestracji
- testy kontraktowe mogą egzekwować własność bundlowanych pluginów i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

1. **egzekwowanie rejestracji w runtime**
   Rejestr pluginów waliduje rejestracje podczas ładowania pluginów. Przykłady:
   zduplikowane ID providerów, zduplikowane ID providerów mowy i nieprawidłowe
   rejestracje powodują diagnostyki pluginów zamiast niezdefiniowanego zachowania.
2. **testy kontraktowe**
   Bundlowane pluginy są przechwytywane w rejestrach kontraktowych podczas uruchomień testów, dzięki czemu
   OpenClaw może jawnie potwierdzić własność. Dziś jest to używane dla
   providerów modeli, providerów mowy, providerów web search i własności bundlowanych rejestracji.

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
- konsumowalne przez kanały/funkcje bez wiedzy o vendorze

Złe kontrakty pluginów to:

- polityka specyficzna dla vendora ukryta w core
- jednorazowe furtki pluginów omijające rejestr
- kod kanału sięgający bezpośrednio do implementacji vendora
- ad hoc obiekty runtime, które nie są częścią `OpenClawPluginApi` ani
  `api.runtime`

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj możliwość, a potem
pozwól pluginom się do niej podłączać.

## Model wykonania

Natywne pluginy OpenClaw działają **in-process** z Gateway. Nie są
sandboxowane. Załadowany natywny plugin ma tę samą granicę zaufania na poziomie procesu co kod core.

Konsekwencje:

- natywny plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi
- błąd natywnego pluginu może crashować lub destabilizować Gateway
- złośliwy natywny plugin jest równoważny dowolnemu wykonaniu kodu wewnątrz procesu OpenClaw

Zgodne bundle są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je
jako pakiety metadanych/treści. W obecnych wydaniach oznacza to głównie bundlowane
Skills.

Używaj allowlist i jawnych ścieżek instalacji/ładowania dla pluginów niebędących bundlowanymi. Traktuj
pluginy workspace jako kod czasu developmentu, a nie domyślne ustawienie produkcyjne.

Dla bundlowanych nazw pakietów workspace utrzymuj ID pluginu zakotwiczone w nazwie npm:
domyślnie `@openclaw/<id>` lub zatwierdzony typowany sufiks, taki jak
`-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy
pakiet celowo udostępnia węższą rolę pluginu.

Ważna uwaga o zaufaniu:

- `plugins.allow` ufa **ID pluginów**, a nie pochodzeniu źródła.
- Plugin workspace o tym samym ID co bundlowany plugin celowo przesłania
  bundlowaną kopię, gdy taki plugin workspace jest włączony/na allowliście.
- To normalne i przydatne dla lokalnego developmentu, testowania łatek i hotfixów.
- Zaufanie do bundlowanego pluginu jest rozwiązywane na podstawie snapshotu źródła — manifestu i
  kodu na dysku w momencie ładowania — a nie na podstawie metadanych instalacji. Uszkodzony
  lub podmieniony rekord instalacji nie może po cichu poszerzyć powierzchni zaufania bundlowanego pluginu poza to, co deklaruje rzeczywiste źródło.

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodę implementacyjną.

Zachowaj publiczną rejestrację możliwości. Ogranicz eksporty helperów niebędących kontraktem:

- podścieżki helperów specyficzne dla bundlowanych pluginów
- podścieżki okablowania runtime nieprzeznaczone jako publiczne API
- helpery wygody specyficzne dla vendora
- helpery konfiguracji/onboardingu będące szczegółami implementacji

Niektóre podścieżki helperów bundlowanych pluginów nadal pozostają w wygenerowanej mapie eksportów SDK dla zgodności i utrzymania bundlowanych pluginów. Aktualne przykłady obejmują
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz kilka szczelin `plugin-sdk/matrix*`. Traktuj je jako
zastrzeżone eksporty będące szczegółami implementacji, a nie jako zalecany wzorzec SDK dla
nowych pluginów firm trzecich.

## Pipeline ładowania

Podczas startu OpenClaw w przybliżeniu wykonuje to:

1. wykrywa katalogi główne kandydatów na pluginy
2. odczytuje natywne lub zgodne manifesty bundli i metadane pakietów
3. odrzuca niebezpiecznych kandydatów
4. normalizuje konfigurację pluginów (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decyduje o włączeniu dla każdego kandydata
6. ładuje włączone natywne moduły: zbudowane bundlowane moduły używają natywnego loadera;
   niezbudowane natywne pluginy używają jiti
7. wywołuje hooki natywne `register(api)` i zbiera rejestracje do rejestru pluginów
8. udostępnia rejestr powierzchniom poleceń/runtime

<Note>
`activate` to legacy alias dla `register` — loader rozwiązuje to, co jest obecne (`def.register ?? def.activate`) i wywołuje je w tym samym miejscu. Wszystkie bundlowane pluginy używają `register`; dla nowych pluginów preferuj `register`.
</Note>

Bramki bezpieczeństwa działają **przed** wykonaniem runtime. Kandydaci są blokowani,
gdy entry wychodzi poza katalog główny pluginu, ścieżka ma prawa zapisu dla wszystkich lub
własność ścieżki wygląda podejrzanie dla pluginów niebędących bundlowanymi.

### Zachowanie manifest-first

Manifest jest źródłem prawdy control-plane. OpenClaw używa go do:

- identyfikowania pluginu
- wykrywania deklarowanych kanałów/Skills/schematu konfiguracji lub możliwości bundla
- walidowania `plugins.entries.<id>.config`
- rozszerzania etykiet/placeholderów Control UI
- pokazywania metadanych instalacji/katalogu
- zachowania tanich deskryptorów aktywacji i konfiguracji bez ładowania runtime pluginu

Dla natywnych pluginów moduł runtime jest częścią data-plane. Rejestruje
rzeczywiste zachowanie, takie jak hooki, narzędzia, polecenia lub przepływy providera.

Opcjonalne bloki manifestu `activation` i `setup` pozostają w control plane.
Są to deskryptory tylko metadanych do planowania aktywacji i wykrywania konfiguracji;
nie zastępują rejestracji runtime, `register(...)` ani `setupEntry`.
Pierwsi aktywni konsumenci aktywacji używają teraz podpowiedzi manifestu dotyczących poleceń, kanałów i providerów,
aby zawężać ładowanie pluginów przed szerszą materializacją rejestru:

- Ładowanie CLI zawęża się do pluginów, które posiadają żądane polecenie główne
- rozwiązywanie konfiguracji kanału/pluginu zawęża się do pluginów, które posiadają żądane
  ID kanału
- jawne rozwiązywanie konfiguracji/runtime providera zawęża się do pluginów, które posiadają żądane
  ID providera

Wykrywanie konfiguracji preferuje teraz identyfikatory należące do deskryptorów, takie jak `setup.providers` i
`setup.cliBackends`, aby zawęzić kandydatów pluginów przed przejściem do
`setup-api` dla pluginów, które nadal potrzebują hooków runtime w czasie konfiguracji. Jeśli więcej niż
jeden wykryty plugin deklaruje to samo znormalizowane ID providera konfiguracji lub backendu CLI,
wyszukiwanie konfiguracji odrzuca niejednoznacznego właściciela zamiast polegać na kolejności wykrywania.

### Co cache’uje loader

OpenClaw utrzymuje krótkie cache in-process dla:

- wyników wykrywania
- danych rejestru manifestów
- rejestrów załadowanych pluginów

Te cache redukują skokowe koszty startu i powtarzane koszty poleceń. Można o nich bezpiecznie myśleć jako o krótkotrwałych cache wydajnościowych, a nie trwałości.

Uwaga wydajnościowa:

- Ustaw `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` lub
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`, aby wyłączyć te cache.
- Dostosuj okna cache przez `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` oraz
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model rejestru

Załadowane pluginy nie mutują bezpośrednio losowych globali core. Rejestrują się w
centralnym rejestrze pluginów.

Rejestr śledzi:

- rekordy pluginów (tożsamość, źródło, pochodzenie, status, diagnostyka)
- narzędzia
- legacy hooki i hooki typowane
- kanały
- providerów
- handlery Gateway RPC
- trasy HTTP
- rejestratory CLI
- usługi działające w tle
- polecenia należące do pluginów

Funkcje core odczytują następnie z tego rejestru zamiast rozmawiać bezpośrednio z modułami pluginów.
Dzięki temu ładowanie pozostaje jednokierunkowe:

- moduł pluginu -> rejestracja w rejestrze
- runtime core -> konsumpcja rejestru

To rozdzielenie ma znaczenie dla utrzymywalności. Oznacza, że większość powierzchni core potrzebuje
tylko jednego punktu integracji: „czytaj rejestr”, a nie „twórz specjalny przypadek dla każdego modułu pluginu”.

## Callbacki wiązania konwersacji

Pluginy, które wiążą konwersację, mogą reagować po rozstrzygnięciu zatwierdzenia.

Użyj `api.onConversationBindingResolved(...)`, aby otrzymać callback po zatwierdzeniu lub odrzuceniu żądania bind:

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

Pola payloadu callbacku:

- `status`: `"approved"` lub `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` lub `"deny"`
- `binding`: rozstrzygnięte wiązanie dla zatwierdzonych żądań
- `request`: oryginalne podsumowanie żądania, wskazówka detach, ID nadawcy oraz
  metadane konwersacji

Ten callback służy tylko do powiadomień. Nie zmienia tego, kto może wiązać
konwersację, i uruchamia się po zakończeniu obsługi zatwierdzenia przez core.

## Hooki runtime providera

Pluginy providerów mają teraz dwie warstwy:

- metadane manifestu: `providerAuthEnvVars` do taniego wyszukiwania uwierzytelniania providera przez env
  przed załadowaniem runtime, `providerAuthAliases` dla wariantów providera współdzielących
  uwierzytelnianie, `channelEnvVars` do taniego wyszukiwania uwierzytelniania/konfiguracji kanału przez env przed
  załadowaniem runtime, oraz `providerAuthChoices` do tanich etykiet onboardingu/wyboru uwierzytelniania i
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw nadal posiada generyczną pętlę agenta, failover, obsługę transkryptów i
politykę narzędzi. Te hooki są powierzchnią rozszerzeń dla zachowania specyficznego dla providera bez
potrzeby tworzenia całego niestandardowego transportu inferencji.

Używaj manifestu `providerAuthEnvVars`, gdy provider ma poświadczenia oparte na env,
które generyczne ścieżki uwierzytelniania/statusu/wyboru modelu powinny widzieć bez ładowania runtime pluginu. Używaj manifestu `providerAuthAliases`, gdy jedno ID providera powinno ponownie używać zmiennych env, profili uwierzytelniania, uwierzytelniania opartego na konfiguracji i wyboru onboardingu klucza API innego ID providera. Używaj manifestu `providerAuthChoices`, gdy powierzchnie CLI onboardingu/wyboru uwierzytelniania
powinny znać ID wyboru providera, etykiety grup i prosty wiring uwierzytelniania z jedną flagą bez ładowania runtime providera. Zachowuj runtime `envVars` providera dla wskazówek skierowanych do operatora, takich jak etykiety onboardingu lub zmienne konfiguracji OAuth
client-id/client-secret.

Używaj manifestu `channelEnvVars`, gdy kanał ma uwierzytelnianie lub konfigurację sterowane przez env, które
generyczny fallback do shell-env, kontrole config/status lub prompty konfiguracji powinny widzieć
bez ładowania runtime kanału.

### Kolejność hooków i użycie

Dla pluginów modeli/providerów OpenClaw wywołuje hooki mniej więcej w tej kolejności.
Kolumna „Kiedy używać” to szybki przewodnik decyzyjny.

| #   | Hook                              | Co robi                                                                                                       | Kiedy używać                                                                                                                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Publikuje konfigurację providera do `models.providers` podczas generowania `models.json`                     | Provider posiada katalog lub domyślne wartości base URL                                                                                          |
| 2   | `applyConfigDefaults`             | Stosuje globalne domyślne ustawienia konfiguracji należące do providera podczas materializacji konfiguracji   | Wartości domyślne zależą od trybu auth, env lub semantyki rodziny modeli providera                                                              |
| --  | _(built-in model lookup)_         | OpenClaw najpierw próbuje zwykłej ścieżki rejestru/katalogu                                                   | _(to nie jest hook pluginu)_                                                                                                                     |
| 3   | `normalizeModelId`                | Normalizuje legacy aliasy model-id lub aliasy preview przed lookupem                                          | Provider posiada logikę czyszczenia aliasów przed kanonicznym rozwiązywaniem modelu                                                              |
| 4   | `normalizeTransport`              | Normalizuje `api` / `baseUrl` rodziny providerów przed generycznym składaniem modelu                         | Provider posiada logikę czyszczenia transportu dla niestandardowych ID providerów w tej samej rodzinie transportu                               |
| 5   | `normalizeConfig`                 | Normalizuje `models.providers.<id>` przed rozwiązywaniem runtime/providera                                    | Provider wymaga czyszczenia konfiguracji, które powinno żyć razem z pluginem; bundlowane helpery rodziny Google dodatkowo wspierają obsługiwane wpisy konfiguracji Google |
| 6   | `applyNativeStreamingUsageCompat` | Stosuje przepisywanie zgodności native streaming-usage do providerów konfiguracji                             | Provider wymaga poprawek metadanych native streaming usage zależnych od endpointu                                                                |
| 7   | `resolveConfigApiKey`             | Rozwiązuje auth env-marker dla providerów konfiguracji przed ładowaniem auth runtime                          | Provider ma należące do niego rozwiązywanie klucza API env-marker; `amazon-bedrock` ma tu też wbudowany resolver env-marker AWS                |
| 8   | `resolveSyntheticAuth`            | Ujawnia lokalne/self-hosted lub oparte na konfiguracji auth bez utrwalania jawnym tekstem                    | Provider może działać z syntetycznym/lokalnym markerem poświadczeń                                                                              |
| 9   | `resolveExternalAuthProfiles`     | Nakłada zewnętrzne profile auth należące do providera; domyślne `persistence` to `runtime-only` dla poświadczeń należących do CLI/aplikacji | Provider ponownie używa zewnętrznych poświadczeń auth bez utrwalania skopiowanych refresh tokenów; zadeklaruj `contracts.externalAuthProviders` w manifeście |
| 10  | `shouldDeferSyntheticProfileAuth` | Obniża priorytet zapisanych syntetycznych placeholderów profili względem auth opartego na env/config         | Provider przechowuje syntetyczne placeholdery profili, które nie powinny mieć pierwszeństwa                                                     |
| 11  | `resolveDynamicModel`             | Synchroniczny fallback dla należących do providera ID modeli, których nie ma jeszcze w lokalnym rejestrze    | Provider akceptuje dowolne upstream ID modeli                                                                                                    |
| 12  | `prepareDynamicModel`             | Asynchroniczne rozgrzanie, po którym `resolveDynamicModel` uruchamia się ponownie                             | Provider potrzebuje metadanych sieciowych przed rozwiązaniem nieznanych ID                                                                       |
| 13  | `normalizeResolvedModel`          | Ostateczne przepisanie przed użyciem rozwiązanego modelu przez embedded runner                               | Provider wymaga przepisania transportu, ale nadal używa transportu core                                                                          |
| 14  | `contributeResolvedModelCompat`   | Dodaje flagi zgodności dla modeli vendora za innym zgodnym transportem                                        | Provider rozpoznaje własne modele na transportach proxy bez przejmowania roli providera                                                         |
| 15  | `capabilities`                    | Metadane transkryptów/narzędzi należące do providera używane przez współdzieloną logikę core                  | Provider wymaga osobliwości transkryptów/rodziny providerów                                                                                      |
| 16  | `normalizeToolSchemas`            | Normalizuje schematy narzędzi, zanim zobaczy je embedded runner                                               | Provider wymaga czyszczenia schematów rodziny transportu                                                                                         |
| 17  | `inspectToolSchemas`              | Ujawnia diagnostykę schematów należącą do providera po normalizacji                                           | Provider chce ostrzeżeń o słowach kluczowych bez uczenia core reguł specyficznych dla providera                                                 |
| 18  | `resolveReasoningOutputMode`      | Wybiera kontrakt reasoning-output natywny vs tagged                                                           | Provider wymaga tagged reasoning/final output zamiast natywnych pól                                                                              |
| 19  | `prepareExtraParams`              | Normalizacja parametrów żądania przed generycznymi wrapperami opcji stream                                    | Provider wymaga domyślnych parametrów żądania lub czyszczenia parametrów per-provider                                                            |
| 20  | `createStreamFn`                  | W pełni zastępuje normalną ścieżkę stream niestandardowym transportem                                         | Provider wymaga niestandardowego protokołu wire, a nie tylko wrappera                                                                            |
| 21  | `wrapStreamFn`                    | Wrapper stream po zastosowaniu generycznych wrapperów                                                         | Provider wymaga wrapperów zgodności nagłówków/body/model żądania bez niestandardowego transportu                                                |
| 22  | `resolveTransportTurnState`       | Dołącza natywne nagłówki lub metadane transportu per-turn                                                     | Provider chce, aby generyczne transporty wysyłały natywną tożsamość tury providera                                                              |
| 23  | `resolveWebSocketSessionPolicy`   | Dołącza natywne nagłówki WebSocket lub politykę cool-down sesji                                               | Provider chce, aby generyczne transporty WS dostrajały nagłówki sesji lub politykę fallback                                                     |
| 24  | `formatApiKey`                    | Formatter auth-profile: zapisany profil staje się runtime’owym stringiem `apiKey`                             | Provider przechowuje dodatkowe metadane auth i wymaga niestandardowego kształtu tokenu runtime                                                  |
| 25  | `refreshOAuth`                    | Nadpisanie odświeżania OAuth dla niestandardowych endpointów odświeżania lub polityki awarii odświeżania     | Provider nie pasuje do współdzielonych refresherów `pi-ai`                                                                                       |
| 26  | `buildAuthDoctorHint`             | Wskazówka naprawcza dołączana, gdy odświeżenie OAuth się nie powiedzie                                        | Provider wymaga wskazówki naprawy auth należącej do providera po awarii odświeżenia                                                             |
| 27  | `matchesContextOverflowError`     | Matcher przepełnienia okna kontekstu należący do providera                                                    | Provider ma surowe błędy przepełnienia, których generyczne heurystyki by nie wykryły                                                            |
| 28  | `classifyFailoverReason`          | Klasyfikacja powodu failover należąca do providera                                                            | Provider potrafi mapować surowe błędy API/transportu do rate-limit/overload/etc.                                                                |
| 29  | `isCacheTtlEligible`              | Polityka prompt-cache dla providerów proxy/backhaul                                                           | Provider wymaga bramkowania TTL cache specyficznego dla proxy                                                                                    |
| 30  | `buildMissingAuthMessage`         | Zamiennik generycznego komunikatu odzyskiwania przy braku auth                                                | Provider wymaga wskazówki odzyskiwania przy braku auth specyficznej dla providera                                                               |
| 31  | `suppressBuiltInModel`            | Tłumienie nieaktualnych modeli upstream plus opcjonalna wskazówka błędu dla użytkownika                      | Provider musi ukrywać nieaktualne wiersze upstream lub zastępować je wskazówką vendora                                                           |
| 32  | `augmentModelCatalog`             | Syntetyczne/końcowe wiersze katalogu dołączane po wykrywaniu                                                  | Provider wymaga syntetycznych wierszy forward-compat w `models list` i pickerach                                                                |
| 33  | `resolveThinkingProfile`          | Zestaw poziomów `/think` specyficzny dla modelu, etykiety wyświetlania i wartość domyślna                    | Provider udostępnia niestandardową drabinkę myślenia lub binarną etykietę dla wybranych modeli                                                  |
| 34  | `isBinaryThinking`                | Hook zgodności dla przełącznika reasoning on/off                                                              | Provider udostępnia tylko binarne thinking on/off                                                                                                |
| 35  | `supportsXHighThinking`           | Hook zgodności dla obsługi reasoning `xhigh`                                                                  | Provider chce `xhigh` tylko dla podzbioru modeli                                                                                                 |
| 36  | `resolveDefaultThinkingLevel`     | Hook zgodności dla domyślnego poziomu `/think`                                                                | Provider posiada domyślną politykę `/think` dla rodziny modeli                                                                                   |
| 37  | `isModernModelRef`                | Matcher nowoczesnych modeli dla filtrów live profile i wyboru smoke                                            | Provider posiada dopasowywanie preferowanych modeli live/smoke                                                                                |
| 38  | `prepareRuntimeAuth`              | Zamienia skonfigurowane poświadczenie na właściwy runtime’owy token/klucz tuż przed inferencją                | Provider wymaga wymiany tokenu lub krótkotrwałego poświadczenia żądania                                                                       |
| 39  | `resolveUsageAuth`                | Rozwiązuje poświadczenia usage/billing dla `/usage` i powiązanych powierzchni statusu                         | Provider wymaga niestandardowego parsowania tokenów usage/quota lub innego poświadczenia usage                                               |
| 40  | `fetchUsageSnapshot`              | Pobiera i normalizuje snapshoty usage/quota specyficzne dla providera po rozwiązaniu auth                     | Provider wymaga endpointu usage lub parsera payloadu specyficznego dla providera                                                              |
| 41  | `createEmbeddingProvider`         | Buduje należący do providera adapter embeddingów dla pamięci/wyszukiwania                                      | Zachowanie embeddingów w pamięci należy do pluginu providera                                                                                  |
| 42  | `buildReplayPolicy`               | Zwraca politykę replay kontrolującą obsługę transkryptu dla providera                                         | Provider wymaga niestandardowej polityki transkryptu (na przykład usuwania bloków myślenia)                                                  |
| 43  | `sanitizeReplayHistory`           | Przepisuje historię replay po generycznym czyszczeniu transkryptu                                             | Provider wymaga przepisania replay specyficznego dla providera poza współdzielonymi helperami Compaction                                     |
| 44  | `validateReplayTurns`             | Ostateczna walidacja lub przekształcanie tur replay przed embedded runnerem                                   | Transport providera wymaga ostrzejszej walidacji tur po generycznym sanityzowaniu                                                            |
| 45  | `onModelSelected`                 | Uruchamia efekty uboczne po wyborze modelu należące do providera                                              | Provider wymaga telemetrii lub stanu należącego do providera, gdy model staje się aktywny                                                    |

`normalizeModelId`, `normalizeTransport` i `normalizeConfig` najpierw sprawdzają
dopasowany plugin providera, a następnie przechodzą przez inne pluginy providerów obsługujące hooki,
dopóki któryś faktycznie nie zmieni model id lub transportu/konfiguracji. To pozwala
shimom aliasów/providerów zgodności działać bez wymagania, by wywołujący wiedział, który
bundlowany plugin jest właścicielem przepisania. Jeśli żaden hook providera nie przepisze obsługiwanego
wpisu konfiguracji rodziny Google, bundlowany normalizator konfiguracji Google nadal zastosuje
to czyszczenie zgodności.

Jeśli provider wymaga w pełni niestandardowego protokołu wire lub własnego wykonawcy żądań,
to jest inna klasa rozszerzenia. Te hooki służą zachowaniu providera, które nadal działa
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

### Przykłady wbudowane

Bundlowane pluginy providerów używają powyższych hooków w kombinacjach dopasowanych do potrzeb
katalogu, auth, thinking, replay i śledzenia usage konkretnego vendora. Dokładny
zestaw hooków dla providera znajduje się przy źródle pluginu w `extensions/`; traktuj
to jako autorytatywną listę zamiast powielać ją tutaj.

Przykładowe wzorce:

- **Providery katalogu pass-through** (OpenRouter, Kilocode, Z.AI, xAI) rejestrują
  `catalog` oraz `resolveDynamicModel`/`prepareDynamicModel`, aby mogły ujawniać
  upstream ID modeli przed statycznym katalogiem OpenClaw.
- **Providery OAuth + endpoint usage** (GitHub Copilot, Gemini CLI, ChatGPT
  Codex, MiniMax, Xiaomi, z.ai) łączą `prepareRuntimeAuth` lub `formatApiKey`
  z `resolveUsageAuth` + `fetchUsageSnapshot`, aby posiadać wymianę tokenów i
  integrację z `/usage`.
- **Czyszczenie replay / transkryptów** jest współdzielone przez nazwane rodziny:
  `google-gemini`, `passthrough-gemini`, `anthropic-by-model`,
  `hybrid-anthropic-openai`. Providery wybierają to przez `buildReplayPolicy`
  zamiast implementować czyszczenie transkryptu każdy osobno.
- **Bundlowane providery tylko katalogowe** (`byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`,
  `venice`, `vercel-ai-gateway`, `volcengine`) rejestrują tylko `catalog` i jadą
  na współdzielonej pętli inferencji.
- **Helpery stream specyficzne dla Anthropic** (nagłówki beta, `/fast`/`serviceTier`,
  `context1m`) znajdują się wewnątrz publicznej szczeliny `api.ts` /
  `contract-api.ts` bundlowanego pluginu Anthropic (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), a nie w
  generycznym SDK.

## Helpery runtime

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

- `textToSpeech` zwraca normalny payload wyjściowy TTS core dla powierzchni typu file/voice-note.
- Używa konfiguracji core `messages.tts` i wyboru providera.
- Zwraca bufor audio PCM + sample rate. Pluginy muszą samodzielnie resamplować/kodować dla providerów.
- `listVoices` jest opcjonalne per-provider. Używaj tego do pickerów głosów lub przepływów konfiguracji należących do vendora.
- Listy głosów mogą zawierać bogatsze metadane, takie jak locale, gender i tagi osobowości dla pickerów świadomych providera.
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

- Zachowuj politykę TTS, fallback i dostarczanie odpowiedzi w core.
- Używaj providerów mowy do zachowania syntezy należącego do vendora.
- Legacy input Microsoft `edge` jest normalizowany do ID providera `microsoft`.
- Preferowany model własności jest zorientowany na firmę: jeden plugin vendora może posiadać
  providery tekstu, mowy, obrazów i przyszłych mediów, gdy OpenClaw dodaje te
  kontrakty możliwości.

Dla rozumienia obrazów/audio/wideo pluginy rejestrują jednego typowanego
providera media-understanding zamiast generycznego worka klucz/wartość:

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

- Zachowuj orkiestrację, fallback, konfigurację i okablowanie kanałów w core.
- Zachowanie vendora trzymaj w pluginie providera.
- Rozszerzanie addytywne powinno pozostać typowane: nowe opcjonalne metody, nowe opcjonalne
  pola wyników, nowe opcjonalne możliwości.
- Generowanie wideo już podąża tym samym wzorcem:
  - core posiada kontrakt możliwości i helper runtime
  - pluginy vendorów rejestrują `api.registerVideoGenerationProvider(...)`
  - pluginy funkcji/kanałów konsumują `api.runtime.videoGeneration.*`

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

Dla transkrypcji audio pluginy mogą używać albo runtime media-understanding,
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
- Używa konfiguracji audio media-understanding core (`tools.media.audio`) i kolejności fallback providerów.
- Zwraca `{ text: undefined }`, gdy nie powstanie wynik transkrypcji (na przykład dla pominiętego/nieobsługiwanego wejścia).
- `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności.

Pluginy mogą także uruchamiać tła subagentów przez `api.runtime.subagent`:

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

- `provider` i `model` to opcjonalne nadpisania per-run, a nie trwałe zmiany sesji.
- OpenClaw honoruje te pola nadpisania tylko dla zaufanych wywołujących.
- Dla uruchomień fallback należących do pluginu operatorzy muszą jawnie włączyć `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Użyj `plugins.entries.<id>.subagent.allowedModels`, aby ograniczyć zaufane pluginy do konkretnych kanonicznych targetów `provider/model`, albo `"*"`, aby jawnie zezwolić na dowolny target.
- Uruchomienia subagentów z niezaufanych pluginów nadal działają, ale żądania nadpisania są odrzucane zamiast po cichu przechodzić do fallbacku.

Dla web search pluginy mogą konsumować współdzielony helper runtime zamiast
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

- Zachowuj wybór providera, rozwiązywanie poświadczeń i współdzieloną semantykę żądań w core.
- Używaj providerów web-search do transportów wyszukiwania specyficznych dla vendora.
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

- `generate(...)`: wygeneruj obraz przy użyciu skonfigurowanego łańcucha providerów generowania obrazów.
- `listProviders(...)`: wyświetl dostępnych providerów generowania obrazów i ich możliwości.

## Trasy HTTP Gateway

Pluginy mogą wystawiać endpointy HTTP przez `api.registerHttpRoute(...)`.

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

- `path`: ścieżka trasy pod serwerem HTTP Gateway.
- `auth`: wymagane. Użyj `"gateway"`, aby wymagać normalnego uwierzytelniania Gateway, albo `"plugin"` dla uwierzytelniania zarządzanego przez plugin / weryfikacji webhooka.
- `match`: opcjonalne. `"exact"` (domyślnie) lub `"prefix"`.
- `replaceExisting`: opcjonalne. Pozwala temu samemu pluginowi zastąpić własną istniejącą rejestrację trasy.
- `handler`: zwróć `true`, gdy trasa obsłużyła żądanie.

Uwagi:

- `api.registerHttpHandler(...)` zostało usunięte i spowoduje błąd ładowania pluginu. Zamiast tego używaj `api.registerHttpRoute(...)`.
- Trasy pluginów muszą jawnie deklarować `auth`.
- Konflikty dokładnie tego samego `path + match` są odrzucane, chyba że ustawiono `replaceExisting: true`, a jeden plugin nie może zastąpić trasy innego pluginu.
- Nakładające się trasy o różnych poziomach `auth` są odrzucane. Łańcuchy fallthrough `exact`/`prefix` utrzymuj tylko na tym samym poziomie auth.
- Trasy `auth: "plugin"` **nie** otrzymują automatycznie runtime scopes operatora. Są przeznaczone do webhooków / weryfikacji sygnatur zarządzanych przez plugin, a nie do uprzywilejowanych wywołań helperów Gateway.
- Trasy `auth: "gateway"` działają w runtime scope żądania Gateway, ale ten scope jest celowo zachowawczy:
  - bearer auth ze współdzielonym sekretem (`gateway.auth.mode = "token"` / `"password"`) utrzymuje runtime scopes trasy pluginu przypięte do `operator.write`, nawet jeśli wywołujący wysyła `x-openclaw-scopes`
  - zaufane tryby HTTP przenoszące tożsamość (na przykład `trusted-proxy` lub `gateway.auth.mode = "none"` na prywatnym ingressie) honorują `x-openclaw-scopes` tylko wtedy, gdy nagłówek jest jawnie obecny
  - jeśli `x-openclaw-scopes` jest nieobecny w takich żądaniach trasy pluginu przenoszących tożsamość, runtime scope wraca do `operator.write`
- Praktyczna reguła: nie zakładaj, że trasa pluginu z gateway-auth jest domyślnie powierzchnią administracyjną. Jeśli Twoja trasa wymaga zachowania tylko dla administratora, wymagaj trybu auth przenoszącego tożsamość i udokumentuj jawny kontrakt nagłówka `x-openclaw-scopes`.

## Ścieżki importu Plugin SDK

Tworząc nowe pluginy, używaj wąskich podścieżek SDK zamiast monolitycznego głównego
barrela `openclaw/plugin-sdk`. Podścieżki core:

| Podścieżka                          | Cel                                                |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Prymitywy rejestracji pluginów                     |
| `openclaw/plugin-sdk/channel-core`  | Helpery wejścia/budowy kanału                      |
| `openclaw/plugin-sdk/core`          | Generyczne współdzielone helpery i kontrakt parasolowy |
| `openclaw/plugin-sdk/config-schema` | Główny schemat Zod `openclaw.json` (`OpenClawSchema`) |

Pluginy kanałów wybierają z rodziny wąskich szczelin — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` i `channel-actions`. Zachowanie zatwierdzania powinno być konsolidowane
w jednym kontrakcie `approvalCapability`, zamiast mieszać je między niezwiązanymi
polami pluginu. Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins).

Helpery runtime i konfiguracji znajdują się pod odpowiadającymi im podścieżkami `*-runtime`
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` itd.).

<Info>
`openclaw/plugin-sdk/channel-runtime` jest przestarzałe — to shim zgodności dla
starszych pluginów. Nowy kod powinien importować węższe prymitywy generyczne.
</Info>

Wewnętrzne punkty wejścia repozytorium (na katalog główny pakietu każdego bundlowanego pluginu):

- `index.js` — entry bundlowanego pluginu
- `api.js` — barrel helperów/typów
- `runtime-api.js` — barrel tylko dla runtime
- `setup-entry.js` — entry pluginu konfiguracji

Pluginy zewnętrzne powinny importować tylko podścieżki `openclaw/plugin-sdk/*`. Nigdy
nie importuj `src/*` innego pakietu pluginu z core ani z innego pluginu.
Punkty wejścia ładowane przez facade preferują aktywny snapshot konfiguracji runtime, jeśli istnieje,
a następnie przechodzą do rozwiązanej konfiguracji z pliku na dysku.

Podścieżki specyficzne dla możliwości, takie jak `image-generation`, `media-understanding`
i `speech`, istnieją, ponieważ bundlowane pluginy używają ich dziś. Nie są one
automatycznie długoterminowo zamrożonymi zewnętrznymi kontraktami — sprawdź odpowiednią
stronę referencyjną SDK, gdy na nich polegasz.

## Schematy narzędzia message

Pluginy powinny posiadać wkłady do schematu `describeMessageTool(...)` specyficzne dla kanału
dla prymitywów innych niż wiadomości, takich jak reakcje, odczyty i ankiety.
Współdzielona prezentacja wysyłania powinna używać generycznego kontraktu `MessagePresentation`
zamiast natywnych pól przycisków, komponentów, bloków lub kart providera.
Zobacz [Message Presentation](/pl/plugins/message-presentation), aby poznać kontrakt,
reguły fallback, mapowanie providerów i checklistę autora pluginu.

Pluginy zdolne do wysyłania deklarują, co potrafią renderować, przez możliwości wiadomości:

- `presentation` dla semantycznych bloków prezentacji (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` dla żądań dostarczenia przypiętego

Core decyduje, czy renderować prezentację natywnie, czy zdegradować ją do tekstu.
Nie udostępniaj natywnych furtek UI providera z generycznego narzędzia wiadomości.
Przestarzałe helpery SDK dla starszych natywnych schematów pozostają eksportowane dla istniejących
pluginów firm trzecich, ale nowe pluginy nie powinny ich używać.

## Rozwiązywanie targetów kanałów

Pluginy kanałów powinny posiadać semantykę targetów specyficzną dla kanału. Zachowaj
generyczność współdzielonego hosta outbound i używaj powierzchni adaptera wiadomości dla reguł providera:

- `messaging.inferTargetChatType({ to })` decyduje, czy znormalizowany target
  powinien być traktowany jako `direct`, `group` czy `channel` przed lookupiem katalogu.
- `messaging.targetResolver.looksLikeId(raw, normalized)` mówi core, czy dane
  wejście powinno od razu przejść do rozwiązywania podobnego do ID zamiast wyszukiwania w katalogu.
- `messaging.targetResolver.resolveTarget(...)` to fallback pluginu, gdy
  core potrzebuje ostatecznego rozwiązywania należącego do providera po normalizacji lub po
  braku trafienia w katalogu.
- `messaging.resolveOutboundSessionRoute(...)` posiada konstrukcję ścieżki sesji specyficznej dla providera po rozwiązaniu targetu.

Zalecany podział:

- Używaj `inferTargetChatType` do decyzji kategorialnych, które powinny nastąpić przed
  wyszukiwaniem peerów/grup.
- Używaj `looksLikeId` do sprawdzeń typu „traktuj to jako jawne/natywne ID targetu”.
- Używaj `resolveTarget` do fallbacku normalizacji specyficznego dla providera, a nie do
  szerokiego wyszukiwania w katalogu.
- Trzymaj natywne ID providera, takie jak ID czatów, ID wątków, JID, handle i ID pokoi,
  wewnątrz wartości `target` lub parametrów specyficznych dla providera, a nie w generycznych polach SDK.

## Katalogi oparte na konfiguracji

Pluginy, które wyprowadzają wpisy katalogu z konfiguracji, powinny trzymać tę logikę w
pluginie i ponownie używać współdzielonych helperów z
`openclaw/plugin-sdk/directory-runtime`.

Używaj tego, gdy kanał potrzebuje peerów/grup opartych na konfiguracji, takich jak:

- peery DM oparte na allowliście
- skonfigurowane mapy kanałów/grup
- statyczne fallbacki katalogu o zakresie konta

Współdzielone helpery w `directory-runtime` obsługują tylko operacje generyczne:

- filtrowanie zapytań
- stosowanie limitów
- helpery deduplikacji/normalizacji
- budowanie `ChannelDirectoryEntry[]`

Inspekcja kont specyficzna dla kanału i normalizacja ID powinny pozostać w
implementacji pluginu.

## Katalogi providerów

Pluginy providerów mogą definiować katalogi modeli do inferencji przez
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` zwraca ten sam kształt, który OpenClaw zapisuje do
`models.providers`:

- `{ provider }` dla jednego wpisu providera
- `{ providers }` dla wielu wpisów providerów

Używaj `catalog`, gdy plugin posiada ID modeli specyficzne dla providera, domyślne
wartości base URL lub metadane modeli zależne od auth.

`catalog.order` kontroluje, kiedy katalog pluginu scala się względem
wbudowanych niejawnych providerów OpenClaw:

- `simple`: zwykli providery oparte na kluczu API lub env
- `profile`: providery, które pojawiają się, gdy istnieją profile auth
- `paired`: providery syntetyzujące wiele powiązanych wpisów providerów
- `late`: ostatnie przejście, po innych niejawnych providerach

Późniejsi providery wygrywają przy kolizji kluczy, więc pluginy mogą celowo nadpisać
wbudowany wpis providera o tym samym ID providera.

Zgodność:

- `discovery` nadal działa jako legacy alias
- jeśli zarejestrowano zarówno `catalog`, jak i `discovery`, OpenClaw używa `catalog`

## Odczytowa inspekcja kanału

Jeśli Twój plugin rejestruje kanał, preferuj implementację
`plugin.config.inspectAccount(cfg, accountId)` obok `resolveAccount(...)`.

Dlaczego:

- `resolveAccount(...)` to ścieżka runtime. Może zakładać, że poświadczenia
  są w pełni zmaterializowane, i może szybko zakończyć się błędem, gdy brakuje wymaganych sekretów.
- Odczytowe ścieżki poleceń, takie jak `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` oraz przepływy doctor/naprawy konfiguracji
  nie powinny wymagać materializacji poświadczeń runtime tylko po to, aby
  opisać konfigurację.

Zalecane zachowanie `inspectAccount(...)`:

- Zwracaj tylko opisowy stan konta.
- Zachowuj `enabled` i `configured`.
- Uwzględniaj pola źródła/statusu poświadczeń, gdy mają znaczenie, takie jak:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Nie musisz zwracać surowych wartości tokenów tylko po to, aby raportować odczytową
  dostępność. Zwrócenie `tokenStatus: "available"` (i odpowiadającego pola źródła)
  wystarcza dla poleceń typu status.
- Używaj `configured_unavailable`, gdy poświadczenie jest skonfigurowane przez SecretRef, ale
  niedostępne w bieżącej ścieżce polecenia.

Dzięki temu polecenia odczytowe mogą raportować „configured but unavailable in this command
path” zamiast crashować lub błędnie raportować konto jako nieskonfigurowane.

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

Każdy wpis staje się pluginem. Jeśli pack wymienia wiele rozszerzeń, ID pluginu
przyjmuje postać `name/<fileBase>`.

Jeśli Twój plugin importuje zależności npm, zainstaluj je w tym katalogu, aby
`node_modules` było dostępne (`npm install` / `pnpm install`).

Zabezpieczenie bezpieczeństwa: każdy wpis `openclaw.extensions` musi pozostać wewnątrz katalogu pluginu
po rozwiązaniu symlinków. Wpisy wychodzące poza katalog pakietu są
odrzucane.

Uwaga bezpieczeństwa: `openclaw plugins install` instaluje zależności pluginów przez
`npm install --omit=dev --ignore-scripts` (bez skryptów lifecycle, bez zależności dev w runtime). Utrzymuj drzewa zależności pluginów jako „czyste JS/TS” i unikaj pakietów wymagających buildów `postinstall`.

Opcjonalnie: `openclaw.setupEntry` może wskazywać na lekki moduł tylko do konfiguracji.
Gdy OpenClaw potrzebuje powierzchni konfiguracji dla wyłączonego pluginu kanału lub
gdy plugin kanału jest włączony, ale nadal nieskonfigurowany, ładuje `setupEntry`
zamiast pełnego entry pluginu. Dzięki temu start i konfiguracja są lżejsze,
gdy główne entry pluginu podłącza też narzędzia, hooki lub inny kod tylko runtime.

Opcjonalnie: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
może włączyć plugin kanału do tej samej ścieżki `setupEntry` podczas
fazy startu Gateway przed nasłuchiwaniem, nawet gdy kanał jest już skonfigurowany.

Używaj tego tylko wtedy, gdy `setupEntry` w pełni pokrywa powierzchnię startową, która musi istnieć
zanim Gateway zacznie nasłuchiwać. W praktyce oznacza to, że entry konfiguracji
musi rejestrować każdą możliwość należącą do kanału, od której zależy start, taką jak:

- sama rejestracja kanału
- wszelkie trasy HTTP, które muszą być dostępne, zanim Gateway zacznie nasłuchiwać
- wszelkie metody Gateway, narzędzia lub usługi, które muszą istnieć w tym samym oknie

Jeśli Twoje pełne entry nadal posiada jakąkolwiek wymaganą możliwość startową, nie włączaj
tej flagi. Pozostaw plugin przy domyślnym zachowaniu i pozwól OpenClaw ładować
pełne entry podczas startu.

Bundlowane kanały mogą też publikować helpery powierzchni kontraktu tylko do konfiguracji, z których core
może korzystać przed załadowaniem pełnego runtime kanału. Aktualna powierzchnia
promocji konfiguracji to:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core używa tej powierzchni, gdy musi promować starszą konfigurację kanału jednokontowego
do `channels.<id>.accounts.*` bez ładowania pełnego entry pluginu.
Matrix jest obecnie bundlowanym przykładem: przenosi tylko klucze auth/bootstrap do
nazwanego promowanego konta, gdy nazwane konta już istnieją, i może zachować
skonfigurowany niekanoniczny klucz konta domyślnego zamiast zawsze tworzyć
`accounts.default`.

Te adaptery patch konfiguracji utrzymują leniwe wykrywanie powierzchni kontraktu bundlowanych kanałów.
Czas importu pozostaje lekki; powierzchnia promocji jest ładowana dopiero przy pierwszym użyciu zamiast ponownie wchodzić w start bundlowanego kanału przy imporcie modułu.

Gdy te powierzchnie startowe zawierają metody Gateway RPC, trzymaj je pod
prefiksem specyficznym dla pluginu. Przestrzenie nazw administratora core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) pozostają zastrzeżone i zawsze rozwiązują się
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
wskazówki instalacyjne przez `openclaw.install`. Dzięki temu dane katalogu core pozostają wolne od danych.

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
      "blurb": "Samohostowany czat przez boty webhook Nextcloud Talk.",
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
- `docsLabel`: nadpisuje tekst linku do dokumentacji
- `preferOver`: identyfikatory pluginów/kanałów o niższym priorytecie, które ten wpis katalogu powinien wyprzedzać
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrolki tekstu powierzchni wyboru
- `markdownCapable`: oznacza kanał jako obsługujący Markdown dla decyzji o formatowaniu wychodzącym
- `exposure.configured`: ukrywa kanał z powierzchni listowania skonfigurowanych kanałów, gdy ustawione na `false`
- `exposure.setup`: ukrywa kanał z interaktywnych pickerów konfiguracji/ustawiania, gdy ustawione na `false`
- `exposure.docs`: oznacza kanał jako wewnętrzny/prywatny dla powierzchni nawigacji dokumentacji
- `showConfigured` / `showInSetup`: starsze aliasy nadal akceptowane dla zgodności; preferuj `exposure`
- `quickstartAllowFrom`: włącza kanał do standardowego przepływu quickstart `allowFrom`
- `forceAccountBinding`: wymaga jawnego powiązania konta, nawet gdy istnieje tylko jedno konto
- `preferSessionLookupForAnnounceTarget`: preferuje lookup sesji przy rozwiązywaniu targetów ogłoszeń

OpenClaw może też scalać **zewnętrzne katalogi kanałów** (na przykład eksport
rejestru MPM). Umieść plik JSON w jednej z lokalizacji:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Lub wskaż `OPENCLAW_PLUGIN_CATALOG_PATHS` (albo `OPENCLAW_MPM_CATALOG_PATHS`) na
jeden lub więcej plików JSON (rozdzielanych przecinkami/średnikami/zgodnie z `PATH`). Każdy plik powinien
zawierać `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser akceptuje też `"packages"` lub `"plugins"` jako starsze aliasy klucza `"entries"`.

## Pluginy silnika kontekstu

Pluginy silnika kontekstu posiadają orkiestrację kontekstu sesji dla ingestu, składania
i Compaction. Rejestruj je ze swojego pluginu przez
`api.registerContextEngine(id, factory)`, a następnie wybierz aktywny silnik przez
`plugins.slots.contextEngine`.

Używaj tego, gdy Twój plugin musi zastąpić lub rozszerzyć domyślny pipeline
kontekstu, zamiast tylko dodawać wyszukiwanie pamięci lub hooki.

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

Jeśli Twój silnik **nie** posiada algorytmu Compaction, pozostaw `compact()`
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
systemu pluginów przez prywatne sięganie do środka. Dodaj brakującą możliwość.

Zalecana sekwencja:

1. zdefiniuj kontrakt core
   Zdecyduj, jakie współdzielone zachowanie powinno należeć do core: polityka, fallback, scalanie konfiguracji,
   lifecycle, semantyka widoczna od strony kanałów i kształt helpera runtime.
2. dodaj typowane powierzchnie rejestracji/runtime pluginów
   Rozszerz `OpenClawPluginApi` i/lub `api.runtime` o najmniejszą użyteczną
   typowaną powierzchnię możliwości.
3. podłącz konsumentów core + kanałów/funkcji
   Kanały i pluginy funkcji powinny konsumować nową możliwość przez core,
   a nie przez bezpośredni import implementacji vendora.
4. zarejestruj implementacje vendorów
   Pluginy vendorów rejestrują następnie swoje backendy względem tej możliwości.
5. dodaj pokrycie kontraktowe
   Dodaj testy, aby własność i kształt rejestracji pozostały jawne w czasie.

Tak OpenClaw pozostaje opiniotwórczy, nie stając się jednocześnie systemem na sztywno
zakodowanym pod światopogląd jednego providera. Zobacz [Capability Cookbook](/pl/plugins/architecture),
aby znaleźć konkretną checklistę plików i przepracowany przykład.

### Checklista możliwości

Gdy dodajesz nową możliwość, implementacja zwykle powinna jednocześnie dotykać tych
powierzchni:

- typy kontraktu core w `src/<capability>/types.ts`
- runner/helper runtime core w `src/<capability>/runtime.ts`
- powierzchnia rejestracji API pluginu w `src/plugins/types.ts`
- okablowanie rejestru pluginów w `src/plugins/registry.ts`
- ekspozycja runtime pluginów w `src/plugins/runtime/*`, gdy pluginy funkcji/kanałów
  muszą ją konsumować
- helpery capture/test w `src/test-utils/plugin-registration.ts`
- asercje własności/kontraktu w `src/plugins/contracts/registry.ts`
- dokumentacja operatora/pluginu w `docs/`

Jeśli którejś z tych powierzchni brakuje, zwykle jest to sygnał, że możliwość
nie została jeszcze w pełni zintegrowana.

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

- core posiada kontrakt możliwości + orkiestrację
- pluginy vendorów posiadają implementacje vendorów
- pluginy funkcji/kanałów konsumują helpery runtime
- testy kontraktowe utrzymują jawność własności
