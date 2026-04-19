---
read_when:
    - Chcesz, aby OpenClaw działał 24/7 na chmurowym VPS-ie (a nie na Twoim laptopie)
    - Chcesz mieć gotowy do produkcji, stale działający Gateway na własnym VPS-ie
    - Chcesz mieć pełną kontrolę nad trwałością danych, binariami i zachowaniem po restarcie
    - Uruchamiasz OpenClaw w Dockerze na Hetznerze lub u podobnego dostawcy
summary: Uruchamiaj Gateway OpenClaw 24/7 na tanim VPS-ie Hetzner (Docker) z trwałym stanem i wbudowanymi binariami
title: Hetzner
x-i18n:
    generated_at: "2026-04-19T01:11:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32f5e552ea87970b89c762059bc27f22e0aa3abf001307cae8829b9f1c713a42
    source_path: install/hetzner.md
    workflow: 15
---

# OpenClaw na Hetznerze (Docker, przewodnik po produkcyjnym VPS-ie)

## Cel

Uruchom trwały Gateway OpenClaw na VPS-ie Hetznera z użyciem Dockera, z trwałym stanem, wbudowanymi binariami i bezpiecznym zachowaniem po restarcie.

Jeśli chcesz „OpenClaw 24/7 za około 5 USD”, to jest najprostsza niezawodna konfiguracja.
Ceny Hetznera się zmieniają; wybierz najmniejszy VPS z Debianem lub Ubuntu i zwiększ zasoby, jeśli zaczniesz napotykać OOM-y.

Przypomnienie o modelu bezpieczeństwa:

- Współdzieleni w firmie agenci są w porządku, jeśli wszyscy znajdują się w tej samej granicy zaufania, a środowisko uruchomieniowe służy wyłącznie do celów biznesowych.
- Zachowaj ścisłą separację: dedykowany VPS/środowisko uruchomieniowe + dedykowane konta; bez osobistych profili Apple/Google/przeglądarki/menedżera haseł na tym hoście.
- Jeśli użytkownicy są wobec siebie antagonistyczni, rozdziel ich według gatewaya/hosta/użytkownika systemu operacyjnego.

Zobacz [Bezpieczeństwo](/pl/gateway/security) i [Hosting VPS](/pl/vps).

## Co robimy (prosto mówiąc)?

- Wynajmujemy mały serwer Linux (VPS Hetznera)
- Instalujemy Docker (izolowane środowisko uruchomieniowe aplikacji)
- Uruchamiamy Gateway OpenClaw w Dockerze
- Utrwalamy `~/.openclaw` + `~/.openclaw/workspace` na hoście (przetrwa restarty/przebudowy)
- Uzyskujemy dostęp do interfejsu Control UI z laptopa przez tunel SSH

Ten zamontowany stan `~/.openclaw` obejmuje `openclaw.json`, plik
`agents/<agentId>/agent/auth-profiles.json` dla każdego agenta oraz `.env`.

Dostęp do Gateway można uzyskać przez:

- Przekierowanie portów SSH z laptopa
- Bezpośrednie wystawienie portu, jeśli samodzielnie zarządzasz zaporą i tokenami

Ten przewodnik zakłada Ubuntu lub Debiana na Hetznerze.  
Jeśli używasz innego linuksowego VPS-a, dobierz odpowiednie pakiety.
Ogólny przepływ dla Dockera znajdziesz w [Docker](/pl/install/docker).

---

## Szybka ścieżka (dla doświadczonych operatorów)

1. Utwórz VPS Hetznera
2. Zainstaluj Docker
3. Sklonuj repozytorium OpenClaw
4. Utwórz trwałe katalogi na hoście
5. Skonfiguruj `.env` i `docker-compose.yml`
6. Wbuduj wymagane binaria do obrazu
7. `docker compose up -d`
8. Zweryfikuj trwałość danych i dostęp do Gateway

---

## Czego potrzebujesz

- VPS Hetznera z dostępem root
- Dostęp SSH z laptopa
- Podstawowa swoboda pracy z SSH + kopiuj/wklej
- Około 20 minut
- Docker i Docker Compose
- Dane uwierzytelniające do modeli
- Opcjonalne dane uwierzytelniające dostawców
  - Kod QR WhatsApp
  - Token bota Telegram
  - OAuth Gmaila

---

<Steps>
  <Step title="Utwórz VPS">
    Utwórz VPS z Ubuntu lub Debianem w Hetznerze.

    Połącz się jako root:

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    Ten przewodnik zakłada, że VPS jest stanowy.
    Nie traktuj go jako infrastruktury jednorazowej.

  </Step>

  <Step title="Zainstaluj Docker (na VPS-ie)">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    Zweryfikuj:

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="Sklonuj repozytorium OpenClaw">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    Ten przewodnik zakłada, że zbudujesz własny obraz, aby zagwarantować trwałość binariów.

  </Step>

  <Step title="Utwórz trwałe katalogi na hoście">
    Kontenery Dockera są efemeryczne.
    Cały długotrwały stan musi znajdować się na hoście.

    ```bash
    mkdir -p /root/.openclaw/workspace

    # Ustaw właściciela na użytkownika kontenera (uid 1000):
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="Skonfiguruj zmienne środowiskowe">
    Utwórz `.env` w katalogu głównym repozytorium.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Pozostaw `OPENCLAW_GATEWAY_TOKEN` puste, chyba że świadomie chcesz
    zarządzać nim przez `.env`; OpenClaw zapisuje losowy token gatewaya w
    konfiguracji przy pierwszym uruchomieniu. Wygeneruj hasło keyringu i wklej je do
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Nie commituj tego pliku.**

    Ten plik `.env` służy do zmiennych środowiskowych kontenera/środowiska uruchomieniowego, takich jak `OPENCLAW_GATEWAY_TOKEN`.
    Zapisane uwierzytelnienie OAuth/kluczy API dostawców znajduje się w zamontowanym
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.

  </Step>

  <Step title="Konfiguracja Docker Compose">
    Utwórz lub zaktualizuj `docker-compose.yml`.

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # Zalecane: pozostaw Gateway dostępny tylko przez loopback na VPS-ie; uzyskuj dostęp przez tunel SSH.
          # Aby wystawić go publicznie, usuń prefiks `127.0.0.1:` i odpowiednio skonfiguruj zaporę.
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` służy tylko do wygody podczas bootstrapu, nie zastępuje poprawnej konfiguracji gatewaya. Nadal ustaw uwierzytelnianie (`gateway.auth.token` lub hasło) i używaj bezpiecznych ustawień bindowania dla swojego wdrożenia.

  </Step>

  <Step title="Wspólne kroki środowiska uruchomieniowego Docker VM">
    Skorzystaj ze wspólnego przewodnika po środowisku uruchomieniowym dla typowego przepływu hosta Docker:

    - [Wbuduj wymagane binaria do obrazu](/pl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Zbuduj i uruchom](/pl/install/docker-vm-runtime#build-and-launch)
    - [Co jest utrwalane i gdzie](/pl/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/pl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Dostęp specyficzny dla Hetznera">
    Po wykonaniu wspólnych kroków budowy i uruchomienia utwórz tunel z laptopa:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    Otwórz:

    `http://127.0.0.1:18789/`

    Wklej skonfigurowany współdzielony sekret. Ten przewodnik domyślnie używa tokena gatewaya;
    jeśli przełączyłeś się na uwierzytelnianie hasłem, użyj zamiast tego tego hasła.

  </Step>
</Steps>

Wspólna mapa trwałości znajduje się w [Docker VM Runtime](/pl/install/docker-vm-runtime#what-persists-where).

## Infrastruktura jako kod (Terraform)

Dla zespołów preferujących przepływy infrastructure-as-code, utrzymywana przez społeczność konfiguracja Terraform zapewnia:

- Modułową konfigurację Terraform ze zdalnym zarządzaniem stanem
- Zautomatyzowane provisionowanie przez cloud-init
- Skrypty wdrożeniowe (bootstrap, wdrożenie, backup/przywracanie)
- Utwardzanie bezpieczeństwa (zapora, UFW, dostęp wyłącznie przez SSH)
- Konfigurację tunelu SSH do dostępu do gatewaya

**Repozytoria:**

- Infrastruktura: [openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Konfiguracja Dockera: [openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

To podejście uzupełnia powyższą konfigurację Dockera o powtarzalne wdrożenia, infrastrukturę wersjonowaną w repozytorium oraz zautomatyzowane odzyskiwanie po awarii.

> **Uwaga:** Utrzymywane przez społeczność. W sprawie problemów lub wkładu zobacz linki do repozytoriów powyżej.

## Następne kroki

- Skonfiguruj kanały komunikacji: [Kanały](/pl/channels)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
- Utrzymuj OpenClaw na bieżąco: [Aktualizowanie](/pl/install/updating)
