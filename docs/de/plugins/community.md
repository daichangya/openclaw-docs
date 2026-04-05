---
read_when:
    - Sie möchten OpenClaw-Plugins von Drittanbietern finden
    - Sie möchten Ihr eigenes Plugin veröffentlichen oder listen lassen
summary: 'Von der Community gepflegte OpenClaw-Plugins: durchsuchen, installieren und eigene einreichen'
title: Community-Plugins
x-i18n:
    generated_at: "2026-04-05T12:50:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01804563a63399fe564b0cd9b9aadef32e5211b63d8467fdbbd1f988200728de
    source_path: plugins/community.md
    workflow: 15
---

# Community-Plugins

Community-Plugins sind Pakete von Drittanbietern, die OpenClaw um neue
Kanäle, Tools, Provider oder andere Funktionen erweitern. Sie werden von der
Community entwickelt und gepflegt, auf [ClawHub](/tools/clawhub) oder npm veröffentlicht und
lassen sich mit einem einzigen Befehl installieren.

ClawHub ist die maßgebliche Oberfläche zur Entdeckung von Community-Plugins. Öffnen Sie keine
reinen Dokumentations-PRs, nur um Ihr Plugin hier zur besseren Auffindbarkeit hinzuzufügen; veröffentlichen Sie es
stattdessen auf ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw prüft zuerst ClawHub und greift dann automatisch auf npm zurück.

## Gelistete Plugins

### Codex App Server Bridge

Unabhängige OpenClaw-Bridge für Codex App Server-Unterhaltungen. Binden Sie einen Chat an
einen Codex-Thread, sprechen Sie per Klartext damit und steuern Sie ihn mit chatnativen
Befehlen für Resume, Planung, Review, Modellauswahl, Kompaktierung und mehr.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Robot-Integration für Unternehmen mit dem Stream-Modus. Unterstützt Text-, Bild- und
Dateinachrichten über jeden DingTalk-Client.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Lossless Context Management-Plugin für OpenClaw. DAG-basierte
Konversationszusammenfassung mit inkrementeller Kompaktierung — bewahrt die vollständige Kontexttreue
bei reduziertem Token-Verbrauch.

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

### QQbot

Verbinden Sie OpenClaw über die QQ Bot API mit QQ. Unterstützt private Chats, Gruppen-
Erwähnungen, Kanalnachrichten und Rich Media einschließlich Sprache, Bildern, Videos
und Dateien.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

WeCom-Kanal-Plugin für OpenClaw vom Tencent-WeCom-Team. Basierend auf
persistenten WeCom Bot WebSocket-Verbindungen unterstützt es Direktnachrichten und Gruppen-
Chats, Streaming-Antworten, proaktive Nachrichten, Bild-/Dateiverarbeitung, Markdown-
Formatierung, integrierte Zugriffssteuerung sowie Skills für Dokumente, Meetings und Messaging.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Reichen Sie Ihr Plugin ein

Wir begrüßen Community-Plugins, die nützlich, dokumentiert und sicher im Betrieb sind.

<Steps>
  <Step title="Auf ClawHub oder npm veröffentlichen">
    Ihr Plugin muss über `openclaw plugins install \<package-name\>` installierbar sein.
    Veröffentlichen Sie es auf [ClawHub](/tools/clawhub) (bevorzugt) oder auf npm.
    Die vollständige Anleitung finden Sie unter [Building Plugins](/plugins/building-plugins).

  </Step>

  <Step title="Auf GitHub hosten">
    Der Quellcode muss in einem öffentlichen Repository mit Einrichtungsdokumentation und
    Issue-Tracker liegen.

  </Step>

  <Step title="Docs-PRs nur für Änderungen an der Quelldokumentation verwenden">
    Sie benötigen keinen Docs-PR, nur damit Ihr Plugin auffindbar wird. Veröffentlichen Sie es
    stattdessen auf ClawHub.

    Öffnen Sie einen Docs-PR nur dann, wenn die Quelldokumentation von OpenClaw tatsächlich inhaltlich
    geändert werden muss, etwa um Installationshinweise zu korrigieren oder repositoryübergreifende
    Dokumentation hinzuzufügen, die in den Hauptdokumentsatz gehört.

  </Step>
</Steps>

## Qualitätsmaßstab

| Anforderung                 | Warum                                         |
| --------------------------- | --------------------------------------------- |
| Auf ClawHub oder npm veröffentlicht | Benutzer benötigen ein funktionierendes `openclaw plugins install` |
| Öffentliches GitHub-Repo    | Quellcodeprüfung, Issue-Tracking, Transparenz |
| Einrichtungs- und Nutzungsdokumentation | Benutzer müssen wissen, wie sie es konfigurieren |
| Aktive Pflege               | Aktuelle Updates oder reaktionsschnelle Bearbeitung von Issues |

Wrapper mit geringem Aufwand, unklare Verantwortlichkeiten oder nicht gepflegte Pakete können abgelehnt werden.

## Verwandt

- [Plugins installieren und konfigurieren](/tools/plugin) — So installieren Sie jedes Plugin
- [Building Plugins](/plugins/building-plugins) — Erstellen Sie Ihr eigenes
- [Plugin-Manifest](/plugins/manifest) — Manifest-Schema
