---
read_when:
    - Você está adicionando um assistente de setup a um Plugin
    - Você precisa entender `setup-entry.ts` vs `index.ts`
    - Você está definindo esquemas de configuração de Plugin ou metadados `openclaw` no `package.json`
sidebarTitle: Setup and Config
summary: Assistentes de configuração, `setup-entry.ts`, esquemas de configuração e metadados de `package.json`
title: Configuração e setup de Plugin
x-i18n:
    generated_at: "2026-04-23T05:41:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccdafb9a562353a7851fcd47bbc382961a449f5d645362c800f64c60579ce7b2
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuração e setup de Plugin

Referência para empacotamento de Plugin (metadados de `package.json`), manifestos
(`openclaw.plugin.json`), entradas de setup e esquemas de configuração.

<Tip>
  **Está procurando um passo a passo?** Os guias práticos cobrem o empacotamento em contexto:
  [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados do pacote

Seu `package.json` precisa de um campo `openclaw` que informa ao sistema de Plugin o que
seu Plugin fornece:

**Plugin de canal:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Plugin de provedor / baseline de publicação no ClawHub:**

```json openclaw-clawhub-package.json
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

Se você publicar o Plugin externamente no ClawHub, esses campos `compat` e `build`
serão obrigatórios. Os snippets canônicos de publicação ficam em
`docs/snippets/plugin-publish/`.

### Campos `openclaw`

| Campo        | Tipo       | Descrição                                                                                                                 |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Arquivos de ponto de entrada (relativos à raiz do pacote)                                                                 |
| `setupEntry` | `string`   | Entrada leve somente para setup (opcional)                                                                                |
| `channel`    | `object`   | Metadados do catálogo de canais para setup, seletor, início rápido e superfícies de status                               |
| `providers`  | `string[]` | IDs de provedores registrados por este Plugin                                                                             |
| `install`    | `object`   | Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags de comportamento de inicialização                                                                                    |

### `openclaw.channel`

`openclaw.channel` são metadados baratos do pacote para descoberta de canais e
superfícies de setup antes do carregamento do runtime.

| Campo                                  | Tipo       | O que significa                                                              |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canônico do canal.                                                        |
| `label`                                | `string`   | Rótulo principal do canal.                                                   |
| `selectionLabel`                       | `string`   | Rótulo no seletor/setup quando ele deve diferir de `label`.                  |
| `detailLabel`                          | `string`   | Rótulo secundário de detalhe para catálogos de canais e superfícies de status mais ricos. |
| `docsPath`                             | `string`   | Caminho da documentação para links de setup e seleção.                       |
| `docsLabel`                            | `string`   | Substitui o rótulo usado em links de documentação quando ele deve diferir do ID do canal. |
| `blurb`                                | `string`   | Descrição curta de onboarding/catálogo.                                      |
| `order`                                | `number`   | Ordem de classificação em catálogos de canais.                               |
| `aliases`                              | `string[]` | Aliases extras de busca para seleção de canal.                               |
| `preferOver`                           | `string[]` | IDs de Plugin/canal de menor prioridade que este canal deve superar.         |
| `systemImage`                          | `string`   | Nome opcional de ícone/system-image para catálogos de UI de canal.           |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes dos links de documentação em superfícies de seleção.  |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra o caminho da documentação diretamente em vez de um link com rótulo na cópia de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras anexadas na cópia de seleção.                          |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com Markdown para decisões de formatação de saída. |
| `exposure`                             | `object`   | Controles de visibilidade do canal para setup, listas configuradas e superfícies de documentação. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de setup `allowFrom` do início rápido.     |
| `forceAccountBinding`                  | `boolean`  | Exige vínculo explícito de conta mesmo quando existe apenas uma conta.       |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere busca de sessão ao resolver destinos de anúncio para este canal.     |

Exemplo:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` aceita:

- `configured`: inclui o canal em superfícies de listagem no estilo configurado/status
- `setup`: inclui o canal em seletores interativos de setup/configuração
- `docs`: marca o canal como voltado ao público em superfícies de documentação/navegação

`showConfigured` e `showInSetup` continuam com suporte como aliases legados. Prefira
`exposure`.

### `openclaw.install`

`openclaw.install` são metadados do pacote, não metadados de manifesto.

| Campo                        | Tipo                 | O que significa                                                                    |
| ---------------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificação npm canônica para fluxos de instalação/atualização.                  |
| `localPath`                  | `string`             | Caminho local de instalação integrada ou de desenvolvimento.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Fonte de instalação preferida quando ambas estão disponíveis.                       |
| `minHostVersion`             | `string`             | Versão mínima compatível do OpenClaw no formato `>=x.y.z`.                          |
| `expectedIntegrity`          | `string`             | String de integridade esperada do dist npm, geralmente `sha512-...`, para instalações fixadas. |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que fluxos de reinstalação de Plugin integrado recuperem falhas específicas de configuração obsoleta. |

O onboarding interativo também usa `openclaw.install` para superfícies de
instalação sob demanda. Se seu Plugin expõe escolhas de autenticação de provedor ou
metadados de setup/catálogo de canal antes do carregamento do runtime, o onboarding pode mostrar
essa escolha, perguntar por instalação npm vs local, instalar ou ativar o Plugin e
então continuar o fluxo selecionado. Escolhas de onboarding com npm exigem metadados de catálogo confiáveis com uma
versão `npmSpec` exata e `expectedIntegrity`; nomes de pacote não fixados e dist-tags
não são oferecidos para instalações automáticas no onboarding. Mantenha os metadados de
“o que mostrar” em `openclaw.plugin.json` e os metadados de “como instalar” em
`package.json`.

Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento pelo registro de manifesto
o aplicam. Hosts mais antigos ignoram o Plugin; strings de versão inválidas são rejeitadas.

Para instalações npm fixadas, mantenha a versão exata em `npmSpec` e adicione a
integridade esperada do artefato:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` não é um bypass geral para configurações quebradas. Ele existe
apenas para recuperação restrita de Plugin integrado, para que reinstalação/setup possa reparar
sobras conhecidas de upgrade, como um caminho ausente de Plugin integrado ou uma entrada obsoleta
`channels.<id>` para esse mesmo Plugin. Se a configuração estiver quebrada por motivos não relacionados, a instalação
ainda falha de forma fechada e informa ao operador para executar `openclaw doctor --fix`.

### Carregamento completo adiado

Plugins de canal podem optar por carregamento adiado com:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Quando ativado, o OpenClaw carrega apenas `setupEntry` durante a fase de inicialização
pré-listen, mesmo para canais já configurados. A entrada completa é carregada após o
Gateway começar a escutar.

<Warning>
  Ative o carregamento adiado apenas quando seu `setupEntry` registrar tudo o que o
  Gateway precisa antes de começar a escutar (registro de canal, rotas HTTP,
  métodos do Gateway). Se a entrada completa for responsável por capacidades obrigatórias de inicialização, mantenha
  o comportamento padrão.
</Warning>

Se sua entrada de setup/completa registrar métodos RPC do Gateway, mantenha-os em um
prefixo específico do Plugin. Namespaces administrativos reservados do núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) continuam pertencendo ao núcleo e sempre resolvem
para `operator.admin`.

## Manifesto do Plugin

Todo Plugin nativo precisa enviar um `openclaw.plugin.json` na raiz do pacote.
O OpenClaw usa isso para validar a configuração sem executar código do Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Para Plugins de canal, adicione `kind` e `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Mesmo Plugins sem configuração precisam enviar um esquema. Um esquema vazio é válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Consulte [Plugin Manifest](/pt-BR/plugins/manifest) para a referência completa do esquema.

## Publicação no ClawHub

Para pacotes de Plugin, use o comando específico de ClawHub para pacote:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

O alias legado de publicação somente para Skills é para Skills. Pacotes de Plugin devem
sempre usar `clawhub package publish`.

## Entrada de setup

O arquivo `setup-entry.ts` é uma alternativa leve a `index.ts` que
o OpenClaw carrega quando precisa apenas de superfícies de setup (onboarding, reparo de configuração,
inspeção de canal desativado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas de criptografia, registros de CLI,
serviços em segundo plano) durante fluxos de setup.

Canais integrados do workspace que mantêm exports seguros para setup em módulos sidecar podem
usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` em vez de
`defineSetupPluginEntry(...)`. Esse contrato integrado também oferece suporte a um export opcional
`runtime`, para que a conexão de runtime no momento do setup permaneça leve e explícita.

**Quando o OpenClaw usa `setupEntry` em vez da entrada completa:**

- O canal está desativado, mas precisa de superfícies de setup/onboarding
- O canal está ativado, mas não configurado
- O carregamento adiado está ativado (`deferConfiguredChannelFullLoadUntilAfterListen`)

**O que `setupEntry` deve registrar:**

- O objeto do Plugin de canal (via `defineSetupPluginEntry`)
- Quaisquer rotas HTTP exigidas antes de o Gateway começar a escutar
- Quaisquer métodos do Gateway necessários durante a inicialização

Esses métodos do Gateway de inicialização ainda devem evitar namespaces administrativos reservados do
núcleo, como `config.*` ou `update.*`.

**O que `setupEntry` NÃO deve incluir:**

- Registros de CLI
- Serviços em segundo plano
- Imports pesados de runtime (crypto, SDKs)
- Métodos do Gateway necessários apenas após a inicialização

### Imports estreitos de auxiliares de setup

Para caminhos quentes somente de setup, prefira os seams estreitos de auxiliares de setup em vez da superfície mais ampla
`plugin-sdk/setup` quando você precisar apenas de parte da superfície de setup:

| Caminho de importação              | Use para                                                                                | Principais exports                                                                                                                                                                                                                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/setup-runtime`         | auxiliares de runtime no momento do setup que continuam disponíveis em `setupEntry` / inicialização adiada de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de setup de conta cientes do ambiente                                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                      |
| `plugin-sdk/setup-tools`           | auxiliares de setup/instalação de CLI/arquivo/documentação                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Use o seam mais amplo `plugin-sdk/setup` quando quiser a caixa de ferramentas completa e compartilhada de setup,
incluindo auxiliares de patch de configuração, como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Os adaptadores de patch de setup continuam seguros para importação em caminho quente. Sua busca integrada
pela superfície de contrato de promoção de conta única é lazy, então importar
`plugin-sdk/setup-runtime` não carrega avidamente a descoberta da superfície de contrato integrada antes de o adaptador realmente ser usado.

### Promoção de conta única controlada pelo canal

Quando um canal é atualizado de uma configuração de nível superior de conta única para
`channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover valores promovidos
com escopo de conta para `accounts.default`.

Canais integrados podem estreitar ou substituir essa promoção por meio da sua superfície de contrato
de setup:

- `singleAccountKeysToMove`: chaves extras de nível superior que devem ser movidas para a
  conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, apenas essas
  chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na raiz
  do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente
  recebe os valores promovidos

Matrix é o exemplo integrado atual. Se exatamente uma conta nomeada do Matrix já
existir, ou se `defaultAccount` apontar para uma chave não canônica existente
como `Ops`, a promoção preserva essa conta em vez de criar uma nova entrada
`accounts.default`.

## Esquema de configuração

A configuração do Plugin é validada em relação ao JSON Schema do seu manifesto. Os usuários
configuram Plugins por meio de:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Seu Plugin recebe essa configuração como `api.pluginConfig` durante o registro.

Para configuração específica do canal, use a seção de configuração do canal:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Criando esquemas de configuração de canal

Use `buildChannelConfigSchema` de `openclaw/plugin-sdk/core` para converter um
esquema Zod no wrapper `ChannelConfigSchema` que o OpenClaw valida:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Assistentes de setup

Plugins de canal podem fornecer assistentes interativos de setup para `openclaw onboard`.
O assistente é um objeto `ChannelSetupWizard` no `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

O tipo `ChannelSetupWizard` oferece suporte a `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e mais.
Consulte os pacotes de Plugin integrados (por exemplo, o Plugin do Discord em `src/channel.setup.ts`) para
exemplos completos.

Para prompts de allowlist de DM que só precisam do fluxo padrão
`note -> prompt -> parse -> merge -> patch`, prefira os auxiliares compartilhados de setup
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Para blocos de status de setup de canal que variam apenas por rótulos, pontuações e linhas extras opcionais,
prefira `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` em vez de criar manualmente o mesmo objeto `status` em
cada Plugin.

Para superfícies opcionais de setup que devem aparecer apenas em certos contextos, use
`createOptionalChannelSetupSurface` de `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` também expõe os builders de nível mais baixo
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando você precisa apenas de uma metade
dessa superfície opcional de instalação.

O adaptador/assistente opcional gerado falha de forma fechada em gravações reais de configuração. Eles
reutilizam uma mensagem única de instalação obrigatória em `validateInput`,
`applyAccountConfig` e `finalize`, e acrescentam um link de documentação quando `docsPath` está
definido.

Para UIs de setup baseadas em binário, prefira os auxiliares compartilhados delegados em vez de
copiar a mesma cola de binário/status para cada canal:

- `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos,
  dicas, pontuações e detecção de binário
- `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar
  de forma lazy para um assistente completo mais pesado
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` só precisa
  delegar uma decisão `textInputs[*].shouldPrompt`

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/pt-BR/tools/clawhub) ou npm e depois instale:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

O OpenClaw tenta primeiro o ClawHub e recorre automaticamente ao npm. Você também pode
forçar explicitamente o ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # somente ClawHub
```

Não existe uma substituição `npm:` correspondente. Use a especificação normal de pacote npm quando
quiser o caminho do npm após o fallback do ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins no repositório:** coloque-os sob a árvore de workspace de Plugins integrados e eles serão automaticamente
descobertos durante a build.

**Os usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalações vindas do npm, `openclaw plugins install` executa
  `npm install --ignore-scripts` (sem scripts de ciclo de vida). Mantenha as árvores de dependências do Plugin
  em JS/TS puro e evite pacotes que exijam builds em `postinstall`.
</Info>

Plugins integrados de propriedade do OpenClaw são a única exceção de reparo na inicialização: quando uma
instalação empacotada vê um deles ativado pela configuração do Plugin, pela configuração legada de canal ou
pelo manifesto integrado ativado por padrão, a inicialização instala as dependências de runtime ausentes desse Plugin antes do import. Plugins de terceiros não devem depender de instalações na inicialização; continue usando o instalador explícito de Plugin.

## Relacionado

- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) -- `definePluginEntry` e `defineChannelPluginEntry`
- [Manifesto do Plugin](/pt-BR/plugins/manifest) -- referência completa do esquema do manifesto
- [Criando Plugins](/pt-BR/plugins/building-plugins) -- guia passo a passo para começar
