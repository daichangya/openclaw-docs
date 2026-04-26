---
read_when:
    - Potrzebujesz metody instalacji innej niż szybki start z Pierwszych kroków
    - Chcesz wdrożyć na platformie chmurowej
    - Potrzebujesz aktualizacji, migracji lub odinstalowania
summary: Zainstaluj OpenClaw — skrypt instalatora, npm/pnpm/bun, ze źródeł, Docker i więcej
title: Instalacja
x-i18n:
    generated_at: "2026-04-26T11:34:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8dc6b9511be6bf9060cc150a7c51daf3b6d556dab4a85910094b4b892145cd7
    source_path: install/index.md
    workflow: 15
---

## Wymagania systemowe

- **Node 24** (zalecane) albo Node 22.14+ — skrypt instalatora obsługuje to automatycznie
- **macOS, Linux albo Windows** — obsługiwane są zarówno natywny Windows, jak i WSL2; WSL2 jest bardziej stabilne. Zobacz [Windows](/pl/platforms/windows).
- `pnpm` jest potrzebne tylko wtedy, gdy budujesz ze źródeł

## Zalecane: skrypt instalatora

Najszybszy sposób instalacji. Wykrywa system operacyjny, instaluje Node w razie potrzeby, instaluje OpenClaw i uruchamia onboarding.

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Aby zainstalować bez uruchamiania onboardingu:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Wszystkie flagi oraz opcje CI/automatyzacji znajdziesz w [Wewnętrzne działanie instalatora](/pl/install/installer).

## Alternatywne metody instalacji

### Instalator z lokalnym prefiksem (`install-cli.sh`)

Użyj tego rozwiązania, jeśli chcesz trzymać OpenClaw i Node pod lokalnym prefiksem, takim jak
`~/.openclaw`, bez zależności od systemowej instalacji Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Domyślnie obsługuje instalacje npm, a także instalacje z repozytorium git w tym samym
przepływie prefiksowym. Pełna dokumentacja: [Wewnętrzne działanie instalatora](/pl/install/installer#install-clish).

Już zainstalowano? Przełączaj między instalacjami pakietowymi i git za pomocą
`openclaw update --channel dev` oraz `openclaw update --channel stable`. Zobacz
[Aktualizacja](/pl/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm albo bun

Jeśli samodzielnie zarządzasz Node:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm wymaga jawnego zatwierdzenia dla pakietów ze skryptami budowania. Po pierwszej instalacji uruchom `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun jest obsługiwany dla ścieżki globalnej instalacji CLI. Dla środowiska uruchomieniowego Gateway zalecanym środowiskiem daemon nadal pozostaje Node.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Rozwiązywanie problemów: błędy budowania sharp (npm)">
  Jeśli `sharp` kończy się błędem z powodu globalnie zainstalowanego libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Ze źródeł

Dla współtwórców albo każdego, kto chce uruchamiać z lokalnego repozytorium:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Możesz też pominąć linkowanie i używać `pnpm openclaw ...` z wnętrza repozytorium. Pełne przepływy deweloperskie znajdziesz w [Konfiguracja](/pl/start/setup).

### Instalacja z GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Kontenery i menedżery pakietów

<CardGroup cols={2}>
  <Card title="Docker" href="/pl/install/docker" icon="container">
    Wdrożenia kontenerowe lub bezgłowe.
  </Card>
  <Card title="Podman" href="/pl/install/podman" icon="container">
    Bezrootowa alternatywa kontenerowa dla Docker.
  </Card>
  <Card title="Nix" href="/pl/install/nix" icon="snowflake">
    Deklaratywna instalacja przez flake Nix.
  </Card>
  <Card title="Ansible" href="/pl/install/ansible" icon="server">
    Zautomatyzowane provisioning floty.
  </Card>
  <Card title="Bun" href="/pl/install/bun" icon="zap">
    Użycie wyłącznie CLI przez środowisko uruchomieniowe Bun.
  </Card>
</CardGroup>

## Weryfikacja instalacji

```bash
openclaw --version      # potwierdź, że CLI jest dostępne
openclaw doctor         # sprawdź problemy z konfiguracją
openclaw gateway status # sprawdź, czy Gateway działa
```

Jeśli po instalacji chcesz zarządzanego uruchamiania:

- macOS: LaunchAgent przez `openclaw onboard --install-daemon` albo `openclaw gateway install`
- Linux/WSL2: usługa użytkownika systemd przez te same polecenia
- Natywny Windows: najpierw Scheduled Task, z awaryjnym logowaniem przez element folderu Startup per użytkownik, jeśli tworzenie zadania zostanie odrzucone

## Hosting i wdrażanie

Wdróż OpenClaw na serwerze chmurowym albo VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/pl/vps">Dowolny Linux VPS</Card>
  <Card title="Docker VM" href="/pl/install/docker-vm-runtime">Wspólne kroki Docker</Card>
  <Card title="Kubernetes" href="/pl/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/pl/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/pl/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/pl/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/pl/install/azure">Azure</Card>
  <Card title="Railway" href="/pl/install/railway">Railway</Card>
  <Card title="Render" href="/pl/install/render">Render</Card>
  <Card title="Northflank" href="/pl/install/northflank">Northflank</Card>
</CardGroup>

## Aktualizacja, migracja lub odinstalowanie

<CardGroup cols={3}>
  <Card title="Aktualizacja" href="/pl/install/updating" icon="refresh-cw">
    Utrzymuj OpenClaw na bieżąco.
  </Card>
  <Card title="Migracja" href="/pl/install/migrating" icon="arrow-right">
    Przenieś na nową maszynę.
  </Card>
  <Card title="Odinstalowanie" href="/pl/install/uninstall" icon="trash-2">
    Całkowicie usuń OpenClaw.
  </Card>
</CardGroup>

## Rozwiązywanie problemów: nie znaleziono `openclaw`

Jeśli instalacja zakończyła się powodzeniem, ale `openclaw` nie jest znajdowane w terminalu:

```bash
node -v           # Node zainstalowany?
npm prefix -g     # Gdzie są pakiety globalne?
echo "$PATH"      # Czy globalny katalog bin jest w PATH?
```

Jeśli `$(npm prefix -g)/bin` nie znajduje się w Twoim `$PATH`, dodaj go do pliku startowego powłoki (`~/.zshrc` albo `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Następnie otwórz nowy terminal. Więcej szczegółów znajdziesz w [Konfiguracja Node](/pl/install/node).
