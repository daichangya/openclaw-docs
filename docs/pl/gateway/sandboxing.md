---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Jak działa sandboxing OpenClaw: tryby, zakresy, dostęp do obszaru roboczego i obrazy'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-25T13:49:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f22778690a4d41033c7abf9e97d54e53163418f8d45f1a816ce2be9d124fedf
    source_path: gateway/sandboxing.md
    workflow: 15
---

OpenClaw może uruchamiać **narzędzia wewnątrz backendów sandbox**, aby ograniczyć zasięg skutków.
Jest to **opcjonalne** i kontrolowane przez konfigurację (`agents.defaults.sandbox` lub
`agents.list[].sandbox`). Jeśli sandboxing jest wyłączony, narzędzia działają na hoście.
Gateway pozostaje na hoście; wykonywanie narzędzi działa w izolowanym sandboxie,
gdy jest włączone.

Nie jest to idealna granica bezpieczeństwa, ale istotnie ogranicza dostęp do systemu plików
i procesów, gdy model zrobi coś głupiego.

## Co jest objęte sandboxem

- Wykonywanie narzędzi (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` itd.).
- Opcjonalna przeglądarka sandboxowana (`agents.defaults.sandbox.browser`).
  - Domyślnie przeglądarka sandboxowana uruchamia się automatycznie (zapewnia dostępność CDP), gdy narzędzie przeglądarki jej potrzebuje.
    Konfiguracja przez `agents.defaults.sandbox.browser.autoStart` i `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Domyślnie kontenery przeglądarki sandboxowanej używają dedykowanej sieci Docker (`openclaw-sandbox-browser`) zamiast globalnej sieci `bridge`.
    Konfiguracja przez `agents.defaults.sandbox.browser.network`.
  - Opcjonalne `agents.defaults.sandbox.browser.cdpSourceRange` ogranicza przychodzący ruch CDP na krawędzi kontenera za pomocą allowlisty CIDR (na przykład `172.21.0.1/32`).
  - Dostęp obserwatora noVNC jest domyślnie chroniony hasłem; OpenClaw emituje krótkotrwały URL z tokenem, który udostępnia lokalną stronę bootstrap i otwiera noVNC z hasłem w fragmencie URL (nie w logach query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` pozwala sesjom sandboxowanym jawnie kierować działania do przeglądarki hosta.
  - Opcjonalne allowlisty bramkują `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Nieobjęte sandboxem:

- Sam proces Gateway.
- Każde narzędzie jawnie dopuszczone do działania poza sandboxem (np. `tools.elevated`).
  - **Elevated exec omija sandboxing i używa skonfigurowanej ścieżki escape (`gateway` domyślnie lub `node`, gdy celem exec jest `node`).**
  - Jeśli sandboxing jest wyłączony, `tools.elevated` nie zmienia sposobu wykonania (już działa na hoście). Zobacz [Elevated Mode](/pl/tools/elevated).

## Tryby

`agents.defaults.sandbox.mode` kontroluje **kiedy** używany jest sandboxing:

- `"off"`: brak sandboxingu.
- `"non-main"`: sandbox tylko dla sesji **niegłównych** (domyślnie, jeśli chcesz zwykłe czaty na hoście).
- `"all"`: każda sesja działa w sandboxie.
  Uwaga: `"non-main"` opiera się na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta.
  Sesje grupowe/kanałowe używają własnych kluczy, więc są traktowane jako niegłówne i będą sandboxowane.

## Zakres

`agents.defaults.sandbox.scope` kontroluje **ile kontenerów** jest tworzonych:

- `"agent"` (domyślnie): jeden kontener na agenta.
- `"session"`: jeden kontener na sesję.
- `"shared"`: jeden kontener współdzielony przez wszystkie sesje sandboxowane.

## Backend

`agents.defaults.sandbox.backend` kontroluje **które środowisko wykonawcze** dostarcza sandbox:

- `"docker"` (domyślnie, gdy sandboxing jest włączony): lokalne środowisko sandbox oparte na Docker.
- `"ssh"`: ogólne zdalne środowisko sandbox oparte na SSH.
- `"openshell"`: środowisko sandbox oparte na OpenShell.

Konfiguracja specyficzna dla SSH znajduje się pod `agents.defaults.sandbox.ssh`.
Konfiguracja specyficzna dla OpenShell znajduje się pod `plugins.entries.openshell.config`.

### Wybór backendu

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Gdzie działa**    | Lokalny kontener                 | Dowolny host dostępny przez SSH | Sandbox zarządzany przez OpenShell                |
| **Konfiguracja**    | `scripts/sandbox-setup.sh`       | Klucz SSH + host docelowy      | Włączony Plugin OpenShell                           |
| **Model obszaru roboczego** | Bind-mount lub kopia      | Remote-canonical (jednorazowy seed) | `mirror` lub `remote`                         |
| **Kontrola sieci**  | `docker.network` (domyślnie: none) | Zależy od zdalnego hosta      | Zależy od OpenShell                                 |
| **Sandbox przeglądarki** | Obsługiwany                 | Nieobsługiwany                 | Jeszcze nieobsługiwany                              |
| **Bind mounty**     | `docker.binds`                   | Nie dotyczy                    | Nie dotyczy                                         |
| **Najlepsze do**    | Lokalny development, pełna izolacja | Przenoszenia obciążenia na zdalną maszynę | Zarządzane zdalne sandboxy z opcjonalną synchronizacją dwukierunkową |

### Backend Docker

Sandboxing jest domyślnie wyłączony. Jeśli go włączysz i nie wybierzesz
backendu, OpenClaw użyje backendu Docker. Wykonuje narzędzia i sandboxowane przeglądarki
lokalnie przez gniazdo demona Docker (`/var/run/docker.sock`). Izolacja kontenera sandbox
jest określana przez przestrzenie nazw Docker.

**Ograniczenia Docker-out-of-Docker (DooD)**:
Jeśli wdrażasz sam Gateway OpenClaw jako kontener Docker, orkiestruje on siostrzane kontenery sandbox przy użyciu gniazda Docker hosta (DooD). Wprowadza to określone ograniczenie mapowania ścieżek:

- **Konfiguracja wymaga ścieżek hosta**: konfiguracja `workspace` w `openclaw.json` MUSI zawierać **bezwzględną ścieżkę hosta** (np. `/home/user/.openclaw/workspaces`), a nie wewnętrzną ścieżkę kontenera Gateway. Gdy OpenClaw prosi demona Docker o uruchomienie sandboxa, demon ocenia ścieżki względem przestrzeni nazw systemu operacyjnego hosta, a nie przestrzeni nazw Gateway.
- **Parzystość mostu FS (identyczne mapowanie wolumenu)**: natywny proces Gateway OpenClaw zapisuje też pliki heartbeat i bridge do katalogu `workspace`. Ponieważ Gateway ocenia dokładnie ten sam ciąg (ścieżkę hosta) z wnętrza własnego środowiska kontenerowego, wdrożenie Gateway MUSI zawierać identyczne mapowanie wolumenu, które natywnie łączy przestrzeń nazw hosta (`-v /home/user/.openclaw:/home/user/.openclaw`).

Jeśli zmapujesz ścieżki wewnętrznie bez bezwzględnej parzystości hosta, OpenClaw natywnie zwróci błąd uprawnień `EACCES` przy próbie zapisu heartbeat wewnątrz środowiska kontenera, ponieważ w pełni kwalifikowany ciąg ścieżki nie istnieje natywnie.

### Backend SSH

Użyj `backend: "ssh"`, gdy chcesz, aby OpenClaw sandboxował `exec`, narzędzia plikowe i odczyty mediów na
dowolnej maszynie dostępnej przez SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Jak to działa:

- OpenClaw tworzy zdalny katalog główny per zakres pod `sandbox.ssh.workspaceRoot`.
- Przy pierwszym użyciu po utworzeniu lub odtworzeniu OpenClaw jednorazowo seeduje ten zdalny obszar roboczy z lokalnego obszaru roboczego.
- Następnie `exec`, `read`, `write`, `edit`, `apply_patch`, odczyty mediów promptu i staging mediów przychodzących działają bezpośrednio na zdalnym obszarze roboczym przez SSH.
- OpenClaw nie synchronizuje automatycznie zmian zdalnych z powrotem do lokalnego obszaru roboczego.

Materiał uwierzytelniający:

- `identityFile`, `certificateFile`, `knownHostsFile`: używają istniejących lokalnych plików i przekazują je przez konfigurację OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: używają ciągów inline lub SecretRef. OpenClaw rozwiązuje je przez zwykłą migawkę środowiska wykonawczego sekretów, zapisuje do plików tymczasowych z `0600` i usuwa po zakończeniu sesji SSH.
- Jeśli dla tego samego elementu ustawiono zarówno `*File`, jak i `*Data`, dla tej sesji SSH pierwszeństwo ma `*Data`.

To model **remote-canonical**. Zdalny obszar roboczy SSH staje się rzeczywistym stanem sandboxa po początkowym seedzie.

Ważne konsekwencje:

- Edycje lokalne hosta wykonane poza OpenClaw po kroku seedu nie są widoczne zdalnie, dopóki nie odtworzysz sandboxa.
- `openclaw sandbox recreate` usuwa zdalny katalog główny per zakres i przy następnym użyciu ponownie seeduje go z lokalnego.
- Sandboxing przeglądarki nie jest obsługiwany przez backend SSH.
- Ustawienia `sandbox.docker.*` nie mają zastosowania do backendu SSH.

### Backend OpenShell

Użyj `backend: "openshell"`, gdy chcesz, aby OpenClaw sandboxował narzędzia w
zdalnym środowisku zarządzanym przez OpenShell. Pełny przewodnik konfiguracji, dokumentację
referencyjną i porównanie trybów obszaru roboczego znajdziesz na dedykowanej
[stronie OpenShell](/pl/gateway/openshell).

OpenShell używa tego samego podstawowego transportu SSH i mostu zdalnego systemu plików co
ogólny backend SSH, a dodatkowo wnosi cykl życia specyficzny dla OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) oraz opcjonalny tryb obszaru roboczego `mirror`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Tryby OpenShell:

- `mirror` (domyślny): lokalny obszar roboczy pozostaje kanoniczny. OpenClaw synchronizuje lokalne pliki do OpenShell przed exec i synchronizuje zdalny obszar roboczy z powrotem po exec.
- `remote`: obszar roboczy OpenShell staje się kanoniczny po utworzeniu sandboxa. OpenClaw jednorazowo seeduje zdalny obszar roboczy z lokalnego, a następnie narzędzia plikowe i exec działają bezpośrednio na zdalnym sandboxie bez synchronizacji zmian z powrotem.

Szczegóły zdalnego transportu:

- OpenClaw prosi OpenShell o konfigurację SSH specyficzną dla sandboxa przez `openshell sandbox ssh-config <name>`.
- Core zapisuje tę konfigurację SSH do pliku tymczasowego, otwiera sesję SSH i ponownie wykorzystuje ten sam most zdalnego systemu plików co `backend: "ssh"`.
- Tylko w trybie `mirror` cykl życia jest inny: synchronizacja lokalnego do zdalnego przed exec, a następnie synchronizacja z powrotem po exec.

Bieżące ograniczenia OpenShell:

- sandbox przeglądarki nie jest jeszcze obsługiwany
- `sandbox.docker.binds` nie jest obsługiwane w backendzie OpenShell
- specyficzne dla Docker pokrętła środowiska wykonawczego pod `sandbox.docker.*` nadal dotyczą tylko backendu Docker

#### Tryby obszaru roboczego

OpenShell ma dwa modele obszaru roboczego. To część, która w praktyce ma największe znaczenie.

##### `mirror`

Użyj `plugins.entries.openshell.config.mode: "mirror"`, gdy chcesz, aby **lokalny obszar roboczy pozostał kanoniczny**.

Zachowanie:

- Przed `exec` OpenClaw synchronizuje lokalny obszar roboczy do sandboxa OpenShell.
- Po `exec` OpenClaw synchronizuje zdalny obszar roboczy z powrotem do lokalnego obszaru roboczego.
- Narzędzia plikowe nadal działają przez most sandboxa, ale lokalny obszar roboczy pozostaje źródłem prawdy między turami.

Używaj tego, gdy:

- edytujesz pliki lokalnie poza OpenClaw i chcesz, aby te zmiany automatycznie pojawiały się w sandboxie
- chcesz, aby sandbox OpenShell zachowywał się możliwie podobnie do backendu Docker
- chcesz, aby obszar roboczy hosta odzwierciedlał zapisy sandboxa po każdej turze exec

Kompromis:

- dodatkowy koszt synchronizacji przed i po exec

##### `remote`

Użyj `plugins.entries.openshell.config.mode: "remote"`, gdy chcesz, aby **obszar roboczy OpenShell stał się kanoniczny**.

Zachowanie:

- Gdy sandbox jest tworzony po raz pierwszy, OpenClaw jednorazowo seeduje zdalny obszar roboczy z lokalnego obszaru roboczego.
- Następnie `exec`, `read`, `write`, `edit` i `apply_patch` działają bezpośrednio na zdalnym obszarze roboczym OpenShell.
- OpenClaw **nie** synchronizuje zdalnych zmian z powrotem do lokalnego obszaru roboczego po exec.
- Odczyty mediów w czasie promptu nadal działają, ponieważ narzędzia plikowe i medialne odczytują przez most sandboxa zamiast zakładać lokalną ścieżkę hosta.
- Transport to SSH do sandboxa OpenShell zwracanego przez `openshell sandbox ssh-config`.

Ważne konsekwencje:

- Jeśli edytujesz pliki na hoście poza OpenClaw po kroku seedu, zdalny sandbox **nie** zobaczy tych zmian automatycznie.
- Jeśli sandbox zostanie odtworzony, zdalny obszar roboczy zostanie ponownie seeded z lokalnego obszaru roboczego.
- Przy `scope: "agent"` lub `scope: "shared"` ten zdalny obszar roboczy jest współdzielony w tym samym zakresie.

Używaj tego, gdy:

- sandbox ma żyć głównie po zdalnej stronie OpenShell
- chcesz mniejszego narzutu synchronizacji na turę
- nie chcesz, aby lokalne edycje hosta po cichu nadpisywały stan zdalnego sandboxa

Wybierz `mirror`, jeśli myślisz o sandboxie jak o tymczasowym środowisku wykonawczym.
Wybierz `remote`, jeśli myślisz o sandboxie jak o rzeczywistym obszarze roboczym.

#### Cykl życia OpenShell

Sandboxy OpenShell są nadal zarządzane przez zwykły cykl życia sandboxa:

- `openclaw sandbox list` pokazuje środowiska OpenShell oraz środowiska Docker
- `openclaw sandbox recreate` usuwa bieżące środowisko wykonawcze i pozwala OpenClaw odtworzyć je przy następnym użyciu
- logika prune również jest świadoma backendu

Dla trybu `remote` recreate jest szczególnie ważne:

- recreate usuwa kanoniczny zdalny obszar roboczy dla tego zakresu
- kolejne użycie seeduje świeży zdalny obszar roboczy z lokalnego obszaru roboczego

Dla trybu `mirror` recreate głównie resetuje zdalne środowisko wykonawcze,
ponieważ lokalny obszar roboczy i tak pozostaje kanoniczny.

## Dostęp do obszaru roboczego

`agents.defaults.sandbox.workspaceAccess` kontroluje **co sandbox może zobaczyć**:

- `"none"` (domyślnie): narzędzia widzą obszar roboczy sandboxa pod `~/.openclaw/sandboxes`.
- `"ro"`: montuje obszar roboczy agenta tylko do odczytu pod `/agent` (wyłącza `write`/`edit`/`apply_patch`).
- `"rw"`: montuje obszar roboczy agenta do odczytu i zapisu pod `/workspace`.

Z backendem OpenShell:

- tryb `mirror` nadal używa lokalnego obszaru roboczego jako źródła kanonicznego między turami exec
- tryb `remote` używa zdalnego obszaru roboczego OpenShell jako źródła kanonicznego po początkowym seedzie
- `workspaceAccess: "ro"` i `"none"` nadal ograniczają zachowanie zapisu w ten sam sposób

Przychodzące media są kopiowane do aktywnego obszaru roboczego sandboxa (`media/inbound/*`).
Uwaga dotycząca Skills: narzędzie `read` jest zakorzenione w sandboxie. Przy `workspaceAccess: "none"`
OpenClaw kopiuje kwalifikujące się Skills do obszaru roboczego sandboxa (`.../skills`), aby
mogły być odczytywane. Przy `"rw"` Skills obszaru roboczego są czytelne z
`/workspace/skills`.

## Niestandardowe bind mounty

`agents.defaults.sandbox.docker.binds` montuje dodatkowe katalogi hosta do kontenera.
Format: `host:container:mode` (np. `"/home/user/source:/source:rw"`).

Globalne i per-agent bindy są **scalane** (a nie zastępowane). Przy `scope: "shared"` bindy per agent są ignorowane.

`agents.defaults.sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko do kontenera **sandbox browser**.

- Gdy jest ustawione (w tym `[]`), zastępuje `agents.defaults.sandbox.docker.binds` dla kontenera przeglądarki.
- Gdy jest pominięte, kontener przeglądarki wraca do `agents.defaults.sandbox.docker.binds` (zgodność wsteczna).

Przykład (źródło tylko do odczytu + dodatkowy katalog danych):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

Uwagi dotyczące bezpieczeństwa:

- Binds omijają system plików sandboxa: udostępniają ścieżki hosta z ustawionym przez Ciebie trybem (`:ro` lub `:rw`).
- OpenClaw blokuje niebezpieczne źródła bindów (na przykład: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` oraz montowania nadrzędne, które by je ujawniały).
- OpenClaw blokuje też typowe katalogi główne poświadczeń w katalogu domowym, takie jak `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` i `~/.ssh`.
- Walidacja bindów to nie tylko dopasowanie ciągów. OpenClaw normalizuje ścieżkę źródłową, a następnie ponownie ją rozwiązuje przez najgłębszego istniejącego przodka, zanim ponownie sprawdzi zablokowane ścieżki i dozwolone korzenie.
- Oznacza to, że ucieczki przez rodzica-będącego-symlinkiem nadal kończą się bezpiecznym domknięciem, nawet gdy końcowy liść jeszcze nie istnieje. Przykład: `/workspace/run-link/new-file` nadal rozwiąże się jako `/var/run/...`, jeśli `run-link` wskazuje tam.
- Dozwolone korzenie źródeł są kanonikalizowane w ten sam sposób, więc ścieżka, która tylko wygląda na znajdującą się na allowliście przed rozwiązaniem symlinków, nadal zostanie odrzucona jako `outside allowed roots`.
- Czułe montowania (sekrety, klucze SSH, poświadczenia usług) powinny mieć `:ro`, chyba że jest to absolutnie konieczne.
- Połącz z `workspaceAccess: "ro"`, jeśli potrzebujesz tylko dostępu do odczytu obszaru roboczego; tryby bindów pozostają niezależne.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby zrozumieć, jak bindy współdziałają z polityką narzędzi i elevated exec.

## Obrazy i konfiguracja

Domyślny obraz Docker: `openclaw-sandbox:bookworm-slim`

Zbuduj go raz:

```bash
scripts/sandbox-setup.sh
```

Uwaga: domyślny obraz **nie** zawiera Node. Jeśli Skill potrzebuje Node (lub
innych runtime'ów), albo przygotuj własny obraz, albo zainstaluj przez
`sandbox.docker.setupCommand` (wymaga wyjścia do sieci + zapisywalnego systemu root +
użytkownika root).

Jeśli chcesz bardziej funkcjonalny obraz sandboxa z typowymi narzędziami (na przykład
`curl`, `jq`, `nodejs`, `python3`, `git`), zbuduj:

```bash
scripts/sandbox-common-setup.sh
```

Następnie ustaw `agents.defaults.sandbox.docker.image` na
`openclaw-sandbox-common:bookworm-slim`.

Obraz sandboxowanej przeglądarki:

```bash
scripts/sandbox-browser-setup.sh
```

Domyślnie kontenery sandboxa Docker działają **bez sieci**.
Nadpisz to przez `agents.defaults.sandbox.docker.network`.

Dołączony obraz sandbox browser stosuje także zachowawcze domyślne ustawienia uruchamiania Chromium
dla obciążeń kontenerowych. Bieżące domyślne ustawienia kontenera obejmują:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- `--no-sandbox`, gdy włączone jest `noSandbox`.
- Trzy flagi wzmacniające grafikę (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) są opcjonalne i są przydatne,
  gdy kontenery nie mają wsparcia GPU. Ustaw `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`,
  jeśli Twoje obciążenie wymaga WebGL lub innych funkcji 3D/przeglądarkowych.
- `--disable-extensions` jest domyślnie włączone i można je wyłączyć przez
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` dla przepływów zależnych od rozszerzeń.
- `--renderer-process-limit=2` jest kontrolowane przez
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, gdzie `0` zachowuje domyślną wartość Chromium.

Jeśli potrzebujesz innego profilu środowiska wykonawczego, użyj niestandardowego obrazu przeglądarki i podaj
własny entrypoint. Dla lokalnych (niekontenerowych) profili Chromium użyj
`browser.extraArgs`, aby dołączyć dodatkowe flagi uruchomieniowe.

Domyślne ustawienia bezpieczeństwa:

- `network: "host"` jest blokowane.
- `network: "container:<id>"` jest domyślnie blokowane (ryzyko ominięcia przez dołączenie do przestrzeni nazw).
- Nadpisanie awaryjne typu break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalacje Docker i skonteneryzowany gateway są opisane tutaj:
[Docker](/pl/install/docker)

Dla wdrożeń gateway Docker `scripts/docker/setup.sh` może przygotować konfigurację sandboxa.
Ustaw `OPENCLAW_SANDBOX=1` (lub `true`/`yes`/`on`), aby włączyć tę ścieżkę. Możesz
nadpisać lokalizację gniazda przez `OPENCLAW_DOCKER_SOCKET`. Pełna konfiguracja i dokumentacja
env: [Docker](/pl/install/docker#agent-sandbox).

## setupCommand (jednorazowa konfiguracja kontenera)

`setupCommand` uruchamia się **raz** po utworzeniu kontenera sandboxa (nie przy każdym uruchomieniu).
Wykonuje się wewnątrz kontenera przez `sh -lc`.

Ścieżki:

- Globalna: `agents.defaults.sandbox.docker.setupCommand`
- Per agent: `agents.list[].sandbox.docker.setupCommand`

Typowe pułapki:

- Domyślne `docker.network` to `"none"` (brak wyjścia), więc instalacje pakietów zakończą się niepowodzeniem.
- `docker.network: "container:<id>"` wymaga `dangerouslyAllowContainerNamespaceJoin: true` i jest tylko awaryjnym obejściem break-glass.
- `readOnlyRoot: true` uniemożliwia zapis; ustaw `readOnlyRoot: false` albo przygotuj niestandardowy obraz.
- `user` musi być rootem do instalacji pakietów (pomiń `user` albo ustaw `user: "0:0"`).
- Sandbox exec **nie** dziedziczy hostowego `process.env`. Użyj
  `agents.defaults.sandbox.docker.env` (lub niestandardowego obrazu) dla kluczy API Skills.

## Polityka narzędzi i ścieżki ucieczki

Polityki allow/deny narzędzi nadal obowiązują przed regułami sandboxa. Jeśli narzędzie jest zabronione
globalnie lub per agent, sandboxing go nie przywróci.

`tools.elevated` to jawna ścieżka ucieczki, która uruchamia `exec` poza sandboxem (`gateway` domyślnie lub `node`, gdy celem exec jest `node`).
Dyrektywy `/exec` mają zastosowanie tylko dla autoryzowanych nadawców i są utrwalane per sesja; aby twardo wyłączyć
`exec`, użyj odmowy w polityce narzędzi (zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated)).

Debugowanie:

- Użyj `openclaw sandbox explain`, aby sprawdzić efektywny tryb sandboxa, politykę narzędzi i klucze konfiguracji naprawczej.
- Zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby zrozumieć model mentalny „dlaczego to jest zablokowane?”.
  Utrzymuj ścisłe blokady.

## Nadpisania dla wielu agentów

Każdy agent może nadpisać sandbox + narzędzia:
`agents.list[].sandbox` i `agents.list[].tools` (plus `agents.list[].tools.sandbox.tools` dla polityki narzędzi sandboxa).
Zobacz [Multi-Agent Sandbox & Tools](/pl/tools/multi-agent-sandbox-tools), aby poznać priorytety.

## Minimalny przykład włączenia

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Powiązana dokumentacja

- [OpenShell](/pl/gateway/openshell) -- konfiguracja zarządzanego backendu sandboxa, tryby obszaru roboczego i dokumentacja referencyjna konfiguracji
- [Sandbox Configuration](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugowanie „dlaczego to jest zablokowane?”
- [Multi-Agent Sandbox & Tools](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per agent i priorytety
- [Security](/pl/gateway/security)
