---
read_when:
    - Apresentar o ClawHub a novos usuários
    - Instalar, pesquisar ou publicar skills ou plugins
    - Explicar flags da CLI do ClawHub e o comportamento de sync
summary: 'Guia do ClawHub: registro público, fluxos nativos de instalação do OpenClaw e fluxos da CLI do ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-05T12:54:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e65b3fd770ca96a5dd828dce2dee4ef127268f4884180a912f43d7744bc5706f
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

O ClawHub é o registro público de **Skills e plugins do OpenClaw**.

- Use comandos nativos do `openclaw` para pesquisar/instalar/atualizar Skills e instalar
  plugins do ClawHub.
- Use a CLI separada `clawhub` quando precisar de autenticação no registro, publicação, exclusão,
  restauração, ou fluxos de sync.

Site: [clawhub.ai](https://clawhub.ai)

## Fluxos nativos do OpenClaw

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Especificações de plugin simples seguras para npm também são tentadas no ClawHub antes do npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Comandos nativos do `openclaw` instalam no seu workspace ativo e persistem metadados
de origem para que chamadas posteriores de `update` possam continuar no ClawHub.

Instalações de plugin validam a compatibilidade anunciada de `pluginApi` e `minGatewayVersion`
antes de a instalação do arquivo começar, para que hosts incompatíveis falhem de forma fechada logo no início,
em vez de instalar parcialmente o pacote.

`openclaw plugins install clawhub:...` aceita apenas famílias de plugin instaláveis.
Se um pacote do ClawHub for, na verdade, uma skill, o OpenClaw interrompe e direciona você para
`openclaw skills install <slug>`.

## O que é o ClawHub

- Um registro público de Skills e plugins do OpenClaw.
- Um armazenamento versionado de bundles de skill e metadados.
- Uma superfície de descoberta para pesquisa, tags e sinais de uso.

## Como funciona

1. Um usuário publica um bundle de skill (arquivos + metadados).
2. O ClawHub armazena o bundle, analisa os metadados e atribui uma versão.
3. O registro indexa a skill para pesquisa e descoberta.
4. Os usuários navegam, baixam e instalam Skills no OpenClaw.

## O que você pode fazer

- Publicar novas Skills e novas versões de Skills existentes.
- Descobrir Skills por nome, tags ou pesquisa.
- Baixar bundles de skill e inspecionar seus arquivos.
- Reportar Skills abusivas ou inseguras.
- Se você for moderador, ocultar, reexibir, excluir ou banir.

## Para quem isso é (amigável para iniciantes)

Se você quiser adicionar novas capacidades ao seu agente OpenClaw, o ClawHub é a forma mais fácil de encontrar e instalar Skills. Você não precisa saber como o backend funciona. Você pode:

- Pesquisar Skills em linguagem natural.
- Instalar uma skill no seu workspace.
- Atualizar Skills mais tarde com um único comando.
- Fazer backup das suas próprias Skills publicando-as.

## Início rápido (não técnico)

1. Pesquise algo de que você precisa:
   - `openclaw skills search "calendar"`
2. Instale uma skill:
   - `openclaw skills install <skill-slug>`
3. Inicie uma nova sessão do OpenClaw para que ele carregue a nova skill.
4. Se você quiser publicar ou gerenciar a autenticação do registro, instale também a CLI separada
   `clawhub`.

## Instalar a CLI do ClawHub

Você só precisa disso para fluxos autenticados no registro, como publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Como isso se encaixa no OpenClaw

`openclaw skills install` nativo instala no diretório `skills/` do workspace ativo. `openclaw plugins install clawhub:...` registra uma instalação normal de plugin gerenciado
mais metadados de origem do ClawHub para atualizações.

Instalações anônimas de plugins do ClawHub também falham de forma fechada para pacotes privados.
Canais da comunidade ou outros canais não oficiais ainda podem ser instalados, mas o OpenClaw emite um aviso
para que operadores possam revisar a origem e a verificação antes de habilitá-los.

A CLI separada `clawhub` também instala Skills em `./skills` dentro do diretório de trabalho atual. Se um workspace do OpenClaw estiver configurado, o `clawhub`
usa esse workspace como fallback, a menos que você substitua com `--workdir` (ou
`CLAWHUB_WORKDIR`). O OpenClaw carrega Skills do workspace a partir de `<workspace>/skills`
e irá carregá-las na **próxima** sessão. Se você já usa
`~/.openclaw/skills` ou Skills empacotadas, as Skills do workspace têm precedência.

Para mais detalhes sobre como as Skills são carregadas, compartilhadas e controladas, consulte
[Skills](/tools/skills).

## Visão geral do sistema de Skills

Uma skill é um bundle versionado de arquivos que ensina o OpenClaw a executar uma
tarefa específica. Cada publicação cria uma nova versão, e o registro mantém um
histórico de versões para que os usuários possam auditar mudanças.

Uma skill típica inclui:

- Um arquivo `SKILL.md` com a descrição principal e o uso.
- Configurações, scripts ou arquivos de suporte opcionais usados pela skill.
- Metadados como tags, resumo e requisitos de instalação.

O ClawHub usa metadados para viabilizar descoberta e expor capacidades de skill com segurança.
O registro também acompanha sinais de uso (como estrelas e downloads) para melhorar
o ranqueamento e a visibilidade.

## O que o serviço oferece (recursos)

- **Navegação pública** de Skills e seu conteúdo `SKILL.md`.
- **Pesquisa** alimentada por embeddings (busca vetorial), não apenas palavras-chave.
- **Versionamento** com semver, changelogs e tags (incluindo `latest`).
- **Downloads** como zip por versão.
- **Estrelas e comentários** para feedback da comunidade.
- **Hooks de moderação** para aprovações e auditorias.
- **API amigável para CLI** para automação e scripts.

## Segurança e moderação

O ClawHub é aberto por padrão. Qualquer pessoa pode enviar Skills, mas uma conta GitHub
precisa ter pelo menos uma semana para publicar. Isso ajuda a desacelerar abusos sem bloquear
contribuidores legítimos.

Reportes e moderação:

- Qualquer usuário autenticado pode reportar uma skill.
- Motivos do reporte são obrigatórios e registrados.
- Cada usuário pode ter até 20 reportes ativos ao mesmo tempo.
- Skills com mais de 3 reportes únicos são ocultadas automaticamente por padrão.
- Moderadores podem ver Skills ocultas, reexibi-las, excluí-las ou banir usuários.
- Abusar do recurso de reporte pode resultar em banimento da conta.

Tem interesse em se tornar moderador? Pergunte no Discord do OpenClaw e entre em contato com um
moderador ou maintainer.

## Comandos e parâmetros da CLI

Opções globais (aplicam-se a todos os comandos):

- `--workdir <dir>`: Diretório de trabalho (padrão: diretório atual; usa o workspace do OpenClaw como fallback).
- `--dir <dir>`: Diretório de Skills, relativo ao workdir (padrão: `skills`).
- `--site <url>`: URL base do site (login no navegador).
- `--registry <url>`: URL base da API do registro.
- `--no-input`: Desabilitar prompts (não interativo).
- `-V, --cli-version`: Imprimir a versão da CLI.

Autenticação:

- `clawhub login` (fluxo no navegador) ou `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Opções:

- `--token <token>`: Cole um token de API.
- `--label <label>`: Rótulo armazenado para tokens de login no navegador (padrão: `CLI token`).
- `--no-browser`: Não abrir um navegador (requer `--token`).

Pesquisa:

- `clawhub search "query"`
- `--limit <n>`: Máximo de resultados.

Instalar:

- `clawhub install <slug>`
- `--version <version>`: Instalar uma versão específica.
- `--force`: Sobrescrever se a pasta já existir.

Atualizar:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Atualizar para uma versão específica (apenas um slug).
- `--force`: Sobrescrever quando os arquivos locais não corresponderem a nenhuma versão publicada.

Listar:

- `clawhub list` (lê `.clawhub/lock.json`)

Publicar Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug da skill.
- `--name <name>`: Nome de exibição.
- `--version <version>`: Versão semver.
- `--changelog <text>`: Texto do changelog (pode estar vazio).
- `--tags <tags>`: Tags separadas por vírgula (padrão: `latest`).

Publicar plugins:

- `clawhub package publish <source>`
- `<source>` pode ser uma pasta local, `owner/repo`, `owner/repo@ref` ou uma URL do GitHub.
- `--dry-run`: Monta o plano exato de publicação sem enviar nada.
- `--json`: Emite saída legível por máquina para CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Substituições opcionais quando a autodetecção não é suficiente.

Excluir/restaurar (somente owner/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (varrer Skills locais + publicar novas/atualizadas):

- `clawhub sync`
- `--root <dir...>`: Raízes extras para varredura.
- `--all`: Enviar tudo sem prompts.
- `--dry-run`: Mostrar o que seria enviado.
- `--bump <type>`: `patch|minor|major` para atualizações (padrão: `patch`).
- `--changelog <text>`: Changelog para atualizações não interativas.
- `--tags <tags>`: Tags separadas por vírgula (padrão: `latest`).
- `--concurrency <n>`: Verificações no registro (padrão: 4).

## Fluxos comuns para agentes

### Pesquisar Skills

```bash
clawhub search "postgres backups"
```

### Baixar novas Skills

```bash
clawhub install my-skill-pack
```

### Atualizar Skills instaladas

```bash
clawhub update --all
```

### Fazer backup das suas Skills (publish ou sync)

Para uma única pasta de skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Para varrer e fazer backup de muitas Skills de uma vez:

```bash
clawhub sync --all
```

### Publicar um plugin a partir do GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Plugins de código precisam incluir os metadados obrigatórios do OpenClaw em `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

## Detalhes avançados (técnicos)

### Versionamento e tags

- Cada publicação cria uma nova `SkillVersion` **semver**.
- Tags (como `latest`) apontam para uma versão; mover tags permite fazer rollback.
- Changelogs são anexados por versão e podem ficar vazios ao sincronizar ou publicar atualizações.

### Mudanças locais vs. versões do registro

Atualizações comparam o conteúdo local da skill com as versões do registro usando um hash de conteúdo. Se os arquivos locais não corresponderem a nenhuma versão publicada, a CLI pergunta antes de sobrescrever (ou exige `--force` em execuções não interativas).

### Varredura de sync e raízes de fallback

`clawhub sync` varre primeiro seu workdir atual. Se nenhuma skill for encontrada, ele usa como fallback locais legados conhecidos (por exemplo `~/openclaw/skills` e `~/.openclaw/skills`). Isso foi projetado para encontrar instalações antigas de skill sem flags extras.

### Armazenamento e lockfile

- Skills instaladas são registradas em `.clawhub/lock.json` dentro do seu workdir.
- Tokens de autenticação são armazenados no arquivo de configuração da CLI do ClawHub (substituível via `CLAWHUB_CONFIG_PATH`).

### Telemetria (contagem de instalações)

Quando você executa `clawhub sync` autenticado, a CLI envia um snapshot mínimo para calcular contagens de instalação. Você pode desabilitar isso completamente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Variáveis de ambiente

- `CLAWHUB_SITE`: Substitui a URL do site.
- `CLAWHUB_REGISTRY`: Substitui a URL da API do registro.
- `CLAWHUB_CONFIG_PATH`: Substitui onde a CLI armazena token/configuração.
- `CLAWHUB_WORKDIR`: Substitui o workdir padrão.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Desabilita telemetria em `sync`.
