---
read_when:
    - Konfigurowanie autonomicznych przepływów pracy agentów, które działają bez monitów dla każdego zadania z osobna
    - Określanie, co agent może robić samodzielnie, a co wymaga zgody człowieka
    - Strukturyzowanie agentów wieloprogramowych z jasnymi granicami i zasadami eskalacji
summary: Zdefiniuj stałe uprawnienia operacyjne dla autonomicznych programów agentowych
title: Stałe polecenia
x-i18n:
    generated_at: "2026-04-25T13:41:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a18777284a12e99b2e9f1ce660a0dc4d18ba5782d6a6a6673b495ab32b2d8cf
    source_path: automation/standing-orders.md
    workflow: 15
---

Stałe polecenia przyznają agentowi **stałe uprawnienia operacyjne** dla zdefiniowanych programów. Zamiast za każdym razem przekazywać osobne instrukcje do wykonania zadania, definiujesz programy z jasnym zakresem, wyzwalaczami i zasadami eskalacji — a agent wykonuje je autonomicznie w tych granicach.

To jest różnica między mówieniem asystentowi „wyślij cotygodniowy raport” w każdy piątek a przyznaniem stałych uprawnień: „Odpowiadasz za cotygodniowy raport. Przygotowuj go w każdy piątek, wysyłaj i eskaluj tylko wtedy, gdy coś wygląda nieprawidłowo”.

## Dlaczego warto używać stałych poleceń?

**Bez stałych poleceń:**

- Musisz wysyłać agentowi polecenie do każdego zadania
- Agent pozostaje bezczynny między zgłoszeniami
- Rutynowe zadania są zapominane lub opóźniane
- To Ty stajesz się wąskim gardłem

**Ze stałymi poleceniami:**

- Agent działa autonomicznie w zdefiniowanych granicach
- Rutynowe zadania są wykonywane zgodnie z harmonogramem bez dodatkowych poleceń
- Angażujesz się tylko w wyjątki i zatwierdzenia
- Agent produktywnie wykorzystuje czas bezczynności

## Jak to działa

Stałe polecenia są definiowane w plikach [obszaru roboczego agenta](/pl/concepts/agent-workspace). Zalecanym podejściem jest umieszczenie ich bezpośrednio w `AGENTS.md` (który jest automatycznie wstrzykiwany w każdej sesji), aby agent zawsze miał je w kontekście. W przypadku większych konfiguracji możesz także umieścić je w osobnym pliku, takim jak `standing-orders.md`, i odwołać się do niego z `AGENTS.md`.

Każdy program określa:

1. **Zakres** — co agent ma uprawnienia wykonywać
2. **Wyzwalacze** — kiedy ma działać (harmonogram, zdarzenie lub warunek)
3. **Bramki zatwierdzania** — co wymaga akceptacji człowieka przed działaniem
4. **Zasady eskalacji** — kiedy się zatrzymać i poprosić o pomoc

Agent ładuje te instrukcje w każdej sesji za pośrednictwem plików startowych obszaru roboczego (zobacz [Agent Workspace](/pl/concepts/agent-workspace), aby uzyskać pełną listę plików wstrzykiwanych automatycznie) i wykonuje je w połączeniu z [zadaniami Cron](/pl/automation/cron-jobs) w celu egzekwowania harmonogramu czasowego.

<Tip>
Umieść stałe polecenia w `AGENTS.md`, aby mieć gwarancję, że będą ładowane w każdej sesji. Mechanizm startowy obszaru roboczego automatycznie wstrzykuje `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` i `MEMORY.md` — ale nie dowolne pliki w podkatalogach.
</Tip>

## Anatomia stałego polecenia

```markdown
## Program: Cotygodniowy raport statusu

**Uprawnienia:** Kompilowanie danych, generowanie raportu, dostarczanie go interesariuszom
**Wyzwalacz:** W każdy piątek o 16:00 (egzekwowane przez zadanie Cron)
**Bramka zatwierdzania:** Brak dla standardowych raportów. Oznacz anomalie do przeglądu przez człowieka.
**Eskalacja:** Jeśli źródło danych jest niedostępne lub metryki wyglądają nietypowo (>2σ od normy)

### Kroki wykonania

1. Pobierz metryki ze skonfigurowanych źródeł
2. Porównaj je z poprzednim tygodniem i celami
3. Wygeneruj raport w Reports/weekly/YYYY-MM-DD.md
4. Dostarcz podsumowanie przez skonfigurowany kanał
5. Zaloguj ukończenie w Agent/Logs/

### Czego NIE robić

- Nie wysyłaj raportów do podmiotów zewnętrznych
- Nie modyfikuj danych źródłowych
- Nie pomijaj wysyłki, jeśli metryki wyglądają źle — raportuj je zgodnie z prawdą
```

## Stałe polecenia + zadania Cron

Stałe polecenia definiują, **co** agent ma uprawnienia robić. [Zadania Cron](/pl/automation/cron-jobs) definiują, **kiedy** to się dzieje. Działają razem:

```
Stałe polecenie: "Odpowiadasz za codzienne triage skrzynki odbiorczej"
    ↓
Zadanie Cron (codziennie o 8:00): "Wykonaj triage skrzynki odbiorczej zgodnie ze stałymi poleceniami"
    ↓
Agent: Odczytuje stałe polecenia → wykonuje kroki → raportuje wyniki
```

Prompt zadania Cron powinien odwoływać się do stałego polecenia zamiast je powielać:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Przykłady

### Przykład 1: Treści i media społecznościowe (cykl tygodniowy)

```markdown
## Program: Treści i media społecznościowe

**Uprawnienia:** Tworzenie szkiców treści, planowanie postów, przygotowywanie raportów zaangażowania
**Bramka zatwierdzania:** Wszystkie posty wymagają przeglądu właściciela przez pierwsze 30 dni, a następnie stałego zatwierdzenia
**Wyzwalacz:** Cykl tygodniowy (poniedziałkowy przegląd → szkice w środku tygodnia → piątkowy brief)

### Cykl tygodniowy

- **Poniedziałek:** Przegląd metryk platform i zaangażowania odbiorców
- **Wtorek–czwartek:** Tworzenie szkiców postów społecznościowych, przygotowywanie treści blogowych
- **Piątek:** Przygotowanie cotygodniowego briefu marketingowego → dostarczenie właścicielowi

### Zasady dotyczące treści

- Ton musi odpowiadać marce (zobacz SOUL.md lub przewodnik po tonie marki)
- Nigdy nie przedstawiaj się jako AI w treściach publicznych
- Uwzględniaj metryki, gdy są dostępne
- Skupiaj się na wartości dla odbiorców, a nie na autopromocji
```

### Przykład 2: Operacje finansowe (wyzwalane zdarzeniem)

```markdown
## Program: Przetwarzanie finansowe

**Uprawnienia:** Przetwarzanie danych transakcyjnych, generowanie raportów, wysyłanie podsumowań
**Bramka zatwierdzania:** Brak dla analiz. Rekomendacje wymagają akceptacji właściciela.
**Wyzwalacz:** Wykrycie nowego pliku danych LUB zaplanowany cykl miesięczny

### Gdy nadejdą nowe dane

1. Wykryj nowy plik w wyznaczonym katalogu wejściowym
2. Przeparsuj i skategoryzuj wszystkie transakcje
3. Porównaj je z celami budżetowymi
4. Oznacz: nietypowe pozycje, przekroczenia progów, nowe opłaty cykliczne
5. Wygeneruj raport w wyznaczonym katalogu wyjściowym
6. Dostarcz podsumowanie właścicielowi przez skonfigurowany kanał

### Zasady eskalacji

- Pojedyncza pozycja > $500: natychmiastowy alert
- Kategoria > budżet o 20%: oznacz w raporcie
- Nierozpoznawalna transakcja: poproś właściciela o kategoryzację
- Nieudane przetwarzanie po 2 próbach: zgłoś błąd, nie zgaduj
```

### Przykład 3: Monitorowanie i alerty (ciągłe)

```markdown
## Program: Monitorowanie systemu

**Uprawnienia:** Sprawdzanie stanu systemu, restartowanie usług, wysyłanie alertów
**Bramka zatwierdzania:** Restartuj usługi automatycznie. Eskaluj, jeśli restart nie powiedzie się dwa razy.
**Wyzwalacz:** Każdy cykl Heartbeat

### Kontrole

- Punkty końcowe stanu usług odpowiadają
- Wolne miejsce na dysku powyżej progu
- Oczekujące zadania nie są przeterminowane (>24 godziny)
- Kanały dostarczania działają

### Macierz reakcji

| Warunek         | Działanie                | Eskalować?               |
| ---------------- | ------------------------ | ------------------------ |
| Usługa nie działa | Uruchom ponownie automatycznie | Tylko jeśli restart nie powiedzie się 2x |
| Miejsce na dysku < 10% | Powiadom właściciela      | Tak                      |
| Nieaktualne zadanie > 24 h | Przypomnij właścicielowi | Nie                      |
| Kanał offline   | Zaloguj i ponów próbę w następnym cyklu | Jeśli offline > 2 godziny     |
```

## Wzorzec Wykonaj-Zweryfikuj-Zaraportuj

Stałe polecenia działają najlepiej, gdy są połączone ze ścisłą dyscypliną wykonania. Każde zadanie w stałym poleceniu powinno podążać za tą pętlą:

1. **Wykonaj** — wykonaj faktyczną pracę (nie tylko potwierdź instrukcję)
2. **Zweryfikuj** — potwierdź, że wynik jest poprawny (plik istnieje, wiadomość została dostarczona, dane zostały sparsowane)
3. **Zaraportuj** — powiedz właścicielowi, co zostało zrobione i co zostało zweryfikowane

```markdown
### Zasady wykonania

- Każde zadanie przebiega według schematu Wykonaj-Zweryfikuj-Zaraportuj. Bez wyjątków.
- "Zajmę się tym" nie oznacza wykonania. Zrób to, a potem zaraportuj.
- "Gotowe" bez weryfikacji nie jest akceptowalne. Udowodnij to.
- Jeśli wykonanie się nie powiedzie: ponów próbę raz ze skorygowanym podejściem.
- Jeśli nadal się nie powiedzie: zgłoś błąd wraz z diagnozą. Nigdy nie ponoś porażki po cichu.
- Nigdy nie ponawiaj prób w nieskończoność — maksymalnie 3 próby, potem eskalacja.
```

Ten wzorzec zapobiega najczęstszemu trybowi błędu agenta: potwierdzeniu zadania bez jego ukończenia.

## Architektura wieloprogramowa

W przypadku agentów zarządzających wieloma obszarami uporządkuj stałe polecenia jako osobne programy z jasnymi granicami:

```markdown
## Program 1: [Domena A] (Tygodniowo)

...

## Program 2: [Domena B] (Miesięcznie + Na żądanie)

...

## Program 3: [Domena C] (W razie potrzeby)

...

## Zasady eskalacji (Wszystkie programy)

- [Wspólne kryteria eskalacji]
- [Bramki zatwierdzania obowiązujące we wszystkich programach]
```

Każdy program powinien mieć:

- Własną **częstotliwość wyzwalania** (tygodniową, miesięczną, sterowaną zdarzeniami, ciągłą)
- Własne **bramki zatwierdzania** (niektóre programy wymagają większego nadzoru niż inne)
- Jasne **granice** (agent powinien wiedzieć, gdzie kończy się jeden program, a zaczyna drugi)

## Dobre praktyki

### Rób

- Zaczynaj od wąskich uprawnień i rozszerzaj je wraz ze wzrostem zaufania
- Definiuj jawne bramki zatwierdzania dla działań wysokiego ryzyka
- Uwzględniaj sekcje „Czego NIE robić” — granice są tak samo ważne jak uprawnienia
- Łącz je z zadaniami Cron dla niezawodnego wykonywania opartego na czasie
- Co tydzień przeglądaj logi agenta, aby weryfikować, czy stałe polecenia są przestrzegane
- Aktualizuj stałe polecenia wraz ze zmianą potrzeb — to żywe dokumenty

### Unikaj

- Przyznawania szerokich uprawnień pierwszego dnia („rób, co uznasz za najlepsze”)
- Pomijania zasad eskalacji — każdy program potrzebuje klauzuli „kiedy się zatrzymać i zapytać”
- Zakładania, że agent zapamięta instrukcje ustne — umieść wszystko w pliku
- Mieszania różnych obszarów w jednym programie — osobne programy dla osobnych domen
- Zapominania o egzekwowaniu za pomocą zadań Cron — stałe polecenia bez wyzwalaczy stają się sugestiami

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — przegląd wszystkich mechanizmów automatyzacji
- [Zadania Cron](/pl/automation/cron-jobs) — egzekwowanie harmonogramu dla stałych poleceń
- [Hooki](/pl/automation/hooks) — skrypty sterowane zdarzeniami dla zdarzeń cyklu życia agenta
- [Webhooki](/pl/automation/cron-jobs#webhooks) — przychodzące wyzwalacze zdarzeń HTTP
- [Agent Workspace](/pl/concepts/agent-workspace) — miejsce, w którym znajdują się stałe polecenia, w tym pełna lista automatycznie wstrzykiwanych plików startowych (AGENTS.md, SOUL.md itd.)
