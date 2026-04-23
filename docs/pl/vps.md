---
read_when:
    - Chcesz uruchomić Gateway na serwerze Linux lub chmurowym VPS
    - Potrzebujesz szybkiej mapy przewodników hostingowych
    - Chcesz ogólnego dostrajania serwera Linux dla OpenClaw
sidebarTitle: Linux Server
summary: Uruchamianie OpenClaw na serwerze Linux lub chmurowym VPS — wybór dostawcy, architektura i dostrajanie
title: Serwer Linux
x-i18n:
    generated_at: "2026-04-23T10:11:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# Serwer Linux

Uruchamiaj Gateway OpenClaw na dowolnym serwerze Linux lub chmurowym VPS. Ta strona pomaga
wybrać dostawcę, wyjaśnia, jak działają wdrożenia chmurowe, i omawia ogólne dostrajanie Linuksa,
które ma zastosowanie wszędzie.

## Wybierz dostawcę

<CardGroup cols={2}>
  <Card title="Railway" href="/pl/install/railway">Jedno kliknięcie, konfiguracja w przeglądarce</Card>
  <Card title="Northflank" href="/pl/install/northflank">Jedno kliknięcie, konfiguracja w przeglądarce</Card>
  <Card title="DigitalOcean" href="/pl/install/digitalocean">Prosty płatny VPS</Card>
  <Card title="Oracle Cloud" href="/pl/install/oracle">Darmowa warstwa ARM Always Free</Card>
  <Card title="Fly.io" href="/pl/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/pl/install/hetzner">Docker na VPS Hetzner</Card>
  <Card title="Hostinger" href="/pl/install/hostinger">VPS z konfiguracją jednym kliknięciem</Card>
  <Card title="GCP" href="/pl/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/pl/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/pl/install/exe-dev">VM z proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/pl/install/raspberry-pi">Self-hosting ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / free tier)** również działa dobrze.
Dostępny jest społecznościowy filmowy przewodnik krok po kroku pod adresem
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(zasób społecznościowy — może stać się niedostępny).

## Jak działają konfiguracje chmurowe

- **Gateway działa na VPS** i zarządza stanem + workspace.
- Łączysz się z laptopa lub telefonu przez **Control UI** albo **Tailscale/SSH**.
- Traktuj VPS jako źródło prawdy i regularnie twórz **kopie zapasowe** stanu + workspace.
- Bezpieczne ustawienie domyślne: trzymaj Gateway na loopback i uzyskuj do niego dostęp przez tunel SSH lub Tailscale Serve.
  Jeśli wiążesz go do `lan` lub `tailnet`, wymagaj `gateway.auth.token` albo `gateway.auth.password`.

Powiązane strony: [Zdalny dostęp do Gateway](/pl/gateway/remote), [Hub platform](/pl/platforms).

## Wspólny agent firmowy na VPS

Uruchamianie jednego agenta dla zespołu jest poprawną konfiguracją, gdy wszyscy użytkownicy znajdują się w tej samej granicy zaufania, a agent jest używany wyłącznie do celów biznesowych.

- Trzymaj go w dedykowanym runtime (VPS/VM/kontener + dedykowany użytkownik/system operacyjny/konta).
- Nie loguj tego runtime do osobistych kont Apple/Google ani do osobistych profili przeglądarki/menedżera haseł.
- Jeśli użytkownicy są wobec siebie adwersarialni, rozdziel ich według gateway/hosta/użytkownika systemowego.

Szczegóły modelu bezpieczeństwa: [Security](/pl/gateway/security).

## Używanie Node z VPS

Możesz trzymać Gateway w chmurze i sparować **Node** na lokalnych urządzeniach
(Mac/iOS/Android/headless). Node zapewniają lokalne możliwości `screen`/`camera`/`canvas` i `system.run`,
podczas gdy Gateway pozostaje w chmurze.

Dokumentacja: [Nodes](/pl/nodes), [CLI Nodes](/pl/cli/nodes).

## Dostrajanie uruchamiania dla małych VM i hostów ARM

Jeśli polecenia CLI wydają się wolne na słabszych VM (lub hostach ARM), włącz cache kompilacji modułów Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` przyspiesza uruchamianie powtarzanych poleceń.
- `OPENCLAW_NO_RESPAWN=1` eliminuje dodatkowy narzut startowy związany ze ścieżką self-respawn.
- Pierwsze uruchomienie polecenia rozgrzewa cache; kolejne uruchomienia są szybsze.
- Szczegóły dla Raspberry Pi znajdziesz w [Raspberry Pi](/pl/install/raspberry-pi).

### Lista kontrolna dostrajania systemd (opcjonalnie)

Dla hostów VM używających `systemd` rozważ:

- Dodanie zmiennych środowiskowych usługi dla stabilnej ścieżki startowej:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Jawne utrzymanie zachowania restartu:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferowanie dysków opartych na SSD dla ścieżek stanu/cache, aby zmniejszyć kary zimnego startu związane z losowym I/O.

Dla standardowej ścieżki `openclaw onboard --install-daemon` edytuj jednostkę użytkownika:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Jeśli celowo zainstalowano jednostkę systemową, zamiast tego edytuj
`openclaw-gateway.service` przez `sudo systemctl edit openclaw-gateway.service`.

Jak polityki `Restart=` pomagają w automatycznym odzyskiwaniu:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Informacje o zachowaniu Linuksa przy OOM, wyborze procesu potomnego jako ofiary i diagnostyce
`exit 137` znajdziesz w [Presja pamięci i zabicia OOM w Linuksie](/pl/platforms/linux#memory-pressure-and-oom-kills).
