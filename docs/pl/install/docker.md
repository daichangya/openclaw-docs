---
read_when:
    - Chcesz używać Gateway w kontenerze zamiast lokalnych instalacji
    - Weryfikujesz przepływ Docker
summary: Opcjonalna konfiguracja i onboarding OpenClaw oparty na Dockerze
title: Docker
x-i18n:
    generated_at: "2026-04-23T10:02:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a874ff7a3c5405ba4437a1d6746f0d9268ba7bd4faf3e20cee6079d5fb68d3
    source_path: install/docker.md
    workflow: 15
---

# Docker (opcjonalnie)

Docker jest **opcjonalny**. Używaj go tylko wtedy, gdy chcesz mieć Gateway w kontenerze lub zweryfikować przepływ Docker.

## Czy Docker jest dla mnie?

- **Tak**: chcesz mieć odizolowane, tymczasowe środowisko Gateway albo uruchamiać OpenClaw na hoście bez lokalnych instalacji.
- **Nie**: uruchamiasz na własnej maszynie i chcesz po prostu najszybszej pętli developerskiej. Zamiast tego użyj normalnego przepływu instalacji.
- **Uwaga o sandboxingu**: domyślny backend sandbox używa Dockera, gdy sandboxing jest włączony, ale sandboxing jest domyślnie wyłączony i **nie** wymaga uruchamiania całego Gateway w Dockerze. Dostępne są też backendy sandbox SSH i OpenShell. Zobacz [Sandboxing](/pl/gateway/sandboxing).

## Wymagania wstępne

- Docker Desktop (lub Docker Engine) + Docker Compose v2
- Co najmniej 2 GB RAM do budowy obrazu (`pnpm install` może zostać ubity przez OOM na hostach z 1 GB z kodem wyjścia 137)
- Wystarczająco dużo miejsca na dysku na obrazy i logi
- Jeśli uruchamiasz na VPS/publicznym hoście, przejrzyj
  [Utwardzanie bezpieczeństwa przy ekspozycji sieciowej](/pl/gateway/security),
  szczególnie politykę zapory Docker `DOCKER-USER`.

## Gateway w kontenerze

<Steps>
  <Step title="Zbuduj obraz">
    Z katalogu głównego repozytorium uruchom skrypt konfiguracji:

    ```bash
    ./scripts/docker/setup.sh
    ```

    To lokalnie buduje obraz Gateway. Aby zamiast tego użyć gotowego obrazu:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Gotowe obrazy są publikowane w
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Typowe tagi: `main`, `latest`, `<version>` (np. `2026.2.26`).

  </Step>

  <Step title="Ukończ onboarding">
    Skrypt konfiguracji uruchamia onboarding automatycznie. Wykona on:

    - poprosi o klucze API providera
    - wygeneruje token Gateway i zapisze go do `.env`
    - uruchomi Gateway przez Docker Compose

    Podczas konfiguracji onboarding przed startem i zapisy konfiguracji są wykonywane przez
    `openclaw-gateway` bezpośrednio. `openclaw-cli` służy do poleceń uruchamianych po tym,
    jak kontener Gateway już istnieje.

  </Step>

  <Step title="Otwórz Control UI">
    Otwórz `http://127.0.0.1:18789/` w przeglądarce i wklej skonfigurowany
    współdzielony sekret do Settings. Skrypt konfiguracji domyślnie zapisuje token do `.env`;
    jeśli przełączysz konfigurację kontenera na uwierzytelnianie hasłem, użyj zamiast tego
    tego hasła.

    Chcesz ponownie zobaczyć URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Skonfiguruj kanały (opcjonalnie)">
    Użyj kontenera CLI, aby dodać kanały komunikacyjne:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Dokumentacja: [WhatsApp](/pl/channels/whatsapp), [Telegram](/pl/channels/telegram), [Discord](/pl/channels/discord)

  </Step>
</Steps>

### Przepływ ręczny

Jeśli wolisz uruchamiać każdy krok samodzielnie zamiast używać skryptu konfiguracji:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Uruchamiaj `docker compose` z katalogu głównego repozytorium. Jeśli włączyłeś `OPENCLAW_EXTRA_MOUNTS`
lub `OPENCLAW_HOME_VOLUME`, skrypt konfiguracji zapisuje `docker-compose.extra.yml`;
dołącz go przez `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Ponieważ `openclaw-cli` współdzieli przestrzeń nazw sieci `openclaw-gateway`, jest to
narzędzie po starcie. Przed `docker compose up -d openclaw-gateway` uruchamiaj onboarding
i zapisy konfiguracji czasu konfiguracji przez `openclaw-gateway` z
`--no-deps --entrypoint node`.
</Note>

### Zmienne środowiskowe

Skrypt konfiguracji akceptuje te opcjonalne zmienne środowiskowe:

| Zmienna                       | Cel                                                             |
| ----------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Użyj zdalnego obrazu zamiast budować lokalnie                   |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Zainstaluj dodatkowe pakiety apt podczas budowy (nazwy rozdzielane spacjami) |
| `OPENCLAW_EXTENSIONS`         | Wstępnie zainstaluj zależności pluginów w czasie budowy (nazwy rozdzielane spacjami) |
| `OPENCLAW_EXTRA_MOUNTS`       | Dodatkowe host bind mounty (oddzielane przecinkami `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Zachowaj `/home/node` w nazwanym woluminie Docker               |
| `OPENCLAW_SANDBOX`            | Włącz bootstrap sandboxa (`1`, `true`, `yes`, `on`)             |
| `OPENCLAW_DOCKER_SOCKET`      | Nadpisz ścieżkę socketu Docker                                  |

### Kontrole zdrowia

Endpointy probe kontenera (bez wymaganego uwierzytelniania):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Obraz Docker zawiera wbudowany `HEALTHCHECK`, który odpytuje `/healthz`.
Jeśli kontrole stale zawodzą, Docker oznacza kontener jako `unhealthy`, a
systemy orkiestracji mogą go zrestartować lub podmienić.

Uwierzytelniony głęboki snapshot zdrowia:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` domyślnie ustawia `OPENCLAW_GATEWAY_BIND=lan`, aby dostęp hosta do
`http://127.0.0.1:18789` działał z publikowaniem portów Dockera.

- `lan` (domyślnie): przeglądarka hosta i CLI hosta mogą osiągnąć opublikowany port Gateway.
- `loopback`: tylko procesy wewnątrz przestrzeni nazw sieci kontenera mogą
  bezpośrednio osiągnąć Gateway.

<Note>
Używaj wartości trybu bind w `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), a nie aliasów hosta takich jak `0.0.0.0` lub `127.0.0.1`.
</Note>

### Storage i trwałość

Docker Compose bind-mountuje `OPENCLAW_CONFIG_DIR` do `/home/node/.openclaw` oraz
`OPENCLAW_WORKSPACE_DIR` do `/home/node/.openclaw/workspace`, więc te ścieżki
przetrwają podmianę kontenera.

W tym podmontowanym katalogu konfiguracji OpenClaw przechowuje:

- `openclaw.json` dla konfiguracji zachowania
- `agents/<agentId>/agent/auth-profiles.json` dla zapisanego uwierzytelniania providerów OAuth/klucz API
- `.env` dla sekretów runtime opartych na env, takich jak `OPENCLAW_GATEWAY_TOKEN`

Pełne szczegóły trwałości dla wdrożeń VM znajdziesz w
[Docker VM Runtime - Co pozostaje gdzie](/pl/install/docker-vm-runtime#what-persists-where).

**Miejsca wzrostu użycia dysku:** obserwuj `media/`, pliki JSONL sesji, `cron/runs/*.jsonl`
oraz rotujące logi plikowe pod `/tmp/openclaw/`.

### Pomocniki shellowe (opcjonalnie)

Aby ułatwić codzienne zarządzanie Dockerem, zainstaluj `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Jeśli zainstalowałeś ClawDock ze starszej ścieżki raw `scripts/shell-helpers/clawdock-helpers.sh`, uruchom ponownie powyższe polecenie instalacji, aby lokalny plik pomocniczy śledził nową lokalizację.

Następnie używaj `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` itd. Uruchom
`clawdock-help`, aby zobaczyć wszystkie polecenia.
Pełny przewodnik po helperze znajdziesz w [ClawDock](/pl/install/clawdock).

<AccordionGroup>
  <Accordion title="Włącz sandbox agenta dla Gateway w Dockerze">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Niestandardowa ścieżka socketu (np. rootless Docker):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Skrypt montuje `docker.sock` dopiero po przejściu wymagań wstępnych sandboxa. Jeśli
    konfiguracja sandboxa nie może zostać ukończona, skrypt resetuje `agents.defaults.sandbox.mode`
    do `off`.

  </Accordion>

  <Accordion title="Automatyzacja / CI (non-interactive)">
    Wyłącz alokację pseudo-TTY Compose przez `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Uwaga o bezpieczeństwie współdzielonej sieci">
    `openclaw-cli` używa `network_mode: "service:openclaw-gateway"`, więc polecenia CLI
    mogą osiągać Gateway przez `127.0.0.1`. Traktuj to jako współdzieloną granicę
    zaufania. Konfiguracja compose usuwa `NET_RAW`/`NET_ADMIN` i włącza
    `no-new-privileges` dla `openclaw-cli`.
  </Accordion>

  <Accordion title="Uprawnienia i EACCES">
    Obraz działa jako `node` (uid 1000). Jeśli widzisz błędy uprawnień na
    `/home/node/.openclaw`, upewnij się, że host bind mounty są własnością uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Szybsze przebudowy">
    Ułóż Dockerfile tak, aby warstwy zależności były cachowane. Pozwala to uniknąć ponownego uruchamiania
    `pnpm install`, chyba że zmienią się lockfile:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Zaawansowane opcje kontenera">
    Domyślny obraz stawia na bezpieczeństwo i działa jako nieuprzywilejowany `node`. Aby uzyskać bardziej
    rozbudowany kontener:

    1. **Zachowaj `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Wbuduj zależności systemowe**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Zainstaluj przeglądarki Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Zachowaj pobrane przeglądarki**: ustaw
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` i użyj
       `OPENCLAW_HOME_VOLUME` lub `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Jeśli wybierzesz OpenAI Codex OAuth w kreatorze, otworzy on URL w przeglądarce. W
    Dockerze lub konfiguracjach headless skopiuj pełny URL przekierowania, na który trafisz, i wklej
    go z powrotem do kreatora, aby dokończyć uwierzytelnianie.
  </Accordion>

  <Accordion title="Metadane obrazu bazowego">
    Główny obraz Docker używa `node:24-bookworm` i publikuje adnotacje OCI obrazu bazowego,
    w tym `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` i inne. Zobacz
    [Adnotacje obrazu OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Uruchamianie na VPS?

Zobacz [Hetzner (Docker VPS)](/pl/install/hetzner) oraz
[Docker VM Runtime](/pl/install/docker-vm-runtime), aby poznać kroki wdrożenia na współdzielonej VM,
w tym wypiekanie binarek, trwałość i aktualizacje.

## Sandbox agenta

Gdy `agents.defaults.sandbox` jest włączone z backendem Docker, Gateway
uruchamia wykonywanie narzędzi agenta (shell, odczyt/zapis plików itd.) wewnątrz odizolowanych kontenerów Docker,
podczas gdy sam Gateway pozostaje na hoście. Daje to twardą ścianę
wokół niezaufanych lub wielodostępnych sesji agentów bez konteneryzowania całego
Gateway.

Zakres sandboxa może być per-agent (domyślnie), per-session lub współdzielony. Każdy zakres
otrzymuje własny workspace montowany pod `/workspace`. Możesz też konfigurować
polityki allow/deny dla narzędzi, izolację sieciową, limity zasobów i kontenery
przeglądarki.

Pełną konfigurację, obrazy, uwagi dotyczące bezpieczeństwa i profile wielu agentów znajdziesz tutaj:

- [Sandboxing](/pl/gateway/sandboxing) -- pełna dokumentacja referencyjna sandboxa
- [OpenShell](/pl/gateway/openshell) -- interaktywny dostęp shell do kontenerów sandbox
- [Multi-Agent Sandbox and Tools](/pl/tools/multi-agent-sandbox-tools) -- nadpisania per-agent

### Szybkie włączenie

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Zbuduj domyślny obraz sandboxa:

```bash
scripts/sandbox-setup.sh
```

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Brak obrazu lub kontener sandbox nie uruchamia się">
    Zbuduj obraz sandboxa za pomocą
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    lub ustaw `agents.defaults.sandbox.docker.image` na własny obraz.
    Kontenery są automatycznie tworzone per-session na żądanie.
  </Accordion>

  <Accordion title="Błędy uprawnień w sandboxie">
    Ustaw `docker.user` na UID:GID zgodne z własnością zamontowanego workspace,
    albo wykonaj `chown` na folderze workspace.
  </Accordion>

  <Accordion title="Niestandardowe narzędzia nie są znajdowane w sandboxie">
    OpenClaw uruchamia polecenia przez `sh -lc` (login shell), które wczytuje
    `/etc/profile` i może zresetować PATH. Ustaw `docker.env.PATH`, aby dodać na początek
    własne ścieżki narzędzi, albo dodaj skrypt w `/etc/profile.d/` w swoim Dockerfile.
  </Accordion>

  <Accordion title="Ubicie przez OOM podczas budowy obrazu (exit 137)">
    VM potrzebuje co najmniej 2 GB RAM. Użyj większej klasy maszyny i spróbuj ponownie.
  </Accordion>

  <Accordion title="Unauthorized lub wymagane parowanie w Control UI">
    Pobierz świeży link do dashboard i zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Więcej szczegółów: [Dashboard](/pl/web/dashboard), [Urządzenia](/pl/cli/devices).

  </Accordion>

  <Accordion title="Cel Gateway pokazuje ws://172.x.x.x lub błędy parowania z Docker CLI">
    Zresetuj tryb Gateway i bind:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Powiązane

- [Przegląd instalacji](/pl/install) — wszystkie metody instalacji
- [Podman](/pl/install/podman) — alternatywa Podman dla Dockera
- [ClawDock](/pl/install/clawdock) — społecznościowa konfiguracja Docker Compose
- [Aktualizowanie](/pl/install/updating) — jak utrzymywać OpenClaw na bieżąco
- [Konfiguracja](/pl/gateway/configuration) — konfiguracja Gateway po instalacji
