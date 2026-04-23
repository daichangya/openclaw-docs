---
read_when:
    - Szukasz statusu aplikacji towarzyszącej dla Linuxa
    - Planowanie pokrycia platform lub wkładów contributors
    - Debugowanie zabicia przez OOM lub kodu wyjścia 137 na VPS-ie lub w kontenerze
summary: Obsługa Linux + status aplikacji towarzyszącej
title: Aplikacja Linux
x-i18n:
    generated_at: "2026-04-23T10:03:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: c56151406517a1259e66626b8f4b48c16917b10580e7626463afd8a68dc286f7
    source_path: platforms/linux.md
    workflow: 15
---

# Aplikacja Linux

Gateway jest w pełni obsługiwany na Linuxie. **Node to zalecany runtime**.
Bun nie jest zalecany dla Gateway (błędy WhatsApp/Telegram).

Natywne aplikacje towarzyszące dla Linuxa są planowane. Wkłady są mile widziane, jeśli chcesz pomóc taką zbudować.

## Szybka ścieżka dla początkujących (VPS)

1. Zainstaluj Node 24 (zalecane; Node 22 LTS, obecnie `22.14+`, nadal działa dla zgodności)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Na laptopie: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Otwórz `http://127.0.0.1:18789/` i uwierzytelnij się przy użyciu skonfigurowanego współdzielonego sekretu (domyślnie token; hasło, jeśli ustawisz `gateway.auth.mode: "password"`)

Pełny przewodnik po serwerze Linux: [Linux Server](/pl/vps). Przykład VPS krok po kroku: [exe.dev](/pl/install/exe-dev)

## Instalacja

- [Pierwsze kroki](/pl/start/getting-started)
- [Instalacja i aktualizacje](/pl/install/updating)
- Opcjonalne ścieżki: [Bun (eksperymentalnie)](/pl/install/bun), [Nix](/pl/install/nix), [Docker](/pl/install/docker)

## Gateway

- [Runbook Gateway](/pl/gateway)
- [Konfiguracja](/pl/gateway/configuration)

## Instalacja usługi Gateway (CLI)

Użyj jednego z poniższych:

```
openclaw onboard --install-daemon
```

Albo:

```
openclaw gateway install
```

Albo:

```
openclaw configure
```

Po wyświetleniu monitu wybierz **Gateway service**.

Naprawa/migracja:

```
openclaw doctor
```

## Sterowanie systemem (jednostka użytkownika systemd)

OpenClaw domyślnie instaluje usługę użytkownika systemd. Dla współdzielonych lub zawsze włączonych serwerów użyj usługi **systemowej**. `openclaw gateway install` oraz `openclaw onboard --install-daemon` już generują dla Ciebie aktualną kanoniczną jednostkę; pisz ją ręcznie tylko wtedy, gdy potrzebujesz niestandardowej konfiguracji system/service-manager. Pełne wskazówki dotyczące usług znajdują się w [Runbook Gateway](/pl/gateway).

Minimalna konfiguracja:

Utwórz `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Włącz ją:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presja pamięci i zabicia przez OOM

Na Linuxie jądro wybiera ofiarę OOM, gdy host, VM lub grupa cgroup kontenera
kończy pamięć. Gateway może być słabą ofiarą, ponieważ posiada długotrwałe
sesje i połączenia kanałów. Dlatego OpenClaw, gdy to możliwe, ustawia przejściowe procesy potomne tak, aby były zabijane przed Gateway.

Dla kwalifikujących się uruchomień procesów potomnych na Linuxie OpenClaw uruchamia proces potomny przez krótki
wrapper `/bin/sh`, który podnosi własne `oom_score_adj` procesu potomnego do `1000`, a następnie
wykonuje `exec` właściwego polecenia. Jest to operacja nieuprzywilejowana, ponieważ proces potomny
jedynie zwiększa własne prawdopodobieństwo zabicia przez OOM.

Obsługiwane powierzchnie procesów potomnych obejmują:

- potomne procesy poleceń zarządzane przez supervisor,
- potomne powłoki PTY,
- potomne procesy serwerów MCP stdio,
- uruchamiane przez OpenClaw procesy browser/Chrome.

Wrapper jest dostępny tylko na Linuxie i jest pomijany, gdy `/bin/sh` jest niedostępne. Jest
również pomijany, jeśli środowisko procesu potomnego ustawia `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` lub `off`.

Aby zweryfikować proces potomny:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Oczekiwana wartość dla obsługiwanych procesów potomnych to `1000`. Proces Gateway powinien zachować
swój normalny wynik, zwykle `0`.

Nie zastępuje to zwykłego dostrajania pamięci. Jeśli VPS lub kontener wielokrotnie
zabija procesy potomne, zwiększ limit pamięci, zmniejsz współbieżność albo dodaj silniejsze
mechanizmy kontroli zasobów, takie jak `MemoryMax=` w systemd lub limity pamięci na poziomie kontenera.
