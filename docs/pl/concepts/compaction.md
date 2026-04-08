---
read_when:
    - Chcesz zrozumieć automatyczną kompakcję i /compact
    - Debugujesz długie sesje osiągające limity kontekstu
summary: Jak OpenClaw streszcza długie rozmowy, aby mieścić się w limitach modelu
title: Kompakcja
x-i18n:
    generated_at: "2026-04-08T02:14:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6590b82a8c3a9c310998d653459ca4d8612495703ca0a8d8d306d7643142fd1
    source_path: concepts/compaction.md
    workflow: 15
---

# Kompakcja

Każdy model ma okno kontekstu — maksymalną liczbę tokenów, które może przetworzyć.
Gdy rozmowa zbliża się do tego limitu, OpenClaw **kompaktuje** starsze wiadomości
do postaci podsumowania, aby czat mógł być kontynuowany.

## Jak to działa

1. Starsze tury rozmowy są streszczane do zwartego wpisu.
2. Podsumowanie jest zapisywane w transkrypcie sesji.
3. Ostatnie wiadomości pozostają nienaruszone.

Gdy OpenClaw dzieli historię na fragmenty do kompaktowania, zachowuje wywołania
narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`. Jeśli punkt
podziału wypada wewnątrz bloku narzędzia, OpenClaw przesuwa granicę tak, aby para
pozostała razem, a bieżący niepodsumowany ogon został zachowany.

Pełna historia rozmowy pozostaje na dysku. Kompakcja zmienia tylko to, co model
widzi w następnej turze.

## Automatyczna kompakcja

Automatyczna kompakcja jest domyślnie włączona. Uruchamia się, gdy sesja zbliża się do limitu
kontekstu albo gdy model zwraca błąd przepełnienia kontekstu (w takim przypadku
OpenClaw wykonuje kompakcję i ponawia próbę). Typowe sygnatury przepełnienia to
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` oraz `ollama error: context length
exceeded`.

<Info>
Przed kompaktowaniem OpenClaw automatycznie przypomina agentowi o zapisaniu ważnych
notatek do plików [memory](/pl/concepts/memory). Zapobiega to utracie kontekstu.
</Info>

Użyj ustawienia `agents.defaults.compaction` w pliku `openclaw.json`, aby skonfigurować zachowanie kompaktowania (tryb, docelową liczbę tokenów itd.).
Streszczanie podczas kompaktowania domyślnie zachowuje nieprzezroczyste identyfikatory (`identifierPolicy: "strict"`). Możesz to zmienić za pomocą `identifierPolicy: "off"` albo podać własny tekst przy użyciu `identifierPolicy: "custom"` i `identifierInstructions`.

Opcjonalnie możesz określić inny model do streszczania podczas kompaktowania za pomocą `agents.defaults.compaction.model`. Jest to przydatne, gdy podstawowy model jest lokalny lub mały, a chcesz, aby podsumowania kompaktowania były tworzone przez bardziej zaawansowany model. To ustawienie przyjmuje dowolny ciąg `provider/model-id`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Działa to również z modelami lokalnymi, na przykład z drugim modelem Ollama przeznaczonym do streszczania albo specjalistycznym modelem dostrojonym do kompaktowania:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Jeśli nie jest ustawione, kompaktowanie używa podstawowego modelu agenta.

## Wtyczkowi dostawcy kompaktowania

Plugins mogą rejestrować niestandardowego dostawcę kompaktowania za pomocą `registerCompactionProvider()` w API pluginu. Gdy dostawca jest zarejestrowany i skonfigurowany, OpenClaw deleguje streszczanie do niego zamiast do wbudowanego potoku LLM.

Aby użyć zarejestrowanego dostawcy, ustaw identyfikator dostawcy w konfiguracji:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Ustawienie `provider` automatycznie wymusza `mode: "safeguard"`. Dostawcy otrzymują te same instrukcje kompaktowania i tę samą politykę zachowywania identyfikatorów co ścieżka wbudowana, a OpenClaw nadal zachowuje kontekst sufiksu ostatnich tur i podzielonych tur po wyniku dostawcy. Jeśli dostawca zakończy się niepowodzeniem albo zwróci pusty wynik, OpenClaw wraca do wbudowanego streszczania przez LLM.

## Automatyczna kompakcja (domyślnie włączona)

Gdy sesja zbliża się do okna kontekstu modelu lub je przekracza, OpenClaw uruchamia automatyczną kompakcję i może ponowić pierwotne żądanie, używając skompaktowanego kontekstu.

Zobaczysz:

- `🧹 Auto-compaction complete` w trybie verbose
- `/status` pokazujące `🧹 Compactions: <count>`

Przed kompaktowaniem OpenClaw może uruchomić **ciche opróżnienie pamięci** tury, aby zapisać
trwałe notatki na dysk. Szczegóły i konfigurację znajdziesz w sekcji [Memory](/pl/concepts/memory).

## Ręczna kompakcja

Wpisz `/compact` w dowolnym czacie, aby wymusić kompakcję. Dodaj instrukcje, aby ukierunkować
podsumowanie:

```
/compact Focus on the API design decisions
```

## Używanie innego modelu

Domyślnie kompaktowanie używa podstawowego modelu agenta. Możesz użyć bardziej
zaawansowanego modelu, aby uzyskać lepsze podsumowania:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Powiadomienie o rozpoczęciu kompaktowania

Domyślnie kompaktowanie działa po cichu. Aby wyświetlać krótkie powiadomienie, gdy kompaktowanie
się rozpoczyna, włącz `notifyUser`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

Po włączeniu użytkownik zobaczy krótki komunikat (na przykład „Kompaktowanie
kontekstu...”) na początku każdego uruchomienia kompaktowania.

## Kompakcja a przycinanie

|                  | Kompakcja                     | Przycinanie                      |
| ---------------- | ----------------------------- | -------------------------------- |
| **Co robi**      | Streszcza starszą rozmowę     | Przycina stare wyniki narzędzi   |
| **Zapisywane?**  | Tak (w transkrypcie sesji)    | Nie (tylko w pamięci, na żądanie) |
| **Zakres**       | Cała rozmowa                  | Tylko wyniki narzędzi            |

[Przycinanie sesji](/pl/concepts/session-pruning) to lżejsze uzupełnienie, które
przycina dane wyjściowe narzędzi bez streszczania.

## Rozwiązywanie problemów

**Kompaktowanie występuje zbyt często?** Okno kontekstu modelu może być małe albo wyniki
narzędzi mogą być duże. Spróbuj włączyć
[przycinanie sesji](/pl/concepts/session-pruning).

**Czy po kompaktowaniu kontekst wydaje się nieaktualny?** Użyj `/compact Focus on <topic>`, aby
ukierunkować podsumowanie, albo włącz [opróżnianie pamięci](/pl/concepts/memory), aby notatki
zostały zachowane.

**Potrzebujesz czystego startu?** `/new` rozpoczyna nową sesję bez kompaktowania.

Zaawansowaną konfigurację (rezerwę tokenów, zachowywanie identyfikatorów, niestandardowe
silniki kontekstu, kompaktowanie po stronie serwera OpenAI) znajdziesz w
[szczegółowym omówieniu zarządzania sesją](/pl/reference/session-management-compaction).

## Powiązane

- [Session](/pl/concepts/session) — zarządzanie sesją i jej cykl życia
- [Session Pruning](/pl/concepts/session-pruning) — przycinanie wyników narzędzi
- [Context](/pl/concepts/context) — jak budowany jest kontekst dla tur agenta
- [Hooks](/pl/automation/hooks) — hooki cyklu życia kompaktowania (before_compaction, after_compaction)
