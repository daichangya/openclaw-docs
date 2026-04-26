---
read_when:
    - Vuoi trovare Plugin OpenClaw di terze parti
    - Vuoi pubblicare o elencare il tuo Plugin
summary: 'Plugin OpenClaw mantenuti dalla community: esplorare, installare e inviare i propri'
title: Plugin della community
x-i18n:
    generated_at: "2026-04-26T11:34:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

I Plugin della community sono pacchetti di terze parti che estendono OpenClaw con nuovi
canali, strumenti, provider o altre capacità. Sono sviluppati e mantenuti
dalla community, pubblicati su [ClawHub](/it/tools/clawhub) o npm e
installabili con un solo comando.

ClawHub è la superficie di discovery canonica per i Plugin della community. Non aprire
PR solo-documentazione solo per aggiungere qui il tuo Plugin a fini di discoverability; pubblicalo invece su
ClawHub.

```bash
openclaw plugins install <package-name>
```

OpenClaw controlla prima ClawHub e poi ripiega automaticamente su npm.

## Plugin elencati

### Apify

Esegui scraping di dati da qualsiasi sito web con oltre 20.000 scraper pronti all'uso. Consenti al tuo agente di
estrarre dati da Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, siti e-commerce e altro ancora — semplicemente chiedendo.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge OpenClaw indipendente per conversazioni Codex App Server. Associa una chat a
un thread Codex, parlaci in testo semplice e controllalo con comandi nativi della chat per
ripresa, pianificazione, review, selezione del modello, Compaction e altro.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integrazione robot aziendale tramite modalità Stream. Supporta testo, immagini e
messaggi file tramite qualsiasi client DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Lossless Context Management per OpenClaw. Riepilogo delle conversazioni
basato su DAG con Compaction incrementale — preserva la piena fedeltà del contesto
riducendo al tempo stesso l'uso di token.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin ufficiale che esporta le tracce dell'agente in Opik. Monitora il comportamento dell'agente,
costi, token, errori e altro.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Dai al tuo agente OpenClaw un avatar Live2D con sincronizzazione labiale in tempo reale,
espressioni emotive e text-to-speech. Include strumenti per creatori per la generazione di asset AI
e distribuzione con un clic nel Prometheus Marketplace. Attualmente in alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Collega OpenClaw a QQ tramite l'API QQ Bot. Supporta chat private, menzioni di gruppo,
messaggi di canale e rich media inclusi voce, immagini, video
e file.

Le versioni correnti di OpenClaw includono QQ Bot nel bundle. Usa la configurazione inclusa nel bundle in
[QQ Bot](/it/channels/qqbot) per le installazioni normali; installa questo Plugin esterno solo
quando vuoi intenzionalmente il pacchetto standalone mantenuto da Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin canale WeCom per OpenClaw del team Tencent WeCom. Basato su
connessioni persistenti WebSocket WeCom Bot, supporta messaggi diretti e chat di gruppo,
risposte in streaming, messaggistica proattiva, elaborazione di immagini/file, formattazione Markdown,
controllo degli accessi integrato e skills per documenti/riunioni/messaggistica.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Invia il tuo Plugin

Accogliamo con favore i Plugin della community che siano utili, documentati e sicuri da usare.

<Steps>
  <Step title="Pubblica su ClawHub o npm">
    Il tuo Plugin deve essere installabile tramite `openclaw plugins install \<package-name\>`.
    Pubblicalo su [ClawHub](/it/tools/clawhub) (preferito) o npm.
    Vedi [Creare Plugin](/it/plugins/building-plugins) per la guida completa.

  </Step>

  <Step title="Ospita su GitHub">
    Il codice sorgente deve trovarsi in un repository pubblico con documentazione di configurazione e un
    issue tracker.

  </Step>

  <Step title="Usa PR di documentazione solo per cambiamenti alla documentazione sorgente">
    Non ti serve una PR di documentazione solo per rendere il tuo Plugin individuabile. Pubblicalo invece
    su ClawHub.

    Apri una PR di documentazione solo quando la documentazione sorgente di OpenClaw richiede un vero
    cambiamento di contenuto, ad esempio correggere le istruzioni di installazione o aggiungere
    documentazione cross-repo che appartiene al set principale di documentazione.

  </Step>
</Steps>

## Standard di qualità

| Requisito                  | Perché                                         |
| -------------------------- | ---------------------------------------------- |
| Pubblicato su ClawHub o npm | Gli utenti devono poter usare `openclaw plugins install` |
| Repository GitHub pubblico | Revisione del sorgente, tracciamento issue, trasparenza |
| Documentazione di setup e utilizzo | Gli utenti devono sapere come configurarlo |
| Manutenzione attiva        | Aggiornamenti recenti o gestione reattiva delle issue |

Wrapper di bassa qualità, proprietà non chiara o pacchetti non mantenuti possono essere rifiutati.

## Correlati

- [Installare e configurare Plugin](/it/tools/plugin) — come installare qualsiasi Plugin
- [Creare Plugin](/it/plugins/building-plugins) — crea il tuo
- [Manifest del Plugin](/it/plugins/manifest) — schema del manifest
