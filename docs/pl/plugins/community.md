---
read_when:
    - Chcesz znaleźć zewnętrzne Pluginy OpenClaw
    - Chcesz opublikować lub dodać do listy własny Plugin
summary: 'Pluginy OpenClaw utrzymywane przez społeczność: przeglądaj, instaluj i przesyłaj własne'
title: Pluginy społecznościowe
x-i18n:
    generated_at: "2026-04-26T11:36:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

Pluginy społecznościowe to pakiety zewnętrzne, które rozszerzają OpenClaw o nowe
kanały, narzędzia, dostawców lub inne możliwości. Są tworzone i utrzymywane
przez społeczność, publikowane w [ClawHub](/pl/tools/clawhub) lub npm oraz
instalowane pojedynczym poleceniem.

ClawHub jest kanoniczną powierzchnią odkrywania Pluginów społecznościowych. Nie otwieraj
PR-ów tylko do dokumentacji wyłącznie po to, aby dodać tu swój Plugin dla lepszej wykrywalności; opublikuj go zamiast tego w
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw najpierw sprawdza ClawHub, a następnie automatycznie przechodzi do npm.

## Wymienione Pluginy

### Apify

Pobieraj dane z dowolnej witryny internetowej za pomocą ponad 20 000 gotowych scraperów. Pozwól swojemu agentowi
wyodrębniać dane z Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, witryn e-commerce i innych — po prostu o to prosząc.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Niezależny most OpenClaw do rozmów Codex App Server. Powiąż czat z
wątkiem Codex, rozmawiaj z nim zwykłym tekstem i steruj nim za pomocą natywnych dla czatu
poleceń do wznawiania, planowania, przeglądu, wyboru modelu, Compaction i nie tylko.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integracja z robotem korporacyjnym z użyciem trybu Stream. Obsługuje tekst, obrazy i
wiadomości plikowe przez dowolnego klienta DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management dla OpenClaw. Oparte na DAG
podsumowywanie rozmów z przyrostowym Compaction — zachowuje pełną wierność kontekstu
przy jednoczesnym zmniejszeniu użycia tokenów.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Oficjalny Plugin eksportujący ślady agentów do Opik. Monitoruj zachowanie agentów,
koszty, tokeny, błędy i nie tylko.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Nadaj swojemu agentowi OpenClaw awatar Live2D z synchronizacją ruchu ust w czasie rzeczywistym,
ekspresją emocji i syntezą mowy. Zawiera narzędzia twórcy do generowania zasobów AI
oraz wdrażania jednym kliknięciem do Prometheus Marketplace. Obecnie w wersji alfa.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Połącz OpenClaw z QQ przez API QQ Bot. Obsługuje prywatne czaty, wzmianki w grupach,
wiadomości kanałowe oraz multimedia rozszerzone, w tym głos, obrazy, filmy
i pliki.

Bieżące wydania OpenClaw zawierają QQ Bot w pakiecie. W przypadku zwykłych instalacji użyj konfiguracji z pakietu w
[QQ Bot](/pl/channels/qqbot); ten zewnętrzny Plugin instaluj tylko
wtedy, gdy celowo chcesz użyć samodzielnego pakietu utrzymywanego przez Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin kanału WeCom dla OpenClaw od zespołu Tencent WeCom. Oparty na
trwałych połączeniach WebSocket WeCom Bot, obsługuje wiadomości bezpośrednie i czaty grupowe,
odpowiedzi strumieniowe, proaktywne wysyłanie wiadomości, przetwarzanie obrazów/plików, formatowanie Markdown,
wbudowaną kontrolę dostępu oraz Skills do dokumentów/spotkań/wiadomości.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Prześlij swój Plugin

Zapraszamy Pluginy społecznościowe, które są przydatne, udokumentowane i bezpieczne w użyciu.

<Steps>
  <Step title="Publikacja w ClawHub lub npm">
    Twój Plugin musi dać się zainstalować za pomocą `openclaw plugins install \<package-name\>`.
    Opublikuj go w [ClawHub](/pl/tools/clawhub) (zalecane) lub npm.
    Zobacz [Tworzenie Pluginów](/pl/plugins/building-plugins), aby zapoznać się z pełnym przewodnikiem.

  </Step>

  <Step title="Hostowanie na GitHub">
    Kod źródłowy musi znajdować się w publicznym repozytorium z dokumentacją konfiguracji i
    trackerem zgłoszeń.

  </Step>

  <Step title="Używaj PR-ów do dokumentacji tylko do zmian w dokumentacji źródłowej">
    Nie potrzebujesz PR-a do dokumentacji tylko po to, aby Twój Plugin był wykrywalny. Opublikuj go
    zamiast tego w ClawHub.

    Otwórz PR do dokumentacji tylko wtedy, gdy dokumentacja źródłowa OpenClaw wymaga rzeczywistej
    zmiany treści, na przykład korekty wskazówek instalacji lub dodania
    dokumentacji międzyrepozytoryjnej, która powinna należeć do głównego zestawu dokumentów.

  </Step>
</Steps>

## Poziom jakości

| Wymaganie                 | Dlaczego                                         |
| ------------------------- | ------------------------------------------------ |
| Opublikowany w ClawHub lub npm | Użytkownicy muszą mieć działające `openclaw plugins install` |
| Publiczne repozytorium GitHub  | Przegląd kodu źródłowego, śledzenie zgłoszeń, przejrzystość |
| Dokumentacja konfiguracji i użycia | Użytkownicy muszą wiedzieć, jak to skonfigurować |
| Aktywne utrzymanie        | Ostatnie aktualizacje lub szybka obsługa zgłoszeń |

Niskiej jakości wrappery, niejasna odpowiedzialność lub nieutrzymywane pakiety mogą zostać odrzucone.

## Powiązane

- [Instalacja i konfiguracja Pluginów](/pl/tools/plugin) — jak zainstalować dowolny Plugin
- [Tworzenie Pluginów](/pl/plugins/building-plugins) — utwórz własny
- [Manifest Pluginu](/pl/plugins/manifest) — schemat manifestu
