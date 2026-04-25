---
read_when:
    - Musisz wyjaśnić przestrzeń roboczą agenta lub układ jej plików
    - Chcesz wykonać kopię zapasową lub migrację przestrzeni roboczej agenta
summary: 'Przestrzeń robocza agenta: lokalizacja, układ i strategia kopii zapasowych'
title: Przestrzeń robocza agenta
x-i18n:
    generated_at: "2026-04-25T13:45:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f9531dbd0f7d0c297f448a5e37f413bae48d75068f15ac88b6fdf7f153c974
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Przestrzeń robocza to dom agenta. Jest to jedyny katalog roboczy używany dla
narzędzi plikowych oraz dla kontekstu przestrzeni roboczej. Zachowuj ją jako prywatną i traktuj jak pamięć.

To jest oddzielone od `~/.openclaw/`, które przechowuje konfigurację, poświadczenia i
sesje.

**Ważne:** przestrzeń robocza jest **domyślnym cwd**, a nie twardą piaskownicą. Narzędzia
rozwiązują ścieżki względne względem przestrzeni roboczej, ale ścieżki bezwzględne nadal mogą sięgać
w inne miejsca hosta, chyba że włączona jest piaskownica. Jeśli potrzebujesz izolacji, użyj
[`agents.defaults.sandbox`](/pl/gateway/sandboxing) (i/lub konfiguracji piaskownicy per agent).
Gdy piaskownica jest włączona i `workspaceAccess` nie ma wartości `"rw"`, narzędzia działają
wewnątrz przestrzeni roboczej piaskownicy pod `~/.openclaw/sandboxes`, a nie w przestrzeni roboczej hosta.

## Domyślna lokalizacja

- Domyślnie: `~/.openclaw/workspace`
- Jeśli ustawiono `OPENCLAW_PROFILE` i nie ma wartości `"default"`, domyślną lokalizacją staje się
  `~/.openclaw/workspace-<profile>`.
- Nadpisanie w `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`, `openclaw configure` lub `openclaw setup` utworzy
przestrzeń roboczą i doda pliki bootstrap, jeśli ich brakuje.
Kopie seed dla piaskownicy akceptują tylko zwykłe pliki wewnątrz przestrzeni roboczej; aliasy
symlink/hardlink, które rozwiązują się poza źródłową przestrzenią roboczą, są ignorowane.

Jeśli już samodzielnie zarządzasz plikami przestrzeni roboczej, możesz wyłączyć tworzenie plików bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Dodatkowe foldery przestrzeni roboczej

Starsze instalacje mogły utworzyć `~/openclaw`. Pozostawienie wielu katalogów przestrzeni roboczej
może powodować mylące rozbieżności autoryzacji lub stanu, ponieważ aktywna jest tylko jedna
przestrzeń robocza naraz.

**Zalecenie:** utrzymuj jedną aktywną przestrzeń roboczą. Jeśli nie używasz już
dodatkowych folderów, zarchiwizuj je lub przenieś do Kosza (na przykład `trash ~/openclaw`).
Jeśli celowo utrzymujesz wiele przestrzeni roboczych, upewnij się, że
`agents.defaults.workspace` wskazuje aktywną.

`openclaw doctor` ostrzega po wykryciu dodatkowych katalogów przestrzeni roboczej.

## Mapa plików przestrzeni roboczej (co oznacza każdy plik)

To są standardowe pliki, których OpenClaw oczekuje wewnątrz przestrzeni roboczej:

- `AGENTS.md`
  - Instrukcje operacyjne dla agenta i sposób korzystania z pamięci.
  - Wczytywany na początku każdej sesji.
  - Dobre miejsce na reguły, priorytety i szczegóły „jak się zachowywać”.

- `SOUL.md`
  - Persona, ton i granice.
  - Wczytywany w każdej sesji.
  - Przewodnik: [Przewodnik po osobowości SOUL.md](/pl/concepts/soul)

- `USER.md`
  - Kim jest użytkownik i jak się do niego zwracać.
  - Wczytywany w każdej sesji.

- `IDENTITY.md`
  - Nazwa agenta, klimat i emoji.
  - Tworzony/aktualizowany podczas rytuału bootstrap.

- `TOOLS.md`
  - Uwagi o lokalnych narzędziach i konwencjach.
  - Nie kontroluje dostępności narzędzi; służy wyłącznie jako wskazówka.

- `HEARTBEAT.md`
  - Opcjonalna mała lista kontrolna dla uruchomień Heartbeat.
  - Utrzymuj ją krótką, aby nie zużywać tokenów.

- `BOOT.md`
  - Opcjonalna lista kontrolna uruchamiana automatycznie przy restarcie gateway (gdy [hooki wewnętrzne](/pl/automation/hooks) są włączone).
  - Utrzymuj ją krótką; do wysyłania na zewnątrz używaj narzędzia message.

- `BOOTSTRAP.md`
  - Jednorazowy rytuał pierwszego uruchomienia.
  - Tworzony tylko dla zupełnie nowej przestrzeni roboczej.
  - Usuń go po zakończeniu rytuału.

- `memory/YYYY-MM-DD.md`
  - Dzienny dziennik pamięci (jeden plik dziennie).
  - Zaleca się odczytywanie dzisiejszego i wczorajszego pliku na początku sesji.

- `MEMORY.md` (opcjonalny)
  - Kuratorowana pamięć długoterminowa.
  - Wczytuj tylko w głównej, prywatnej sesji (nie w kontekstach współdzielonych/grupowych).

Zobacz [Pamięć](/pl/concepts/memory), aby poznać przepływ pracy i automatyczne opróżnianie pamięci.

- `skills/` (opcjonalny)
  - Skills specyficzne dla przestrzeni roboczej.
  - Lokalizacja Skills o najwyższym priorytecie dla tej przestrzeni roboczej.
  - Nadpisuje skills agenta projektu, osobiste Skills agenta, zarządzane Skills, dołączone Skills oraz `skills.load.extraDirs`, gdy nazwy kolidują.

- `canvas/` (opcjonalny)
  - Pliki UI Canvas dla widoków Node (na przykład `canvas/index.html`).

Jeśli brakuje któregokolwiek pliku bootstrap, OpenClaw wstrzykuje do
sesji znacznik „missing file” i kontynuuje. Duże pliki bootstrap są obcinane przy wstrzykiwaniu;
limity można dostosować przez `agents.defaults.bootstrapMaxChars` (domyślnie: 12000) i
`agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000).
`openclaw setup` może odtworzyć brakujące pliki domyślne bez nadpisywania istniejących
plików.

## Czego NIE ma w przestrzeni roboczej

Te elementy znajdują się w `~/.openclaw/` i NIE powinny być commitowane do repozytorium przestrzeni roboczej:

- `~/.openclaw/openclaw.json` (konfiguracja)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profile autoryzacji modeli: OAuth + klucze API)
- `~/.openclaw/credentials/` (stan kanałów/dostawców oraz starsze dane importu OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrypcje sesji + metadane)
- `~/.openclaw/skills/` (zarządzane Skills)

Jeśli musisz migrować sesje lub konfigurację, skopiuj je osobno i trzymaj
poza kontrolą wersji.

## Kopia zapasowa w git (zalecane, prywatne)

Traktuj przestrzeń roboczą jako prywatną pamięć. Umieść ją w **prywatnym** repozytorium git, aby była
objęta kopią zapasową i możliwa do odzyskania.

Wykonaj te kroki na maszynie, na której działa Gateway (tam znajduje się
przestrzeń robocza).

### 1) Zainicjalizuj repozytorium

Jeśli git jest zainstalowany, zupełnie nowe przestrzenie robocze są inicjalizowane automatycznie. Jeśli ta
przestrzeń robocza nie jest jeszcze repozytorium, uruchom:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Dodaj prywatny zdalny serwer (opcje przyjazne dla początkujących)

Opcja A: interfejs webowy GitHub

1. Utwórz nowe **prywatne** repozytorium na GitHub.
2. Nie inicjalizuj go plikiem README (pozwala uniknąć konfliktów scalania).
3. Skopiuj zdalny URL HTTPS.
4. Dodaj zdalne repozytorium i wypchnij zmiany:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opcja B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Opcja C: interfejs webowy GitLab

1. Utwórz nowe **prywatne** repozytorium na GitLab.
2. Nie inicjalizuj go plikiem README (pozwala uniknąć konfliktów scalania).
3. Skopiuj zdalny URL HTTPS.
4. Dodaj zdalne repozytorium i wypchnij zmiany:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Bieżące aktualizacje

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Nie commituj sekretów

Nawet w prywatnym repozytorium unikaj przechowywania sekretów w przestrzeni roboczej:

- kluczy API, tokenów OAuth, haseł lub prywatnych poświadczeń.
- czegokolwiek z `~/.openclaw/`.
- surowych zrzutów czatów lub wrażliwych załączników.

Jeśli musisz przechowywać wrażliwe odniesienia, używaj placeholderów, a prawdziwy
sekret przechowuj gdzie indziej (menedżer haseł, zmienne środowiskowe lub `~/.openclaw/`).

Sugerowany początek pliku `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Przenoszenie przestrzeni roboczej na nową maszynę

1. Sklonuj repozytorium do wybranej ścieżki (domyślnie `~/.openclaw/workspace`).
2. Ustaw `agents.defaults.workspace` na tę ścieżkę w `~/.openclaw/openclaw.json`.
3. Uruchom `openclaw setup --workspace <path>`, aby dodać brakujące pliki.
4. Jeśli potrzebujesz sesji, skopiuj `~/.openclaw/agents/<agentId>/sessions/` ze
   starej maszyny osobno.

## Uwagi zaawansowane

- Routing wielu agentów może używać różnych przestrzeni roboczych dla różnych agentów. Zobacz
  [Routing kanałów](/pl/channels/channel-routing), aby poznać konfigurację routingu.
- Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą używać przestrzeni roboczych
  piaskownicy per sesja pod `agents.defaults.sandbox.workspaceRoot`.

## Powiązane

- [Stałe instrukcje](/pl/automation/standing-orders) — trwałe instrukcje w plikach przestrzeni roboczej
- [Heartbeat](/pl/gateway/heartbeat) — plik przestrzeni roboczej HEARTBEAT.md
- [Sesja](/pl/concepts/session) — ścieżki przechowywania sesji
- [Piaskownica](/pl/gateway/sandboxing) — dostęp do przestrzeni roboczej w środowiskach z piaskownicą
