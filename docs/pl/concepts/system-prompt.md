---
read_when:
    - Edytowanie tekstu promptu systemowego, listy narzędzi lub sekcji czasu/Heartbeat
    - Zmiana zachowania bootstrapu workspace lub wstrzykiwania Skills
summary: Co zawiera prompt systemowy OpenClaw i jak jest składany
title: Prompt systemowy
x-i18n:
    generated_at: "2026-04-26T11:28:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71a4dc6dfb412d62f7c81875f1bebfb21fdae432e28cc7473e1ce8f93380f93b
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw buduje niestandardowy prompt systemowy dla każdego uruchomienia agenta. Prompt jest **własnością OpenClaw** i nie używa domyślnego promptu pi-coding-agent.

Prompt jest składany przez OpenClaw i wstrzykiwany do każdego uruchomienia agenta.

Pluginy dostawców mogą wnosić prompt-aware wskazówki dotyczące cache bez zastępowania
całego promptu należącego do OpenClaw. Środowisko wykonawcze dostawcy może:

- zastąpić mały zestaw nazwanych sekcji rdzeniowych (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- wstrzyknąć **stabilny prefiks** powyżej granicy cache promptu
- wstrzyknąć **dynamiczny sufiks** poniżej granicy cache promptu

Używaj wkładów należących do dostawcy do dostrajania specyficznego dla rodziny modeli. Zachowaj starszą
mutację promptu `before_prompt_build` dla zgodności albo dla prawdziwie globalnych zmian promptu, a nie dla zwykłego zachowania dostawcy.

Nakładka rodziny OpenAI GPT-5 utrzymuje małą podstawową regułę wykonania i dodaje
wskazówki specyficzne dla modelu dotyczące utrzymywania persony, zwięzłego wyjścia, dyscypliny narzędzi,
wyszukiwania równoległego, pokrycia materiałów wynikowych, weryfikacji, brakującego kontekstu oraz higieny narzędzi terminalowych.

## Struktura

Prompt jest celowo zwięzły i używa stałych sekcji:

- **Narzędzia**: przypomnienie o strukturalnych narzędziach jako źródle prawdy oraz wskazówki czasu wykonania dotyczące użycia narzędzi.
- **Execution Bias**: zwięzłe wskazówki dotyczące doprowadzania spraw do końca: działaj w bieżącej turze na
  wykonalne żądania, kontynuuj aż do zakończenia albo zablokowania, odzyskuj się po słabych wynikach narzędzi,
  sprawdzaj na żywo stan mutowalny i weryfikuj przed finalizacją.
- **Bezpieczeństwo**: krótkie przypomnienie o ograniczeniach, aby unikać zachowań dążących do władzy i obchodzenia nadzoru.
- **Skills** (gdy dostępne): informuje model, jak w razie potrzeby ładować instrukcje Skill.
- **Samodzielna aktualizacja OpenClaw**: jak bezpiecznie sprawdzać konfigurację za pomocą
  `config.schema.lookup`, poprawiać konfigurację przy użyciu `config.patch`, zastępować pełną
  konfigurację przez `config.apply` i uruchamiać `update.run` wyłącznie na wyraźne
  żądanie użytkownika. Narzędzie `gateway`, ograniczone tylko do właściciela, również odmawia przepisywania
  `tools.exec.ask` / `tools.exec.security`, w tym starszych aliasów `tools.bash.*`,
  które normalizują się do tych chronionych ścieżek exec.
- **Workspace**: katalog roboczy (`agents.defaults.workspace`).
- **Dokumentacja**: lokalna ścieżka do dokumentacji OpenClaw (repozytorium lub pakiet npm) i kiedy ją czytać.
- **Pliki workspace (wstrzyknięte)**: wskazuje, że pliki bootstrap są dołączone poniżej.
- **Sandbox** (gdy włączony): wskazuje środowisko uruchomieniowe sandbox, ścieżki sandboxa i to, czy dostępny jest exec z podniesionymi uprawnieniami.
- **Bieżąca data i godzina**: czas lokalny użytkownika, strefa czasowa i format czasu.
- **Tagi odpowiedzi**: opcjonalna składnia tagów odpowiedzi dla obsługiwanych dostawców.
- **Heartbeats**: prompt Heartbeat i zachowanie ack, gdy Heartbeat są włączone dla domyślnego agenta.
- **Środowisko wykonawcze**: host, system operacyjny, node, model, katalog główny repozytorium (gdy wykryto), poziom rozumowania (jedna linia).
- **Rozumowanie**: bieżący poziom widoczności + wskazówka przełącznika /reasoning.

Sekcja Narzędzia zawiera też wskazówki wykonawcze dla długotrwałej pracy:

- używaj Cron do przyszłych działań następczych (`check back later`, przypomnienia, praca cykliczna)
  zamiast pętli uśpienia `exec`, sztuczek opóźniania `yieldMs` lub powtarzanego odpytywania `process`
- używaj `exec` / `process` tylko dla poleceń, które startują teraz i dalej działają
  w tle
- gdy włączone jest automatyczne wybudzanie po zakończeniu, uruchom polecenie raz i polegaj na
  ścieżce wybudzania typu push, gdy pojawi się wyjście albo wystąpi błąd
- używaj `process` do logów, statusu, wejścia lub interwencji, gdy potrzebujesz
  sprawdzić działające polecenie
- jeśli zadanie jest większe, preferuj `sessions_spawn`; zakończenie podagenta jest
  oparte na push i automatycznie ogłasza wynik z powrotem do żądającego
- nie odpytywaj `subagents list` / `sessions_list` w pętli tylko po to, by czekać na
  zakończenie

Gdy eksperymentalne narzędzie `update_plan` jest włączone, sekcja Narzędzia informuje też
model, aby używać go wyłącznie przy nietrywialnej pracy wieloetapowej, utrzymywać dokładnie jeden
krok `in_progress` i unikać powtarzania całego planu po każdej aktualizacji.

Ograniczenia bezpieczeństwa w promptcie systemowym mają charakter doradczy. Kierują zachowaniem modelu, ale nie wymuszają polityki. Do twardego egzekwowania używaj polityki narzędzi, zatwierdzeń exec, sandboxingu i list dozwolonych kanałów; operatorzy mogą je z założenia wyłączać.

Na kanałach z natywnymi kartami/przyciskami zatwierdzeń prompt środowiska wykonawczego mówi teraz
agentowi, aby w pierwszej kolejności polegał na tym natywnym interfejsie zatwierdzeń. Powinien uwzględniać ręczne polecenie
`/approve` tylko wtedy, gdy wynik narzędzia mówi, że zatwierdzenia w czacie są niedostępne albo
jedyną drogą jest zatwierdzenie ręczne.

## Tryby promptu

OpenClaw może renderować mniejsze prompty systemowe dla podagentów. Środowisko wykonawcze ustawia
`promptMode` dla każdego uruchomienia (nie jest to konfiguracja użytkownika):

- `full` (domyślnie): zawiera wszystkie powyższe sekcje.
- `minimal`: używany dla podagentów; pomija **Skills**, **Memory Recall**, **Samodzielna aktualizacja OpenClaw**, **Aliasy modeli**, **Tożsamość użytkownika**, **Tagi odpowiedzi**,
  **Wiadomości**, **Ciche odpowiedzi** i **Heartbeats**. Narzędzia, **Bezpieczeństwo**,
  Workspace, Sandbox, Bieżąca data i godzina (gdy znane), Runtime oraz wstrzyknięty
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
- `BOOTSTRAP.md` (tylko w zupełnie nowych workspace)
- `MEMORY.md`, jeśli istnieje

Wszystkie te pliki są **wstrzykiwane do okna kontekstu** przy każdej turze, chyba że
obowiązuje ograniczenie specyficzne dla danego pliku. `HEARTBEAT.md` jest pomijany przy zwykłych uruchomieniach, gdy
Heartbeat są wyłączone dla domyślnego agenta albo
`agents.defaults.heartbeat.includeSystemPromptSection` ma wartość false. Utrzymuj wstrzykiwane
pliki w zwięzłej formie — szczególnie `MEMORY.md`, który może z czasem rosnąć i prowadzić do
nieoczekiwanie wysokiego użycia kontekstu oraz częstszej Compaction.

> **Uwaga:** dzienne pliki `memory/*.md` **nie** są częścią zwykłego bootstrapowego
> Kontekstu projektu. W zwykłych turach są dostępne na żądanie przez
> narzędzia `memory_search` i `memory_get`, więc nie zajmują okna kontekstu,
> chyba że model jawnie je odczyta. Wyjątkiem są zwykłe tury `/new` i
> `/reset`: środowisko wykonawcze może poprzedzić pierwszą turę ostatnią dzienną pamięcią
> jako jednorazowym blokiem kontekstu startowego.

Duże pliki są obcinane ze znacznikiem. Maksymalny rozmiar na plik kontroluje
`agents.defaults.bootstrapMaxChars` (domyślnie: 12000). Całkowita zawartość
wstrzykniętego bootstrapu ze wszystkich plików jest ograniczona przez `agents.defaults.bootstrapTotalMaxChars`
(domyślnie: 60000). Brakujące pliki wstrzykują krótki znacznik brakującego pliku. Gdy następuje obcięcie,
OpenClaw może wstrzyknąć blok ostrzegawczy w Kontekście projektu; steruje tym
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
domyślnie: `once`).

Sesje podagentów wstrzykują tylko `AGENTS.md` i `TOOLS.md` (pozostałe pliki bootstrap
są odfiltrowywane, aby kontekst podagenta był mały).

Wewnętrzne hooki mogą przechwycić ten krok przez `agent:bootstrap`, aby zmodyfikować lub zastąpić
wstrzyknięte pliki bootstrap (na przykład zamieniając `SOUL.md` na alternatywną personę).

Jeśli chcesz, aby agent brzmiał mniej generycznie, zacznij od
[Przewodnika osobowości SOUL.md](/pl/concepts/soul).

Aby sprawdzić, jaki wkład wnosi każdy wstrzyknięty plik (surowy vs wstrzyknięty, obcięcie oraz narzut schematu narzędzi), użyj `/context list` lub `/context detail`. Zobacz [Kontekst](/pl/concepts/context).

## Obsługa czasu

Prompt systemowy zawiera dedykowaną sekcję **Bieżąca data i godzina**, gdy znana jest
strefa czasowa użytkownika. Aby zachować stabilność cache promptu, zawiera teraz tylko
**strefę czasową** (bez dynamicznego zegara ani formatu czasu).

Używaj `session_status`, gdy agent potrzebuje bieżącego czasu; karta statusu
zawiera wiersz znacznika czasu. To samo narzędzie może opcjonalnie ustawić nadpisanie modelu per sesja
(`model=default` je czyści).

Konfiguracja:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Pełne szczegóły zachowania znajdziesz w [Data i godzina](/pl/date-time).

## Skills

Gdy istnieją kwalifikujące się Skills, OpenClaw wstrzykuje zwięzłą **listę dostępnych Skills**
(`formatSkillsForPrompt`), która zawiera **ścieżkę pliku** dla każdego Skill. Prompt
instrukuje model, aby używał `read` do ładowania pliku SKILL.md z wymienionej
lokalizacji (workspace, zarządzanej lub dołączonej). Jeśli nie ma kwalifikujących się Skills, sekcja
Skills jest pomijana.

Kwalifikacja obejmuje ograniczenia metadanych Skill, sprawdzenia środowiska wykonawczego/konfiguracji
oraz efektywną listę dozwolonych Skills agenta, gdy skonfigurowano `agents.defaults.skills` lub
`agents.list[].skills`.

Skills dołączone przez Plugin kwalifikują się tylko wtedy, gdy włączony jest ich
właścicielski Plugin. Pozwala to Pluginom narzędziowym udostępniać głębsze przewodniki operacyjne bez osadzania wszystkich
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

To pozwala zachować mały prompt bazowy, jednocześnie umożliwiając ukierunkowane użycie Skills.

Budżet listy Skills należy do podsystemu Skills:

- Domyślnie globalnie: `skills.limits.maxSkillsPromptChars`
- Nadpisanie per agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Ogólne ograniczone fragmenty środowiska wykonawczego używają innej powierzchni:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Ten podział utrzymuje rozmiar Skills oddzielnie od rozmiaru odczytu/wstrzykiwania środowiska wykonawczego, takiego jak
`memory_get`, wyniki narzędzi na żywo i odświeżenia AGENTS.md po Compaction.

## Dokumentacja

Prompt systemowy zawiera sekcję **Dokumentacja**. Gdy lokalna dokumentacja jest dostępna,
wskazuje lokalny katalog dokumentacji OpenClaw (`docs/` w repozytorium Git albo dołączoną
dokumentację pakietu npm). Jeśli lokalna dokumentacja jest niedostępna, wraca do
[https://docs.openclaw.ai](https://docs.openclaw.ai).

Ta sama sekcja zawiera też lokalizację kodu źródłowego OpenClaw. Repozytoria Git udostępniają lokalny
katalog główny źródeł, dzięki czemu agent może bezpośrednio sprawdzać kod. Instalacje pakietowe zawierają adres URL kodu źródłowego GitHub i mówią agentowi, aby sprawdzał kod tam zawsze, gdy dokumentacja jest niepełna albo
nieaktualna. Prompt wspomina też o publicznym mirrorze dokumentacji, społeczności Discord oraz ClawHub
([https://clawhub.ai](https://clawhub.ai)) do odkrywania Skills. Mówi modelowi, aby
najpierw konsultował dokumentację w sprawach zachowania OpenClaw, poleceń, konfiguracji lub architektury oraz aby
w miarę możliwości sam uruchamiał `openclaw status` (pytając użytkownika tylko wtedy, gdy nie ma dostępu).
W przypadku konfiguracji prompt wskazuje agentom działanie narzędzia `gateway`
`config.schema.lookup` w celu uzyskania dokładnej dokumentacji i ograniczeń na poziomie pól, a następnie
`docs/gateway/configuration.md` i `docs/gateway/configuration-reference.md`
w celu uzyskania szerszych wskazówek.

## Powiązane

- [Środowisko wykonawcze agenta](/pl/concepts/agent)
- [Workspace agenta](/pl/concepts/agent-workspace)
- [Silnik kontekstu](/pl/concepts/context-engine)
