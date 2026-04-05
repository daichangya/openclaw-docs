---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por que uma ferramenta está bloqueada: runtime de sandbox, política de permissão/bloqueio de ferramentas e gates de exec elevado'
title: Sandbox vs política de ferramentas vs elevado
x-i18n:
    generated_at: "2026-04-05T12:42:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d5ddc1dbf02b89f18d46e5473ff0a29b8a984426fe2db7270c170f2de0cdeac
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs política de ferramentas vs elevado

O OpenClaw tem três controles relacionados (mas diferentes):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **onde as ferramentas são executadas** (Docker vs host).
2. **Política de ferramentas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quais ferramentas estão disponíveis/permitidas**.
3. **Elevado** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) é uma **válvula de escape apenas para exec** para executar fora do sandbox quando você está em sandbox (`gateway` por padrão, ou `node` quando o destino de exec está configurado como `node`).

## Depuração rápida

Use o inspetor para ver o que o OpenClaw _realmente_ está fazendo:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Ele imprime:

- modo/escopo/acesso ao workspace efetivos do sandbox
- se a sessão está atualmente em sandbox (main vs não main)
- allow/deny efetivo de ferramentas do sandbox (e se veio de agente/global/padrão)
- gates elevados e caminhos de chave de configuração para correção

## Sandbox: onde as ferramentas são executadas

O sandboxing é controlado por `agents.defaults.sandbox.mode`:

- `"off"`: tudo é executado no host.
- `"non-main"`: apenas sessões não main usam sandbox (uma “surpresa” comum em grupos/canais).
- `"all"`: tudo usa sandbox.

Consulte [Sandboxing](/gateway/sandboxing) para ver a matriz completa (escopo, mounts de workspace, imagens).

### Bind mounts (verificação rápida de segurança)

- `docker.binds` _atravessa_ o sistema de arquivos do sandbox: tudo o que você montar fica visível dentro do contêiner com o modo definido (`:ro` ou `:rw`).
- O padrão é leitura e gravação se você omitir o modo; prefira `:ro` para código-fonte/segredos.
- `scope: "shared"` ignora binds por agente (somente binds globais se aplicam).
- O OpenClaw valida as origens de bind duas vezes: primeiro no caminho de origem normalizado, depois novamente após resolver pelo ancestral existente mais profundo. Escapes por pai com symlink não contornam verificações de caminho bloqueado ou raiz permitida.
- Caminhos folha inexistentes ainda são verificados com segurança. Se `/workspace/alias-out/new-file` resolver por um pai com symlink para um caminho bloqueado ou fora das raízes permitidas configuradas, o bind será rejeitado.
- Vincular `/var/run/docker.sock` efetivamente entrega o controle do host ao sandbox; faça isso apenas intencionalmente.
- O acesso ao workspace (`workspaceAccess: "ro"`/`"rw"`) é independente dos modos de bind.

## Política de ferramentas: quais ferramentas existem/podem ser chamadas

Duas camadas importam:

- **Perfil de ferramentas**: `tools.profile` e `agents.list[].tools.profile` (allowlist de base)
- **Perfil de ferramentas por provedor**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Política global/por agente de ferramentas**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de ferramentas por provedor**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de ferramentas do sandbox** (aplica-se apenas quando há sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regras gerais:

- `deny` sempre vence.
- Se `allow` não estiver vazio, todo o resto é tratado como bloqueado.
- A política de ferramentas é a barreira rígida: `/exec` não pode substituir uma ferramenta `exec` negada.
- `/exec` apenas altera padrões de sessão para remetentes autorizados; ele não concede acesso a ferramentas.
  Chaves de ferramentas por provedor aceitam `provider` (por exemplo `google-antigravity`) ou `provider/model` (por exemplo `openai/gpt-5.4`).

### Grupos de ferramentas (atalhos)

Políticas de ferramentas (globais, por agente, sandbox) oferecem suporte a entradas `group:*` que se expandem em várias ferramentas:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Grupos disponíveis:

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` é aceito como
  alias para `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `tts`
- `group:openclaw`: todas as ferramentas integradas do OpenClaw (exclui plugins de provedor)

## Elevado: "executar no host" apenas para exec

O modo elevado **não** concede ferramentas extras; ele afeta apenas `exec`.

- Se você estiver em sandbox, `/elevated on` (ou `exec` com `elevated: true`) executa fora do sandbox (aprovações ainda podem se aplicar).
- Use `/elevated full` para pular aprovações de exec para a sessão.
- Se você já estiver executando diretamente, o modo elevado é efetivamente um no-op (ainda controlado por gates).
- O modo elevado **não** é delimitado por skill e **não** substitui allow/deny de ferramentas.
- O modo elevado não concede substituições arbitrárias entre hosts a partir de `host=auto`; ele segue as regras normais de destino de exec e só preserva `node` quando o destino configurado/da sessão já é `node`.
- `/exec` é separado do modo elevado. Ele apenas ajusta padrões de exec por sessão para remetentes autorizados.

Gates:

- Ativação: `tools.elevated.enabled` (e opcionalmente `agents.list[].tools.elevated.enabled`)
- Allowlists de remetente: `tools.elevated.allowFrom.<provider>` (e opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulte [Modo elevado](/tools/elevated).

## Correções comuns para "prisão do sandbox"

### "Ferramenta X bloqueada pela política de ferramentas do sandbox"

Chaves de correção (escolha uma):

- Desative o sandbox: `agents.defaults.sandbox.mode=off` (ou por agente `agents.list[].sandbox.mode=off`)
- Permita a ferramenta dentro do sandbox:
  - remova-a de `tools.sandbox.tools.deny` (ou por agente `agents.list[].tools.sandbox.tools.deny`)
  - ou adicione-a a `tools.sandbox.tools.allow` (ou ao allow por agente)

### "Achei que isso fosse main, por que está em sandbox?"

No modo `"non-main"`, chaves de grupo/canal _não_ são main. Use a chave de sessão main (mostrada por `sandbox explain`) ou mude o modo para `"off"`.

## Consulte também

- [Sandboxing](/gateway/sandboxing) -- referência completa de sandbox (modos, escopos, backends, imagens)
- [Sandbox e ferramentas multiagente](/tools/multi-agent-sandbox-tools) -- substituições por agente e precedência
- [Modo elevado](/tools/elevated)
