---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “Sandbox por agente + restrições de ferramentas, precedência e exemplos”
title: Sandbox e Ferramentas para Múltiplos Agentes
x-i18n:
    generated_at: "2026-04-05T12:56:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07985f7c8fae860a7b9bf685904903a4a8f90249e95e4179cf0775a1208c0597
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Configuração de Sandbox e Ferramentas para Múltiplos Agentes

Cada agente em uma configuração com múltiplos agentes pode substituir a política
global de sandbox e ferramentas. Esta página aborda a configuração por agente,
as regras de precedência e exemplos.

- **Backends e modos de sandbox**: consulte [Sandboxing](/pt-BR/gateway/sandboxing).
- **Depuração de ferramentas bloqueadas**: consulte [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) e `openclaw sandbox explain`.
- **Execução elevada**: consulte [Elevated Mode](/pt-BR/tools/elevated).

A autenticação é por agente: cada agente lê do seu próprio armazenamento de autenticação em `agentDir`
em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
As credenciais **não** são compartilhadas entre agentes. Nunca reutilize `agentDir` entre agentes.
Se você quiser compartilhar credenciais, copie `auth-profiles.json` para o `agentDir` do outro agente.

---

## Exemplos de configuração

### Exemplo 1: agente pessoal + agente familiar restrito

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Resultado:**

- agente `main`: é executado no host, com acesso total às ferramentas
- agente `family`: é executado no Docker (um contêiner por agente), apenas com a ferramenta `read`

---

### Exemplo 2: agente de trabalho com sandbox compartilhado

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Exemplo 2b: perfil global de codificação + agente apenas de mensagens

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Resultado:**

- os agentes padrão recebem ferramentas de codificação
- o agente `support` é apenas para mensagens (+ ferramenta Slack)

---

### Exemplo 3: modos de sandbox diferentes por agente

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Padrão global
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Substituição: main nunca usa sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Substituição: public sempre usa sandbox
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Precedência de configuração

Quando existem configurações globais (`agents.defaults.*`) e específicas do agente (`agents.list[].*`):

### Configuração de sandbox

As configurações específicas do agente substituem as globais:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Observações:**

- `agents.list[].sandbox.{docker,browser,prune}.*` substitui `agents.defaults.sandbox.{docker,browser,prune}.*` para esse agente (ignorado quando o escopo do sandbox é resolvido como `"shared"`).

### Restrições de ferramentas

A ordem de filtragem é:

1. **Perfil de ferramentas** (`tools.profile` ou `agents.list[].tools.profile`)
2. **Perfil de ferramentas do provedor** (`tools.byProvider[provider].profile` ou `agents.list[].tools.byProvider[provider].profile`)
3. **Política global de ferramentas** (`tools.allow` / `tools.deny`)
4. **Política de ferramentas do provedor** (`tools.byProvider[provider].allow/deny`)
5. **Política de ferramentas específica do agente** (`agents.list[].tools.allow/deny`)
6. **Política do provedor do agente** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Política de ferramentas do sandbox** (`tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`)
8. **Política de ferramentas de subagente** (`tools.subagents.tools`, quando aplicável)

Cada nível pode restringir ainda mais as ferramentas, mas não pode restaurar ferramentas negadas em níveis anteriores.
Se `agents.list[].tools.sandbox.tools` estiver definido, ele substitui `tools.sandbox.tools` para esse agente.
Se `agents.list[].tools.profile` estiver definido, ele substitui `tools.profile` para esse agente.
As chaves de ferramentas por provedor aceitam `provider` (por exemplo, `google-antigravity`) ou `provider/model` (por exemplo, `openai/gpt-5.4`).

As políticas de ferramentas oferecem abreviações `group:*` que se expandem para várias ferramentas. Consulte [Tool groups](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) para ver a lista completa.

As substituições de modo elevado por agente (`agents.list[].tools.elevated`) podem restringir ainda mais a execução elevada para agentes específicos. Consulte [Elevated Mode](/pt-BR/tools/elevated) para obter detalhes.

---

## Migração de agente único

**Antes (agente único):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Depois (múltiplos agentes com perfis diferentes):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

As configurações legadas `agent.*` são migradas por `openclaw doctor`; prefira `agents.defaults` + `agents.list` daqui para frente.

---

## Exemplos de restrição de ferramentas

### Agente somente leitura

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agente de execução segura (sem modificações de arquivos)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agente apenas de comunicação

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` nesse perfil ainda retorna uma visualização de recuperação limitada e sanitizada
em vez de um despejo bruto de transcrição. A recuperação do assistente remove tags de raciocínio,
estruturas `<relevant-memories>`, cargas XML de chamada de ferramenta em texto simples
(incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta),
estruturas rebaixadas de chamada de ferramenta, tokens de controle do modelo
em ASCII/largura total vazados e XML malformado de chamada de ferramenta do MiniMax antes da redação/truncamento.

---

## Armadilha comum: `"non-main"`

`agents.defaults.sandbox.mode: "non-main"` se baseia em `session.mainKey` (padrão `"main"`),
não no ID do agente. Sessões de grupo/canal sempre recebem suas próprias chaves, portanto
são tratadas como não principais e usarão sandbox. Se você quiser que um agente nunca use
sandbox, defina `agents.list[].sandbox.mode: "off"`.

---

## Testes

Depois de configurar sandbox e ferramentas para múltiplos agentes:

1. **Verifique a resolução do agente:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Verifique os contêineres de sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Teste as restrições de ferramentas:**
   - Envie uma mensagem que exija ferramentas restritas
   - Verifique se o agente não pode usar as ferramentas negadas

4. **Monitore os logs:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Solução de problemas

### Agente sem sandbox apesar de `mode: "all"`

- Verifique se há um `agents.defaults.sandbox.mode` global que o substitui
- A configuração específica do agente tem precedência, então defina `agents.list[].sandbox.mode: "all"`

### Ferramentas ainda disponíveis apesar da lista de negação

- Verifique a ordem de filtragem de ferramentas: global → agente → sandbox → subagente
- Cada nível só pode restringir ainda mais, não restaurar permissões
- Verifique com logs: `[tools] filtering tools for agent:${agentId}`

### Contêiner não isolado por agente

- Defina `scope: "agent"` na configuração de sandbox específica do agente
- O padrão é `"session"`, que cria um contêiner por sessão

---

## Veja também

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox (modos, escopos, backends, imagens)
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuração de "por que isto está bloqueado?"
- [Elevated Mode](/pt-BR/tools/elevated)
- [Multi-Agent Routing](/pt-BR/concepts/multi-agent)
- [Sandbox Configuration](/pt-BR/gateway/configuration-reference#agentsdefaultssandbox)
- [Session Management](/pt-BR/concepts/session)
