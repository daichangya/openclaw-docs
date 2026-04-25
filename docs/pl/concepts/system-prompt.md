---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania bootstrapu workspace lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-04-25T13:45:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a0717788885521848e3ef9508e3eb5bc5a8ad39f183f0ab2ce0d4cb971cb2df
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Plugin dostawcy mogą wnosić wskazówki promptu świadome cache bez zastępowania
pełnego promptu będącego własnością OpenClaw. Runtime dostawcy może:

- zastąpić mały zestaw nazwanych sekcji rdzeniowych (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** ponad granicą cache promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy cache promptu

Używaj wkładów należących do dostawcy do dostrajania specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla zgodności lub naprawdę globalnych zmian promptu, a nie dla zwykłego zachowania dostawcy.

Nakładka dla rodziny OpenAI GPT-5 utrzymuje małą główną regułę wykonania i dodaje
wskazówki specyficzne dla modelu dotyczące utrzymywania persony, zwięzłych odpowiedzi,
dyscypliny narzędzi, równoległego wyszukiwania, pokrycia elementów dostarczanych,
weryfikacji, brakującego kontekstu i higieny narzędzi terminalowych.

## Struktura

Prompt jest celowo zwięzły i używa stałych sekcji:

- **Tooling**: przypomnienie o źródle prawdy dla narzędzi strukturalnych oraz wskazówki dotyczące używania narzędzi w runtime.
- **Execution Bias**: zwięzłe wskazówki doprowadzania do końca: działaj w tej turze na
  wykonalnych żądaniach, kontynuuj aż do zakończenia lub zablokowania, odzyskuj po słabych wynikach
  narzędzi, sprawdzaj zmienny stan na żywo i weryfikuj przed finalizacją.
- **Safety**: krótkie przypomnienie o guardrailach, aby unikać zachowań dążących do władzy i obchodzenia nadzoru.
- **Skills** (gdy dostępne): informuje model, jak ładować instrukcje Skills na żądanie.
- **OpenClaw Self-Update**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, poprawiać konfigurację przez `config.patch`, zastępować pełną
  konfigurację przez `config.apply` i uruchamiać `update.run` tylko na wyraźne
  żądanie użytkownika. Narzędzie `gateway` dostępne tylko dla właściciela odmawia także
  przepisywania `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Workspace**: katalog roboczy (`agents.defaults.workspace`).
- **Documentation**: lokalna ścieżka do dokumentacji OpenClaw (repo lub pakiet npm) i kiedy ją czytać.
- **Workspace Files (injected)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje runtime sandboxed, ścieżki sandbox i to, czy dostępny jest podniesiony exec.
- **Current Date & Time**: lokalny czas użytkownika, strefa czasowa i format czasu.
- **Reply Tags**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeats**: prompt Heartbeat i zachowanie ack, gdy Heartbeat są włączone dla domyślnego agenta.
- **Runtime**: host, system operacyjny, node, model, root repo (gdy wykryty), poziom myślenia (jedna linia).
- **Reasoning**: bieżący poziom widoczności + wskazówka przełączania /reasoning.

Sekcja Tooling zawiera także wskazówki runtime dla długotrwałej pracy:

- używaj cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli `exec` ze sleep, trików opóźniania `yieldMs` lub powtarzanego
  odpytywania `process`
- używaj `exec` / `process` tylko dla poleceń, które uruchamiają się teraz i dalej działają
  w tle
- gdy włączone jest automatyczne wybudzanie po zakończeniu, uruchom polecenie raz i polegaj na
  ścieżce wybudzania opartej na push, gdy wygeneruje dane wyjściowe lub zakończy się błędem
- używaj `process` do logów, statusu, wejścia lub interwencji, gdy musisz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; zakończenie sub-agenta jest
  oparte na push i automatycznie ogłaszane z powrotem żądającemu
- nie odpytyj `subagents list` / `sessions_list` w pętli tylko po to, by czekać na
  zakończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, Tooling informuje model także,
aby używał go tylko do nietrywialnej pracy wieloetapowej, utrzymywał dokładnie jeden krok
`in_progress` i unikał powtarzania całego planu po każdej aktualizacji.

Guardraile bezpieczeństwa w promptie systemowym mają charakter doradczy. Kierują zachowaniem modelu, ale nie wymuszają polityki. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, sandboxing i list dozwolonych kanałów; operatorzy mogą je celowo wyłączyć.

Na kanałach z natywnymi kartami/przyciskami zatwierdzeń prompt runtime informuje teraz
agenta, aby najpierw polegał na tym natywnym interfejsie zatwierdzania. Powinien dołączać ręczne
polecenie `/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia na czacie są niedostępne albo
ręczne zatwierdzenie jest jedyną ścieżką.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla sub-agentów. Runtime ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja widoczna dla użytkownika):

- `full` (domyślnie): zawiera wszystkie powyższe sekcje.
- `minimal`: używany dla sub-agentów; pomija **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** i **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (gdy znane), Runtime i wstrzyknięty
  kontekst pozostają dostępne.
- `none`: zwraca tylko podstawową linię tożsamości.

Gdy `promptMode=minimal`, dodatkowe wstrzyknięte prompty są oznaczone jako **Subagent
Context** zamiast **Group Chat Context**.

## Wstrzykiwanie bootstrapu workspace

Pliki bootstrap są przycinane i dołączane pod **Project Context**, aby model widział kontekst tożsamości i profilu bez potrzeby jawnego odczytu:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (tylko w zupełnie nowych workspace)
- `MEMORY.md`, gdy występuje

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** w każdej turze, chyba że
obowiązuje bramka specyficzna dla pliku. `HEARTBEAT.md` jest pomijany w zwykłych uruchomieniach, gdy
Heartbeat są wyłączone dla domyślnego agenta albo
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj
wstrzykiwane pliki w zwięzłej formie — szczególnie `MEMORY.md`, który może z czasem rosnąć
i prowadzić do nieoczekiwanie wysokiego użycia kontekstu oraz częstszej Compaction.

> **Uwaga:** dzienne pliki `memory/*.md` **nie** są częścią zwykłego bootstrapowego
> Project Context. W zwykłych turach są dostępne na żądanie przez narzędzia
> `memory_search` i `memory_get`, więc nie liczą się do okna kontekstu, chyba że model jawnie je odczyta. Wyjątkiem są zwykłe tury `/new` i
> `/reset`: runtime może poprzedzić je ostatnią pamięcią dzienną jako jednorazowym blokiem kontekstu startowego dla tej pierwszej tury.

Duże pliki są obcinane ze znacznikiem. Maksymalny rozmiar na plik jest kontrolowany przez
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Łączna wstrzyknięta zawartość bootstrap
we wszystkich plikach jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki marker brakującego pliku. Gdy wystąpi obcięcie,
OpenClaw może wstrzyknąć blok ostrzegawczy w Project Context; kontroluj to przez
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje sub-agentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (inne pliki bootstrap
są odfiltrowywane, aby utrzymać mały kontekst sub-agenta).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby mutować lub zastępować
wstrzyknięte pliki bootstrap (na przykład podmieniając `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[SOUL.md Personality Guide](/pl/concepts/soul).

Aby sprawdzić, jaki wkład wnosi każdy wstrzyknięty plik (surowy vs wstrzyknięty, obcięcie, plus narzut schematu narzędzi), użyj `/context list` albo `/context detail`. Zobacz [Context](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Current Date & Time**, gdy
znana jest strefa czasowa użytkownika. Aby utrzymać stabilność cache promptu, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Użyj `session_status`, gdy agent potrzebuje bieżącego czasu; karta statusu
zawiera wiersz znacznika czasu. To samo narzędzie może opcjonalnie ustawić nadpisanie modelu dla sesji
(`model=default` czyści je).

Skonfiguruj za pomocą:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełne szczegóły zachowania znajdziesz w [Date & Time](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwięzłą **listę dostępnych Skills**
(`formatSkillsForPrompt`), która zawiera **ścieżkę pliku** dla każdego Skills. Prompt
nakazuje modelowi użyć `read` do załadowania SKILL.md z podanej
lokalizacji (workspace, managed lub bundled). Jeśli nie ma kwalifikujących się Skills, sekcja
Skills jest pomijana.

Kwalifikowalność obejmuje bramki metadanych Skills, kontrole środowiska/runtime i konfiguracji
oraz efektywną listę dozwolonych Skills agenta, gdy skonfigurowano `agents.defaults.skills` albo
`agents.list[].skills`.

Skills dołączone do Plugin kwalifikują się tylko wtedy, gdy ich właścicielski Plugin jest włączony.
Pozwala to Plugin narzędzi udostępniać głębsze przewodniki operacyjne bez osadzania całych
tych wskazówek bezpośrednio w każdym opisie narzędzia.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

To utrzymuje mały prompt bazowy, a jednocześnie nadal umożliwia ukierunkowane użycie Skills.

Budżet listy Skills należy do subsystemu Skills:

- Globalna wartość domyślna: `skills.limits.maxSkillsPromptChars`
- Nadpisanie per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczone wycinki runtime używają innej powierzchni:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział utrzymuje rozmiar Skills oddzielnie od rozmiaru odczytu/wstrzykiwania runtime, takiego
jak `memory_get`, wyniki narzędzi na żywo i odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Prompt systemowy zawiera sekcję **Documentation**. Gdy lokalna dokumentacja jest dostępna,
wskazuje lokalny katalog dokumentacji OpenClaw (`docs/` w checkout Git albo dołączoną dokumentację pakietu npm). Jeśli lokalna dokumentacja jest niedostępna, wraca do
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Ta sama sekcja zawiera także lokalizację źródeł OpenClaw. Checkout Git udostępniają lokalny
root źródeł, aby agent mógł bezpośrednio sprawdzać kod. Instalacje pakietowe zawierają adres URL
źródeł GitHub i mówią agentowi, aby sprawdzał tam źródła zawsze, gdy dokumentacja jest niepełna albo
nieaktualna. Prompt odnotowuje także publiczne lustro dokumentacji, społeczność Discord i ClawHub
([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Nakazuje modelowi
najpierw konsultować dokumentację w sprawach zachowania, poleceń, konfiguracji lub architektury OpenClaw oraz
samodzielnie uruchamiać `openclaw status`, gdy to możliwe (prosząc użytkownika tylko wtedy, gdy nie ma dostępu).

## Powiązane

- [Runtime agenta](/pl/concepts/agent)
- [Workspace agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
