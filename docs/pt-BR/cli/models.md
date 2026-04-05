---
read_when:
    - Você quer alterar os modelos padrão ou ver o status de autenticação do provider
    - Você quer examinar modelos/providers disponíveis e depurar perfis de autenticação
summary: Referência da CLI para `openclaw models` (status/list/set/scan, aliases, fallbacks, auth)
title: models
x-i18n:
    generated_at: "2026-04-05T12:38:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ba33181d49b6bbf3b5d5fa413aa6b388c9f29fb9d4952055d68c79f7bcfea0
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Descoberta, varredura e configuração de modelos (modelo padrão, fallbacks, perfis de autenticação).

Relacionado:

- Providers + modelos: [Models](/providers/models)
- Configuração de autenticação do provider: [Getting started](/pt-BR/start/getting-started)

## Comandos comuns

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` mostra os padrões/fallbacks resolvidos mais uma visão geral de autenticação.
Quando snapshots de uso do provider estão disponíveis, a seção de status de OAuth/API key inclui
janelas de uso do provider e snapshots de cota.
Providers atuais com janela de uso: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi e z.ai. A autenticação de uso vem de hooks específicos do provider
quando disponíveis; caso contrário, o OpenClaw recorre à correspondência de
credenciais OAuth/API key de perfis de autenticação, env ou config.
Adicione `--probe` para executar probes de autenticação ao vivo em cada perfil de provider configurado.
Os probes são requisições reais (podem consumir tokens e acionar rate limits).
Use `--agent <id>` para inspecionar o estado de modelo/autenticação de um agente configurado. Quando omitido,
o comando usa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` se estiver definido; caso contrário, usa o
agente padrão configurado.
Linhas de probe podem vir de perfis de autenticação, credenciais de env ou `models.json`.

Observações:

- `models set <model-or-alias>` aceita `provider/model` ou um alias.
- Referências de modelo são analisadas dividindo na **primeira** `/`. Se o ID do modelo incluir `/` (estilo OpenRouter), inclua o prefixo do provider (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provider, o OpenClaw resolve a entrada primeiro como um alias, depois
  como uma correspondência única de provider configurado para esse id de modelo exato, e só então
  recorre ao provider padrão configurado com um aviso de descontinuação.
  Se esse provider não expuser mais o modelo padrão configurado, o OpenClaw
  recorre ao primeiro provider/modelo configurado em vez de exibir um
  padrão obsoleto de provider removido.
- `models status` pode mostrar `marker(<value>)` na saída de autenticação para placeholders não secretos (por exemplo `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) em vez de mascará-los como segredos.

### `models status`

Opções:

- `--json`
- `--plain`
- `--check` (saída 1=expirado/ausente, 2=expirando)
- `--probe` (probe ao vivo dos perfis de autenticação configurados)
- `--probe-provider <name>` (executa probe em um provider)
- `--probe-profile <id>` (repetido ou IDs de perfil separados por vírgula)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id do agente configurado; substitui `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Categorias de status do probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Casos de detalhe/código de motivo esperados no probe:

- `excluded_by_auth_order`: existe um perfil armazenado, mas
  `auth.order.<provider>` explícito o omitiu, então o probe reporta a exclusão em vez de
  tentar usá-lo.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  o perfil está presente, mas não é elegível/resolúvel.
- `no_model`: existe autenticação do provider, mas o OpenClaw não conseguiu resolver
  um candidato de modelo que possa ser usado para probe nesse provider.

## Aliases + fallbacks

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Perfis de autenticação

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` é o assistente interativo de autenticação. Ele pode iniciar um fluxo de autenticação do provider
(OAuth/API key) ou orientar você no colar manual de token, dependendo do
provider que você escolher.

`models auth login` executa o fluxo de autenticação de um plugin de provider (OAuth/API key). Use
`openclaw plugins list` para ver quais providers estão instalados.

Exemplos:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
openclaw models auth login --provider openai-codex --set-default
```

Observações:

- `login --provider anthropic --method cli --set-default` reutiliza um login local do Claude
  CLI e reescreve o caminho principal do modelo padrão Anthropic para uma referência
  canônica `claude-cli/claude-*`.
- `setup-token` e `paste-token` continuam sendo comandos genéricos de token para providers
  que expõem métodos de autenticação por token.
- `setup-token` exige um TTY interativo e executa o método de autenticação por token do provider
  (usando por padrão o método `setup-token` desse provider quando ele expõe
  um).
- `paste-token` aceita uma string de token gerada em outro lugar ou por automação.
- `paste-token` exige `--provider`, solicita o valor do token e o grava
  no id de perfil padrão `<provider>:manual`, a menos que você passe
  `--profile-id`.
- `paste-token --expires-in <duration>` armazena um vencimento absoluto do token a partir de uma
  duração relativa como `365d` ou `12h`.
- Observação de cobrança da Anthropic: acreditamos que o fallback do Claude Code CLI provavelmente é permitido para automação local gerenciada pelo usuário com base na documentação pública da CLI da Anthropic. Dito isso, a política da Anthropic para harnesses de terceiros cria ambiguidade suficiente em torno do uso com assinatura em produtos externos, de modo que não o recomendamos para produção. A Anthropic também notificou usuários do OpenClaw em **4 de abril de 2026 às 12:00 PM PT / 8:00 PM BST** que o caminho **OpenClaw** com login do Claude conta como uso de harness de terceiros e exige **Extra Usage**, cobrado separadamente da assinatura.
- `setup-token` / `paste-token` da Anthropic estão disponíveis novamente como um caminho legado/manual do OpenClaw. Use-os esperando que a Anthropic informou aos usuários do OpenClaw que esse caminho exige **Extra Usage**.
