---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/heartbeatów
    - Zmiana zachowania bootstrapu workspace lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-04-08T02:14:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e55fc886bc8ec47584d07c9e60dfacd964dc69c7db976ea373877dc4fe09a79a
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt systemowy

OpenClaw tworzy niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Wtyczki dostawców mogą dodawać wskazówki do promptu uwzględniające pamięć podręczną bez zastępowania pełnego promptu należącego do OpenClaw. Środowisko wykonawcze dostawcy może:

- zastąpić mały zestaw nazwanych sekcji rdzenia (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** powyżej granicy pamięci podręcznej promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy pamięci podręcznej promptu

Używaj wkładów należących do dostawcy do strojenia specyficznego dla rodziny modeli. Zachowaj starszą mutację promptu `before_prompt_build` dla zgodności lub naprawdę globalnych zmian promptu, a nie dla typowego zachowania dostawcy.

## Struktura

Prompt jest celowo zwięzły i używa stałych sekcji:

- **Narzędzia**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki środowiska wykonawczego dotyczące użycia narzędzi.
- **Bezpieczeństwo**: krótkie przypomnienie o zabezpieczeniach, aby unikać zachowań dążących do przejęcia kontroli lub obchodzenia nadzoru.
- **Skills** (gdy są dostępne): informuje model, jak na żądanie wczytywać instrukcje skillów.
- **Samoaktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, poprawiać konfigurację za pomocą `config.patch`, zastępować pełną
  konfigurację za pomocą `config.apply` oraz uruchamiać `update.run` tylko na wyraźną prośbę użytkownika. Narzędzie `gateway`, dostępne tylko dla właściciela, również odmawia przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które są normalizowane do tych chronionych ścieżek exec.
- **Workspace**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) oraz informacja, kiedy ją czytać.
- **Pliki workspace (wstrzyknięte)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje środowisko uruchomieniowe sandbox, ścieżki sandboxa oraz to, czy podwyższone exec jest dostępne.
- **Bieżąca data i godzina**: lokalny czas użytkownika, strefa czasowa i format czasu.
- **Tagi odpowiedzi**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeaty**: prompt heartbeatów i zachowanie potwierdzeń, gdy heartbeaty są włączone dla domyślnego agenta.
- **Środowisko wykonawcze**: host, system operacyjny, node, katalog główny repozytorium (gdy wykryty), poziom myślenia (jedna linia).
- **Rozumowanie**: bieżący poziom widoczności + podpowiedź przełączania `/reasoning`.

Sekcja Narzędzia zawiera również wskazówki środowiska wykonawczego dla długotrwałej pracy:

- używaj cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli uśpienia `exec`, sztuczek opóźniania `yieldMs` lub powtarzanego odpytywania `process`
- używaj `exec` / `process` tylko dla poleceń, które uruchamiają się teraz i dalej działają
  w tle
- gdy włączone jest automatyczne wybudzanie po zakończeniu, uruchom polecenie tylko raz i polegaj na
  ścieżce wybudzania opartej na push, gdy zwróci dane wyjściowe lub zakończy się błędem
- używaj `process` do logów, statusu, wejścia lub interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; zakończenie podagenta działa
  w trybie push i jest automatycznie ogłaszane z powrotem do zgłaszającego
- nie odpytywać `subagents list` / `sessions_list` w pętli tylko po to, aby czekać na
  zakończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, sekcja Narzędzia mówi też modelowi,
aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden krok
`in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Zabezpieczenia w promptcie systemowym mają charakter doradczy. Kierują zachowaniem modelu, ale nie wymuszają zasad. Do twardego egzekwowania używaj polityki narzędzi, zgód exec, sandboxingu i list dozwolonych kanałów; operatorzy mogą je celowo wyłączyć.

W kanałach z natywnymi kartami/przyciskami zatwierdzania prompt środowiska wykonawczego informuje teraz
agenta, aby najpierw polegał na tym natywnym interfejsie zatwierdzania. Powinien dołączać ręczne polecenie
`/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne lub
ręczne zatwierdzenie jest jedyną drogą.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla podagentów. Środowisko wykonawcze ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie powyższe sekcje.
- `minimal`: używany dla podagentów; pomija **Skills**, **Przywoływanie pamięci**, **Samoaktualizację OpenClaw**, **Aliasy modeli**, **Tożsamość użytkownika**, **Tagi odpowiedzi**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeaty**. Narzędzia, **Bezpieczeństwo**,
  Workspace, Sandbox, Bieżąca data i godzina (gdy znane), Środowisko wykonawcze oraz wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko podstawową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczane jako **Kontekst podagenta**
zamiast **Kontekst czatu grupowego**.

## Wstrzykiwanie bootstrapu workspace

Pliki bootstrap są przycinane i dołączane w sekcji **Kontekst projektu**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnego odczytu:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w całkowicie nowych workspace'ach)
- `MEMORY.md`, jeśli istnieje, w przeciwnym razie `memory.md` jako rezerwowy wariant pisany małymi literami

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** przy każdym kroku, chyba że obowiązuje
bramka specyficzna dla pliku. `HEARTBEAT.md` jest pomijany przy normalnych uruchomieniach, gdy
heartbeaty są wyłączone dla domyślnego agenta lub
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Zachowaj zwięzłość
wstrzykiwanych plików — zwłaszcza `MEMORY.md`, który może z czasem rosnąć i prowadzić do
nieoczekiwanie wysokiego zużycia kontekstu oraz częstszego kompaktowania.

> **Uwaga:** dzienne pliki `memory/*.md` **nie** są wstrzykiwane automatycznie. Są
> dostępne na żądanie przez narzędzia `memory_search` i `memory_get`, więc nie
> wliczają się do okna kontekstu, chyba że model jawnie je odczyta.

Duże pliki są obcinane z użyciem znacznika. Maksymalny rozmiar pojedynczego pliku jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 20000). Łączna zawartość wstrzykniętego bootstrapu
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 150000). Brakujące pliki wstrzykują krótki znacznik brakującego pliku. Gdy wystąpi obcięcie,
OpenClaw może wstrzyknąć blok ostrzeżenia w Kontekście projektu; sterujesz tym przez
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje podagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (pozostałe pliki bootstrapu
są odfiltrowywane, aby zachować mały kontekst podagenta).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby mutować lub zastępować
wstrzyknięte pliki bootstrapu (na przykład zamieniając `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, jaki wkład ma każdy wstrzyknięty plik (surowy vs wstrzyknięty, obcięcie oraz narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera osobną sekcję **Bieżąca data i godzina**, gdy znana jest
strefa czasowa użytkownika. Aby zachować stabilność pamięci podręcznej promptu, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Użyj `session_status`, gdy agent potrzebuje bieżącego czasu; karta statusu
zawiera wiersz ze znacznikiem czasu. To samo narzędzie może opcjonalnie ustawić zastąpienie modelu
dla sesji (`model=default` je czyści).

Skonfiguruj za pomocą:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełne szczegóły zachowania znajdziesz w [Data i godzina](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się skille, OpenClaw wstrzykuje zwięzłą **listę dostępnych skillów**
(`formatSkillsForPrompt`), która zawiera **ścieżkę pliku** dla każdego skilla. Prompt
instruuje model, aby użył `read` do wczytania SKILL.md z podanej
lokalizacji (workspace, zarządzanej lub dołączonej). Jeśli żadne skille się nie kwalifikują,
sekcja Skills jest pomijana.

Kwalifikowalność obejmuje bramki metadanych skilli, kontrole środowiska wykonawczego/konfiguracji
oraz efektywną listę dozwolonych skillów agenta, gdy skonfigurowano `agents.defaults.skills` lub
`agents.list[].skills`.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dzięki temu podstawowy prompt pozostaje mały, a jednocześnie umożliwia użycie ukierunkowanych skillów.

## Dokumentacja

Gdy jest dostępna, prompt systemowy zawiera sekcję **Dokumentacja**, która wskazuje
lokalny katalog dokumentacji OpenClaw (albo `docs/` w workspace repozytorium, albo dołączoną dokumentację pakietu npm)
oraz wspomina także o publicznym mirrorze, repozytorium źródłowym, społeczności Discord i
ClawHub ([https://clawhub.ai](https://clawhub.ai)) do odkrywania skillów. Prompt instruuje model, aby najpierw konsultował lokalną dokumentację
w sprawach dotyczących zachowania OpenClaw, poleceń, konfiguracji lub architektury oraz aby
samodzielnie uruchamiał `openclaw status`, gdy to możliwe (prosząc użytkownika tylko wtedy, gdy nie ma dostępu).
