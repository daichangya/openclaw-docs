---
read_when:
    - Chcesz skonteneryzowanego gateway z Podman zamiast Docker
summary: Uruchamianie OpenClaw w bezrootowym kontenerze Podman
title: Podman
x-i18n:
    generated_at: "2026-04-23T10:03:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

Uruchamiaj Gateway OpenClaw w bezrootowym kontenerze Podman, zarządzanym przez bieżącego użytkownika bez uprawnień root.

Docelowy model wygląda tak:

- Podman uruchamia kontener gateway.
- CLI `openclaw` na hoście jest control plane.
- Trwały stan domyślnie znajduje się na hoście w `~/.openclaw`.
- Codzienne zarządzanie używa `openclaw --container <name> ...` zamiast `sudo -u openclaw`, `podman exec` lub oddzielnego użytkownika usługi.

## Wymagania wstępne

- **Podman** w trybie bezrootowym
- **CLI OpenClaw** zainstalowane na hoście
- **Opcjonalnie:** `systemd --user`, jeśli chcesz automatycznego startu zarządzanego przez Quadlet
- **Opcjonalnie:** `sudo`, tylko jeśli chcesz `loginctl enable-linger "$(whoami)"` dla trwałości po restarcie na hoście bezgłowym

## Szybki start

<Steps>
  <Step title="Jednorazowa konfiguracja">
    Z katalogu głównego repo uruchom `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Uruchom kontener Gateway">
    Uruchom kontener poleceniem `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Uruchom onboarding wewnątrz kontenera">
    Uruchom `./scripts/run-openclaw-podman.sh launch setup`, a następnie otwórz `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Zarządzaj uruchomionym kontenerem z CLI hosta">
    Ustaw `OPENCLAW_CONTAINER=openclaw`, a następnie używaj zwykłych poleceń `openclaw` z hosta.
  </Step>
</Steps>

Szczegóły konfiguracji:

- `./scripts/podman/setup.sh` domyślnie buduje `openclaw:local` w Twoim bezrootowym magazynie Podman albo używa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, jeśli któreś z nich ustawisz.
- Tworzy `~/.openclaw/openclaw.json` z `gateway.mode: "local"`, jeśli plik nie istnieje.
- Tworzy `~/.openclaw/.env` z `OPENCLAW_GATEWAY_TOKEN`, jeśli plik nie istnieje.
- Przy ręcznych uruchomieniach helper odczytuje tylko niewielką allowlistę kluczy związanych z Podman z `~/.openclaw/.env` i przekazuje do kontenera jawne zmienne env środowiska uruchomieniowego; nie przekazuje całego pliku env do Podman.

Konfiguracja zarządzana przez Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet to opcja tylko dla Linuksa, ponieważ zależy od usług użytkownika systemd.

Możesz też ustawić `OPENCLAW_PODMAN_QUADLET=1`.

Opcjonalne zmienne env build/configuration:

- `OPENCLAW_IMAGE` lub `OPENCLAW_PODMAN_IMAGE` — użyj istniejącego/pobranego obrazu zamiast budować `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` — zainstaluj dodatkowe pakiety apt podczas budowania obrazu
- `OPENCLAW_EXTENSIONS` — wstępnie zainstaluj zależności Plugin podczas build

Start kontenera:

```bash
./scripts/run-openclaw-podman.sh launch
```

Skrypt uruchamia kontener z bieżącym uid/gid przy użyciu `--userns=keep-id` i bind-mountuje stan OpenClaw do kontenera.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Następnie otwórz `http://127.0.0.1:18789/` i użyj tokenu z `~/.openclaw/.env`.

Domyślne CLI hosta:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Następnie takie polecenia będą automatycznie uruchamiane wewnątrz tego kontenera:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

W systemie macOS Podman machine może sprawić, że przeglądarka będzie wyglądała dla gateway jak nielokalna.
Jeśli po uruchomieniu Control UI zgłasza błędy device-auth, skorzystaj ze wskazówek Tailscale w
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Dla HTTPS lub zdalnego dostępu z przeglądarki postępuj zgodnie z główną dokumentacją Tailscale.

Uwaga specyficzna dla Podman:

- Utrzymuj host publikacji Podman jako `127.0.0.1`.
- Preferuj `tailscale serve` zarządzane przez host zamiast `openclaw gateway --tailscale serve`.
- W systemie macOS, jeśli lokalny kontekst device-auth przeglądarki jest zawodny, używaj dostępu Tailscale zamiast doraźnych obejść z lokalnymi tunelami.

Zobacz:

- [Tailscale](/pl/gateway/tailscale)
- [Control UI](/pl/web/control-ui)

## Systemd (Quadlet, opcjonalnie)

Jeśli uruchomiono `./scripts/podman/setup.sh --quadlet`, konfiguracja instaluje plik Quadlet w:

```bash
~/.config/containers/systemd/openclaw.container
```

Przydatne polecenia:

- **Start:** `systemctl --user start openclaw.service`
- **Stop:** `systemctl --user stop openclaw.service`
- **Status:** `systemctl --user status openclaw.service`
- **Logi:** `journalctl --user -u openclaw.service -f`

Po edycji pliku Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Dla trwałości po starcie systemu na hostach SSH/bezgłowych włącz lingering dla bieżącego użytkownika:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Konfiguracja, env i magazyn

- **Katalog konfiguracji:** `~/.openclaw`
- **Katalog obszaru roboczego:** `~/.openclaw/workspace`
- **Plik tokenu:** `~/.openclaw/.env`
- **Helper uruchamiania:** `./scripts/run-openclaw-podman.sh`

Skrypt uruchamiania i Quadlet bind-mountują stan hosta do kontenera:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Domyślnie są to katalogi hosta, a nie anonimowy stan kontenera, więc
`openclaw.json`, `auth-profiles.json` per agent, stan kanałów/providerów,
sesje i obszar roboczy przetrwają wymianę kontenera.
Konfiguracja Podman seeduje też `gateway.controlUi.allowedOrigins` dla `127.0.0.1` i `localhost` na opublikowanym porcie gateway, aby lokalny dashboard działał z nieloopbackowym bindowaniem kontenera.

Przydatne zmienne env dla ręcznego launcher:

- `OPENCLAW_PODMAN_CONTAINER` — nazwa kontenera (domyślnie `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` — obraz do uruchomienia
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` — port hosta mapowany do kontenera `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` — port hosta mapowany do kontenera `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` — interfejs hosta dla publikowanych portów; domyślnie `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` — tryb bindowania gateway wewnątrz kontenera; domyślnie `lan`
- `OPENCLAW_PODMAN_USERNS` — `keep-id` (domyślnie), `auto` lub `host`

Ręczny launcher odczytuje `~/.openclaw/.env` przed sfinalizowaniem ustawień domyślnych kontenera/obrazu, więc możesz je tam utrwalić.

Jeśli używasz niestandardowego `OPENCLAW_CONFIG_DIR` lub `OPENCLAW_WORKSPACE_DIR`, ustaw te same zmienne zarówno dla `./scripts/podman/setup.sh`, jak i późniejszych poleceń `./scripts/run-openclaw-podman.sh launch`. Lokalny launcher repo nie utrwala niestandardowych nadpisań ścieżek między powłokami.

Uwaga dotycząca Quadlet:

- Wygenerowana usługa Quadlet celowo zachowuje stały, utwardzony domyślny kształt: porty publikowane na `127.0.0.1`, `--bind lan` wewnątrz kontenera i przestrzeń nazw użytkownika `keep-id`.
- Przypina `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` i `TimeoutStartSec=300`.
- Publikuje zarówno `127.0.0.1:18789:18789` (gateway), jak i `127.0.0.1:18790:18790` (bridge).
- Odczytuje `~/.openclaw/.env` jako `EnvironmentFile` środowiska uruchomieniowego dla wartości takich jak `OPENCLAW_GATEWAY_TOKEN`, ale nie używa allowlisty nadpisań specyficznych dla Podman z ręcznego launchera.
- Jeśli potrzebujesz niestandardowych portów publikacji, hosta publikacji lub innych flag uruchamiania kontenera, użyj ręcznego launchera albo bezpośrednio edytuj `~/.config/containers/systemd/openclaw.container`, a następnie przeładuj i zrestartuj usługę.

## Przydatne polecenia

- **Logi kontenera:** `podman logs -f openclaw`
- **Zatrzymanie kontenera:** `podman stop openclaw`
- **Usunięcie kontenera:** `podman rm -f openclaw`
- **Otwórz URL dashboard z CLI hosta:** `openclaw dashboard --no-open`
- **Kondycja/status przez CLI hosta:** `openclaw gateway status --deep` (sonda RPC + dodatkowe
  skanowanie usługi)

## Rozwiązywanie problemów

- **Odmowa dostępu (EACCES) do konfiguracji lub obszaru roboczego:** Kontener domyślnie działa z `--userns=keep-id` i `--user <your uid>:<your gid>`. Upewnij się, że ścieżki konfiguracji/obszaru roboczego na hoście należą do bieżącego użytkownika.
- **Start Gateway zablokowany (brak `gateway.mode=local`):** Upewnij się, że istnieje `~/.openclaw/openclaw.json` i ustawia `gateway.mode="local"`. `scripts/podman/setup.sh` tworzy ten plik, jeśli go brakuje.
- **Polecenia CLI kontenera trafiają do niewłaściwego celu:** Użyj jawnie `openclaw --container <name> ...` albo wyeksportuj `OPENCLAW_CONTAINER=<name>` w swojej powłoce.
- **`openclaw update` kończy się błędem z `--container`:** To oczekiwane. Przebuduj/pobierz obraz, a następnie zrestartuj kontener lub usługę Quadlet.
- **Usługa Quadlet się nie uruchamia:** Uruchom `systemctl --user daemon-reload`, a następnie `systemctl --user start openclaw.service`. W systemach bezgłowych możesz też potrzebować `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blokuje bind-mounty:** Pozostaw domyślne zachowanie mountów bez zmian; launcher automatycznie dodaje `:Z` w Linuksie, gdy SELinux jest w trybie enforcing lub permissive.

## Powiązane

- [Docker](/pl/install/docker)
- [Proces gateway w tle](/pl/gateway/background-process)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
