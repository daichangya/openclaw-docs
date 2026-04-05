---
read_when:
    - Você precisa fazer login em sites para automação de navegador
    - Você quer publicar atualizações no X/Twitter
summary: Logins manuais para automação de navegador + postagem no X/Twitter
title: Login no Navegador
x-i18n:
    generated_at: "2026-04-05T12:53:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: de40685c70f1c141dba98e6dadc2c6f3a2b3b6d98c89ef8404144c9d178bb763
    source_path: tools/browser-login.md
    workflow: 15
---

# Login no navegador + postagem no X/Twitter

## Login manual (recomendado)

Quando um site exigir login, **entre manualmente** no perfil de navegador do **host** (o navegador openclaw).

**Não** forneça suas credenciais ao modelo. Logins automatizados frequentemente acionam defesas anti-bot e podem bloquear a conta.

Volte para a documentação principal do navegador: [Browser](/tools/browser).

## Qual perfil do Chrome é usado?

O OpenClaw controla um **perfil dedicado do Chrome** (chamado `openclaw`, com UI em tom alaranjado). Ele é separado do seu perfil de navegador do dia a dia.

Para chamadas de ferramenta de navegador do agente:

- Escolha padrão: o agente deve usar seu navegador `openclaw` isolado.
- Use `profile="user"` somente quando sessões já autenticadas forem importantes e o usuário estiver no computador para clicar/aprovar qualquer prompt de conexão.
- Se você tiver vários perfis de navegador do usuário, especifique o perfil explicitamente em vez de adivinhar.

Duas maneiras fáceis de acessá-lo:

1. **Peça ao agente para abrir o navegador** e depois faça login você mesmo.
2. **Abra-o via CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Se você tiver vários perfis, passe `--browser-profile <name>` (o padrão é `openclaw`).

## X/Twitter: fluxo recomendado

- **Ler/pesquisar/threads:** use o navegador do **host** (login manual).
- **Publicar atualizações:** use o navegador do **host** (login manual).

## Sandboxing + acesso ao navegador do host

Sessões de navegador em sandbox têm **maior probabilidade** de acionar detecção de bot. Para X/Twitter (e outros sites mais rigorosos), prefira o navegador do **host**.

Se o agente estiver em sandbox, a ferramenta de navegador usa por padrão o sandbox. Para permitir controle do host:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Depois, direcione para o navegador do host:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Ou desative o sandboxing para o agente que publica atualizações.
