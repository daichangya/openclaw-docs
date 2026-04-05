---
read_when:
    - Ajustando padrões, allowlists ou comportamento de comandos slash do modo elevado
    - Entendendo como agentes em sandbox podem acessar o host
summary: 'Modo exec elevado: execute comandos fora do sandbox a partir de um agente em sandbox'
title: Modo elevado
x-i18n:
    generated_at: "2026-04-05T12:54:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f0ca0a7c03c94554a70fee775aa92085f15015850c3abaa2c1c46ced9d3c2e
    source_path: tools/elevated.md
    workflow: 15
---

# Modo elevado

Quando um agente é executado dentro de um sandbox, seus comandos `exec` ficam confinados ao
ambiente do sandbox. O **modo elevado** permite que o agente saia desse ambiente e execute comandos
fora do sandbox, com gates de aprovação configuráveis.

<Info>
  O modo elevado só muda o comportamento quando o agente está em **sandbox**. Para
  agentes sem sandbox, `exec` já é executado no host.
</Info>

## Diretivas

Controle o modo elevado por sessão com comandos slash:

| Diretiva        | O que faz                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Executa fora do sandbox no caminho de host configurado, mantendo aprovações    |
| `/elevated ask`  | Igual a `on` (alias)                                                   |
| `/elevated full` | Executa fora do sandbox no caminho de host configurado e ignora aprovações |
| `/elevated off`  | Retorna à execução confinada ao sandbox                                   |

Também disponível como `/elev on|off|ask|full`.

Envie `/elevated` sem argumento para ver o nível atual.

## Como funciona

<Steps>
  <Step title="Verifique a disponibilidade">
    O modo elevado deve estar habilitado na configuração e o remetente deve estar na allowlist:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Defina o nível">
    Envie uma mensagem contendo apenas a diretiva para definir o padrão da sessão:

    ```
    /elevated full
    ```

    Ou use em linha (aplica-se apenas àquela mensagem):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Os comandos são executados fora do sandbox">
    Com o modo elevado ativo, chamadas `exec` saem do sandbox. O host efetivo é
    `gateway` por padrão, ou `node` quando o alvo de exec configurado/da sessão é
    `node`. No modo `full`, aprovações de exec são ignoradas. Nos modos `on`/`ask`,
    as regras de aprovação configuradas ainda se aplicam.
  </Step>
</Steps>

## Ordem de resolução

1. **Diretiva em linha** na mensagem (aplica-se apenas àquela mensagem)
2. **Substituição da sessão** (definida ao enviar uma mensagem contendo apenas a diretiva)
3. **Padrão global** (`agents.defaults.elevatedDefault` na configuração)

## Disponibilidade e allowlists

- **Gate global**: `tools.elevated.enabled` (deve ser `true`)
- **Allowlist de remetentes**: `tools.elevated.allowFrom` com listas por canal
- **Gate por agente**: `agents.list[].tools.elevated.enabled` (só pode restringir ainda mais)
- **Allowlist por agente**: `agents.list[].tools.elevated.allowFrom` (o remetente deve corresponder tanto à global quanto à do agente)
- **Fallback do Discord**: se `tools.elevated.allowFrom.discord` for omitido, `channels.discord.allowFrom` será usado como fallback
- **Todos os gates devem passar**; caso contrário, o modo elevado será tratado como indisponível

Formatos de entrada da allowlist:

| Prefixo                 | Corresponde a                    |
| ----------------------- | -------------------------------- |
| (nenhum)                | ID do remetente, E.164 ou campo From |
| `name:`                 | Nome de exibição do remetente    |
| `username:`             | Nome de usuário do remetente     |
| `tag:`                  | Tag do remetente                 |
| `id:`, `from:`, `e164:` | Direcionamento explícito de identidade |

## O que o modo elevado não controla

- **Política de ferramenta**: se `exec` for negado pela política de ferramenta, o modo elevado não pode substituí-la
- **Política de seleção de host**: o modo elevado não transforma `auto` em uma substituição livre entre hosts. Ele usa as regras configuradas/de sessão para o alvo de exec, escolhendo `node` apenas quando o alvo já for `node`.
- **Separado de `/exec`**: a diretiva `/exec` ajusta os padrões de exec por sessão para remetentes autorizados e não exige modo elevado

## Relacionado

- [Ferramenta exec](/tools/exec) — execução de comandos shell
- [Aprovações de exec](/tools/exec-approvals) — sistema de aprovação e allowlist
- [Sandboxing](/pt-BR/gateway/sandboxing) — configuração de sandbox
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)
