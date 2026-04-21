---
read_when:
    - Sie möchten Drittanbieter-Plugins für OpenClaw finden.
    - Sie möchten Ihr eigenes Plugin veröffentlichen oder auflisten.
summary: 'Von der Community gepflegte OpenClaw-Plugins: durchsuchen, installieren und eigene einreichen'
title: Community-Plugins
x-i18n:
    generated_at: "2026-04-21T06:27:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# Community-Plugins

Community-Plugins sind Drittanbieter-Pakete, die OpenClaw um neue
Channels, Tools, Provider oder andere Fähigkeiten erweitern. Sie werden von der
Community entwickelt und gepflegt, auf [ClawHub](/de/tools/clawhub) oder npm veröffentlicht und
lassen sich mit einem einzigen Befehl installieren.

ClawHub ist die kanonische Discovery-Oberfläche für Community-Plugins. Öffnen Sie
keine Docs-only-PRs, nur um Ihr Plugin hier zur besseren Auffindbarkeit hinzuzufügen; veröffentlichen Sie es stattdessen auf
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw prüft zuerst ClawHub und greift automatisch auf npm zurück.

## Aufgelistete Plugins

### Apify

Daten von jeder Website mit 20.000+ fertigen Scrapern extrahieren. Lassen Sie Ihren Agenten
Daten aus Instagram, Facebook, TikTok, YouTube, Google Maps, der Google-Suche, E-Commerce-Websites und mehr extrahieren — einfach durch eine Anfrage.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Unabhängige OpenClaw-Bridge für Unterhaltungen mit dem Codex App Server. Binden Sie einen Chat an
einen Codex-Thread, sprechen Sie per Klartext mit ihm und steuern Sie ihn mit chatnativen
Befehlen für Fortsetzen, Planung, Review, Modellauswahl, Compaction und mehr.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integration für Enterprise-Roboter im Stream-Modus. Unterstützt Text-, Bild- und
Dateinachrichten über jeden DingTalk-Client.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin für Lossless Context Management für OpenClaw. DAG-basierte
Zusammenfassung von Unterhaltungen mit inkrementeller Compaction — erhält die vollständige Kontexttreue
bei geringerer Token-Nutzung.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Offizielles Plugin, das Agent-Traces nach Opik exportiert. Überwachen Sie Agent-Verhalten,
Kosten, Tokens, Fehler und mehr.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Geben Sie Ihrem OpenClaw-Agenten einen Live2D-Avatar mit Echtzeit-Lippensynchronisation, Emotions-
Ausdrücken und Text-to-Speech. Enthält Creator-Tools zur KI-Asset-Erzeugung
und One-Click-Deployment in den Prometheus Marketplace. Derzeit in Alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Verbinden Sie OpenClaw über die QQ Bot API mit QQ. Unterstützt private Chats, Gruppen-
Erwähnungen, Channel-Nachrichten und Rich Media einschließlich Sprache, Bildern, Videos
und Dateien.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

WeCom-Channel-Plugin für OpenClaw vom Tencent-WeCom-Team. Basierend auf
persistenten WebSocket-Verbindungen von WeCom Bot unterstützt es Direktnachrichten und Gruppen-
Chats, Streaming-Antworten, proaktives Messaging, Bild-/Dateiverarbeitung, Markdown-
Formatierung, integrierte Zugriffskontrolle und Skills für Dokumente, Meetings und Messaging.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Plugin einreichen

Wir begrüßen Community-Plugins, die nützlich, dokumentiert und sicher im Betrieb sind.

<Steps>
  <Step title="Auf ClawHub oder npm veröffentlichen">
    Ihr Plugin muss über `openclaw plugins install \<package-name\>` installierbar sein.
    Veröffentlichen Sie es auf [ClawHub](/de/tools/clawhub) (bevorzugt) oder npm.
    Die vollständige Anleitung finden Sie unter [Building Plugins](/de/plugins/building-plugins).

  </Step>

  <Step title="Auf GitHub hosten">
    Der Quellcode muss in einem öffentlichen Repository mit Einrichtungsdokumentation und einem
    Issue-Tracker liegen.

  </Step>

  <Step title="Docs-PRs nur für Änderungen an den Quelldokumenten verwenden">
    Sie benötigen keinen Docs-PR, nur damit Ihr Plugin auffindbar ist. Veröffentlichen Sie es stattdessen
    auf ClawHub.

    Öffnen Sie einen Docs-PR nur dann, wenn die Quelldokumentation von OpenClaw eine tatsächliche inhaltliche
    Änderung benötigt, etwa zur Korrektur von Installationshinweisen oder zum Hinzufügen
    reposübergreifender Dokumentation, die in den Haupt-Dokumentsatz gehört.

  </Step>
</Steps>

## Qualitätsmaßstab

| Anforderung                | Warum                                         |
| -------------------------- | --------------------------------------------- |
| Auf ClawHub oder npm veröffentlicht | Benutzer müssen `openclaw plugins install` verwenden können |
| Öffentliches GitHub-Repo   | Prüfung des Quellcodes, Issue-Tracking, Transparenz |
| Einrichtungs- und Nutzungsdokumentation | Benutzer müssen wissen, wie es konfiguriert wird |
| Aktive Wartung             | Aktuelle Updates oder reaktionsschnelle Bearbeitung von Issues |

Low-Effort-Wrapper, unklare Ownership oder nicht gepflegte Pakete können abgelehnt werden.

## Verwandt

- [Install and Configure Plugins](/de/tools/plugin) — wie man ein beliebiges Plugin installiert
- [Building Plugins](/de/plugins/building-plugins) — erstellen Sie Ihr eigenes
- [Plugin Manifest](/de/plugins/manifest) — Manifest-Schema
