---
read_when:
    - Udostępnianie Control UI Gateway poza localhost
    - Automatyzacja dostępu do panelu przez tailnet lub publicznie
summary: Zintegrowany Tailscale Serve/Funnel dla panelu Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-25T13:49:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6042ddaf7194b34f003b1cdf5226f4693da22663d4007c65c79580e7f8ea2835
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw może automatycznie konfigurować Tailscale **Serve** (tailnet) lub **Funnel** (publicznie) dla
panelu Gateway i portu WebSocket. Dzięki temu Gateway pozostaje zbindowany do loopback, podczas gdy
Tailscale zapewnia HTTPS, routing i (dla Serve) nagłówki tożsamości.

## Tryby

- `serve`: Tylko tailnet przez Tailscale Serve via `tailscale serve`. Gateway pozostaje na `127.0.0.1`.
- `funnel`: Publiczny HTTPS przez `tailscale funnel`. OpenClaw wymaga współdzielonego hasła.
- `off`: Domyślnie (bez automatyzacji Tailscale).

## Uwierzytelnianie

Ustaw `gateway.auth.mode`, aby kontrolować handshake:

- `none` (tylko private ingress)
- `token` (domyślnie, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`)
- `password` (współdzielony sekret przez `OPENCLAW_GATEWAY_PASSWORD` lub config)
- `trusted-proxy` (reverse proxy świadome tożsamości; zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth))

Gdy `tailscale.mode = "serve"` i `gateway.auth.allowTailscale` ma wartość `true`,
uwierzytelnianie Control UI/WebSocket może używać nagłówków tożsamości Tailscale
(`tailscale-user-login`) bez podawania tokenu/hasła. OpenClaw weryfikuje
tożsamość, rozwiązując adres `x-forwarded-for` przez lokalny demon Tailscale
(`tailscale whois`) i dopasowując go do nagłówka przed jego zaakceptowaniem.
OpenClaw traktuje żądanie jako Serve tylko wtedy, gdy dociera ono z loopback z
nagłówkami Tailscale `x-forwarded-for`, `x-forwarded-proto` i `x-forwarded-host`.
Endpointy HTTP API (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`)
nie używają uwierzytelniania przez nagłówki tożsamości Tailscale. Nadal stosują
normalny tryb uwierzytelniania HTTP Gateway: domyślnie uwierzytelnianie współdzielonym sekretem albo celowo
skonfigurowany trusted-proxy / private-ingress `none`.
Ten beztokenowy przepływ zakłada, że host Gateway jest zaufany. Jeśli na tym samym hoście
może działać niezaufany kod lokalny, wyłącz `gateway.auth.allowTailscale` i zamiast tego
wymagaj uwierzytelniania tokenem/hasłem.
Aby wymagać jawnych danych uwierzytelniających współdzielonym sekretem, ustaw `gateway.auth.allowTailscale: false`
i użyj `gateway.auth.mode: "token"` lub `"password"`.

## Przykłady konfiguracji

### Tylko tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Otwórz: `https://<magicdns>/` (lub skonfigurowane `gateway.controlUi.basePath`)

### Tylko tailnet (bind do IP Tailnet)

Użyj tego, gdy chcesz, aby Gateway nasłuchiwał bezpośrednio na IP Tailnet (bez Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Połącz z innego urządzenia Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Uwaga: loopback (`http://127.0.0.1:18789`) **nie** będzie działać w tym trybie.

### Publiczny internet (Funnel + współdzielone hasło)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Preferuj `OPENCLAW_GATEWAY_PASSWORD` zamiast zapisywania hasła na dysku.

## Przykłady CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Uwagi

- Tailscale Serve/Funnel wymaga zainstalowanego i zalogowanego CLI `tailscale`.
- `tailscale.mode: "funnel"` odmawia uruchomienia, jeśli tryb uwierzytelniania nie jest `password`, aby uniknąć publicznej ekspozycji.
- Ustaw `gateway.tailscale.resetOnExit`, jeśli chcesz, aby OpenClaw cofał konfigurację `tailscale serve`
  lub `tailscale funnel` przy zamknięciu.
- `gateway.bind: "tailnet"` to bezpośrednie bindowanie do Tailnet (bez HTTPS, bez Serve/Funnel).
- `gateway.bind: "auto"` preferuje loopback; użyj `tailnet`, jeśli chcesz trybu tylko Tailnet.
- Serve/Funnel udostępniają tylko **Control UI + WS Gateway**. Nodes łączą się przez
  ten sam endpoint WS Gateway, więc Serve może działać także dla dostępu Node.

## Sterowanie przeglądarką (zdalny Gateway + lokalna przeglądarka)

Jeśli uruchamiasz Gateway na jednej maszynie, ale chcesz sterować przeglądarką na innej,
uruchom **hosta Node** na maszynie z przeglądarką i utrzymuj obie maszyny w tym samym tailnet.
Gateway będzie proxyować akcje przeglądarki do węzła; nie jest potrzebny osobny serwer sterowania ani URL Serve.

Unikaj Funnel do sterowania przeglądarką; traktuj parowanie Node jak dostęp operatora.

## Wymagania wstępne i ograniczenia Tailscale

- Serve wymaga włączonego HTTPS dla Twojego tailnet; CLI wyświetli monit, jeśli go brakuje.
- Serve wstrzykuje nagłówki tożsamości Tailscale; Funnel tego nie robi.
- Funnel wymaga Tailscale v1.38.3+, MagicDNS, włączonego HTTPS i atrybutu węzła funnel.
- Funnel obsługuje przez TLS tylko porty `443`, `8443` i `10000`.
- Funnel na macOS wymaga wariantu aplikacji Tailscale open source.

## Dowiedz się więcej

- Omówienie Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Polecenie `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Omówienie Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Polecenie `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Powiązane

- [Dostęp zdalny](/pl/gateway/remote)
- [Discovery](/pl/gateway/discovery)
- [Uwierzytelnianie](/pl/gateway/authentication)
