---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por que uma ferramenta está bloqueada: runtime em sandbox, política de permissão/bloqueio de ferramentas e barreiras de exec elevado'
title: Sandbox vs. política de ferramentas vs. elevado
x-i18n:
    generated_at: "2026-04-21T05:37:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox vs. política de ferramentas vs. elevado

O OpenClaw tem três controles relacionados (mas diferentes):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **onde as ferramentas são executadas** (backend de sandbox vs host).
2. **Política de ferramentas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **quais ferramentas estão disponíveis/autorizadas**.
3. **Elevado** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) é uma **rota de escape apenas para exec** para executar fora do sandbox quando você está em sandbox (`gateway` por padrão, ou `node` quando o destino de exec está configurado como `node`).

## Depuração rápida

Use o inspetor para ver o que o OpenClaw está _realmente_ fazendo:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Ele imprime:

- modo/escopo/acesso ao workspace efetivos do sandbox
- se a sessão está atualmente em sandbox (main vs non-main)
- permissão/bloqueio efetivos de ferramentas no sandbox (e se veio de agent/global/default)
- barreiras de elevado e caminhos de chave para correção

## Sandbox: onde as ferramentas são executadas

O sandbox é controlado por `agents.defaults.sandbox.mode`:

- `"off"`: tudo é executado no host.
- `"non-main"`: apenas sessões non-main ficam em sandbox (uma “surpresa” comum para grupos/canais).
- `"all"`: tudo fica em sandbox.

Veja [Sandboxing](/pt-BR/gateway/sandboxing) para a matriz completa (escopo, montagens de workspace, imagens).

### Bind mounts (verificação rápida de segurança)

- `docker.binds` _atravessa_ o sistema de arquivos do sandbox: tudo o que você montar ficará visível dentro do contêiner com o modo que você definir (`:ro` ou `:rw`).
- O padrão é leitura e escrita se você omitir o modo; prefira `:ro` para código-fonte/segredos.
- `scope: "shared"` ignora bind mounts por agente (apenas bind mounts globais se aplicam).
- O OpenClaw valida fontes de bind duas vezes: primeiro no caminho de origem normalizado, depois novamente após resolver pelo ancestral existente mais profundo. Escapes por pai com symlink não burlam verificações de caminho bloqueado ou raiz permitida.
- Caminhos-folha inexistentes ainda são verificados com segurança. Se `/workspace/alias-out/new-file` resolver por um pai com symlink para um caminho bloqueado ou para fora das raízes permitidas configuradas, o bind será rejeitado.
- Vincular `/var/run/docker.sock` efetivamente entrega o controle do host ao sandbox; faça isso apenas intencionalmente.
- O acesso ao workspace (`workspaceAccess: "ro"`/`"rw"`) é independente dos modos de bind.

## Política de ferramentas: quais ferramentas existem/podem ser chamadas

Duas camadas importam:

- **Perfil de ferramentas**: `tools.profile` e `agents.list[].tools.profile` (lista-base de permissões)
- **Perfil de ferramentas por provedor**: `tools.byProvider[provider].profile` e `agents.list[].tools.byProvider[provider].profile`
- **Política global/por agente de ferramentas**: `tools.allow`/`tools.deny` e `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de ferramentas por provedor**: `tools.byProvider[provider].allow/deny` e `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de ferramentas no sandbox** (só se aplica quando está em sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` e `agents.list[].tools.sandbox.tools.*`

Regras práticas:

- `deny` sempre vence.
- Se `allow` não estiver vazio, todo o resto é tratado como bloqueado.
- A política de ferramentas é a barreira rígida: `/exec` não pode sobrescrever uma ferramenta `exec` negada.
- `/exec` só altera padrões de sessão para remetentes autorizados; não concede acesso a ferramentas.
  Chaves de ferramentas por provedor aceitam `provider` (por exemplo, `google-antigravity`) ou `provider/model` (por exemplo, `openai/gpt-5.4`).

### Grupos de ferramentas (atalhos)

As políticas de ferramentas (globais, por agente, no sandbox) suportam entradas `group:*` que se expandem para múltiplas ferramentas:

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
  alias de `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: todas as ferramentas integradas do OpenClaw (exclui plugins de provedor)

## Elevado: exec-only "executar no host"

Elevado **não** concede ferramentas extras; ele afeta apenas `exec`.

- Se você estiver em sandbox, `/elevated on` (ou `exec` com `elevated: true`) executa fora do sandbox (aprovações ainda podem se aplicar).
- Use `/elevated full` para ignorar aprovações de exec na sessão.
- Se você já estiver executando diretamente, elevado é efetivamente um no-op (ainda assim com barreiras).
- Elevado **não** é delimitado por Skills e **não** sobrescreve `allow`/`deny` de ferramentas.
- Elevado não concede sobrescritas arbitrárias entre hosts a partir de `host=auto`; ele segue as regras normais de destino de exec e só preserva `node` quando o destino configurado/da sessão já é `node`.
- `/exec` é separado de elevado. Ele apenas ajusta padrões de exec por sessão para remetentes autorizados.

Barreiras:

- Habilitação: `tools.elevated.enabled` (e opcionalmente `agents.list[].tools.elevated.enabled`)
- Listas de permissão de remetente: `tools.elevated.allowFrom.<provider>` (e opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Veja [Elevated Mode](/pt-BR/tools/elevated).

## Correções comuns para “prisão de sandbox”

### "Ferramenta X bloqueada pela política de ferramentas do sandbox"

Chaves de correção (escolha uma):

- Desabilite o sandbox: `agents.defaults.sandbox.mode=off` (ou por agente `agents.list[].sandbox.mode=off`)
- Permita a ferramenta dentro do sandbox:
  - remova-a de `tools.sandbox.tools.deny` (ou por agente `agents.list[].tools.sandbox.tools.deny`)
  - ou adicione-a a `tools.sandbox.tools.allow` (ou à lista de permissão por agente)

### "Eu achei que isso era main, por que está em sandbox?"

No modo `"non-main"`, chaves de grupo/canal _não_ são main. Use a chave da sessão main (mostrada por `sandbox explain`) ou mude o modo para `"off"`.

## Veja também

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox (modos, escopos, backends, imagens)
- [Multi-Agent Sandbox & Tools](/pt-BR/tools/multi-agent-sandbox-tools) -- sobrescritas por agente e precedência
- [Elevated Mode](/pt-BR/tools/elevated)
