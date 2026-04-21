---
read_when:
    - Você está adicionando um assistente de configuração a um Plugin
    - Você precisa entender `setup-entry.ts` vs `index.ts`
    - Você está definindo schemas de configuração do plugin ou metadados `openclaw` no `package.json`
sidebarTitle: Setup and Config
summary: Assistentes de configuração, `setup-entry.ts`, schemas de configuração e metadados de `package.json`
title: Configuração e setup de Plugin
x-i18n:
    generated_at: "2026-04-21T05:42:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Configuração e setup de Plugin

Referência para empacotamento de plugins (metadados em `package.json`), manifestos
(`openclaw.plugin.json`), entradas de setup e schemas de configuração.

<Tip>
  **Está procurando um passo a passo?** Os guias práticos cobrem empacotamento em contexto:
  [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados de pacote

Seu `package.json` precisa de um campo `openclaw` que informe ao sistema de plugins o que
seu plugin fornece:

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

Se você publicar o plugin externamente no ClawHub, esses campos `compat` e `build`
são obrigatórios. Os snippets canônicos de publicação ficam em
`docs/snippets/plugin-publish/`.

### Campos `openclaw`

| Campo        | Tipo       | Descrição                                                                                             |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Arquivos de entrypoint (relativos à raiz do pacote)                                                   |
| `setupEntry` | `string`   | Entrada leve somente para setup (opcional)                                                            |
| `channel`    | `object`   | Metadados de catálogo de canal para setup, picker, início rápido e superfícies de status             |
| `providers`  | `string[]` | IDs de provedor registrados por este plugin                                                           |
| `install`    | `object`   | Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags de comportamento de inicialização                                                               |

### `openclaw.channel`

`openclaw.channel` são metadados baratos de pacote para descoberta de canal e
superfícies de setup antes de o runtime carregar.

| Campo                                  | Tipo       | O que significa                                                               |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID canônico do canal.                                                         |
| `label`                                | `string`   | Rótulo principal do canal.                                                    |
| `selectionLabel`                       | `string`   | Rótulo do picker/setup quando deve diferir de `label`.                        |
| `detailLabel`                          | `string`   | Rótulo secundário para catálogos de canal e superfícies de status mais ricos. |
| `docsPath`                             | `string`   | Caminho da documentação para links de setup e seleção.                        |
| `docsLabel`                            | `string`   | Sobrescreve o rótulo usado em links de docs quando deve diferir do id do canal. |
| `blurb`                                | `string`   | Descrição curta de onboarding/catálogo.                                       |
| `order`                                | `number`   | Ordem de classificação em catálogos de canal.                                 |
| `aliases`                              | `string[]` | Aliases extras de lookup para seleção de canal.                               |
| `preferOver`                           | `string[]` | IDs de plugin/canal de prioridade menor que este canal deve superar.          |
| `systemImage`                          | `string`   | Nome opcional de ícone/system-image para catálogos de UI do canal.            |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes de links de docs em superfícies de seleção.            |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra o caminho de docs diretamente em vez de um link com rótulo nas cópias de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras anexadas nas cópias de seleção.                         |
| `markdownCapable`                      | `boolean`  | Marca o canal como capaz de Markdown para decisões de formatação de saída.     |
| `exposure`                             | `object`   | Controles de visibilidade do canal para setup, listas configuradas e superfícies de docs. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de setup `allowFrom` de início rápido.      |
| `forceAccountBinding`                  | `boolean`  | Exige binding explícito de conta mesmo quando existe apenas uma conta.         |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere lookup de sessão ao resolver alvos de anúncio para este canal.         |

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

`exposure` oferece suporte a:

- `configured`: inclui o canal em superfícies de listagem no estilo configurado/status
- `setup`: inclui o canal em pickers interativos de setup/configuração
- `docs`: marca o canal como público em superfícies de docs/navegação

`showConfigured` e `showInSetup` continuam compatíveis como aliases legados. Prefira
`exposure`.

### `openclaw.install`

`openclaw.install` são metadados de pacote, não metadados de manifesto.

| Campo                        | Tipo                 | O que significa                                                                 |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Especificação npm canônica para fluxos de instalação/atualização.                |
| `localPath`                  | `string`             | Caminho local de desenvolvimento ou instalação empacotada.                       |
| `defaultChoice`              | `"npm"` \| `"local"` | Fonte de instalação preferida quando ambas estiverem disponíveis.                |
| `minHostVersion`             | `string`             | Versão mínima compatível do OpenClaw no formato `>=x.y.z`.                       |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que fluxos de reinstalação de plugin empacotado recuperem falhas específicas de configuração obsoleta. |

Se `minHostVersion` estiver definido, a instalação e o carregamento do registry de manifestos
ambos o aplicam. Hosts mais antigos ignoram o plugin; strings de versão inválidas são rejeitadas.

`allowInvalidConfigRecovery` não é um bypass geral para configurações quebradas. Ele serve
apenas para recuperação restrita de plugins empacotados, para que reinstalação/setup possam reparar restos conhecidos de upgrade, como um caminho ausente de plugin empacotado ou entrada obsoleta `channels.<id>`
desse mesmo plugin. Se a configuração estiver quebrada por motivos não relacionados, a instalação
ainda falha de forma fechada e orienta o operador a executar `openclaw doctor --fix`.

### Adiamento do carregamento completo

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

Quando habilitado, o OpenClaw carrega apenas `setupEntry` durante a fase de
inicialização antes do listen, mesmo para canais já configurados. A entrada completa carrega após o
gateway começar a escutar.

<Warning>
  Habilite o carregamento adiado somente quando seu `setupEntry` registrar tudo o que o
  gateway precisa antes de começar a escutar (registro de canal, rotas HTTP,
  métodos do gateway). Se a entrada completa controlar capabilities necessárias de inicialização, mantenha
  o comportamento padrão.
</Warning>

Se sua entrada de setup/completa registrar métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces reservados do core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) continuam sob controle do core e sempre resolvem
para `operator.admin`.

## Manifesto do plugin

Todo plugin nativo deve incluir um `openclaw.plugin.json` na raiz do pacote.
O OpenClaw usa isso para validar a configuração sem executar código do plugin.

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

Para plugins de canal, adicione `kind` e `channels`:

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

Mesmo plugins sem configuração devem incluir um schema. Um schema vazio é válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Consulte [Plugin Manifest](/pt-BR/plugins/manifest) para a referência completa do schema.

## Publicação no ClawHub

Para pacotes de plugin, use o comando específico de pacote do ClawHub:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

O alias legado de publicação somente de Skills é para Skills. Pacotes de plugin devem
sempre usar `clawhub package publish`.

## Entrada de setup

O arquivo `setup-entry.ts` é uma alternativa leve ao `index.ts` que
o OpenClaw carrega quando só precisa de superfícies de setup (onboarding, reparo de config,
inspeção de canal desabilitado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas de criptografia, registros de CLI,
serviços em segundo plano) durante fluxos de setup.

Canais empacotados de workspace que mantêm exports seguros para setup em módulos sidecar podem
usar `defineBundledChannelSetupEntry(...)` de
`openclaw/plugin-sdk/channel-entry-contract` em vez de
`defineSetupPluginEntry(...)`. Esse contrato empacotado também oferece suporte a um export opcional
`runtime`, para que a ligação de runtime em tempo de setup permaneça leve e explícita.

**Quando o OpenClaw usa `setupEntry` em vez da entrada completa:**

- O canal está desabilitado, mas precisa de superfícies de setup/onboarding
- O canal está habilitado, mas não configurado
- O carregamento adiado está habilitado (`deferConfiguredChannelFullLoadUntilAfterListen`)

**O que `setupEntry` deve registrar:**

- O objeto do Plugin de canal (via `defineSetupPluginEntry`)
- Quaisquer rotas HTTP necessárias antes do gateway escutar
- Quaisquer métodos do gateway necessários durante a inicialização

Esses métodos de gateway de inicialização ainda devem evitar namespaces reservados do core admin
como `config.*` ou `update.*`.

**O que `setupEntry` NÃO deve incluir:**

- Registros de CLI
- Serviços em segundo plano
- Imports pesados de runtime (crypto, SDKs)
- Métodos do gateway necessários apenas após a inicialização

### Imports estreitos de helpers de setup

Para caminhos quentes somente de setup, prefira os seams estreitos de helper de setup em vez do guarda-chuva mais amplo
`plugin-sdk/setup` quando você precisa apenas de parte da superfície de setup:

| Caminho de import                   | Use para                                                                                   | Exports principais                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helpers de runtime em tempo de setup que continuam disponíveis em `setupEntry` / inicialização adiada de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adaptadores de setup de conta sensíveis ao ambiente                                        | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | helpers de CLI/arquivo/docs para setup/instalação                                          | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                             |

Use o seam mais amplo `plugin-sdk/setup` quando quiser a caixa de ferramentas compartilhada completa de setup,
incluindo helpers de patch de configuração como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Os adaptadores de patch de setup continuam seguros para importação em caminho quente. O lookup do contrato empacotado
de promoção de conta única é lazy, então importar
`plugin-sdk/setup-runtime` não carrega antecipadamente a descoberta da superfície de contrato empacotada antes de o adaptador ser realmente usado.

### Promoção de conta única controlada pelo canal

Quando um canal é atualizado de uma configuração de nível superior de conta única para
`channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover valores promovidos com escopo de conta para `accounts.default`.

Canais empacotados podem restringir ou sobrescrever essa promoção por meio de sua superfície de contrato
de setup:

- `singleAccountKeysToMove`: chaves extras de nível superior que devem ser movidas para a
  conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, somente essas
  chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na
  raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente
  recebe os valores promovidos

O Matrix é o exemplo empacotado atual. Se exatamente uma conta nomeada do Matrix
já existir, ou se `defaultAccount` apontar para uma chave não canônica existente
como `Ops`, a promoção preserva essa conta em vez de criar uma nova entrada
`accounts.default`.

## Schema de configuração

A configuração do plugin é validada contra o JSON Schema no seu manifesto. Usuários
configuram plugins por meio de:

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

Seu plugin recebe essa configuração como `api.pluginConfig` durante o registro.

Para configuração específica de canal, use a seção de configuração do canal em vez disso:

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

### Construindo schemas de configuração de canal

Use `buildChannelConfigSchema` de `openclaw/plugin-sdk/core` para converter um
schema Zod no wrapper `ChannelConfigSchema` que o OpenClaw valida:

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

## Assistentes de configuração

Plugins de canal podem fornecer assistentes interativos de configuração para `openclaw onboard`.
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
Consulte pacotes de plugins empacotados (por exemplo o Plugin Discord em `src/channel.setup.ts`) para
exemplos completos.

Para prompts de allowlist de DM que só precisam do fluxo padrão
`note -> prompt -> parse -> merge -> patch`, prefira os helpers compartilhados de setup
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Para blocos de status de setup de canal que só variam por rótulos, pontuações e linhas extras opcionais, prefira `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` em vez de criar manualmente o mesmo objeto `status` em
cada plugin.

Para superfícies opcionais de setup que só devem aparecer em certos contextos, use
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

`plugin-sdk/channel-setup` também expõe os builders de nível inferior
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando você precisa apenas de uma metade
dessa superfície opcional de instalação.

O adaptador/assistente opcional gerado falha de forma fechada em gravações reais de configuração. Eles
reutilizam uma única mensagem de instalação obrigatória em `validateInput`,
`applyAccountConfig` e `finalize`, e acrescentam um link de docs quando `docsPath` está
definido.

Para UIs de setup apoiadas por binário, prefira os helpers compartilhados delegados em vez de
copiar a mesma cola de binário/status para cada canal:

- `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos,
  dicas, pontuações e detecção de binário
- `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar para
  um assistente completo mais pesado de forma lazy
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` só precisa
  delegar uma decisão de `textInputs[*].shouldPrompt`

## Publicação e instalação

**Plugins externos:** publique em [ClawHub](/pt-BR/tools/clawhub) ou npm e depois instale:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

O OpenClaw tenta primeiro o ClawHub e recorre ao npm automaticamente. Você também pode
forçar explicitamente o ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # somente ClawHub
```

Não existe um sobrescritor correspondente `npm:`. Use a especificação normal de pacote npm quando
quiser o caminho npm após o fallback do ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins no repositório:** coloque-os sob a árvore de workspace de plugins empacotados e eles serão descobertos automaticamente
durante o build.

**Usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalações vindas do npm, `openclaw plugins install` executa
  `npm install --ignore-scripts` (sem scripts de ciclo de vida). Mantenha as árvores de dependência
  do plugin puras em JS/TS e evite pacotes que exijam builds em `postinstall`.
</Info>

Plugins empacotados de propriedade do OpenClaw são a única exceção de reparo na inicialização: quando uma
instalação empacotada encontra um deles habilitado pela configuração de plugin, configuração legada de canal ou seu manifesto empacotado com padrão habilitado, a inicialização instala as dependências de runtime ausentes desse plugin antes do import. Plugins de terceiros não devem depender de instalações na inicialização; continue usando o instalador explícito de plugins.

## Relacionado

- [SDK Entry Points](/pt-BR/plugins/sdk-entrypoints) -- `definePluginEntry` e `defineChannelPluginEntry`
- [Plugin Manifest](/pt-BR/plugins/manifest) -- referência completa do schema do manifesto
- [Building Plugins](/pt-BR/plugins/building-plugins) -- guia passo a passo para começar
