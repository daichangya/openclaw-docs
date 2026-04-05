---
read_when:
    - Você quer encontrar plugins de terceiros do OpenClaw
    - Você quer publicar ou listar seu próprio plugin
summary: 'Plugins comunitários do OpenClaw: navegar, instalar e enviar o seu próprio'
title: Plugins da Comunidade
x-i18n:
    generated_at: "2026-04-05T12:48:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01804563a63399fe564b0cd9b9aadef32e5211b63d8467fdbbd1f988200728de
    source_path: plugins/community.md
    workflow: 15
---

# Plugins da Comunidade

Plugins da comunidade são pacotes de terceiros que estendem o OpenClaw com novos
canais, ferramentas, providers ou outros recursos. Eles são desenvolvidos e mantidos
pela comunidade, publicados no [ClawHub](/tools/clawhub) ou no npm, e
podem ser instalados com um único comando.

O ClawHub é a superfície canônica de descoberta para plugins da comunidade. Não abra
PRs apenas de documentação só para adicionar seu plugin aqui por questões de descoberta; publique-o no
ClawHub em vez disso.

```bash
openclaw plugins install <package-name>
```

O OpenClaw verifica o ClawHub primeiro e recorre ao npm automaticamente.

## Plugins listados

### Codex App Server Bridge

Bridge independente do OpenClaw para conversas do Codex App Server. Vincule um chat a
uma thread do Codex, converse com ela em texto simples e controle-a com comandos
nativos de chat para retomar, planejar, revisar, selecionar modelo, compactação e muito mais.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Integração de robô corporativo usando o modo Stream. Oferece suporte a mensagens de texto, imagens e
arquivos por meio de qualquer cliente DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin de Gerenciamento de Contexto sem Perdas para OpenClaw. Resumização de conversas
baseada em DAG com compactação incremental — preserva a fidelidade total do contexto
enquanto reduz o uso de tokens.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin oficial que exporta rastreamentos de agentes para o Opik. Monitore o comportamento do agente,
custos, tokens, erros e muito mais.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

Conecte o OpenClaw ao QQ por meio da API QQ Bot. Oferece suporte a chats privados, menções em grupo,
mensagens de canal e mídia rica, incluindo voz, imagens, vídeos
e arquivos.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **repo:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin de canal WeCom para OpenClaw da equipe Tencent WeCom. Desenvolvido com
conexões persistentes WebSocket do WeCom Bot, oferece suporte a
mensagens diretas e chats em grupo, respostas em streaming, mensagens proativas, processamento de imagens/arquivos, formatação Markdown,
controle de acesso integrado e Skills de documentos/reuniões/mensagens.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Envie seu plugin

Aceitamos plugins da comunidade que sejam úteis, documentados e seguros para operar.

<Steps>
  <Step title="Publique no ClawHub ou no npm">
    Seu plugin deve poder ser instalado via `openclaw plugins install \<package-name\>`.
    Publique no [ClawHub](/tools/clawhub) (preferencial) ou no npm.
    Consulte [Building Plugins](/plugins/building-plugins) para o guia completo.

  </Step>

  <Step title="Hospede no GitHub">
    O código-fonte deve estar em um repositório público com documentação de configuração e um
    rastreador de issues.

  </Step>

  <Step title="Use PRs de documentação apenas para mudanças na documentação-fonte">
    Você não precisa de um PR de documentação apenas para tornar seu plugin detectável. Publique-o
    no ClawHub em vez disso.

    Abra um PR de documentação apenas quando a documentação-fonte do OpenClaw precisar de uma
    mudança real de conteúdo, como corrigir orientações de instalação ou adicionar
    documentação entre repositórios que pertença ao conjunto principal de documentação.

  </Step>
</Steps>

## Padrão de qualidade

| Requirement                 | Why                                           |
| --------------------------- | --------------------------------------------- |
| Publicado no ClawHub ou no npm | Os usuários precisam que `openclaw plugins install` funcione |
| Repositório público no GitHub  | Revisão do código-fonte, rastreamento de issues, transparência |
| Documentação de configuração e uso | Os usuários precisam saber como configurá-lo |
| Manutenção ativa           | Atualizações recentes ou tratamento responsivo de issues   |

Wrappers de baixo esforço, propriedade pouco clara ou pacotes sem manutenção podem ser recusados.

## Relacionados

- [Instalar e Configurar Plugins](/tools/plugin) — como instalar qualquer plugin
- [Building Plugins](/plugins/building-plugins) — crie o seu próprio
- [Manifesto do Plugin](/plugins/manifest) — esquema do manifesto
