---
read_when:
    - Chcesz połączyć OpenClaw z WeChat lub Weixin
    - Instalujesz lub rozwiązujesz problemy z Pluginem kanału `openclaw-weixin`
    - Musisz zrozumieć, jak zewnętrzne Pluginy kanałów działają obok Gateway```
summary: Konfiguracja kanału WeChat za pomocą zewnętrznego Plugin `openclaw-weixin`
title: WeChat
x-i18n:
    generated_at: "2026-04-19T01:11:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae669f2b6300e0c2b1d1dc57743a0a2ab0c05b9e277ec2ac640a03e6e7ab3b84
    source_path: channels/wechat.md
    workflow: 15
---

# WeChat

OpenClaw łączy się z WeChat za pośrednictwem zewnętrznego Pluginu kanału Tencent
`@tencent-weixin/openclaw-weixin`.

Status: zewnętrzny Plugin. Obsługiwane są czaty bezpośrednie i multimedia. Czaty grupowe nie są
deklarowane przez bieżące metadane możliwości Pluginu.

## Nazewnictwo

- **WeChat** to nazwa widoczna dla użytkownika w tej dokumentacji.
- **Weixin** to nazwa używana przez pakiet Tencent oraz przez identyfikator Pluginu.
- `openclaw-weixin` to identyfikator kanału OpenClaw.
- `@tencent-weixin/openclaw-weixin` to pakiet npm.

Używaj `openclaw-weixin` w poleceniach CLI i ścieżkach konfiguracji.

## Jak to działa

Kod WeChat nie znajduje się w głównym repozytorium OpenClaw. OpenClaw udostępnia
ogólny kontrakt Pluginu kanału, a zewnętrzny Plugin udostępnia
środowisko uruchomieniowe specyficzne dla WeChat:

1. `openclaw plugins install` instaluje `@tencent-weixin/openclaw-weixin`.
2. Gateway wykrywa manifest Pluginu i ładuje punkt wejścia Pluginu.
3. Plugin rejestruje identyfikator kanału `openclaw-weixin`.
4. `openclaw channels login --channel openclaw-weixin` uruchamia logowanie przez QR.
5. Plugin przechowuje poświadczenia konta w katalogu stanu OpenClaw.
6. Po uruchomieniu Gateway Plugin uruchamia monitor Weixin dla każdego
   skonfigurowanego konta.
7. Przychodzące wiadomości WeChat są normalizowane przez kontrakt kanału, kierowane do
   wybranego agenta OpenClaw i odsyłane z powrotem przez wychodzącą ścieżkę Pluginu.

To rozdzielenie ma znaczenie: rdzeń OpenClaw powinien pozostać niezależny od kanałów. Logowanie WeChat,
wywołania Tencent iLink API, wysyłanie/pobieranie multimediów, tokeny kontekstu i
monitorowanie kont należą do zewnętrznego Pluginu.

## Instalacja

Szybka instalacja:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Instalacja ręczna:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Po instalacji uruchom ponownie Gateway:

```bash
openclaw gateway restart
```

## Logowanie

Uruchom logowanie QR na tej samej maszynie, na której działa Gateway:

```bash
openclaw channels login --channel openclaw-weixin
```

Zeskanuj kod QR w WeChat na telefonie i potwierdź logowanie. Plugin zapisuje
token konta lokalnie po pomyślnym zeskanowaniu.

Aby dodać kolejne konto WeChat, uruchom ponownie to samo polecenie logowania. W przypadku wielu
kont izoluj sesje wiadomości bezpośrednich według konta, kanału i nadawcy:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Kontrola dostępu

Wiadomości bezpośrednie używają standardowego modelu parowania i listy dozwolonych nadawców OpenClaw dla Pluginów
kanałów.

Zatwierdzaj nowych nadawców:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

Pełny model kontroli dostępu opisano w sekcji [Pairing](/pl/channels/pairing).

## Zgodność

Plugin sprawdza wersję hosta OpenClaw podczas uruchamiania.

| Linia Pluginu | Wersja OpenClaw         | Tag npm  |
| ------------- | ----------------------- | -------- |
| `2.x`         | `>=2026.3.22`           | `latest` |
| `1.x`         | `>=2026.1.0 <2026.3.22` | `legacy` |

Jeśli Plugin zgłasza, że Twoja wersja OpenClaw jest zbyt stara, zaktualizuj
OpenClaw albo zainstaluj starszą linię Pluginu:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Proces sidecar

Plugin WeChat może uruchamiać pomocniczą pracę obok Gateway, gdy monitoruje
Tencent iLink API. W zgłoszeniu #68451 ta ścieżka pomocnicza ujawniła błąd w
ogólnym mechanizmie czyszczenia nieaktualnego Gateway w OpenClaw: proces potomny mógł próbować
wyczyścić nadrzędny proces Gateway, powodując pętle restartów w menedżerach procesów
takich jak systemd.

Obecne czyszczenie przy uruchamianiu OpenClaw wyklucza bieżący proces i jego procesy nadrzędne,
więc pomocnik kanału nie może zakończyć Gateway, który go uruchomił. Ta poprawka jest
ogólna; nie jest to ścieżka specyficzna dla WeChat w rdzeniu.

## Rozwiązywanie problemów

Sprawdź instalację i status:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

Jeśli kanał jest widoczny jako zainstalowany, ale się nie łączy, potwierdź, że Plugin jest
włączony, i uruchom ponownie:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Jeśli Gateway uruchamia się ponownie wielokrotnie po włączeniu WeChat, zaktualizuj zarówno OpenClaw, jak i
Plugin:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

Tymczasowe wyłączenie:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## Powiązana dokumentacja

- Omówienie kanałów: [Chat Channels](/pl/channels)
- Pairing: [Pairing](/pl/channels/pairing)
- Routing kanałów: [Channel Routing](/pl/channels/channel-routing)
- Architektura Pluginów: [Plugin Architecture](/pl/plugins/architecture)
- SDK Pluginów kanałów: [Channel Plugin SDK](/pl/plugins/sdk-channel-plugins)
- Pakiet zewnętrzny: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
