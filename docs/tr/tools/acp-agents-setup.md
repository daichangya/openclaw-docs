---
read_when:
    - Claude Code / Codex / Gemini CLI için acpx harness'ı kurma veya yapılandırma
    - plugin-tools veya OpenClaw-tools MCP köprüsünü etkinleştirme
    - ACP izin modlarını yapılandırma
summary: 'ACP ajanlarını ayarlama: acpx harness yapılandırması, Plugin kurulumu, izinler'
title: ACP ajanları — kurulum
x-i18n:
    generated_at: "2026-04-25T13:58:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Genel bakış, operatör çalışma kılavuzu ve kavramlar için bkz. [ACP ajanları](/tr/tools/acp-agents).

Aşağıdaki bölümler acpx harness yapılandırmasını, MCP köprüleri için Plugin kurulumunu ve izin yapılandırmasını kapsar.

## acpx harness desteği (güncel)

Mevcut acpx yerleşik harness takma adları:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

OpenClaw, acpx arka ucunu kullandığında, acpx yapılandırmanız özel ajan takma adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz ACP'yi hâlâ `agent acp` olarak sunuyorsa, yerleşik varsayılanı değiştirmek yerine acpx yapılandırmanızda `cursor` ajan komutunu geçersiz kılın.

Doğrudan acpx CLI kullanımı, `--agent <command>` aracılığıyla isteğe bağlı bağdaştırıcıları da hedefleyebilir, ancak bu ham kaçış kapağı normal OpenClaw `agentId` yolu değil, bir acpx CLI özelliğidir.

## Gerekli yapılandırma

Temel ACP tabanı:

```json5
{
  acp: {
    enabled: true,
    // İsteğe bağlı. Varsayılan true değeridir; /acp denetimlerini korurken ACP dağıtımını duraklatmak için false ayarlayın.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

İş parçacığı bağlama yapılandırması kanal bağdaştırıcısına özeldir. Discord için örnek:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

İş parçacığına bağlı ACP başlatma çalışmıyorsa önce bağdaştırıcı özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Mevcut konuşma bağları, alt iş parçacığı oluşturmayı gerektirmez. Etkin bir konuşma bağlamı ve ACP konuşma bağlarını sunan bir kanal bağdaştırıcısı gerektirir.

Bkz. [Yapılandırma Başvurusu](/tr/gateway/configuration-reference).

## acpx arka ucu için Plugin kurulumu

Yeni kurulumlar, paketle gelen `acpx` çalışma zamanı Plugin'i varsayılan olarak etkin halde gönderir, bu nedenle ACP
genellikle manuel bir Plugin kurulum adımı olmadan çalışır.

Şununla başlayın:

```text
/acp doctor
```

`acpx` devre dışı bıraktıysanız, `plugins.allow` / `plugins.deny` ile engellediyseniz veya
yerel bir geliştirme checkout'una geçmek istiyorsanız, açık Plugin yolunu kullanın:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Geliştirme sırasında yerel çalışma alanı kurulumu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Ardından arka uç durumunu doğrulayın:

```text
/acp doctor
```

### acpx komut ve sürüm yapılandırması

Varsayılan olarak paketle gelen `acpx` Plugin'i, Plugin'e yerel sabitlenmiş ikilisini kullanır (Plugin paketi içindeki `node_modules/.bin/acpx`). Başlangıçta arka uç hazır değil olarak kaydedilir ve bir arka plan işi `acpx --version` doğrular; ikili eksikse veya eşleşmiyorsa `npm install --omit=dev --no-save acpx@<pinned>` çalıştırır ve yeniden doğrular. Gateway tüm süreç boyunca engellemesiz kalır.

Komutu veya sürümü Plugin yapılandırmasında geçersiz kılın:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command`, mutlak yol, göreli yol (OpenClaw çalışma alanından çözülür) veya komut adı kabul eder.
- `expectedVersion: "any"` katı sürüm eşleştirmesini devre dışı bırakır.
- Özel `command` yolları, Plugin'e yerel otomatik kurulumu devre dışı bırakır.

Bkz. [Plugin'ler](/tr/tools/plugin).

### Otomatik bağımlılık kurulumu

OpenClaw'u `npm install -g openclaw` ile genel olarak kurduğunuzda, acpx
çalışma zamanı bağımlılıkları (platforma özgü ikililer) bir postinstall kancası aracılığıyla
otomatik olarak kurulur. Otomatik kurulum başarısız olursa, gateway yine de normal
şekilde başlar ve eksik bağımlılığı `openclaw acp doctor` üzerinden bildirir.

### Plugin araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, OpenClaw tarafından Plugin kaydı yapılmış araçları
ACP harness'e **sunmaz**.

Codex veya Claude Code gibi ACP ajanlarının, yüklü
OpenClaw Plugin araçlarını, örneğin bellek çağırma/depolama araçlarını çağırmasını istiyorsanız, özel köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bunun yaptığı:

- Yerleşik `openclaw-plugin-tools` adlı bir MCP sunucusunu ACPX oturum
  önyüklemesine enjekte eder.
- Kurulu ve etkin OpenClaw
  Plugin'leri tarafından zaten kaydedilmiş Plugin araçlarını sunar.
- Özelliği açık ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP harness araç yüzeyini genişletir.
- ACP ajanları yalnızca gateway'de zaten etkin olan Plugin araçlarına erişir.
- Bunu, bu Plugin'lerin OpenClaw'un kendisinde çalışmasına izin vermekle aynı güven sınırı olarak değerlendirin.
- Etkinleştirmeden önce kurulu Plugin'leri gözden geçirin.

Özel `mcpServers` her zamanki gibi çalışmaya devam eder. Yerleşik plugin-tools köprüsü,
genel MCP sunucusu yapılandırmasının yerine geçen bir çözüm değil, ek bir isteğe bağlı kolaylıktır.

### OpenClaw araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, yerleşik OpenClaw araçlarını da MCP üzerinden
sunmaz. Bir ACP ajanı `cron` gibi seçili
yerleşik araçlara ihtiyaç duyduğunda ayrı çekirdek araçları köprüsünü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Bunun yaptığı:

- Yerleşik `openclaw-tools` adlı bir MCP sunucusunu ACPX oturum
  önyüklemesine enjekte eder.
- Seçili yerleşik OpenClaw araçlarını sunar. İlk sunucu `cron` aracını sunar.
- Çekirdek araçların sunulmasını açık ve varsayılan olarak kapalı tutar.

### Çalışma zamanı zaman aşımı yapılandırması

Paketle gelen `acpx` Plugin'i, gömülü çalışma zamanı dönüşleri için varsayılan olarak 120 saniyelik
bir zaman aşımı kullanır. Bu, Gemini CLI gibi daha yavaş harness'lere
ACP başlatma ve ilklendirmeyi tamamlamak için yeterli süre verir. Barındırıcınız farklı
bir çalışma zamanı sınırına ihtiyaç duyuyorsa bunu geçersiz kılın:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Bu değeri değiştirdikten sonra Gateway'i yeniden başlatın.

### Durum yoklama ajanı yapılandırması

Paketle gelen `acpx` Plugin'i, gömülü çalışma zamanı arka ucunun hazır olup olmadığını
belirlerken bir harness ajanını yoklar. `acp.allowedAgents` ayarlanmışsa varsayılan olarak
izin verilen ilk ajanı kullanır; aksi halde varsayılan `codex` olur. Dağıtımınızın
durum denetimleri için farklı bir ACP ajanına ihtiyacı varsa, yoklama ajanını açıkça ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Bu değeri değiştirdikten sonra Gateway'i yeniden başlatın.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır — dosya yazma ve kabuk yürütme izin istemlerini onaylamak veya reddetmek için TTY yoktur. acpx Plugin'i, izinlerin nasıl işleneceğini denetleyen iki yapılandırma anahtarı sağlar:

Bu ACPX harness izinleri, OpenClaw exec onaylarından ayrıdır ve Claude CLI `--permission-mode bypassPermissions` gibi CLI arka ucu sağlayıcı bayraklarından da ayrıdır. ACPX `approve-all`, ACP oturumları için harness düzeyindeki acil durum geçersiz kılma anahtarıdır.

### `permissionMode`

Harness ajanının istem göstermeden hangi işlemleri gerçekleştirebileceğini denetler.

| Değer          | Davranış                                                  |
| -------------- | --------------------------------------------------------- |
| `approve-all`  | Tüm dosya yazmaları ve kabuk komutlarını otomatik onaylar. |
| `approve-reads` | Yalnızca okumaları otomatik onaylar; yazmalar ve exec istem gerektirir. |
| `deny-all`     | Tüm izin istemlerini reddeder.                            |

### `nonInteractivePermissions`

İzin istemi gösterilecek olduğunda ancak etkileşimli bir TTY bulunmadığında ne olacağını denetler (ACP oturumları için durum her zaman böyledir).

| Değer | Davranış                                                         |
| ----- | ---------------------------------------------------------------- |
| `fail` | Oturumu `AcpRuntimeError` ile sonlandırır. **(varsayılan)**      |
| `deny` | İzni sessizce reddeder ve devam eder (zarif bozulma).            |

### Yapılandırma

Plugin yapılandırması üzerinden ayarlanır:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra Gateway'i yeniden başlatın.

> **Önemli:** OpenClaw şu anda varsayılan olarak `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` kullanır. Etkileşimsiz ACP oturumlarında, izin istemi tetikleyen herhangi bir yazma veya exec işlemi `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` hatasıyla başarısız olabilir.
>
> İzinleri kısıtlamanız gerekiyorsa, oturumların çökmesi yerine zarif şekilde bozulması için `nonInteractivePermissions` değerini `deny` olarak ayarlayın.

## İlgili

- [ACP ajanları](/tr/tools/acp-agents) — genel bakış, operatör çalışma kılavuzu, kavramlar
- [Alt ajanlar](/tr/tools/subagents)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
