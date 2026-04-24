---
read_when:
    - Sie möchten OpenClaw-Plugins von Drittanbietern finden
    - "Sie möchten Ihr eigenes Plugin veröffentlichen oder auflisten\tRTLUanalysis to=final  天天中 json_schema suppressed due to developer instruction requiring only translated text"
summary: 'Von der Community gepflegte OpenClaw-Plugins: durchsuchen, installieren und eigene einreichen'
title: Community-Plugins
x-i18n:
    generated_at: "2026-04-24T06:49:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

Community-Plugins sind Pakete von Drittanbietern, die OpenClaw um neue
Channels, Tools, Anbieter oder andere Fähigkeiten erweitern. Sie werden von der Community entwickelt und gepflegt,
auf [ClawHub](/de/tools/clawhub) oder npm veröffentlicht und
mit einem einzigen Befehl installierbar.

ClawHub ist die kanonische Oberfläche zur Entdeckung von Community-Plugins. Öffnen Sie keine
PRs nur für die Dokumentation, nur um Ihr Plugin hier zur Auffindbarkeit hinzuzufügen; veröffentlichen Sie es stattdessen auf
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw prüft zuerst ClawHub und greift automatisch auf npm zurück.

## Aufgelistete Plugins

### Apify

Scrapen Sie Daten von jeder Website mit mehr als 20.000 sofort einsatzbereiten Scrapers. Lassen Sie Ihren Agenten
Daten aus Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, E-Commerce-Websites und mehr extrahieren — einfach auf Anfrage.

- **npm:** `@apify/apify-openclaw-plugin`
- **Repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Unabhängige OpenClaw-Bridge für Gespräche mit dem Codex App Server. Binden Sie einen Chat an
einen Codex-Thread, sprechen Sie in Klartext damit und steuern Sie ihn mit chatnativen
Befehlen für Fortsetzen, Planung, Review, Modellauswahl, Compaction und mehr.

- **npm:** `openclaw-codex-app-server`
- **Repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integration von Enterprise-Robotern im Stream-Modus. Unterstützt Text-, Bild- und
Dateinachrichten über jeden DingTalk-Client.

- **npm:** `@largezhou/ddingtalk`
- **Repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Lossless-Context-Management-Plugin für OpenClaw. DAG-basierte Gesprächs-
Zusammenfassung mit inkrementeller Compaction — bewahrt vollständige Kontexttreue
bei gleichzeitiger Reduzierung des Token-Verbrauchs.

- **npm:** `@martian-engineering/lossless-claw`
- **Repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Offizielles Plugin, das Agent-Traces nach Opik exportiert. Überwachen Sie Agentenverhalten,
Kosten, Tokens, Fehler und mehr.

- **npm:** `@opik/opik-openclaw`
- **Repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Geben Sie Ihrem OpenClaw-Agenten einen Live2D-Avatar mit Echtzeit-Lippensynchronisation, Emotions-
Ausdrücken und Text-to-Speech. Enthält Creator-Tools für AI-Asset-Generierung
und One-Click-Deployment auf den Prometheus Marketplace. Derzeit in Alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **Repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Verbinden Sie OpenClaw über die QQ Bot API mit QQ. Unterstützt private Chats, Gruppen-
Erwähnungen, Channel-Nachrichten und Rich Media einschließlich Sprache, Bilder, Videos
und Dateien.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **Repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

WeCom-Channel-Plugin für OpenClaw vom Tencent-WeCom-Team. Unterstützt durch
persistente WebSocket-Verbindungen von WeCom Bot unterstützt es Direktnachrichten und Gruppenchats,
Streaming-Antworten, proaktives Messaging, Bild-/Dateiverarbeitung, Markdown-
Formatierung, integrierte Zugriffskontrolle sowie Skills für Dokumente/Meetings/Messaging.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **Repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Ihr Plugin einreichen

Wir begrüßen Community-Plugins, die nützlich, dokumentiert und sicher im Betrieb sind.

<Steps>
  <Step title="Auf ClawHub oder npm veröffentlichen">
    Ihr Plugin muss über `openclaw plugins install \<package-name\>` installierbar sein.
    Veröffentlichen Sie es auf [ClawHub](/de/tools/clawhub) (bevorzugt) oder npm.
    Den vollständigen Leitfaden finden Sie unter [Plugins erstellen](/de/plugins/building-plugins).

  </Step>

  <Step title="Auf GitHub hosten">
    Der Quellcode muss in einem öffentlichen Repository mit Einrichtungsdokumentation und Issue-
    Tracker liegen.

  </Step>

  <Step title="Docs-PRs nur für Änderungen an Quelldokumentation verwenden">
    Sie benötigen keinen Docs-PR, nur damit Ihr Plugin auffindbar ist. Veröffentlichen Sie es
    stattdessen auf ClawHub.

    Öffnen Sie einen Docs-PR nur dann, wenn die Quelldokumentation von OpenClaw tatsächlich
    inhaltlich geändert werden muss, etwa zur Korrektur von Installationshinweisen oder zum Hinzufügen repoübergreifender
    Dokumentation, die in die Hauptdokumentation gehört.

  </Step>
</Steps>

## Qualitätsmaßstab

| Anforderung                 | Warum                                             |
| --------------------------- | ------------------------------------------------- |
| Auf ClawHub oder npm veröffentlicht | Benutzer benötigen eine funktionierende Installation mit `openclaw plugins install` |
| Öffentliches GitHub-Repo    | Quellcodeprüfung, Issue-Tracking, Transparenz     |
| Einrichtungs- und Nutzungsdokumentation | Benutzer müssen wissen, wie sie es konfigurieren |
| Aktive Pflege               | Aktuelle Updates oder reaktionsschnelle Bearbeitung von Issues |

Low-Effort-Wrapper, unklare Eigentümerschaft oder nicht gepflegte Pakete können abgelehnt werden.

## Verwandt

- [Plugins installieren und konfigurieren](/de/tools/plugin) — wie jedes Plugin installiert wird
- [Plugins erstellen](/de/plugins/building-plugins) — ein eigenes Plugin erstellen
- [Plugin-Manifest](/de/plugins/manifest) — Manifest-Schema
