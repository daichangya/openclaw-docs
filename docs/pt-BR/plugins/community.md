---
read_when:
    - Você quer encontrar plugins de terceiros do OpenClaw
    - Você quer publicar ou listar seu próprio plugin
summary: 'Plugins do OpenClaw mantidos pela comunidade: navegue, instale e envie o seu próprio'
title: Plugins da comunidade
x-i18n:
    generated_at: "2026-04-21T05:40:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59be629cc5e271cec459eaaaa587487a4225a12f721ec22a3fefa3f29ac057fa
    source_path: plugins/community.md
    workflow: 15
---

# Plugins da comunidade

Plugins da comunidade são pacotes de terceiros que estendem o OpenClaw com novos
canais, ferramentas, provedores ou outros recursos. Eles são criados e mantidos
pela comunidade, publicados no [ClawHub](/pt-BR/tools/clawhub) ou no npm, e
instaláveis com um único comando.

ClawHub é a superfície canônica de descoberta para plugins da comunidade. Não abra
PRs somente de documentação apenas para adicionar seu plugin aqui para fins de descobribilidade; publique-o no
ClawHub.

```bash
openclaw plugins install <package-name>
```

O OpenClaw verifica o ClawHub primeiro e recorre ao npm automaticamente.

## Plugins listados

### Apify

Extraia dados de qualquer site com mais de 20.000 scrapers prontos. Deixe seu agente
extrair dados do Instagram, Facebook, TikTok, YouTube, Google Maps, Google
Search, sites de e-commerce e muito mais — apenas pedindo.

- **npm:** `@apify/apify-openclaw-plugin`
- **repo:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

Bridge independente do OpenClaw para conversas do Codex App Server. Vincule um chat a
uma thread do Codex, converse com ela em texto simples e controle-a com comandos nativos do chat para retomar, planejamento, revisão, seleção de modelo, Compaction e mais.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integração de robô corporativo usando o modo Stream. Oferece suporte a mensagens de texto, imagens e
arquivos por qualquer cliente DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin de Lossless Context Management para OpenClaw. Sumarização de conversa
baseada em DAG com Compaction incremental — preserva a fidelidade total do contexto
enquanto reduz o uso de tokens.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin oficial que exporta rastreamentos de agente para o Opik. Monitore o comportamento do agente,
custos, tokens, erros e mais.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

Dê ao seu agente OpenClaw um avatar Live2D com sincronização labial em tempo real, expressões
emocionais e conversão de texto em fala. Inclui ferramentas de criação para geração de ativos com IA
e implantação com um clique no Prometheus Marketplace. Atualmente em alfa.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **repo:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

Conecte o OpenClaw ao QQ por meio da API do QQ Bot. Oferece suporte a chats privados, menções em
grupo, mensagens de canal e mídia avançada, incluindo voz, imagens, vídeos
e arquivos.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom para OpenClaw pela equipe Tencent WeCom. Impulsionado por
conexões persistentes WebSocket do WeCom Bot, oferece suporte a mensagens diretas e chats em
grupo, respostas com streaming, mensagens proativas, processamento de imagem/arquivo, formatação
Markdown, controle de acesso integrado e Skills de documentos/reuniões/mensagens.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Envie seu plugin

Recebemos bem plugins da comunidade que sejam úteis, documentados e seguros de operar.

<Steps>
  <Step title="Publique no ClawHub ou no npm">
    Seu plugin deve ser instalável via `openclaw plugins install \<package-name\>`.
    Publique no [ClawHub](/pt-BR/tools/clawhub) (preferencial) ou no npm.
    Consulte [Building Plugins](/pt-BR/plugins/building-plugins) para o guia completo.

  </Step>

  <Step title="Hospede no GitHub">
    O código-fonte deve estar em um repositório público com documentação de configuração e
    rastreador de issues.

  </Step>

  <Step title="Use PRs de documentação apenas para alterações na documentação-fonte">
    Você não precisa de um PR de documentação apenas para tornar seu plugin descobrível. Publique-o
    no ClawHub em vez disso.

    Abra um PR de documentação apenas quando a documentação-fonte do OpenClaw precisar de uma alteração
    real de conteúdo, como corrigir orientações de instalação ou adicionar documentação
    entre repositórios que pertence ao conjunto principal de documentação.

  </Step>
</Steps>

## Padrão de qualidade

| Requirement                 | Why                                           |
| --------------------------- | --------------------------------------------- |
| Publicado no ClawHub ou npm | Os usuários precisam que `openclaw plugins install` funcione |
| Repositório público no GitHub | Revisão do código-fonte, rastreamento de issues, transparência |
| Documentação de configuração e uso | Os usuários precisam saber como configurá-lo |
| Manutenção ativa            | Atualizações recentes ou tratamento responsivo de issues |

Wrappers de baixo esforço, propriedade pouco clara ou pacotes sem manutenção podem ser recusados.

## Relacionado

- [Install and Configure Plugins](/pt-BR/tools/plugin) — como instalar qualquer plugin
- [Building Plugins](/pt-BR/plugins/building-plugins) — crie o seu próprio
- [Plugin Manifest](/pt-BR/plugins/manifest) — schema do manifesto
