---
read_when:
    - Você está adicionando um assistente de setup a um plugin
    - Você precisa entender setup-entry.ts vs index.ts
    - Você está definindo schemas de configuração de plugin ou metadados openclaw no package.json
sidebarTitle: Setup and Config
summary: Assistentes de setup, setup-entry.ts, schemas de configuração e metadados do package.json
title: Setup e configuração de plugins
x-i18n:
    generated_at: "2026-04-05T12:50:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68fda27be1c89ea6ba906833113e9190ddd0ab358eb024262fb806746d54f7bf
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Setup e configuração de plugins

Referência para empacotamento de plugins (metadados em `package.json`), manifestos
(`openclaw.plugin.json`), entradas de setup e schemas de configuração.

<Tip>
  **Procurando um passo a passo?** Os guias práticos abordam o empacotamento em contexto:
  [Plugins de canal](/plugins/sdk-channel-plugins#step-1-package-and-manifest) e
  [Plugins de provedor](/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadados do pacote

Seu `package.json` precisa de um campo `openclaw` que informa ao sistema de plugins o que
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

**Plugin de provedor / baseline de publicação do ClawHub:**

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
serão obrigatórios. Os snippets canônicos de publicação ficam em
`docs/snippets/plugin-publish/`.

### Campos `openclaw`

| Campo        | Tipo       | Descrição                                                                                             |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Arquivos de entry point (relativos à raiz do pacote)                                                  |
| `setupEntry` | `string`   | Entry leve apenas para setup (opcional)                                                               |
| `channel`    | `object`   | Metadados do catálogo de canais para superfícies de setup, seletor, quickstart e status              |
| `providers`  | `string[]` | IDs de provedor registrados por este plugin                                                           |
| `install`    | `object`   | Dicas de instalação: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flags de comportamento de inicialização                                                               |

### `openclaw.channel`

`openclaw.channel` são metadados leves de pacote para descoberta de canal e
superfícies de setup antes do carregamento do runtime.

| Campo                                  | Tipo       | O que significa                                                                |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID canônico do canal.                                                          |
| `label`                                | `string`   | Rótulo principal do canal.                                                     |
| `selectionLabel`                       | `string`   | Rótulo no seletor/setup quando deve diferir de `label`.                        |
| `detailLabel`                          | `string`   | Rótulo de detalhe secundário para catálogos de canais e superfícies de status mais ricos. |
| `docsPath`                             | `string`   | Caminho da documentação para links de setup e seleção.                         |
| `docsLabel`                            | `string`   | Substitui o rótulo usado para links de documentação quando deve diferir do ID do canal. |
| `blurb`                                | `string`   | Descrição curta para onboarding/catálogo.                                      |
| `order`                                | `number`   | Ordem de classificação em catálogos de canais.                                 |
| `aliases`                              | `string[]` | Aliases extras de lookup para seleção de canal.                                |
| `preferOver`                           | `string[]` | IDs de plugin/canal de prioridade inferior que este canal deve superar.        |
| `systemImage`                          | `string`   | Nome opcional de ícone/system image para catálogos de UI de canal.             |
| `selectionDocsPrefix`                  | `string`   | Texto de prefixo antes dos links de documentação em superfícies de seleção.    |
| `selectionDocsOmitLabel`               | `boolean`  | Mostra o caminho da documentação diretamente em vez de um link rotulado na cópia de seleção. |
| `selectionExtras`                      | `string[]` | Strings curtas extras acrescentadas na cópia de seleção.                       |
| `markdownCapable`                      | `boolean`  | Marca o canal como compatível com Markdown para decisões de formatação de saída. |
| `showConfigured`                       | `boolean`  | Controla se superfícies de listagem de canais configurados mostram este canal. |
| `quickstartAllowFrom`                  | `boolean`  | Inclui este canal no fluxo padrão de setup `allowFrom` do quickstart.          |
| `forceAccountBinding`                  | `boolean`  | Exige vinculação explícita de conta mesmo quando existe apenas uma conta.      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prefere lookup de sessão ao resolver destinos de anúncio para este canal.      |

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
      "quickstartAllowFrom": true
    }
  }
}
```

### `openclaw.install`

`openclaw.install` é metadado do pacote, não metadado do manifesto.

| Campo                        | Tipo                 | O que significa                                                                  |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spec npm canônica para fluxos de instalação/atualização.                         |
| `localPath`                  | `string`             | Caminho de instalação local de desenvolvimento ou integrada.                      |
| `defaultChoice`              | `"npm"` \| `"local"` | Fonte de instalação preferida quando ambas estão disponíveis.                    |
| `minHostVersion`             | `string`             | Versão mínima compatível do OpenClaw no formato `>=x.y.z`.                       |
| `allowInvalidConfigRecovery` | `boolean`            | Permite que fluxos de reinstalação de plugins integrados recuperem falhas específicas de configuração obsoleta. |

Se `minHostVersion` estiver definido, tanto a instalação quanto o carregamento
do registro de manifesto o aplicarão. Hosts mais antigos ignoram o plugin; strings
de versão inválidas são rejeitadas.

`allowInvalidConfigRecovery` não é um bypass geral para configurações quebradas. Ele é
para recuperação estreita de plugins integrados apenas, para que reinstalação/setup
possa reparar sobras conhecidas de upgrade como um caminho ausente de plugin integrado
ou uma entrada obsoleta `channels.<id>` para esse mesmo plugin. Se a configuração estiver
quebrada por motivos não relacionados, a instalação ainda falhará de forma fechada e orientará o operador
a executar `openclaw doctor --fix`.

### Carga completa adiada

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

Quando habilitado, o OpenClaw carrega apenas `setupEntry` durante a fase de inicialização
pré-listen, mesmo para canais já configurados. A entrada completa é carregada depois que o
gateway começa a escutar.

<Warning>
  Ative o carregamento adiado somente quando seu `setupEntry` registrar tudo o que o
  gateway precisa antes de começar a escutar (registro de canal, rotas HTTP,
  métodos do gateway). Se a entrada completa for responsável por capacidades necessárias na inicialização, mantenha
  o comportamento padrão.
</Warning>

Se sua entrada de setup/completa registrar métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces administrativos reservados do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) continuam pertencendo ao core e sempre resolvem
para `operator.admin`.

## Manifesto do plugin

Todo plugin nativo deve incluir um `openclaw.plugin.json` na raiz do pacote.
O OpenClaw usa isso para validar a configuração sem executar o código do plugin.

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

Mesmo plugins sem configuração precisam incluir um schema. Um schema vazio é válido:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Veja [Manifesto do plugin](/plugins/manifest) para a referência completa do schema.

## Publicação no ClawHub

Para pacotes de plugin, use o comando do ClawHub específico para pacote:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

O alias legado de publicação apenas de skill é para Skills. Pacotes de plugin devem
sempre usar `clawhub package publish`.

## Entry de setup

O arquivo `setup-entry.ts` é uma alternativa leve ao `index.ts` que o
OpenClaw carrega quando precisa apenas de superfícies de setup (onboarding, reparo
de configuração, inspeção de canal desativado).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Isso evita carregar código pesado de runtime (bibliotecas de criptografia, registros de CLI,
serviços em segundo plano) durante fluxos de setup.

**Quando o OpenClaw usa `setupEntry` em vez da entrada completa:**

- O canal está desativado, mas precisa de superfícies de setup/onboarding
- O canal está habilitado, mas não configurado
- O carregamento adiado está habilitado (`deferConfiguredChannelFullLoadUntilAfterListen`)

**O que `setupEntry` deve registrar:**

- O objeto do plugin de canal (via `defineSetupPluginEntry`)
- Quaisquer rotas HTTP necessárias antes de o gateway começar a escutar
- Quaisquer métodos do gateway necessários durante a inicialização

Esses métodos do gateway de inicialização ainda devem evitar namespaces administrativos
reservados do core, como `config.*` ou `update.*`.

**O que `setupEntry` NÃO deve incluir:**

- Registros de CLI
- Serviços em segundo plano
- Imports pesados de runtime (crypto, SDKs)
- Métodos do gateway necessários apenas após a inicialização

### Imports estreitos de helpers de setup

Para caminhos quentes somente de setup, prefira as superfícies estreitas de helpers de setup em vez da
superfície guarda-chuva mais ampla `plugin-sdk/setup` quando você precisar apenas de parte da superfície de setup:

| Caminho de importação                | Use para                                                                                 | Exportações principais                                                                                                                                                                                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`           | helpers de runtime em tempo de setup que continuam disponíveis em `setupEntry` / inicialização adiada de canal | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime`   | adaptadores de setup de conta compatíveis com ambiente                                   | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`             | helpers de CLI/arquivo/docs de setup/instalação                                          | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                             |

Use a superfície mais ampla `plugin-sdk/setup` quando quiser a caixa de ferramentas completa
de setup compartilhado, incluindo helpers de patch de configuração como
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Os adaptadores de patch de setup continuam seguros para importação em caminho quente. O lookup da superfície de contrato
integrada para promoção de conta única é lazy, então importar
`plugin-sdk/setup-runtime` não carrega antecipadamente a descoberta da superfície de contrato integrada
antes de o adaptador realmente ser usado.

### Promoção de conta única pertencente ao canal

Quando um canal faz upgrade de uma configuração de nível superior de conta única para
`channels.<id>.accounts.*`, o comportamento compartilhado padrão é mover valores promovidos
com escopo de conta para `accounts.default`.

Canais integrados podem restringir ou substituir essa promoção por meio de sua
superfície de contrato de setup:

- `singleAccountKeysToMove`: chaves extras de nível superior que devem ser movidas para a
  conta promovida
- `namedAccountPromotionKeys`: quando contas nomeadas já existem, somente essas
  chaves são movidas para a conta promovida; chaves compartilhadas de política/entrega permanecem na
  raiz do canal
- `resolveSingleAccountPromotionTarget(...)`: escolhe qual conta existente
  recebe os valores promovidos

O Matrix é o exemplo integrado atual. Se já existir exatamente uma conta Matrix nomeada,
ou se `defaultAccount` apontar para uma chave não canônica existente
como `Ops`, a promoção preservará essa conta em vez de criar uma nova
entrada `accounts.default`.

## Schema de configuração

A configuração do plugin é validada em relação ao JSON Schema no seu manifesto. Os usuários
configuram plugins via:

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

### Criar schemas de configuração de canal

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

## Assistentes de setup

Plugins de canal podem fornecer assistentes de setup interativos para `openclaw onboard`.
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

O tipo `ChannelSetupWizard` aceita `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` e mais.
Veja pacotes de plugins integrados (por exemplo, o plugin Discord em `src/channel.setup.ts`) para
exemplos completos.

Para prompts de allowlist de DM que precisam apenas do fluxo padrão
`note -> prompt -> parse -> merge -> patch`, prefira os helpers de setup compartilhados
de `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` e
`createNestedChannelParsedAllowFromPrompt(...)`.

Para blocos de status de setup de canal que variam apenas por rótulos, pontuações e linhas extras opcionais,
prefira `createStandardChannelSetupStatus(...)` de
`openclaw/plugin-sdk/setup` em vez de implementar manualmente o mesmo objeto `status` em
cada plugin.

Para superfícies de setup opcionais que devem aparecer apenas em certos contextos, use
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

`plugin-sdk/channel-setup` também expõe os construtores de nível mais baixo
`createOptionalChannelSetupAdapter(...)` e
`createOptionalChannelSetupWizard(...)` quando você precisa apenas de uma metade
dessa superfície de instalação opcional.

O adaptador/assistente opcional gerado falha de forma fechada em gravações reais de configuração. Eles
reutilizam uma única mensagem de instalação obrigatória em `validateInput`,
`applyAccountConfig` e `finalize`, e acrescentam um link para a documentação quando `docsPath` está
definido.

Para UIs de setup baseadas em binários, prefira os helpers delegados compartilhados em vez de
copiar a mesma lógica de binário/status em cada canal:

- `createDetectedBinaryStatus(...)` para blocos de status que variam apenas por rótulos,
  dicas, pontuações e detecção de binário
- `createCliPathTextInput(...)` para entradas de texto baseadas em caminho
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` e
  `createDelegatedResolveConfigured(...)` quando `setupEntry` precisa encaminhar de forma lazy para
  um assistente completo mais pesado
- `createDelegatedTextInputShouldPrompt(...)` quando `setupEntry` precisa apenas
  delegar uma decisão `textInputs[*].shouldPrompt`

## Publicação e instalação

**Plugins externos:** publique no [ClawHub](/tools/clawhub) ou npm e depois instale:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

O OpenClaw tenta primeiro o ClawHub e faz fallback para npm automaticamente. Você também pode
forçar o ClawHub explicitamente:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

Não existe um override correspondente `npm:`. Use o spec normal do pacote npm quando
quiser o caminho npm após o fallback do ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins no repositório:** coloque-os na árvore de workspace de plugins integrados e eles serão descobertos automaticamente
durante o build.

**Os usuários podem instalar:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Para instalações vindas do npm, `openclaw plugins install` executa
  `npm install --ignore-scripts` (sem scripts de ciclo de vida). Mantenha a árvore de dependências do plugin
  em JS/TS puro e evite pacotes que exijam builds em `postinstall`.
</Info>

## Relacionado

- [Entry points do SDK](/plugins/sdk-entrypoints) -- `definePluginEntry` e `defineChannelPluginEntry`
- [Manifesto do plugin](/plugins/manifest) -- referência completa do schema do manifesto
- [Criando plugins](/plugins/building-plugins) -- guia passo a passo de introdução
