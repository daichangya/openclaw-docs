---
read_when:
    - Musisz wyjaśnić obszar roboczy agenta lub układ jego plików
    - Chcesz utworzyć kopię zapasową obszaru roboczego agenta lub go zmigrować
sidebarTitle: Agent workspace
summary: 'Obszar roboczy agenta: lokalizacja, układ i strategia tworzenia kopii zapasowych'
title: Obszar roboczy agenta
x-i18n:
    generated_at: "2026-04-26T11:27:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35d59d1f0dec05db30f9166a43bfa519d7299b08d093bbeb905d8f83e5cd022a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Obszar roboczy to dom agenta. Jest to jedyny katalog roboczy używany przez narzędzia plikowe i dla kontekstu obszaru roboczego. Zachowaj go jako prywatny i traktuj jak pamięć.

To jest oddzielne od `~/.openclaw/`, które przechowuje konfigurację, poświadczenia i sesje.

<Warning>
Obszar roboczy jest **domyślnym cwd**, a nie twardym sandboxem. Narzędzia rozwiązują ścieżki względne względem obszaru roboczego, ale ścieżki bezwzględne nadal mogą sięgać innych miejsc na hoście, chyba że włączone jest sandboxing. Jeśli potrzebujesz izolacji, użyj [`agents.defaults.sandbox`](/pl/gateway/sandboxing) (i/lub konfiguracji sandbox per agent).

Gdy sandboxing jest włączony i `workspaceAccess` nie ma wartości `"rw"`, narzędzia działają wewnątrz obszaru roboczego sandboxa w `~/.openclaw/sandboxes`, a nie w obszarze roboczym hosta.
</Warning>

## Domyślna lokalizacja

- Domyślnie: `~/.openclaw/workspace`
- Jeśli `OPENCLAW_PROFILE` jest ustawione i nie ma wartości `"default"`, domyślną lokalizacją staje się `~/.openclaw/workspace-<profile>`.
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

`openclaw onboard`, `openclaw configure` lub `openclaw setup` utworzą obszar roboczy i zainicjują pliki bootstrap, jeśli ich brakuje.

<Note>
Kopiowanie seed do sandboxa akceptuje tylko zwykłe pliki znajdujące się wewnątrz obszaru roboczego; aliasy symlink/hardlink, które rozwiązują się poza źródłowym obszarem roboczym, są ignorowane.
</Note>

Jeśli już samodzielnie zarządzasz plikami obszaru roboczego, możesz wyłączyć tworzenie plików bootstrap:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Dodatkowe foldery obszaru roboczego

Starsze instalacje mogły utworzyć `~/openclaw`. Pozostawienie wielu katalogów obszaru roboczego może powodować mylące rozjazdy auth lub stanu, ponieważ aktywny jest tylko jeden obszar roboczy naraz.

<Note>
**Zalecenie:** utrzymuj jeden aktywny obszar roboczy. Jeśli nie używasz już dodatkowych folderów, zarchiwizuj je lub przenieś do Kosza (na przykład `trash ~/openclaw`). Jeśli celowo utrzymujesz wiele obszarów roboczych, upewnij się, że `agents.defaults.workspace` wskazuje aktywny.

`openclaw doctor` ostrzega, gdy wykryje dodatkowe katalogi obszaru roboczego.
</Note>

## Mapa plików obszaru roboczego

To standardowe pliki, których OpenClaw oczekuje wewnątrz obszaru roboczego:

<AccordionGroup>
  <Accordion title="AGENTS.md — instrukcje operacyjne">
    Instrukcje operacyjne dla agenta i sposób, w jaki powinien używać pamięci. Ładowane na początku każdej sesji. To dobre miejsce na reguły, priorytety i szczegóły typu „jak się zachowywać”.
  </Accordion>
  <Accordion title="SOUL.md — persona i ton">
    Persona, ton i granice. Ładowane w każdej sesji. Przewodnik: [Przewodnik po osobowości SOUL.md](/pl/concepts/soul).
  </Accordion>
  <Accordion title="USER.md — kim jest użytkownik">
    Kim jest użytkownik i jak się do niego zwracać. Ładowane w każdej sesji.
  </Accordion>
  <Accordion title="IDENTITY.md — nazwa, vibe, emoji">
    Nazwa agenta, vibe i emoji. Tworzone/aktualizowane podczas rytuału bootstrap.
  </Accordion>
  <Accordion title="TOOLS.md — lokalne konwencje narzędzi">
    Uwagi o twoich lokalnych narzędziach i konwencjach. Nie steruje dostępnością narzędzi; to tylko wskazówki.
  </Accordion>
  <Accordion title="HEARTBEAT.md — checklista Heartbeat">
    Opcjonalna mała checklista dla uruchomień Heartbeat. Utrzymuj ją krótką, aby nie zużywać tokenów.
  </Accordion>
  <Accordion title="BOOT.md — checklista startowa">
    Opcjonalna checklista startowa uruchamiana automatycznie przy restarcie Gateway (gdy włączone są [hooki wewnętrzne](/pl/automation/hooks)). Utrzymuj ją krótką; do wysyłki wychodzącej używaj narzędzia message.
  </Accordion>
  <Accordion title="BOOTSTRAP.md — rytuał pierwszego uruchomienia">
    Jednorazowy rytuał pierwszego uruchomienia. Tworzony tylko dla zupełnie nowego obszaru roboczego. Usuń go po zakończeniu rytuału.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md — dzienny log pamięci">
    Dzienny log pamięci (jeden plik na dzień). Zaleca się odczytanie dzisiejszego i wczorajszego pliku na początku sesji.
  </Accordion>
  <Accordion title="MEMORY.md — kuratorowana pamięć długoterminowa (opcjonalnie)">
    Kuratorowana pamięć długoterminowa. Ładuj tylko w głównej, prywatnej sesji (nie we współdzielonych/grupowych kontekstach). Zobacz [Pamięć](/pl/concepts/memory), aby poznać przepływ pracy i automatyczne opróżnianie pamięci.
  </Accordion>
  <Accordion title="skills/ — Skills obszaru roboczego (opcjonalnie)">
    Skills specyficzne dla obszaru roboczego. Lokalizacja Skills o najwyższym priorytecie dla tego obszaru roboczego. Nadpisuje Skills agenta projektu, osobiste Skills agenta, zarządzane Skills, dołączone Skills oraz `skills.load.extraDirs`, gdy nazwy się pokrywają.
  </Accordion>
  <Accordion title="canvas/ — pliki interfejsu Canvas (opcjonalnie)">
    Pliki interfejsu Canvas dla wyświetlaczy node (na przykład `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
Jeśli brakuje dowolnego pliku bootstrap, OpenClaw wstrzykuje do sesji znacznik „missing file” i kontynuuje. Duże pliki bootstrap są obcinane przy wstrzykiwaniu; dostosuj limity za pomocą `agents.defaults.bootstrapMaxChars` (domyślnie: 12000) i `agents.defaults.bootstrapTotalMaxChars` (domyślnie: 60000). `openclaw setup` może odtworzyć brakujące wartości domyślne bez nadpisywania istniejących plików.
</Note>

## Czego NIE ma w obszarze roboczym

Te elementy znajdują się w `~/.openclaw/` i NIE powinny być commitowane do repo obszaru roboczego:

- `~/.openclaw/openclaw.json` (konfiguracja)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (profile auth modeli: OAuth + klucze API)
- `~/.openclaw/credentials/` (stan kanału/providera oraz starsze dane importu OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transkrypty sesji + metadane)
- `~/.openclaw/skills/` (zarządzane Skills)

Jeśli musisz zmigrować sesje lub konfigurację, skopiuj je osobno i trzymaj poza kontrolą wersji.

## Kopia zapasowa w Git (zalecane, prywatne)

Traktuj obszar roboczy jako prywatną pamięć. Umieść go w **prywatnym** repo git, aby był objęty kopią zapasową i możliwy do odzyskania.

Uruchom te kroki na maszynie, na której działa Gateway (tam znajduje się obszar roboczy).

<Steps>
  <Step title="Zainicjalizuj repo">
    Jeśli git jest zainstalowany, zupełnie nowe obszary robocze są inicjalizowane automatycznie. Jeśli ten obszar roboczy nie jest jeszcze repozytorium, uruchom:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="Dodaj prywatny remote">
    <Tabs>
      <Tab title="Interfejs webowy GitHub">
        1. Utwórz nowe **prywatne** repozytorium na GitHub.
        2. Nie inicjalizuj go plikiem README (pozwala to uniknąć konfliktów merge).
        3. Skopiuj URL zdalnego repozytorium HTTPS.
        4. Dodaj remote i wypchnij zmiany:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="Interfejs webowy GitLab">
        1. Utwórz nowe **prywatne** repozytorium na GitLab.
        2. Nie inicjalizuj go plikiem README (pozwala to uniknąć konfliktów merge).
        3. Skopiuj URL zdalnego repozytorium HTTPS.
        4. Dodaj remote i wypchnij zmiany:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Bieżące aktualizacje">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## Nie commituj sekretów

<Warning>
Nawet w prywatnym repo unikaj przechowywania sekretów w obszarze roboczym:

- kluczy API, tokenów OAuth, haseł lub prywatnych poświadczeń;
- czegokolwiek z `~/.openclaw/`;
- surowych zrzutów czatów lub wrażliwych załączników.

Jeśli musisz przechowywać wrażliwe odwołania, używaj placeholderów i trzymaj prawdziwy sekret gdzie indziej (menedżer haseł, zmienne środowiskowe lub `~/.openclaw/`).
</Warning>

Sugerowany starter `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Przenoszenie obszaru roboczego na nową maszynę

<Steps>
  <Step title="Sklonuj repo">
    Sklonuj repo do żądanej ścieżki (domyślnie `~/.openclaw/workspace`).
  </Step>
  <Step title="Zaktualizuj konfigurację">
    Ustaw `agents.defaults.workspace` na tę ścieżkę w `~/.openclaw/openclaw.json`.
  </Step>
  <Step title="Uzupełnij brakujące pliki">
    Uruchom `openclaw setup --workspace <path>`, aby uzupełnić brakujące pliki.
  </Step>
  <Step title="Skopiuj sesje (opcjonalnie)">
    Jeśli potrzebujesz sesji, skopiuj osobno `~/.openclaw/agents/<agentId>/sessions/` ze starej maszyny.
  </Step>
</Steps>

## Zaawansowane uwagi

- Routing wielu agentów może używać różnych obszarów roboczych dla różnych agentów. Zobacz [Routing kanałów](/pl/channels/channel-routing), aby poznać konfigurację routingu.
- Jeśli `agents.defaults.sandbox` jest włączone, sesje inne niż główna mogą używać obszarów roboczych sandbox per sesja w `agents.defaults.sandbox.workspaceRoot`.

## Powiązane

- [Heartbeat](/pl/gateway/heartbeat) — plik obszaru roboczego HEARTBEAT.md
- [Sandboxing](/pl/gateway/sandboxing) — dostęp do obszaru roboczego w środowiskach sandboxowanych
- [Sesja](/pl/concepts/session) — ścieżki przechowywania sesji
- [Standing orders](/pl/automation/standing-orders) — trwałe instrukcje w plikach obszaru roboczego
