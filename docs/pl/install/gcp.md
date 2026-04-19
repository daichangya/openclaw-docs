---
read_when:
    - Chcesz, aby OpenClaw działał 24/7 na GCP.
    - Chcesz mieć produkcyjny, stale działający Gateway na własnej maszynie wirtualnej.
    - Chcesz mieć pełną kontrolę nad trwałością danych, plikami binarnymi i sposobem restartowania.
summary: Uruchom Gateway OpenClaw 24/7 na maszynie wirtualnej GCP Compute Engine (Docker) z trwałym stanem
title: GCP
x-i18n:
    generated_at: "2026-04-19T01:11:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b4cf7924cbcfae74f268c88caedb79ed87a6ad37f4910ad65d92a5d99fe49c1
    source_path: install/gcp.md
    workflow: 15
---

# OpenClaw na GCP Compute Engine (Docker, przewodnik produkcyjnego VPS)

## Cel

Uruchom trwały Gateway OpenClaw na maszynie wirtualnej GCP Compute Engine z użyciem Docker, z trwałym stanem, wbudowanymi plikami binarnymi i bezpiecznym zachowaniem przy restartach.

Jeśli chcesz uruchomić „OpenClaw 24/7 za około 5–12 USD/mies.”, to jest niezawodna konfiguracja w Google Cloud.
Cena różni się w zależności od typu maszyny i regionu; wybierz najmniejszą maszynę wirtualną, która pasuje do Twojego obciążenia, i zwiększ ją, jeśli zaczniesz trafiać na błędy OOM.

## Co robimy (prosto wyjaśnione)?

- Tworzymy projekt GCP i włączamy rozliczenia
- Tworzymy maszynę wirtualną Compute Engine
- Instalujemy Docker (izolowane środowisko uruchomieniowe aplikacji)
- Uruchamiamy Gateway OpenClaw w Dockerze
- Utrwalamy `~/.openclaw` + `~/.openclaw/workspace` na hoście (przetrwa restarty/przebudowy)
- Uzyskujemy dostęp do interfejsu Control UI z laptopa przez tunel SSH

Ten zamontowany stan `~/.openclaw` obejmuje `openclaw.json`, profile
`agents/<agentId>/agent/auth-profiles.json` dla poszczególnych agentów oraz `.env`.

Dostęp do Gateway można uzyskać przez:

- przekierowanie portu SSH z laptopa
- bezpośrednie wystawienie portu, jeśli samodzielnie zarządzasz firewallem i tokenami

Ten przewodnik używa Debiana na GCP Compute Engine.
Ubuntu również działa; odpowiednio dopasuj pakiety.
Ogólny przepływ dla Docker znajdziesz w [Docker](/pl/install/docker).

---

## Szybka ścieżka (dla doświadczonych operatorów)

1. Utwórz projekt GCP i włącz Compute Engine API
2. Utwórz maszynę wirtualną Compute Engine (e2-small, Debian 12, 20GB)
3. Połącz się z maszyną przez SSH
4. Zainstaluj Docker
5. Sklonuj repozytorium OpenClaw
6. Utwórz trwałe katalogi na hoście
7. Skonfiguruj `.env` i `docker-compose.yml`
8. Wbuduj wymagane pliki binarne, zbuduj i uruchom

---

## Czego potrzebujesz

- konto GCP (e2-micro kwalifikuje się do warstwy bezpłatnej)
- zainstalowany `gcloud CLI` (lub użyj Cloud Console)
- dostępu SSH z laptopa
- podstawowej swobody w pracy z SSH + kopiowaniem/wklejaniem
- około 20–30 minut
- Docker i Docker Compose
- poświadczeń autoryzacji modelu
- opcjonalnych poświadczeń dostawców
  - kod QR WhatsApp
  - token bota Telegram
  - OAuth Gmail

---

<Steps>
  <Step title="Zainstaluj gcloud CLI (lub użyj Console)">
    **Opcja A: `gcloud CLI`** (zalecane do automatyzacji)

    Zainstaluj z [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)

    Zainicjuj i uwierzytelnij:

    ```bash
    gcloud init
    gcloud auth login
    ```

    **Opcja B: Cloud Console**

    Wszystkie kroki można wykonać przez interfejs webowy pod adresem [https://console.cloud.google.com](https://console.cloud.google.com)

  </Step>

  <Step title="Utwórz projekt GCP">
    **CLI:**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    Włącz rozliczenia na [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) (wymagane dla Compute Engine).

    Włącz Compute Engine API:

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console:**

    1. Przejdź do IAM & Admin > Create Project
    2. Nadaj nazwę i utwórz projekt
    3. Włącz rozliczenia dla projektu
    4. Przejdź do APIs & Services > Enable APIs > wyszukaj „Compute Engine API” > Enable

  </Step>

  <Step title="Utwórz maszynę wirtualną">
    **Typy maszyn:**

    | Typ       | Specyfikacja             | Koszt              | Uwagi                                        |
    | --------- | ------------------------ | ------------------ | -------------------------------------------- |
    | e2-medium | 2 vCPU, 4GB RAM          | ~25 USD/mies.      | Najbardziej niezawodny do lokalnych buildów Docker |
    | e2-small  | 2 vCPU, 2GB RAM          | ~12 USD/mies.      | Minimalna zalecana konfiguracja do buildu Docker |
    | e2-micro  | 2 vCPU (współdzielone), 1GB RAM | Kwalifikuje się do warstwy bezpłatnej | Często kończy się błędem OOM przy buildzie Docker (exit 137) |

    **CLI:**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console:**

    1. Przejdź do Compute Engine > VM instances > Create instance
    2. Nazwa: `openclaw-gateway`
    3. Region: `us-central1`, strefa: `us-central1-a`
    4. Typ maszyny: `e2-small`
    5. Dysk rozruchowy: Debian 12, 20GB
    6. Utwórz

  </Step>

  <Step title="Połącz się z maszyną przez SSH">
    **CLI:**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console:**

    Kliknij przycisk „SSH” obok swojej maszyny wirtualnej w panelu Compute Engine.

    Uwaga: propagacja klucza SSH może zająć 1–2 minuty po utworzeniu maszyny. Jeśli połączenie jest odrzucane, poczekaj i spróbuj ponownie.

  </Step>

  <Step title="Zainstaluj Docker (na maszynie wirtualnej)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    Wyloguj się i zaloguj ponownie, aby zmiana grupy zaczęła działać:

    ```bash
    exit
    ```

    Następnie ponownie połącz się przez SSH:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    Sprawdź:

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

    Ten przewodnik zakłada, że zbudujesz własny obraz, aby zagwarantować trwałość plików binarnych.

  </Step>

  <Step title="Utwórz trwałe katalogi na hoście">
    Kontenery Docker są efemeryczne.
    Cały długotrwały stan musi znajdować się na hoście.

    ```bash
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="Skonfiguruj zmienne środowiskowe">
    Utwórz `.env` w katalogu głównym repozytorium.

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    Pozostaw `OPENCLAW_GATEWAY_TOKEN` puste, chyba że świadomie chcesz
    zarządzać nim przez `.env`; OpenClaw zapisuje losowy token Gateway do
    konfiguracji przy pierwszym uruchomieniu. Wygeneruj hasło keyringu i wklej je do
    `GOG_KEYRING_PASSWORD`:

    ```bash
    openssl rand -hex 32
    ```

    **Nie commituj tego pliku.**

    Ten plik `.env` służy dla zmiennych środowiskowych kontenera/runtime, takich jak `OPENCLAW_GATEWAY_TOKEN`.
    Zapisane uwierzytelnienie dostawców OAuth/kluczy API znajduje się w zamontowanym
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
          # Zalecane: pozostaw Gateway dostępny tylko przez loopback na maszynie wirtualnej; uzyskuj dostęp przez tunel SSH.
          # Aby wystawić go publicznie, usuń prefiks `127.0.0.1:` i odpowiednio skonfiguruj firewall.
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

    `--allow-unconfigured` służy tylko do wygodnego bootstrapu, nie zastępuje poprawnej konfiguracji Gateway. Nadal skonfiguruj auth (`gateway.auth.token` lub hasło) i użyj bezpiecznych ustawień bind dla swojej instalacji.

  </Step>

  <Step title="Wspólne kroki runtime dla Docker VM">
    Skorzystaj ze wspólnego przewodnika runtime dla standardowego przepływu hosta Docker:

    - [Wbuduj wymagane pliki binarne do obrazu](/pl/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [Zbuduj i uruchom](/pl/install/docker-vm-runtime#build-and-launch)
    - [Co jest utrwalane i gdzie](/pl/install/docker-vm-runtime#what-persists-where)
    - [Aktualizacje](/pl/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Uwagi dotyczące uruchomienia specyficzne dla GCP">
    Na GCP, jeśli build kończy się błędem `Killed` lub `exit code 137` podczas `pnpm install --frozen-lockfile`, maszynie wirtualnej zabrakło pamięci. Użyj co najmniej `e2-small`, albo `e2-medium`, jeśli chcesz bardziej niezawodnych pierwszych buildów.

    Podczas wiązania do LAN (`OPENCLAW_GATEWAY_BIND=lan`) przed kontynuacją skonfiguruj zaufane źródło przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    Jeśli zmieniłeś port Gateway, zastąp `18789` skonfigurowanym portem.

  </Step>

  <Step title="Dostęp z laptopa">
    Utwórz tunel SSH, aby przekierować port Gateway:

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    Otwórz w przeglądarce:

    `http://127.0.0.1:18789/`

    Ponownie wyświetl czysty link do dashboardu:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    Jeśli interfejs poprosi o uwierzytelnienie współdzielonym sekretem, wklej skonfigurowany token lub
    hasło w ustawieniach Control UI. Ten przepływ Docker domyślnie zapisuje token;
    jeśli zmienisz konfigurację kontenera na auth hasłem, użyj zamiast tego
    tego hasła.

    Jeśli Control UI pokazuje `unauthorized` lub `disconnected (1008): pairing required`, zatwierdź urządzenie przeglądarki:

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Potrzebujesz ponownie odnośnika do współdzielonej trwałości i aktualizacji?
    Zobacz [Docker VM Runtime](/pl/install/docker-vm-runtime#what-persists-where) i [aktualizacje Docker VM Runtime](/pl/install/docker-vm-runtime#updates).

  </Step>
</Steps>

---

## Rozwiązywanie problemów

**Połączenie SSH odrzucone**

Propagacja klucza SSH może zająć 1–2 minuty po utworzeniu maszyny wirtualnej. Poczekaj i spróbuj ponownie.

**Problemy z OS Login**

Sprawdź swój profil OS Login:

```bash
gcloud compute os-login describe-profile
```

Upewnij się, że Twoje konto ma wymagane uprawnienia IAM (Compute OS Login lub Compute OS Admin Login).

**Brak pamięci (OOM)**

Jeśli build Docker kończy się błędami `Killed` i `exit code 137`, maszyna wirtualna została ubita przez OOM. Zwiększ typ maszyny do e2-small (minimum) lub e2-medium (zalecane do niezawodnych lokalnych buildów):

```bash
# Najpierw zatrzymaj maszynę wirtualną
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# Zmień typ maszyny
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# Uruchom maszynę wirtualną
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## Konta usługi (najlepsza praktyka bezpieczeństwa)

Do użytku osobistego Twoje domyślne konto użytkownika w zupełności wystarczy.

W przypadku automatyzacji lub pipeline’ów CI/CD utwórz dedykowane konto usługi z minimalnymi uprawnieniami:

1. Utwórz konto usługi:

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. Nadaj rolę Compute Instance Admin (lub węższą rolę niestandardową):

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

Unikaj używania roli Owner do automatyzacji. Stosuj zasadę najmniejszych uprawnień.

Szczegóły ról IAM znajdziesz na [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles).

---

## Następne kroki

- Skonfiguruj kanały wiadomości: [Channels](/pl/channels)
- Sparuj urządzenia lokalne jako węzły: [Nodes](/pl/nodes)
- Skonfiguruj Gateway: [Konfiguracja Gateway](/pl/gateway/configuration)
