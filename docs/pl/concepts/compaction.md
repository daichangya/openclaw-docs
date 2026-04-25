---
read_when:
    - Chcesz zrozumieć automatyczny Compaction i `/compact`
    - Debugujesz długie sesje osiągające limity kontekstu
summary: Jak OpenClaw podsumowuje długie rozmowy, aby zmieścić się w limitach modelu
title: Compaction
x-i18n:
    generated_at: "2026-04-25T13:45:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

Każdy model ma okno kontekstowe — maksymalną liczbę tokenów, które może przetworzyć.
Gdy rozmowa zbliża się do tego limitu, OpenClaw wykonuje **Compaction** starszych wiadomości
do postaci podsumowania, aby czat mógł być kontynuowany.

## Jak to działa

1. Starsze tury rozmowy są podsumowywane do zwartego wpisu.
2. Podsumowanie jest zapisywane w transkrypcie sesji.
3. Ostatnie wiadomości pozostają nienaruszone.

Gdy OpenClaw dzieli historię na fragmenty Compaction, utrzymuje wywołania narzędzi
asystenta sparowane z odpowiadającymi im wpisami `toolResult`. Jeśli punkt podziału wypada
wewnątrz bloku narzędzia, OpenClaw przesuwa granicę tak, aby para pozostała razem
i aby zachowany został bieżący niepodsumowany ogon.

Pełna historia rozmowy pozostaje na dysku. Compaction zmienia tylko to, co
model widzi w następnej turze.

## Automatyczny Compaction

Automatyczny Compaction jest domyślnie włączony. Uruchamia się, gdy sesja zbliża się do limitu
kontekstu lub gdy model zwraca błąd przepełnienia kontekstu (w takim przypadku
OpenClaw wykonuje Compaction i ponawia próbę). Typowe sygnatury przepełnienia obejmują
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` oraz `ollama error: context length
exceeded`.

<Info>
Przed wykonaniem Compaction OpenClaw automatycznie przypomina agentowi o zapisaniu ważnych
notatek do plików [memory](/pl/concepts/memory). Zapobiega to utracie kontekstu.
</Info>

Użyj ustawienia `agents.defaults.compaction` w swoim `openclaw.json`, aby skonfigurować zachowanie Compaction (tryb, docelowe tokeny itp.).
Podsumowywanie Compaction domyślnie zachowuje nieprzezroczyste identyfikatory (`identifierPolicy: "strict"`). Możesz to nadpisać przez `identifierPolicy: "off"` albo podać własny tekst przez `identifierPolicy: "custom"` i `identifierInstructions`.

Opcjonalnie możesz określić inny model do podsumowywania Compaction przez `agents.defaults.compaction.model`. Jest to przydatne, gdy główny model jest lokalny lub mały, a chcesz, by podsumowania Compaction były tworzone przez bardziej zaawansowany model. To nadpisanie akceptuje dowolny ciąg `provider/model-id`:

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

Działa to także z modelami lokalnymi, na przykład drugim modelem Ollama przeznaczonym do podsumowywania albo specjalistą Compaction po fine-tuningu:

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

Jeśli nie jest ustawione, Compaction używa głównego modelu agenta.

## Wymienne dostawcy Compaction

Pluginy mogą rejestrować własnego dostawcę Compaction przez `registerCompactionProvider()` w API Plugin. Gdy dostawca jest zarejestrowany i skonfigurowany, OpenClaw deleguje podsumowywanie do niego zamiast do wbudowanego potoku LLM.

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

Ustawienie `provider` automatycznie wymusza `mode: "safeguard"`. Dostawcy otrzymują te same instrukcje Compaction i zasady zachowywania identyfikatorów co ścieżka wbudowana, a OpenClaw nadal zachowuje kontekst ostatnich tur i sufiksu tury podziału po wyniku dostawcy. Jeśli dostawca zawiedzie lub zwróci pusty wynik, OpenClaw wraca do wbudowanego podsumowywania LLM.

## Automatyczny Compaction (domyślnie włączony)

Gdy sesja zbliża się do okna kontekstowego modelu lub je przekracza, OpenClaw wyzwala automatyczny Compaction i może ponowić oryginalne żądanie, używając skompaktowanego kontekstu.

Zobaczysz:

- `🧹 Auto-compaction complete` w trybie verbose
- `/status` pokazujące `🧹 Compactions: <count>`

Przed wykonaniem Compaction OpenClaw może uruchomić **cichą turę opróżniania pamięci**, aby zapisać
trwałe notatki na dysku. Szczegóły i konfiguracja: [Memory](/pl/concepts/memory).

## Ręczny Compaction

Wpisz `/compact` w dowolnym czacie, aby wymusić Compaction. Dodaj instrukcje, aby ukierunkować
podsumowanie:

```
/compact Focus on the API design decisions
```

Gdy ustawione jest `agents.defaults.compaction.keepRecentTokens`, ręczny Compaction
respektuje ten punkt cięcia Pi i zachowuje ostatni ogon w odbudowanym kontekście. Bez
jawnego budżetu zachowania ręczny Compaction zachowuje się jak twardy punkt kontrolny i
kontynuuje tylko z nowego podsumowania.

## Używanie innego modelu

Domyślnie Compaction używa głównego modelu agenta. Możesz użyć bardziej
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

## Powiadomienia Compaction

Domyślnie Compaction działa po cichu. Aby pokazywać krótkie powiadomienia, gdy Compaction
się rozpoczyna i gdy się kończy, włącz `notifyUser`:

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

Po włączeniu użytkownik widzi krótkie komunikaty o stanie przy każdym przebiegu Compaction
(na przykład „Compacting context...” i „Compaction complete”).

## Compaction a przycinanie

|                  | Compaction                   | Przycinanie                      |
| ---------------- | ---------------------------- | -------------------------------- |
| **Co robi**      | Podsumowuje starszą rozmowę  | Przycina stare wyniki narzędzi   |
| **Zapisywane?**  | Tak (w transkrypcie sesji)   | Nie (tylko w pamięci, per żądanie) |
| **Zakres**       | Cała rozmowa                 | Tylko wyniki narzędzi            |

[Session pruning](/pl/concepts/session-pruning) to lżejsze uzupełnienie, które
przycina wyniki narzędzi bez podsumowywania.

## Rozwiązywanie problemów

**Compaction dzieje się zbyt często?** Okno kontekstowe modelu może być małe albo wyniki
narzędzi mogą być duże. Spróbuj włączyć
[session pruning](/pl/concepts/session-pruning).

**Kontekst wydaje się nieaktualny po Compaction?** Użyj `/compact Focus on <topic>`, aby
ukierunkować podsumowanie, albo włącz [memory flush](/pl/concepts/memory), aby notatki
przetrwały.

**Potrzebujesz czystego startu?** `/new` rozpoczyna świeżą sesję bez Compaction.

W przypadku zaawansowanej konfiguracji (rezerwa tokenów, zachowywanie identyfikatorów, niestandardowe
silniki kontekstu, server-side Compaction OpenAI) zobacz
[Session Management Deep Dive](/pl/reference/session-management-compaction).

## Powiązane

- [Session](/pl/concepts/session) — zarządzanie sesją i cykl życia
- [Session Pruning](/pl/concepts/session-pruning) — przycinanie wyników narzędzi
- [Context](/pl/concepts/context) — jak budowany jest kontekst dla tur agenta
- [Hooks](/pl/automation/hooks) — hooki cyklu życia Compaction (`before_compaction`, `after_compaction`)
