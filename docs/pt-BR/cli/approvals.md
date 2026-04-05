---
read_when:
    - Você quer editar aprovações de exec pela CLI
    - Você precisa gerenciar allowlists em hosts de gateway ou node
summary: Referência da CLI para `openclaw approvals` (aprovações de exec para hosts de gateway ou node)
title: approvals
x-i18n:
    generated_at: "2026-04-05T12:37:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2532bfd3e6e6ce43c96a2807df2dd00cb7b4320b77a7dfd09bee0531da610e
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Gerencie aprovações de exec para o **host local**, **host do gateway** ou um **host de node**.
Por padrão, os comandos têm como alvo o arquivo local de aprovações em disco. Use `--gateway` para ter como alvo o gateway, ou `--node` para ter como alvo um node específico.

Alias: `openclaw exec-approvals`

Relacionado:

- Aprovações de exec: [Exec approvals](/tools/exec-approvals)
- Nodes: [Nodes](/nodes)

## Comandos comuns

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` agora mostra a política efetiva de exec para alvos locais, de gateway e de node:

- política `tools.exec` solicitada
- política do arquivo de aprovações do host
- resultado efetivo após a aplicação das regras de precedência

A precedência é intencional:

- o arquivo de aprovações do host é a fonte da verdade aplicável
- a política `tools.exec` solicitada pode restringir ou ampliar a intenção, mas o resultado efetivo ainda é derivado das regras do host
- `--node` combina o arquivo de aprovações do host do node com a política `tools.exec` do gateway, porque ambos ainda se aplicam em runtime
- se a configuração do gateway não estiver disponível, a CLI usa o snapshot de aprovações do node como fallback e informa que a política final de runtime não pôde ser calculada

## Substituir aprovações a partir de um arquivo

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` aceita JSON5, não apenas JSON estrito. Use `--file` ou `--stdin`, não ambos.

## Exemplo de "nunca solicitar" / YOLO

Para um host que nunca deve parar em aprovações de exec, defina os padrões de aprovações do host como `full` + `off`:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Variante de node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Isso altera apenas o **arquivo de aprovações do host**. Para manter a política solicitada do OpenClaw alinhada, defina também:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Por que `tools.exec.host=gateway` neste exemplo:

- `host=auto` ainda significa "sandbox quando disponível, caso contrário gateway".
- YOLO é sobre aprovações, não roteamento.
- Se você quiser exec no host mesmo quando um sandbox estiver configurado, torne a escolha do host explícita com `gateway` ou `/exec host=gateway`.

Isso corresponde ao comportamento atual de YOLO com padrão de host. Restrinja mais se quiser aprovações.

## Helpers de allowlist

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Opções comuns

`get`, `set` e `allowlist add|remove` todos oferecem suporte a:

- `--node <id|name|ip>`
- `--gateway`
- opções compartilhadas de RPC de node: `--url`, `--token`, `--timeout`, `--json`

Observações sobre alvos:

- sem flags de alvo significa o arquivo local de aprovações em disco
- `--gateway` tem como alvo o arquivo de aprovações do host do gateway
- `--node` tem como alvo um host de node após resolver id, nome, IP ou prefixo de id

`allowlist add|remove` também oferece suporte a:

- `--agent <id>` (o padrão é `*`)

## Observações

- `--node` usa o mesmo resolvedor que `openclaw nodes` (id, nome, ip ou prefixo de id).
- `--agent` usa `"*"` por padrão, o que se aplica a todos os agentes.
- O host de node precisa anunciar `system.execApprovals.get/set` (app macOS ou host de node headless).
- Os arquivos de aprovações são armazenados por host em `~/.openclaw/exec-approvals.json`.
