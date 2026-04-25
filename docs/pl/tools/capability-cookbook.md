---
read_when:
    - Dodawanie nowej możliwości rdzenia i powierzchni rejestracji Plugin
    - Decydowanie, czy kod powinien należeć do rdzenia, Plugin dostawcy czy Plugin funkcji
    - Podłączanie nowego helpera runtime dla kanałów lub narzędzi
sidebarTitle: Adding Capabilities
summary: Przewodnik dla współtwórców dotyczący dodawania nowej współdzielonej możliwości do systemu Plugin OpenClaw
title: Dodawanie możliwości (przewodnik dla współtwórców)
x-i18n:
    generated_at: "2026-04-25T13:59:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  To **przewodnik dla współtwórców** dla deweloperów rdzenia OpenClaw. Jeśli
  tworzysz zewnętrzny Plugin, zobacz zamiast tego [Building Plugins](/pl/plugins/building-plugins).
</Info>

Używaj tego wtedy, gdy OpenClaw potrzebuje nowej dziedziny, takiej jak generowanie obrazów, generowanie wideo lub jakiegoś przyszłego obszaru funkcji wspieranego przez dostawcę.

Zasada:

- plugin = granica własności
- capability = współdzielony kontrakt rdzenia

Oznacza to, że nie należy zaczynać od podłączania dostawcy bezpośrednio do kanału albo narzędzia. Zacznij od zdefiniowania możliwości.

## Kiedy tworzyć możliwość

Utwórz nową możliwość, gdy wszystkie poniższe są prawdziwe:

1. więcej niż jeden dostawca mógłby ją realnie zaimplementować
2. kanały, narzędzia lub Pluginy funkcji powinny ją konsumować bez troski o
   dostawcę
3. rdzeń musi być właścicielem fallbacku, polityki, konfiguracji lub zachowania dostarczenia

Jeśli praca dotyczy wyłącznie dostawcy i nie istnieje jeszcze współdzielony kontrakt, zatrzymaj się i najpierw zdefiniuj kontrakt.

## Standardowa sekwencja

1. Zdefiniuj typowany kontrakt rdzenia.
2. Dodaj rejestrację Plugin dla tego kontraktu.
3. Dodaj współdzielony helper runtime.
4. Podłącz jednego prawdziwego Plugin dostawcy jako dowód.
5. Przenieś konsumentów funkcji/kanałów na helper runtime.
6. Dodaj testy kontraktowe.
7. Udokumentuj konfigurację widoczną dla operatora i model własności.

## Co gdzie trafia

Rdzeń:

- typy żądań/odpowiedzi
- rejestr providera + rozwiązywanie
- zachowanie fallbacku
- schemat konfiguracji plus propagowane metadane dokumentacyjne `title` / `description` na zagnieżdżonych obiektach, węzłach wildcard, elementach tablic i węzłach kompozycji
- powierzchnia helpera runtime

Plugin dostawcy:

- wywołania API dostawcy
- obsługa auth dostawcy
- normalizacja żądań specyficzna dla dostawcy
- rejestracja implementacji możliwości

Plugin funkcji/kanału:

- wywołuje `api.runtime.*` albo pasujący helper `plugin-sdk/*-runtime`
- nigdy nie wywołuje bezpośrednio implementacji dostawcy

## Seamy providera i harnessa

Używaj hooków providera, gdy zachowanie należy do kontraktu providera modelu,
a nie do generycznej pętli agenta. Przykłady obejmują parametry żądania specyficzne dla providera
po wyborze transportu, preferencję profilu auth, nakładki promptu oraz
routing fallbacku kolejnych prób po failoverze modelu/profilu.

Używaj hooków harnessa agenta, gdy zachowanie należy do środowiska wykonawczego,
które wykonuje turę. Harnessy mogą klasyfikować wyniki prób, które zakończyły się sukcesem,
ale są nieużywalne, takie jak puste odpowiedzi, odpowiedzi tylko z reasoning albo tylko z planowaniem,
tak aby zewnętrzna polityka fallbacku modelu mogła podjąć decyzję o ponowieniu.

Utrzymuj oba seamy wąskie:

- rdzeń jest właścicielem polityki retry/fallbacku
- Pluginy dostawców są właścicielami wskazówek żądań/auth/routingu specyficznych dla dostawcy
- Pluginy harnessa są właścicielami klasyfikacji prób specyficznej dla runtime
- Pluginy stron trzecich zwracają wskazówki, a nie bezpośrednie mutacje stanu rdzenia

## Checklista plików

W przypadku nowej możliwości spodziewaj się zmian w tych obszarach:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- jeden lub więcej pakietów dołączonych Plugin
- config/docs/tests

## Przykład: generowanie obrazów

Generowanie obrazów stosuje standardowy kształt:

1. rdzeń definiuje `ImageGenerationProvider`
2. rdzeń udostępnia `registerImageGenerationProvider(...)`
3. rdzeń udostępnia `runtime.imageGeneration.generate(...)`
4. Pluginy `openai`, `google`, `fal` i `minimax` rejestrują implementacje wspierane przez dostawcę
5. przyszli dostawcy mogą rejestrować ten sam kontrakt bez zmiany kanałów/narzędzi

Klucz konfiguracji jest oddzielony od routingu analizy vision:

- `agents.defaults.imageModel` = analizuj obrazy
- `agents.defaults.imageGenerationModel` = generuj obrazy

Utrzymuj ich rozdzielenie, aby fallback i polityka pozostały jawne.

## Checklista przeglądu

Przed wdrożeniem nowej możliwości sprawdź:

- żaden kanał/narzędzie nie importuje bezpośrednio kodu dostawcy
- helper runtime jest współdzieloną ścieżką
- co najmniej jeden test kontraktowy potwierdza dołączoną własność
- dokumentacja konfiguracji nazywa nowy klucz modelu/konfiguracji
- dokumentacja Plugin wyjaśnia granicę własności

Jeśli PR pomija warstwę możliwości i koduje na sztywno zachowanie dostawcy w
kanale/narzędziu, odeślij go z powrotem i najpierw zdefiniuj kontrakt.

## Powiązane

- [Plugin](/pl/tools/plugin)
- [Creating skills](/pl/tools/creating-skills)
- [Tools and plugins](/pl/tools)
