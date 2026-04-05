---
read_when:
    - Você quer um arquivo de backup de primeira classe para o estado local do OpenClaw
    - Você quer visualizar quais caminhos seriam incluídos antes de reset ou uninstall
summary: Referência de CLI para `openclaw backup` (criar arquivos locais de backup)
title: backup
x-i18n:
    generated_at: "2026-04-05T12:37:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 700eda8f9eac1cc93a854fa579f128e5e97d4e6dfc0da75b437c0fb2a898a37d
    source_path: cli/backup.md
    workflow: 15
---

# `openclaw backup`

Crie um arquivo local de backup para estado, configuração, perfis de autenticação, credenciais de canal/provedor, sessões e, opcionalmente, workspaces do OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Observações

- O arquivo inclui um arquivo `manifest.json` com os caminhos de origem resolvidos e o layout do arquivo.
- A saída padrão é um arquivo `.tar.gz` com timestamp no diretório de trabalho atual.
- Se o diretório de trabalho atual estiver dentro de uma árvore de origem incluída no backup, o OpenClaw usa seu diretório home como fallback para o local padrão do arquivo.
- Arquivos existentes nunca são sobrescritos.
- Caminhos de saída dentro das árvores de origem de estado/workspace são rejeitados para evitar auto-inclusão.
- `openclaw backup verify <archive>` valida que o arquivo contém exatamente um manifesto raiz, rejeita caminhos de arquivo no estilo traversal e verifica que cada payload declarado no manifesto existe no tarball.
- `openclaw backup create --verify` executa essa validação imediatamente após gravar o arquivo.
- `openclaw backup create --only-config` faz backup apenas do arquivo JSON de configuração ativo.

## O que é incluído no backup

`openclaw backup create` planeja fontes de backup a partir da sua instalação local do OpenClaw:

- O diretório de estado retornado pelo resolvedor de estado local do OpenClaw, normalmente `~/.openclaw`
- O caminho do arquivo de configuração ativo
- O diretório `credentials/` resolvido quando ele existe fora do diretório de estado
- Diretórios de workspace descobertos a partir da configuração atual, a menos que você passe `--no-include-workspace`

Os perfis de autenticação de modelo já fazem parte do diretório de estado em
`agents/<agentId>/agent/auth-profiles.json`, então normalmente ficam cobertos pela
entrada de backup do estado.

Se você usar `--only-config`, o OpenClaw ignorará a descoberta de estado, diretório de credenciais e workspace e arquivará apenas o caminho do arquivo de configuração ativo.

O OpenClaw canoniza caminhos antes de criar o arquivo. Se a configuração, o
diretório de credenciais ou um workspace já estiverem dentro do diretório de estado,
eles não serão duplicados como fontes de backup separadas no nível superior. Caminhos ausentes são
ignorados.

O payload do arquivo armazena o conteúdo dos arquivos dessas árvores de origem, e o `manifest.json` incorporado registra os caminhos absolutos de origem resolvidos mais o layout do arquivo usado para cada ativo.

## Comportamento com configuração inválida

`openclaw backup` ignora intencionalmente a pré-verificação normal da configuração para ainda poder ajudar durante a recuperação. Como a descoberta de workspace depende de uma configuração válida, `openclaw backup create` agora falha rapidamente quando o arquivo de configuração existe, mas é inválido, e o backup de workspace continua habilitado.

Se você ainda quiser um backup parcial nessa situação, execute novamente:

```bash
openclaw backup create --no-include-workspace
```

Isso mantém estado, configuração e o diretório externo de credenciais no escopo, enquanto
ignora totalmente a descoberta de workspace.

Se você precisar apenas de uma cópia do próprio arquivo de configuração, `--only-config` também funciona quando a configuração está malformada, porque não depende da análise da configuração para descoberta de workspace.

## Tamanho e desempenho

O OpenClaw não aplica um tamanho máximo interno de backup nem limite de tamanho por arquivo.

Os limites práticos vêm da máquina local e do sistema de arquivos de destino:

- Espaço disponível para a gravação temporária do arquivo mais o arquivo final
- Tempo para percorrer grandes árvores de workspace e compactá-las em um `.tar.gz`
- Tempo para analisar novamente o arquivo se você usar `openclaw backup create --verify` ou executar `openclaw backup verify`
- Comportamento do sistema de arquivos no caminho de destino. O OpenClaw prefere uma etapa de publicação com hard link sem sobrescrita e usa cópia exclusiva como fallback quando hard links não são compatíveis

Workspaces grandes costumam ser o principal fator do tamanho do arquivo. Se você quiser um backup menor ou mais rápido, use `--no-include-workspace`.

Para o menor arquivo possível, use `--only-config`.
