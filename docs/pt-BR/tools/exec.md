---
read_when:
    - Usando ou modificando a ferramenta Exec
    - Depurando o comportamento de stdin ou TTY
summary: Uso da ferramenta Exec, modos de stdin e suporte a TTY
title: Ferramenta Exec
x-i18n:
    generated_at: "2026-04-21T13:38:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Ferramenta Exec

Execute comandos de shell no workspace. Oferece suporte a execução em primeiro plano + em segundo plano via `process`.
Se `process` não for permitido, `exec` será executado de forma síncrona e ignorará `yieldMs`/`background`.
Sessões em segundo plano têm escopo por agente; `process` vê apenas sessões do mesmo agente.

## Parâmetros

- `command` (obrigatório)
- `workdir` (o padrão é cwd)
- `env` (substituições de chave/valor)
- `yieldMs` (padrão 10000): vai automaticamente para segundo plano após o atraso
- `background` (bool): vai para segundo plano imediatamente
- `timeout` (segundos, padrão 1800): encerra ao expirar
- `pty` (bool): executa em um pseudo-terminal quando disponível (CLIs somente-TTY, agentes de código, TUIs)
- `host` (`auto | sandbox | gateway | node`): onde executar
- `security` (`deny | allowlist | full`): modo de aplicação para `gateway`/`node`
- `ask` (`off | on-miss | always`): prompts de aprovação para `gateway`/`node`
- `node` (string): id/nome do node para `host=node`
- `elevated` (bool): solicita modo elevado (sair do sandbox para o caminho de host configurado); `security=full` só é forçado quando elevated resolve para `full`

Observações:

- `host` tem como padrão `auto`: sandbox quando o runtime de sandbox está ativo para a sessão; caso contrário, gateway.
- `auto` é a estratégia de roteamento padrão, não um curinga. `host=node` por chamada é permitido a partir de `auto`; `host=gateway` por chamada só é permitido quando nenhum runtime de sandbox estiver ativo.
- Sem configuração extra, `host=auto` ainda “simplesmente funciona”: sem sandbox, ele resolve para `gateway`; com um sandbox ativo, permanece no sandbox.
- `elevated` sai do sandbox para o caminho de host configurado: `gateway` por padrão, ou `node` quando `tools.exec.host=node` (ou quando o padrão da sessão for `host=node`). Ele só está disponível quando o acesso elevado está habilitado para a sessão/provedor atual.
- Aprovações de `gateway`/`node` são controladas por `~/.openclaw/exec-approvals.json`.
- `node` exige um node pareado (app complementar ou host node headless).
- Se houver vários nodes disponíveis, defina `exec.node` ou `tools.exec.node` para selecionar um.
- `exec host=node` é o único caminho de execução de shell para nodes; o wrapper legado `nodes.run` foi removido.
- Em hosts não Windows, exec usa `SHELL` quando definido; se `SHELL` for `fish`, ele prefere `bash` (ou `sh`)
  do `PATH` para evitar scripts incompatíveis com fish, e depois usa `SHELL` se nenhum dos dois existir.
- Em hosts Windows, exec prefere detectar o PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, depois PATH),
  e depois recorre ao Windows PowerShell 5.1.
- A execução no host (`gateway`/`node`) rejeita substituições de `env.PATH` e de carregador (`LD_*`/`DYLD_*`) para
  evitar sequestro de binário ou código injetado.
- O OpenClaw define `OPENCLAW_SHELL=exec` no ambiente do comando gerado (incluindo execução em PTY e sandbox), para que regras de shell/profile possam detectar o contexto da ferramenta exec.
- Importante: o sandbox está **desativado por padrão**. Se o sandbox estiver desativado, `host=auto`
  implícito resolve para `gateway`. `host=sandbox` explícito ainda falha de forma fechada em vez de
  executar silenciosamente no host gateway. Habilite o sandbox ou use `host=gateway` com aprovações.
- Verificações preflight de script (para erros comuns de sintaxe de shell em Python/Node) inspecionam apenas arquivos dentro do
  limite efetivo de `workdir`. Se o caminho de um script resolver para fora de `workdir`, o preflight será ignorado para
  esse arquivo.
- Para trabalhos longos que começam agora, inicie-os uma vez e conte com o
  wake automático na conclusão quando ele estiver habilitado e o comando emitir saída ou falhar.
  Use `process` para logs, status, entrada ou intervenção; não emule
  agendamento com loops de sleep, loops de timeout ou polling repetido.
- Para trabalho que deva acontecer depois ou em um agendamento, use Cron em vez de
  padrões de sleep/delay com `exec`.

## Configuração

- `tools.exec.notifyOnExit` (padrão: true): quando true, sessões exec em segundo plano enfileiram um evento de sistema e solicitam um Heartbeat ao sair.
- `tools.exec.approvalRunningNoticeMs` (padrão: 10000): emite uma única notificação “em execução” quando um exec com aprovação obrigatória executa por mais do que isso (0 desabilita).
- `tools.exec.host` (padrão: `auto`; resolve para `sandbox` quando o runtime de sandbox está ativo, `gateway` caso contrário)
- `tools.exec.security` (padrão: `deny` para sandbox, `full` para gateway + node quando não definido)
- `tools.exec.ask` (padrão: `off`)
- Exec de host sem aprovação é o padrão para gateway + node. Se você quiser comportamento com aprovações/lista de permissões, restrinja tanto `tools.exec.*` quanto `~/.openclaw/exec-approvals.json` do host; consulte [Exec approvals](/pt-BR/tools/exec-approvals#no-approval-yolo-mode).
- O modo YOLO vem dos padrões de política do host (`security=full`, `ask=off`), não de `host=auto`. Se você quiser forçar roteamento para gateway ou node, defina `tools.exec.host` ou use `/exec host=...`.
- No modo `security=full` mais `ask=off`, exec no host segue diretamente a política configurada; não há camada extra de prefilter heurístico de ofuscação de comando nem de rejeição de script-preflight.
- `tools.exec.node` (padrão: não definido)
- `tools.exec.strictInlineEval` (padrão: false): quando true, formas inline de eval do interpretador como `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` e `osascript -e` sempre exigem aprovação explícita. `allow-always` ainda pode persistir invocações benignas de interpretador/script, mas formas de inline-eval continuarão solicitando aprovação a cada vez.
- `tools.exec.pathPrepend`: lista de diretórios a serem prefixados ao `PATH` para execuções de exec (somente gateway + sandbox).
- `tools.exec.safeBins`: binários seguros apenas para stdin que podem executar sem entradas explícitas na lista de permissões. Para detalhes de comportamento, consulte [Safe bins](/pt-BR/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: diretórios explícitos adicionais confiáveis para verificações de caminho executável de `safeBins`. Entradas de `PATH` nunca são confiáveis automaticamente. Os padrões embutidos são `/bin` e `/usr/bin`.
- `tools.exec.safeBinProfiles`: política opcional personalizada de argv por safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Exemplo:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Tratamento de PATH

- `host=gateway`: mescla seu `PATH` de shell de login ao ambiente do exec. Substituições de `env.PATH`
  são rejeitadas para execução no host. O próprio daemon ainda roda com um `PATH` mínimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: executa `sh -lc` (shell de login) dentro do contêiner, então `/etc/profile` pode redefinir `PATH`.
  O OpenClaw prefixa `env.PATH` após o carregamento do profile por meio de uma variável de ambiente interna (sem interpolação de shell);
  `tools.exec.pathPrepend` também se aplica aqui.
- `host=node`: apenas substituições de env não bloqueadas que você passar são enviadas ao node. Substituições de `env.PATH`
  são rejeitadas para execução no host e ignoradas por hosts node. Se você precisar de entradas adicionais de PATH em um node,
  configure o ambiente do serviço do host node (systemd/launchd) ou instale ferramentas em locais padrão.

Vínculo de node por agente (use o índice da lista de agentes na configuração):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

UI de controle: a aba Nodes inclui um pequeno painel “Exec node binding” para as mesmas configurações.

## Substituições de sessão (`/exec`)

Use `/exec` para definir padrões **por sessão** para `host`, `security`, `ask` e `node`.
Envie `/exec` sem argumentos para mostrar os valores atuais.

Exemplo:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modelo de autorização

`/exec` só é aceito para **remetentes autorizados** (listas de permissões/pareamento do canal mais `commands.useAccessGroups`).
Ele atualiza **apenas o estado da sessão** e não grava configuração. Para desabilitar exec de forma rígida, negue-o por
política de ferramenta (`tools.deny: ["exec"]` ou por agente). Aprovações de host ainda se aplicam, a menos que você defina explicitamente
`security=full` e `ask=off`.

## Aprovações de Exec (app complementar / host node)

Agentes em sandbox podem exigir aprovação por solicitação antes que `exec` seja executado no host gateway ou node.
Consulte [Exec approvals](/pt-BR/tools/exec-approvals) para a política, a lista de permissões e o fluxo da UI.

Quando aprovações são exigidas, a ferramenta exec retorna imediatamente com
`status: "approval-pending"` e um id de aprovação. Depois de aprovada (ou negada / expirada),
o Gateway emite eventos de sistema (`Exec finished` / `Exec denied`). Se o comando ainda estiver
em execução após `tools.exec.approvalRunningNoticeMs`, uma única notificação `Exec running` será emitida.
Em canais com cartões/botões nativos de aprovação, o agente deve contar primeiro com essa
UI nativa e incluir um comando manual `/approve` apenas quando o
resultado da ferramenta disser explicitamente que aprovações no chat não estão disponíveis ou que a aprovação manual é o
único caminho.

## Lista de permissões + safe bins

A aplicação manual da lista de permissões corresponde apenas a **caminhos resolvidos de binário** (sem correspondência por basename). Quando
`security=allowlist`, comandos de shell são permitidos automaticamente apenas se cada segmento do pipeline estiver
na lista de permissões ou for um safe bin. Encadeamento (`;`, `&&`, `||`) e redirecionamentos são rejeitados no
modo allowlist, a menos que cada segmento de nível superior satisfaça a lista de permissões (incluindo safe bins).
Redirecionamentos continuam sem suporte.
Confiança durável `allow-always` não ignora essa regra: um comando encadeado ainda exige que cada
segmento de nível superior corresponda.

`autoAllowSkills` é um caminho de conveniência separado em aprovações de exec. Não é o mesmo que
entradas manuais de lista de permissões por caminho. Para confiança explícita estrita, mantenha
`autoAllowSkills` desabilitado.

Use os dois controles para tarefas diferentes:

- `tools.exec.safeBins`: pequenos filtros de stream apenas para stdin.
- `tools.exec.safeBinTrustedDirs`: diretórios explícitos extras confiáveis para caminhos executáveis de safe bins.
- `tools.exec.safeBinProfiles`: política explícita de argv para safe bins personalizados.
- allowlist: confiança explícita para caminhos executáveis.

Não trate `safeBins` como uma lista de permissões genérica e não adicione binários de interpretador/runtime (por exemplo `python3`, `node`, `ruby`, `bash`). Se precisar deles, use entradas explícitas de lista de permissões e mantenha os prompts de aprovação habilitados.
`openclaw security audit` avisa quando entradas de `safeBins` de interpretador/runtime não têm perfis explícitos, e `openclaw doctor --fix` pode gerar entradas personalizadas ausentes de `safeBinProfiles`.
`openclaw security audit` e `openclaw doctor` também avisam quando você adiciona explicitamente bins de comportamento amplo como `jq` de volta a `safeBins`.
Se você permitir explicitamente interpretadores na lista de permissões, habilite `tools.exec.strictInlineEval` para que formas inline de eval de código ainda exijam uma aprovação nova.

Para detalhes completos da política e exemplos, consulte [Exec approvals](/pt-BR/tools/exec-approvals#safe-bins-stdin-only) e [Safe bins versus allowlist](/pt-BR/tools/exec-approvals#safe-bins-versus-allowlist).

## Exemplos

Primeiro plano:

```json
{ "tool": "exec", "command": "ls -la" }
```

Segundo plano + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Polling é para status sob demanda, não para loops de espera. Se o wake automático na conclusão
estiver habilitado, o comando pode despertar a sessão quando emitir saída ou falhar.

Enviar teclas (estilo tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Enviar (somente CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Colar (entre delimitadores por padrão):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` é uma subferramenta de `exec` para edições estrutururadas em vários arquivos.
Ela vem habilitada por padrão para modelos OpenAI e OpenAI Codex. Use configuração apenas
quando quiser desabilitá-la ou restringi-la a modelos específicos:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Observações:

- Disponível apenas para modelos OpenAI/OpenAI Codex.
- A política de ferramenta ainda se aplica; `allow: ["write"]` implicitamente permite `apply_patch`.
- A configuração fica em `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` tem como padrão `true`; defina como `false` para desabilitar a ferramenta para modelos OpenAI.
- `tools.exec.applyPatch.workspaceOnly` tem como padrão `true` (contido no workspace). Defina como `false` apenas se você intencionalmente quiser que `apply_patch` grave/exclua fora do diretório do workspace.

## Relacionado

- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — gates de aprovação para comandos de shell
- [Sandboxing](/pt-BR/gateway/sandboxing) — execução de comandos em ambientes com sandbox
- [Processo em segundo plano](/pt-BR/gateway/background-process) — execuções longas de exec e ferramenta process
- [Security](/pt-BR/gateway/security) — política de ferramenta e acesso elevado
