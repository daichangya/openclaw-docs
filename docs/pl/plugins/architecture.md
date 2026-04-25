---
read_when:
    - Budowanie lub debugowanie natywnych Plugin OpenClaw
    - Zrozumienie modelu możliwości Plugin albo granic własności
    - Praca nad potokiem ładowania Plugin albo rejestrem
    - Implementowanie hooków runtime dostawcy albo Plugin kanałowych
sidebarTitle: Internals
summary: 'Wnętrze Plugin: model możliwości, własność, kontrakty, potok ładowania i pomocniki runtime'
title: Wnętrze Plugin
x-i18n:
    generated_at: "2026-04-25T13:52:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1fd7d9192c8c06aceeb6e8054a740bba27c94770e17eabf064627adda884e77
    source_path: plugins/architecture.md
    workflow: 15
---

To jest **szczegółowa dokumentacja architektury** systemu Plugin OpenClaw. Jeśli
szukasz praktycznych przewodników, zacznij od jednej z poniższych stron tematycznych.

<CardGroup cols={2}>
  <Card title="Instalowanie i używanie Plugin" icon="plug" href="/pl/tools/plugin">
    Przewodnik użytkownika końcowego dotyczący dodawania, włączania i rozwiązywania problemów z Plugin.
  </Card>
  <Card title="Budowanie Plugin" icon="rocket" href="/pl/plugins/building-plugins">
    Samouczek pierwszego Plugin z najmniejszym działającym manifestem.
  </Card>
  <Card title="Plugin kanałowe" icon="comments" href="/pl/plugins/sdk-channel-plugins">
    Zbuduj Plugin kanału wiadomości.
  </Card>
  <Card title="Plugin dostawców" icon="microchip" href="/pl/plugins/sdk-provider-plugins">
    Zbuduj Plugin dostawcy modeli.
  </Card>
  <Card title="Przegląd SDK" icon="book" href="/pl/plugins/sdk-overview">
    Import map i dokumentacja API rejestracji.
  </Card>
</CardGroup>

## Publiczny model możliwości

Możliwości to publiczny model **natywnych Plugin** wewnątrz OpenClaw. Każdy
natywny Plugin OpenClaw rejestruje się względem jednego lub większej liczby typów możliwości:

| Capability             | Metoda rejestracji                               | Przykładowe Plugin                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Wnioskowanie tekstowe  | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend CLI do wnioskowania | `api.registerCliBackend(...)`               | `openai`, `anthropic`                |
| Mowa                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkrypcja w czasie rzeczywistym | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                     |
| Głos w czasie rzeczywistym | `api.registerRealtimeVoiceProvider(...)`     | `openai`                             |
| Rozumienie mediów      | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Generowanie obrazów    | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generowanie muzyki     | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Generowanie wideo      | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pobieranie web         | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Wyszukiwanie web       | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanał / wiadomości     | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Wykrywanie Gateway     | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

Plugin, który rejestruje zero możliwości, ale dostarcza hooki, narzędzia, usługi discovery
albo usługi tła, to **starszy Plugin tylko z hookami**. Ten wzorzec
jest nadal w pełni obsługiwany.

### Stanowisko dotyczące zgodności zewnętrznej

Model możliwości jest wdrożony w rdzeniu i używany dziś przez dołączone/natywne Plugin,
ale zgodność z zewnętrznymi Plugin nadal potrzebuje wyższego progu niż „jest
eksportowane, więc jest zamrożone”.

| Sytuacja Plugin                                  | Wskazówki                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Istniejące zewnętrzne Plugin                     | Utrzymuj działanie integracji opartych na hookach; to bazowy poziom zgodności.                  |
| Nowe dołączone/natywne Plugin                    | Preferuj jawną rejestrację możliwości zamiast sięgania do powierzchni specyficznych dla dostawcy lub nowych projektów tylko z hookami. |
| Zewnętrzne Plugin przyjmujące rejestrację możliwości | Dozwolone, ale traktuj powierzchnie pomocnicze specyficzne dla możliwości jako ewoluujące, chyba że dokumentacja oznacza je jako stabilne. |

Rejestracja możliwości to zamierzony kierunek. Starsze hooki pozostają
najbezpieczniejszą ścieżką bez ryzyka uszkodzenia dla zewnętrznych Plugin w trakcie przejścia. Eksportowane podścieżki pomocnicze nie są sobie równe — preferuj wąskie, udokumentowane kontrakty zamiast przypadkowych eksportów pomocniczych.

### Kształty Plugin

OpenClaw klasyfikuje każdy załadowany Plugin do określonego kształtu na podstawie jego rzeczywistego
zachowania rejestracyjnego (a nie tylko statycznych metadanych):

- **plain-capability**: rejestruje dokładnie jeden typ możliwości (na przykład
  Plugin tylko dostawcy, taki jak `mistral`).
- **hybrid-capability**: rejestruje wiele typów możliwości (na przykład
  `openai` posiada wnioskowanie tekstowe, mowę, rozumienie mediów i generowanie obrazów).
- **hook-only**: rejestruje tylko hooki (typowane lub niestandardowe), bez możliwości,
  narzędzi, poleceń ani usług.
- **non-capability**: rejestruje narzędzia, polecenia, usługi albo trasy, ale bez
  możliwości.

Użyj `openclaw plugins inspect <id>`, aby zobaczyć kształt Plugin i rozkład możliwości.
Szczegóły znajdziesz w [dokumentacji CLI](/pl/cli/plugins#inspect).

### Starsze hooki

Hook `before_agent_start` nadal jest obsługiwany jako ścieżka zgodności dla
Plugin tylko z hookami. Starsze rzeczywiste Plugin nadal od niego zależą.

Kierunek:

- utrzymywać działanie
- dokumentować jako starsze
- preferować `before_model_resolve` do pracy nad nadpisywaniem modelu/dostawcy
- preferować `before_prompt_build` do pracy nad mutacją promptu
- usuwać dopiero wtedy, gdy rzeczywiste użycie spadnie, a pokrycie fixture dowiedzie bezpieczeństwa migracji

### Sygnały zgodności

Gdy uruchamiasz `openclaw doctor` albo `openclaw plugins inspect <id>`, możesz zobaczyć
jedną z tych etykiet:

| Signal                     | Znaczenie                                                   |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | Konfiguracja parsuje się poprawnie i Plugin się rozwiązują  |
| **compatibility advisory** | Plugin używa obsługiwanego, ale starszego wzorca (np. `hook-only`) |
| **legacy warning**         | Plugin używa `before_agent_start`, które jest przestarzałe  |
| **hard error**             | Konfiguracja jest nieprawidłowa albo Plugin nie udało się załadować |

Ani `hook-only`, ani `before_agent_start` nie zepsują dziś Twojego Plugin:
`hook-only` ma charakter doradczy, a `before_agent_start` wywołuje tylko ostrzeżenie. Te
sygnały pojawiają się też w `openclaw status --all` i `openclaw plugins doctor`.

## Przegląd architektury

System Plugin OpenClaw ma cztery warstwy:

1. **Manifest + discovery**
   OpenClaw znajduje kandydackie Plugin z skonfigurowanych ścieżek, rootów workspace,
   globalnych rootów Plugin i dołączonych Plugin. Discovery najpierw odczytuje natywne
   manifesty `openclaw.plugin.json` oraz obsługiwane manifesty bundle.
2. **Włączanie + walidacja**
   Rdzeń decyduje, czy wykryty Plugin jest włączony, wyłączony, zablokowany czy
   wybrany do ekskluzywnego slotu, takiego jak memory.
3. **Ładowanie runtime**
   Natywne Plugin OpenClaw są ładowane w procesie przez jiti i rejestrują
   możliwości w centralnym rejestrze. Zgodne bundle są normalizowane do
   rekordów rejestru bez importowania kodu runtime.
4. **Konsumpcja powierzchni**
   Reszta OpenClaw odczytuje rejestr, aby udostępniać narzędzia, kanały, konfigurację
   dostawców, hooki, trasy HTTP, polecenia CLI i usługi.

Specjalnie dla CLI Plugin wykrywanie poleceń root jest podzielone na dwa etapy:

- metadane w czasie parsowania pochodzą z `registerCli(..., { descriptors: [...] })`
- właściwy moduł CLI Plugin może pozostać leniwy i zarejestrować się przy pierwszym wywołaniu

Dzięki temu kod CLI będący własnością Plugin pozostaje wewnątrz Plugin, a OpenClaw nadal może
rezerwować nazwy poleceń root przed parsowaniem.

Ważna granica projektowa:

- walidacja manifestu/konfiguracji powinna działać na podstawie **metadanych manifestu/schematu**
  bez wykonywania kodu Plugin
- natywne wykrywanie możliwości może ładować zaufany kod wejściowy Plugin, aby zbudować
  nieaktywującą migawkę rejestru
- natywne zachowanie runtime pochodzi ze ścieżki modułu Plugin `register(api)`
  z `api.registrationMode === "full"`

Ten podział pozwala OpenClaw walidować konfigurację, wyjaśniać brakujące/wyłączone Plugin i
budować wskazówki UI/schematu, zanim pełny runtime stanie się aktywny.

### Planowanie aktywacji

Planowanie aktywacji jest częścią płaszczyzny sterowania. Wywołujący mogą zapytać, które Plugin
są istotne dla konkretnego polecenia, dostawcy, kanału, trasy, harness agenta lub
możliwości przed załadowaniem szerszych rejestrów runtime.

Planner utrzymuje zgodność bieżącego zachowania manifestów:

- pola `activation.*` są jawnymi wskazówkami planera
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` i hooki pozostają fallbackiem własności manifestu
- API planera zwracające tylko identyfikatory pozostaje dostępne dla istniejących wywołujących
- API planu raportuje etykiety przyczyn, dzięki czemu diagnostyka może odróżniać jawne
  wskazówki od fallbacku własności

Nie traktuj `activation` jako hooka cyklu życia ani zamiennika dla
`register(...)`. To metadane używane do zawężania ładowania. Preferuj pola własności,
gdy już opisują relację; używaj `activation` tylko dla dodatkowych wskazówek planera.

### Plugin kanałowe i współdzielone narzędzie wiadomości

Plugin kanałowe nie muszą rejestrować osobnego narzędzia send/edit/react dla
zwykłych działań czatu. OpenClaw utrzymuje jedno współdzielone narzędzie `message` w rdzeniu, a
Plugin kanałowe posiadają discovery i wykonanie specyficzne dla kanału za nim.

Obecna granica jest następująca:

- rdzeń posiada host współdzielonego narzędzia `message`, okablowanie promptu, księgowanie sesji/wątków
  i dispatch wykonania
- Plugin kanałowe posiadają scoped action discovery, capability discovery i wszelkie
  fragmenty schematu specyficzne dla kanału
- Plugin kanałowe posiadają gramatykę rozmów sesji specyficzną dla dostawcy, taką jak
  sposób, w jaki identyfikatory rozmów kodują identyfikatory wątków lub dziedziczą od rozmów nadrzędnych
- Plugin kanałowe wykonują końcową akcję przez swój adapter akcji

Dla Plugin kanałowych powierzchnią SDK jest
`ChannelMessageActionAdapter.describeMessageTool(...)`. To ujednolicone wywołanie discovery
pozwala Plugin zwrócić widoczne akcje, możliwości i wkłady do schematu razem,
tak aby te elementy się nie rozjeżdżały.

Gdy parametr narzędzia wiadomości specyficzny dla kanału przenosi źródło mediów, takie jak
lokalna ścieżka albo zdalny adres URL mediów, Plugin powinien także zwrócić
`mediaSourceParams` z `describeMessageTool(...)`. Rdzeń używa tej jawnej
listy do stosowania normalizacji ścieżek sandbox i wskazówek dostępu do mediów wychodzących
bez hardkodowania nazw parametrów należących do Plugin.
Preferuj tam mapy ograniczone do akcji, a nie jedną płaską listę dla całego kanału, tak aby
parametr mediów tylko dla profilu nie był normalizowany przy niepowiązanych akcjach, takich jak
`send`.

Rdzeń przekazuje zakres runtime do tego kroku discovery. Ważne pola obejmują:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- zaufane przychodzące `requesterSenderId`

Ma to znaczenie dla Plugin zależnych od kontekstu. Kanał może ukrywać albo ujawniać
akcje wiadomości na podstawie aktywnego konta, bieżącego pokoju/wątku/wiadomości albo
zaufanej tożsamości żądającego, bez hardkodowania gałęzi specyficznych dla kanału w
rdzeniowym narzędziu `message`.

Dlatego zmiany routingu embedded-runner nadal są pracą Plugin: runner
odpowiada za przekazywanie bieżącej tożsamości czatu/sesji do granicy discovery Plugin, aby współdzielone narzędzie `message` ujawniało właściwą powierzchnię będącą własnością kanału dla bieżącej tury.

Dla pomocników wykonania będących własnością kanału dołączone Plugin powinny utrzymywać runtime wykonania
wewnątrz własnych modułów rozszerzeń. Rdzeń nie posiada już runtime akcji wiadomości Discord,
Slack, Telegram ani WhatsApp pod `src/agents/tools`.
Nie publikujemy osobnych podścieżek `plugin-sdk/*-action-runtime`, a dołączone
Plugin powinny importować własny lokalny kod runtime bezpośrednio z należących do rozszerzenia modułów.

Ta sama granica dotyczy ogólnie powierzchni SDK nazwanych od dostawców: rdzeń nie powinien
importować wygodnych barrel specyficznych dla kanałów Slack, Discord, Signal,
WhatsApp ani podobnych rozszerzeń. Jeśli rdzeń potrzebuje jakiegoś zachowania, powinien albo użyć
własnego barrel `api.ts` / `runtime-api.ts` dołączonego Plugin, albo awansować potrzebę
do wąskiej ogólnej możliwości we współdzielonym SDK.

W przypadku ankiet istnieją konkretnie dwie ścieżki wykonania:

- `outbound.sendPoll` to współdzielona baza dla kanałów, które pasują do wspólnego
  modelu ankiet
- `actions.handleAction("poll")` to preferowana ścieżka dla semantyki ankiet specyficznej dla kanału albo dodatkowych parametrów ankiety

Rdzeń odracza teraz współdzielone parsowanie ankiet do czasu, aż dispatch ankiet Plugin odrzuci
akcję, dzięki czemu handlery ankiet należące do Plugin mogą akceptować pola ankiet specyficzne dla kanału bez bycia wcześniej blokowanymi przez generyczny parser ankiet.

Pełną sekwencję startową znajdziesz w [Plugin architecture internals](/pl/plugins/architecture-internals).

## Model własności możliwości

OpenClaw traktuje natywny Plugin jako granicę własności dla **firmy** albo
**funkcji**, a nie jako zbiór niezwiązanych integracji.

To oznacza, że:

- Plugin firmy powinien zwykle posiadać wszystkie powierzchnie OpenClaw-facing tej firmy
- Plugin funkcji powinien zwykle posiadać pełną powierzchnię funkcji, którą wprowadza
- kanały powinny konsumować współdzielone możliwości rdzenia zamiast doraźnie ponownie implementować
  zachowanie dostawcy

<Accordion title="Przykładowe wzorce własności w dołączonych Plugin">
  - **Dostawca wielomożliwościowy**: `openai` posiada wnioskowanie tekstowe, mowę, realtime
    voice, rozumienie mediów i generowanie obrazów. `google` posiada wnioskowanie tekstowe
    oraz rozumienie mediów, generowanie obrazów i wyszukiwanie web.
    `qwen` posiada wnioskowanie tekstowe oraz rozumienie mediów i generowanie wideo.
  - **Dostawca jednomożliwościowy**: `elevenlabs` i `microsoft` posiadają mowę;
    `firecrawl` posiada web-fetch; `minimax` / `mistral` / `moonshot` / `zai` posiadają
    backendy rozumienia mediów.
  - **Plugin funkcji**: `voice-call` posiada transport połączeń, narzędzia, CLI, trasy
    i mostkowanie strumieni mediów Twilio, ale konsumuje współdzielone możliwości mowy, realtime
    transcription i realtime voice zamiast bezpośrednio importować Plugin dostawców.
</Accordion>

Zamierzony stan końcowy to:

- OpenAI żyje w jednym Plugin, nawet jeśli obejmuje modele tekstowe, mowę, obrazy i
  przyszłe wideo
- inny dostawca może zrobić to samo dla własnego obszaru powierzchni
- kanały nie dbają o to, który Plugin dostawcy posiada dostawcę; konsumują
  współdzielony kontrakt możliwości udostępniany przez rdzeń

To jest kluczowe rozróżnienie:

- **plugin** = granica własności
- **capability** = kontrakt rdzenia, który wiele Plugin może implementować lub konsumować

Jeśli więc OpenClaw dodaje nową domenę, taką jak wideo, pierwsze pytanie nie brzmi
„który dostawca powinien na sztywno zakodować obsługę wideo?”. Pierwsze pytanie brzmi „jaki jest
kontrakt głównej możliwości wideo?”. Gdy taki kontrakt istnieje, Plugin dostawców
mogą się względem niego rejestrować, a Plugin kanałowe/funkcyjne mogą go konsumować.

Jeśli możliwość jeszcze nie istnieje, właściwym ruchem jest zwykle:

1. zdefiniować brakującą możliwość w rdzeniu
2. udostępnić ją przez API/runtime Plugin w sposób typowany
3. podłączyć kanały/funkcje do tej możliwości
4. pozwolić Plugin dostawców rejestrować implementacje

Dzięki temu własność pozostaje jawna, a jednocześnie unika się zachowań rdzenia zależnych od
jednego dostawcy albo jednorazowej ścieżki kodu specyficznej dla Plugin.

### Warstwowanie możliwości

Używaj tego modelu mentalnego przy podejmowaniu decyzji, gdzie powinien trafić kod:

- **warstwa możliwości rdzenia**: współdzielona orkiestracja, polityka, fallback, reguły
  scalania konfiguracji, semantyka dostarczania i typowane kontrakty
- **warstwa Plugin dostawcy**: API specyficzne dla dostawcy, auth, katalogi modeli, synteza mowy,
  generowanie obrazów, przyszłe backendy wideo, endpointy użycia
- **warstwa Plugin kanałowych/funkcyjnych**: integracje Slack/Discord/voice-call/itd.,
  które konsumują możliwości rdzenia i prezentują je na określonej powierzchni

Na przykład TTS ma taki kształt:

- rdzeń posiada politykę TTS w czasie odpowiedzi, kolejność fallback, prefs i dostarczanie kanałowe
- `openai`, `elevenlabs` i `microsoft` posiadają implementacje syntezy
- `voice-call` konsumuje pomocnik runtime TTS dla telefonii

Ten sam wzorzec powinien być preferowany dla przyszłych możliwości.

### Przykład Plugin firmy o wielu możliwościach

Plugin firmy powinien z zewnątrz sprawiać wrażenie spójnego. Jeśli OpenClaw ma współdzielone
kontrakty dla modeli, mowy, realtime transcription, realtime voice, rozumienia mediów,
generowania obrazów, generowania wideo, web fetch i wyszukiwania web,
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
      // konfiguracja mowy dostawcy — implementuj interfejs SpeechProviderPlugin bezpośrednio
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
        // logika poświadczeń + fetch
      }),
    );
  },
};

export default plugin;
```

Liczy się nie dokładna nazwa helperów. Liczy się kształt:

- jeden Plugin posiada powierzchnię dostawcy
- rdzeń nadal posiada kontrakty możliwości
- kanały i Plugin funkcji konsumują helpery `api.runtime.*`, a nie kod dostawcy
- testy kontraktowe mogą potwierdzać, że Plugin zarejestrował możliwości, które
  deklaruje jako własne

### Przykład możliwości: rozumienie wideo

OpenClaw już traktuje rozumienie obrazu/audio/wideo jako jedną współdzieloną
możliwość. Ten sam model własności obowiązuje również tutaj:

1. rdzeń definiuje kontrakt rozumienia mediów
2. Plugin dostawców rejestrują `describeImage`, `transcribeAudio` i
   `describeVideo`, gdy ma to zastosowanie
3. kanały i Plugin funkcji konsumują współdzielone zachowanie rdzenia zamiast
   wiązać się bezpośrednio z kodem dostawcy

To zapobiega wypiekaniu założeń wideo jednego dostawcy do rdzenia. Plugin posiada
powierzchnię dostawcy; rdzeń posiada kontrakt możliwości i zachowanie fallback.

Generowanie wideo już używa tej samej sekwencji: rdzeń posiada typowany
kontrakt możliwości i helper runtime, a Plugin dostawców rejestrują
implementacje `api.registerVideoGenerationProvider(...)` względem niego.

Potrzebujesz konkretnej checklisty wdrożenia? Zobacz
[Capability Cookbook](/pl/plugins/architecture).

## Kontrakty i egzekwowanie

Powierzchnia API Plugin jest celowo typowana i scentralizowana w
`OpenClawPluginApi`. Ten kontrakt definiuje obsługiwane punkty rejestracji oraz
pomocniki runtime, na których Plugin może polegać.

Dlaczego to ma znaczenie:

- autorzy Plugin dostają jeden stabilny standard wewnętrzny
- rdzeń może odrzucać zduplikowaną własność, na przykład dwa Plugin rejestrujące ten sam
  identyfikator dostawcy
- startup może pokazywać praktyczną diagnostykę dla nieprawidłowych rejestracji
- testy kontraktowe mogą wymuszać własność dołączonych Plugin i zapobiegać cichemu dryfowi

Istnieją dwie warstwy egzekwowania:

1. **egzekwowanie rejestracji runtime**
   Rejestr Plugin waliduje rejestracje podczas ładowania Plugin. Przykłady:
   zduplikowane identyfikatory dostawców, zduplikowane identyfikatory dostawców mowy i nieprawidłowe
   rejestracje produkują diagnostykę Plugin zamiast niezdefiniowanego zachowania.
2. **testy kontraktowe**
   Dołączone Plugin są przechwytywane do rejestrów kontraktowych podczas uruchomień testów, tak aby
   OpenClaw mógł jawnie potwierdzać własność. Dziś jest to używane dla modeli
   dostawców, dostawców mowy, dostawców wyszukiwania web i własności rejestracji dołączonych Plugin.

Praktyczny efekt jest taki, że OpenClaw z góry wie, który Plugin posiada którą
powierzchnię. To pozwala rdzeniowi i kanałom komponować się płynnie, ponieważ własność jest
deklarowana, typowana i testowalna, a nie niejawna.

### Co należy do kontraktu

Dobre kontrakty Plugin są:

- typowane
- małe
- specyficzne dla możliwości
- będące własnością rdzenia
- wielokrotnego użytku przez wiele Plugin
- konsumowalne przez kanały/funkcje bez wiedzy o dostawcy

Złe kontrakty Plugin to:

- polityka specyficzna dla dostawcy ukryta w rdzeniu
- jednorazowe furtki ucieczki Plugin omijające rejestr
- kod kanału sięgający bezpośrednio do implementacji dostawcy
- doraźne obiekty runtime, które nie są częścią `OpenClawPluginApi` ani
  `api.runtime`

W razie wątpliwości podnieś poziom abstrakcji: najpierw zdefiniuj możliwość, potem
pozwól Plugin się do niej podłączyć.

## Model wykonania

Natywne Plugin OpenClaw działają **w procesie** razem z Gateway. Nie są
sandboxed. Załadowany natywny Plugin ma tę samą granicę zaufania na poziomie procesu co
kod rdzenia.

Konsekwencje:

- natywny Plugin może rejestrować narzędzia, handlery sieciowe, hooki i usługi
- błąd natywnego Plugin może spowodować awarię lub destabilizację gateway
- złośliwy natywny Plugin jest równoważny dowolnemu wykonaniu kodu wewnątrz procesu OpenClaw

Zgodne bundle są domyślnie bezpieczniejsze, ponieważ OpenClaw obecnie traktuje je
jako pakiety metadanych/treści. W obecnych wydaniach oznacza to głównie
dołączone Skills.

W przypadku Plugin niedołączonych używaj list dozwolonych i jawnych ścieżek instalacji/ładowania. Traktuj
Plugin workspace jako kod czasu deweloperskiego, a nie domyślne ustawienie produkcyjne.

W przypadku nazw pakietów dołączonych workspace utrzymuj identyfikator Plugin zakotwiczony w nazwie npm:
domyślnie `@openclaw/<id>`, albo zatwierdzony typowany sufiks, taki jak
`-provider`, `-plugin`, `-speech`, `-sandbox` lub `-media-understanding`, gdy
pakiet celowo ujawnia węższą rolę Plugin.

Ważna uwaga dotycząca zaufania:

- `plugins.allow` ufa **identyfikatorom Plugin**, a nie pochodzeniu źródła.
- Plugin workspace z tym samym identyfikatorem co dołączony Plugin celowo przesłania
  dołączoną kopię, gdy taki Plugin workspace jest włączony/na liście dozwolonych.
- To normalne i przydatne dla lokalnego rozwoju, testowania poprawek i hotfixów.
- Zaufanie do dołączonych Plugin jest rozwiązywane z migawki źródła — manifestu i
  kodu na dysku w czasie ładowania — a nie z metadanych instalacji. Uszkodzony
  albo podmieniony rekord instalacji nie może po cichu rozszerzyć powierzchni zaufania dołączonego Plugin
  ponad to, co deklaruje rzeczywiste źródło.

## Granica eksportu

OpenClaw eksportuje możliwości, a nie wygodne implementacje.

Utrzymuj publiczną rejestrację możliwości. Ograniczaj eksporty helperów niebędących częścią kontraktu:

- podścieżki pomocnicze specyficzne dla dołączonych Plugin
- podścieżki plumbing runtime nieprzeznaczone jako publiczne API
- helpery wygody specyficzne dla dostawcy
- helpery setup/onboardingu będące szczegółami implementacji

Niektóre podścieżki helperów dołączonych Plugin nadal pozostają w wygenerowanej mapie eksportów SDK dla zgodności i utrzymania dołączonych Plugin. Obecne przykłady obejmują
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz kilka powierzchni `plugin-sdk/matrix*`. Traktuj je jako
zastrzeżone eksporty szczegółów implementacji, a nie zalecany wzorzec SDK dla
nowych zewnętrznych Plugin.

## Wnętrza i dokumentacja referencyjna

Informacje o potoku ładowania, modelu rejestru, hookach runtime dostawców, trasach HTTP Gateway,
schematach narzędzia wiadomości, rozwiązywaniu celów kanałów, katalogach dostawców,
Plugin silnika kontekstu oraz przewodniku dodawania nowej możliwości znajdziesz w
[Plugin architecture internals](/pl/plugins/architecture-internals).

## Powiązane

- [Budowanie Plugin](/pl/plugins/building-plugins)
- [Konfiguracja SDK Plugin](/pl/plugins/sdk-setup)
- [Manifest Plugin](/pl/plugins/manifest)
