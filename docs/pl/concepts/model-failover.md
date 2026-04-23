---
read_when:
    - Diagnozowanie rotacji profili uwierzytelniania, cooldownów lub zachowania fallbacku modeli
    - Aktualizowanie reguł failover dla profili uwierzytelniania lub modeli
    - Zrozumienie, jak nadpisania modeli sesji współdziałają z ponownymi próbami fallbacku
summary: Jak OpenClaw rotuje profile uwierzytelniania i stosuje fallback między modelami
title: Failover modeli
x-i18n:
    generated_at: "2026-04-23T10:00:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c1f06d5371379cc59998e1cd6f52d250e8c4eba4e7dbfef776a090899b8d3c4
    source_path: concepts/model-failover.md
    workflow: 15
---

# Failover modeli

OpenClaw obsługuje awarie w dwóch etapach:

1. **Rotacja profili uwierzytelniania** w obrębie bieżącego providera.
2. **Fallback modelu** do następnego modelu w `agents.defaults.model.fallbacks`.

Ten dokument wyjaśnia reguły runtime i dane, na których się one opierają.

## Przepływ runtime

Dla zwykłego uruchomienia tekstowego OpenClaw ocenia kandydatów w tej kolejności:

1. Aktualnie wybrany model sesji.
2. Skonfigurowane `agents.defaults.model.fallbacks` w podanej kolejności.
3. Skonfigurowany model podstawowy na końcu, gdy uruchomienie zaczęło się od nadpisania.

W obrębie każdego kandydata OpenClaw próbuje failover profilu uwierzytelniania przed przejściem
do następnego kandydata modelu.

Sekwencja wysokiego poziomu:

1. Rozwiąż aktywny model sesji i preferencję profilu uwierzytelniania.
2. Zbuduj łańcuch kandydatów modeli.
3. Spróbuj bieżącego providera z regułami rotacji/cooldownów profili uwierzytelniania.
4. Jeśli ten provider zostanie wyczerpany z błędem kwalifikującym się do failover, przejdź do następnego
   kandydata modelu.
5. Zapisz wybrane nadpisanie fallback przed rozpoczęciem ponownej próby, aby inni czytelnicy sesji widzieli ten sam provider/model, którego runner zaraz użyje.
6. Jeśli kandydat fallback zawiedzie, wycofaj tylko pola nadpisania sesji należące do fallbacku, gdy nadal odpowiadają temu nieudanemu kandydatowi.
7. Jeśli każdy kandydat zawiedzie, rzuć `FallbackSummaryError` ze szczegółami dla każdej próby
   oraz najbliższą datą wygaśnięcia cooldownu, jeśli jest znana.

To jest celowo węższe niż „zapisz i przywróć całą sesję”. Runner odpowiedzi zapisuje tylko pola wyboru modelu, które posiada na potrzeby fallbacku:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

To zapobiega sytuacji, w której nieudana ponowna próba fallback nadpisuje nowsze, niezwiązane mutacje sesji, takie jak ręczne zmiany `/model` lub aktualizacje rotacji sesji, które nastąpiły podczas działania próby.

## Przechowywanie uwierzytelniania (klucze + OAuth)

OpenClaw używa **profili uwierzytelniania** zarówno dla kluczy API, jak i tokenów OAuth.

- Sekrety znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (starsza lokalizacja: `~/.openclaw/agent/auth-profiles.json`).
- Stan routingu uwierzytelniania runtime znajduje się w `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- Konfiguracja `auth.profiles` / `auth.order` to tylko **metadane + routing** (bez sekretów).
- Starszy plik OAuth tylko do importu: `~/.openclaw/credentials/oauth.json` (importowany do `auth-profiles.json` przy pierwszym użyciu).

Więcej szczegółów: [/concepts/oauth](/pl/concepts/oauth)

Typy poświadczeń:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` dla niektórych providerów)

## ID profili

Logowania OAuth tworzą odrębne profile, aby wiele kont mogło współistnieć.

- Domyślnie: `provider:default`, gdy e-mail nie jest dostępny.
- OAuth z e-mailem: `provider:<email>` (na przykład `google-antigravity:user@gmail.com`).

Profile znajdują się w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` pod `profiles`.

## Kolejność rotacji

Gdy provider ma wiele profili, OpenClaw wybiera kolejność w ten sposób:

1. **Jawna konfiguracja**: `auth.order[provider]` (jeśli ustawiono).
2. **Skonfigurowane profile**: `auth.profiles` przefiltrowane po providerze.
3. **Zapisane profile**: wpisy w `auth-profiles.json` dla providera.

Jeśli nie skonfigurowano jawnej kolejności, OpenClaw używa kolejności round‑robin:

- **Klucz podstawowy:** typ profilu (**OAuth przed kluczami API**).
- **Klucz pomocniczy:** `usageStats.lastUsed` (najstarsze najpierw, w obrębie każdego typu).
- Profile w cooldownie/wyłączone są przesuwane na koniec, uporządkowane według najbliższego wygaśnięcia.

### Lepkość sesji (przyjazna cache)

OpenClaw **przypina wybrany profil uwierzytelniania do sesji**, aby utrzymać ciepłe cache providera.
**Nie** rotuje przy każdym żądaniu. Przypięty profil jest używany ponownie, dopóki:

- sesja nie zostanie zresetowana (`/new` / `/reset`)
- nie zakończy się Compaction (licznik compaction wzrasta)
- profil nie znajdzie się w cooldownie/nie zostanie wyłączony

Ręczny wybór przez `/model …@<profileId>` ustawia **nadpisanie użytkownika** dla tej sesji
i nie jest automatycznie rotowany aż do rozpoczęcia nowej sesji.

Profile automatycznie przypinane (wybierane przez router sesji) są traktowane jako **preferencja**:
są próbowane najpierw, ale OpenClaw może zrotować do innego profilu przy limitach szybkości/timeoutach.
Profile przypięte przez użytkownika pozostają zablokowane do tego profilu; jeśli zawiodą i skonfigurowano fallbacki modeli, OpenClaw przechodzi do następnego modelu zamiast przełączać profile.

### Dlaczego OAuth może „wyglądać na utracony”

Jeśli masz zarówno profil OAuth, jak i profil klucza API dla tego samego providera, round‑robin może przełączać się między nimi między wiadomościami, chyba że są przypięte. Aby wymusić pojedynczy profil:

- Przypnij przez `auth.order[provider] = ["provider:profileId"]`, lub
- Użyj nadpisania per-session przez `/model …` z nadpisaniem profilu (jeśli jest obsługiwane przez Twoją powierzchnię UI/czatu).

## Cooldowny

Gdy profil zawodzi z powodu błędów uwierzytelniania/limitów szybkości (lub timeoutu, który wygląda
jak limit szybkości), OpenClaw oznacza go cooldownem i przechodzi do następnego profilu.
Ten koszyk limitów szybkości jest szerszy niż zwykłe `429`: obejmuje też komunikaty providera
takie jak `Too many concurrent requests`, `ThrottlingException`,
`concurrency limit reached`, `workers_ai ... quota limit exceeded`,
`throttled`, `resource exhausted` oraz okresowe limity okna użycia, takie jak
`weekly/monthly limit reached`.
Błędy formatu/nieprawidłowego żądania (na przykład błędy walidacji ID wywołania narzędzia Cloud Code Assist)
są traktowane jako kwalifikujące się do failover i używają tych samych cooldownów.
Błędy zgodne z OpenAI dotyczące stop-reason, takie jak `Unhandled stop reason: error`,
`stop reason: error` i `reason: error`, są klasyfikowane jako sygnały timeout/failover.
Generyczny tekst błędu po stronie providera również może trafić do koszyka timeoutów, gdy
źródło odpowiada znanemu wzorcowi przejściowemu. Na przykład w Anthropic samo
`An unknown error occurred` oraz payloady JSON `api_error` z przejściowym tekstem serwera
takim jak `internal server error`, `unknown error, 520`, `upstream error`
lub `backend error` są traktowane jako kwalifikujące się timeouty. Specyficzny dla OpenRouter
generyczny tekst upstream, taki jak samo `Provider returned error`, jest również traktowany jako
timeout, ale tylko wtedy, gdy kontekst providera to rzeczywiście OpenRouter. Generyczny wewnętrzny
tekst fallbacku, taki jak `LLM request failed with an unknown error.`, pozostaje traktowany zachowawczo i sam w sobie nie wyzwala failover.

Niektóre SDK providerów mogą w przeciwnym razie usypiać na długie okno `Retry-After` przed
oddaniem kontroli do OpenClaw. Dla SDK opartych na Stainless, takich jak Anthropic i
OpenAI, OpenClaw domyślnie ogranicza wewnętrzne oczekiwania SDK `retry-after-ms` / `retry-after` do 60
sekund i natychmiast ujawnia dłuższe odpowiedzi kwalifikujące się do retry, aby ta ścieżka
failover mogła się uruchomić. Dostosuj lub wyłącz limit przez
`OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; zobacz [/concepts/retry](/pl/concepts/retry).

Cooldowny limitów szybkości mogą też mieć zakres modelu:

- OpenClaw zapisuje `cooldownModel` dla błędów limitów szybkości, gdy znane jest ID modelu,
  który zawiódł.
- Model pokrewny u tego samego providera nadal może zostać wypróbowany, gdy cooldown ma
  zakres innego modelu.
- Okna billing/disabled nadal blokują cały profil we wszystkich modelach.

Cooldowny używają exponential backoff:

- 1 minuta
- 5 minut
- 25 minut
- 1 godzina (limit)

Stan jest przechowywany w `auth-state.json` pod `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Wyłączenia billingowe

Awarie billing/credit (na przykład „insufficient credits” / „credit balance too low”) są traktowane jako kwalifikujące się do failover, ale zwykle nie są przejściowe. Zamiast krótkiego cooldownu OpenClaw oznacza profil jako **disabled** (z dłuższym backoffem) i rotuje do następnego profilu/providera.

Nie każda odpowiedź wyglądająca na billing ma kod `402` i nie każde HTTP `402` trafia
tutaj. OpenClaw utrzymuje jawny tekst billingowy w ścieżce billingowej nawet wtedy, gdy
provider zwraca zamiast tego `401` lub `403`, ale matchery specyficzne dla providera pozostają
ograniczone do providera, który jest ich właścicielem (na przykład OpenRouter `403 Key limit
exceeded`). Tymczasem tymczasowe błędy `402` dotyczące okna użycia i
limitów wydatków organizacji/workspace są klasyfikowane jako `rate_limit`, gdy
wiadomość wygląda na możliwą do ponowienia (na przykład `weekly usage limit exhausted`, `daily
limit reached, resets tomorrow` lub `organization spending limit exceeded`).
Pozostają one na ścieżce krótkiego cooldownu/failover zamiast trafiać na długą
ścieżkę billing-disable.

Stan jest przechowywany w `auth-state.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Wartości domyślne:

- Billing backoff zaczyna się od **5 godzin**, podwaja się przy każdej awarii billingowej i osiąga limit **24 godzin**.
- Liczniki backoff resetują się, jeśli profil nie zawiódł przez **24 godziny** (konfigurowalne).
- Retries dla przeciążenia pozwalają na **1 rotację profilu tego samego providera** przed fallbackiem modelu.
- Retries dla przeciążenia domyślnie używają **0 ms backoff**.

## Fallback modelu

Jeśli wszystkie profile dla providera zawiodą, OpenClaw przechodzi do następnego modelu w
`agents.defaults.model.fallbacks`. Dotyczy to błędów uwierzytelniania, limitów szybkości oraz
timeoutów, które wyczerpały rotację profili (inne błędy nie przesuwają fallbacku).

Błędy przeciążenia i limitu szybkości są obsługiwane bardziej agresywnie niż cooldowny billingowe. Domyślnie OpenClaw pozwala na jedną ponowną próbę profilu uwierzytelniania tego samego providera, a następnie bez czekania przełącza się do następnego skonfigurowanego fallbacku modelu.
Sygnały zajętości providera, takie jak `ModelNotReadyException`, trafiają do tego koszyka przeciążenia. Dostosuj to przez `auth.cooldowns.overloadedProfileRotations`,
`auth.cooldowns.overloadedBackoffMs` oraz
`auth.cooldowns.rateLimitedProfileRotations`.

Gdy uruchomienie zaczyna się od nadpisania modelu (hooki lub CLI), fallbacki nadal kończą się na
`agents.defaults.model.primary` po wypróbowaniu wszystkich skonfigurowanych fallbacków.

### Reguły łańcucha kandydatów

OpenClaw buduje listę kandydatów na podstawie aktualnie żądanego `provider/model`
oraz skonfigurowanych fallbacków.

Reguły:

- Żądany model jest zawsze pierwszy.
- Jawnie skonfigurowane fallbacki są deduplikowane, ale nie są filtrowane przez allowlistę modeli. Są traktowane jako jawna intencja operatora.
- Jeśli bieżące uruchomienie już działa na skonfigurowanym fallbacku w tej samej rodzinie providerów, OpenClaw nadal używa pełnego skonfigurowanego łańcucha.
- Jeśli bieżące uruchomienie działa na innym providerze niż konfiguracja i ten bieżący
  model nie jest już częścią skonfigurowanego łańcucha fallback, OpenClaw nie
  dołącza niezwiązanych skonfigurowanych fallbacków z innego providera.
- Gdy uruchomienie zaczęło się od nadpisania, skonfigurowany model primary jest dołączany na końcu, aby łańcuch mógł wrócić do zwykłej wartości domyślnej po wyczerpaniu wcześniejszych kandydatów.

### Które błędy przesuwają fallback

Fallback modelu jest kontynuowany przy:

- błędach uwierzytelniania
- limitach szybkości i wyczerpaniu cooldownu
- błędach przeciążenia/zajętości providera
- błędach typu timeout kwalifikujących się do failover
- wyłączeniach billingowych
- `LiveSessionModelSwitchError`, który jest normalizowany do ścieżki failover, aby
  nieaktualny zapisany model nie tworzył zewnętrznej pętli retry
- innych nierozpoznanych błędach, gdy nadal pozostają kandydaci

Fallback modelu nie jest kontynuowany przy:

- jawnych przerwaniach, które nie mają charakteru timeout/failover
- błędach przepełnienia kontekstu, które powinny pozostać w logice Compaction/retry
  (na przykład `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `The input is too long for the model` lub `ollama error: context
length exceeded`)
- końcowym nieznanym błędzie, gdy nie pozostał już żaden kandydat

### Zachowanie pomijania cooldownu vs probe

Gdy wszystkie profile uwierzytelniania dla providera są już w cooldownie, OpenClaw nie
pomija automatycznie tego providera na zawsze. Podejmuje decyzję per-candidate:

- Trwałe błędy uwierzytelniania powodują natychmiastowe pominięcie całego providera.
- Wyłączenia billingowe zwykle powodują pominięcie, ale kandydat primary nadal może być probe’owany
  z throttlingiem, aby odzyskanie było możliwe bez restartu.
- Kandydat primary może być probe’owany blisko wygaśnięcia cooldownu, z throttlingiem per-provider.
- Sąsiednie fallbacki tego samego providera mogą być próbowane mimo cooldownu, gdy
  awaria wygląda na przejściową (`rate_limit`, `overloaded` lub unknown). Jest to
  szczególnie istotne, gdy limit szybkości ma zakres modelu i model pokrewny może
  nadal odzyskać sprawność natychmiast.
- Probe’y przejściowego cooldownu są ograniczone do jednego na providera na przebieg fallbacku, aby
  pojedynczy provider nie blokował fallbacku między providerami.

## Nadpisania sesji i przełączanie modelu na żywo

Zmiany modelu sesji są współdzielonym stanem. Aktywny runner, polecenie `/model`,
aktualizacje Compaction/sesji oraz uzgadnianie live-session odczytują lub zapisują
części tego samego wpisu sesji.

Oznacza to, że ponowne próby fallback muszą koordynować się z przełączaniem modelu na żywo:

- Tylko jawne zmiany modelu inicjowane przez użytkownika oznaczają oczekujące live switch. Obejmuje to
  `/model`, `session_status(model=...)` oraz `sessions.patch`.
- Zmiany modelu inicjowane przez system, takie jak rotacja fallback, nadpisania Heartbeat
  lub Compaction, nigdy same z siebie nie oznaczają oczekującego live switch.
- Zanim rozpocznie się ponowna próba fallback, runner odpowiedzi zapisuje wybrane
  pola nadpisania fallback do wpisu sesji.
- Uzgadnianie live-session preferuje zapisane nadpisania sesji zamiast nieaktualnych
  pól modelu runtime.
- Jeśli próba fallback się nie powiedzie, runner wycofuje tylko pola nadpisania,
  które sam zapisał, i tylko wtedy, gdy nadal odpowiadają temu nieudanemu kandydatowi.

To zapobiega klasycznemu wyścigowi:

1. Primary zawodzi.
2. Kandydat fallback zostaje wybrany w pamięci.
3. Store sesji nadal wskazuje stare primary.
4. Uzgadnianie live-session odczytuje nieaktualny stan sesji.
5. Ponowna próba zostaje cofnięta do starego modelu, zanim rozpocznie się próba fallback.

Zapisane nadpisanie fallback zamyka to okno, a wąskie wycofanie
utrzymuje nienaruszone nowsze ręczne zmiany sesji lub zmiany runtime.

## Obserwowalność i podsumowania awarii

`runWithModelFallback(...)` rejestruje szczegóły każdej próby, które zasilają logi i
komunikaty dla użytkownika dotyczące cooldownów:

- próbował provider/model
- powód (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` i
  podobne powody failover)
- opcjonalny status/kod
- czytelne dla człowieka podsumowanie błędu

Gdy każdy kandydat zawiedzie, OpenClaw rzuca `FallbackSummaryError`. Zewnętrzny
runner odpowiedzi może użyć tego do zbudowania bardziej szczegółowego komunikatu, takiego jak „wszystkie modele
są tymczasowo objęte limitem szybkości”, i uwzględnić najbliższy termin wygaśnięcia cooldownu, jeśli jest znany.

To podsumowanie cooldownu jest świadome modelu:

- niepowiązane limity szybkości o zakresie modelu są ignorowane dla próbowanego
  łańcucha provider/model
- jeśli pozostałą blokadą jest pasujący limit szybkości o zakresie modelu, OpenClaw
  raportuje ostatni pasujący termin wygaśnięcia, który nadal blokuje ten model

## Powiązana konfiguracja

Zobacz [Konfiguracja Gateway](/pl/gateway/configuration), aby poznać:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- routing `agents.defaults.imageModel`

Zobacz [Modele](/pl/concepts/models), aby uzyskać szerszy przegląd wyboru modelu i fallbacku.
