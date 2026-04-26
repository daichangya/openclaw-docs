---
read_when:
    - Udostępnianie Control UI Gateway poza localhost
    - Automatyzowanie dostępu do dashboardu w tailnet lub publicznie
summary: Zintegrowane Tailscale Serve/Funnel dla dashboardu Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T11:32:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
    source_path: gateway/tailscale.md
    workflow: 15
---

OpenClaw może automatycznie skonfigurować Tailscale **Serve** (tailnet) albo **Funnel** (publicznie) dla
dashboardu Gateway i portu WebSocket. Dzięki temu Gateway pozostaje związany z loopback, podczas gdy
Tailscale zapewnia HTTPS, routing oraz (dla Serve) nagłówki tożsamości.

## Tryby

- `serve`: Serve tylko dla tailnet przez `tailscale serve`. Gateway pozostaje na `127.0.0.1`.
- `funnel`: Publiczny HTTPS przez `tailscale funnel`. OpenClaw wymaga współdzielonego hasła.
- `off`: Domyślnie (brak automatyzacji Tailscale).

Wyjście statusu i audytu używa określenia **ekspozycja Tailscale** dla tego trybu OpenClaw Serve/Funnel.
`off` oznacza, że OpenClaw nie zarządza Serve ani Funnel; nie oznacza to, że
lokalny demon Tailscale jest zatrzymany albo wylogowany.

## Uwierzytelnianie

Ustaw `gateway.auth.mode`, aby kontrolować handshake:

- `none` (tylko prywatny ingress)
- `token` (domyślnie, gdy ustawione jest `OPENCLAW_GATEWAY_TOKEN`)
- `password` (współdzielony sekret przez `OPENCLAW_GATEWAY_PASSWORD` lub konfigurację)
- `trusted-proxy` (reverse proxy świadome tożsamości; zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth))

Gdy `tailscale.mode = "serve"` i `gateway.auth.allowTailscale` ma wartość `true`,
uwierzytelnianie Control UI/WebSocket może używać nagłówków tożsamości Tailscale
(`tailscale-user-login`) bez podawania tokenu/hasła. OpenClaw weryfikuje
tożsamość, rozwiązując adres `x-forwarded-for` przez lokalnego demona Tailscale
(`tailscale whois`) i dopasowując go do nagłówka przed akceptacją.
OpenClaw traktuje żądanie jako Serve tylko wtedy, gdy przychodzi z loopback z
nagłówkami Tailscale `x-forwarded-for`, `x-forwarded-proto` i `x-forwarded-host`.
Dla sesji operatora Control UI, które zawierają tożsamość urządzenia przeglądarki, ta
zweryfikowana ścieżka Serve pomija również rundę parowania urządzenia. Nie omija to
tożsamości urządzenia przeglądarki: klienci bez urządzenia są nadal odrzucani, a połączenia WebSocket
w roli node albo niebędące połączeniami Control UI nadal przechodzą normalne sprawdzenia parowania i
uwierzytelniania.
Endpointy HTTP API (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`)
**nie** używają uwierzytelniania nagłówkami tożsamości Tailscale. Nadal stosują
normalny tryb uwierzytelniania HTTP gateway: domyślnie uwierzytelnianie współdzielonym sekretem albo
intencjonalnie skonfigurowany `trusted-proxy` / prywatny ingress `none`.
Ten przepływ bez tokena zakłada, że host gateway jest zaufany. Jeśli na tym samym hoście
może działać niezaufany kod lokalny, wyłącz `gateway.auth.allowTailscale` i zamiast tego wymagaj uwierzytelniania tokenem/hasłem.
Aby wymagać jawnych poświadczeń współdzielonego sekretu, ustaw `gateway.auth.allowTailscale: false`
i użyj `gateway.auth.mode: "token"` albo `"password"`.

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

Otwórz: `https://<magicdns>/` (albo skonfigurowane `gateway.controlUi.basePath`)

### Tylko tailnet (powiązanie z adresem IP Tailnet)

Użyj tego, gdy chcesz, aby Gateway nasłuchiwał bezpośrednio na adresie IP Tailnet (bez Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Połącz się z innego urządzenia Tailnet:

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
- Ustaw `gateway.tailscale.resetOnExit`, jeśli chcesz, aby OpenClaw cofnął konfigurację `tailscale serve`
  albo `tailscale funnel` przy zamknięciu.
- `gateway.bind: "tailnet"` to bezpośrednie powiązanie Tailnet (bez HTTPS, bez Serve/Funnel).
- `gateway.bind: "auto"` preferuje loopback; użyj `tailnet`, jeśli chcesz tylko Tailnet.
- Serve/Funnel udostępniają tylko **Gateway control UI + WS**. Node łączą się przez
  ten sam endpoint Gateway WS, więc Serve może działać także dla dostępu node.

## Sterowanie przeglądarką (zdalny Gateway + lokalna przeglądarka)

Jeśli uruchamiasz Gateway na jednej maszynie, ale chcesz sterować przeglądarką na innej,
uruchom **host node** na maszynie z przeglądarką i trzymaj obie w tej samej tailnet.
Gateway będzie proxyował akcje przeglądarki do node; nie jest potrzebny osobny serwer sterujący ani URL Serve.

Unikaj Funnel do sterowania przeglądarką; traktuj parowanie node tak samo jak dostęp operatora.

## Wymagania wstępne i ograniczenia Tailscale

- Serve wymaga włączonego HTTPS dla Twojego tailnet; CLI wyświetli monit, jeśli go brakuje.
- Serve wstrzykuje nagłówki tożsamości Tailscale; Funnel tego nie robi.
- Funnel wymaga Tailscale v1.38.3+, MagicDNS, włączonego HTTPS i atrybutu node funnel.
- Funnel obsługuje tylko porty `443`, `8443` i `10000` przez TLS.
- Funnel na macOS wymaga wariantu aplikacji Tailscale typu open-source.

## Dowiedz się więcej

- Przegląd Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Polecenie `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Przegląd Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Polecenie `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Powiązane

- [Dostęp zdalny](/pl/gateway/remote)
- [Discovery](/pl/gateway/discovery)
- [Uwierzytelnianie](/pl/gateway/authentication)
