---
read_when:
    - Yapılandırmayı etkileşimsiz olarak okumak veya düzenlemek istiyorsunuz
summary: '`openclaw config` için CLI başvurusu (get/set/unset/file/schema/validate)'
title: config
x-i18n:
    generated_at: "2026-04-23T08:59:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b496b6c02eeb144bfe800b801ea48a178b02bc7a87197dbf189b27d6fcf41c9
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

`openclaw.json` içinde etkileşimsiz düzenlemeler için yapılandırma yardımcıları: yol ile
get/set/unset/file/schema/validate değerleri ve etkin yapılandırma dosyasını yazdırma. Alt komut olmadan çalıştırıldığında
yapılandırma sihirbazını açar (`openclaw configure` ile aynı).

Kök seçenekleri:

- `--section <section>`: `openclaw config` komutunu alt komut olmadan çalıştırdığınızda tekrar edilebilir yönlendirmeli kurulum bölüm filtresi

Desteklenen yönlendirmeli bölümler:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Örnekler

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Üretilmiş `openclaw.json` JSON şemasını stdout'a JSON olarak yazdırır.

İçerdikleri:

- Geçerli kök yapılandırma şeması ve ayrıca editör araçları için kök `$schema` dize alanı
- Control UI tarafından kullanılan alan `title` ve `description` belge üst verisi
- İç içe nesne, joker (`*`) ve dizi öğesi (`[]`) düğümleri, eşleşen alan belgeleri mevcut olduğunda aynı `title` / `description` üst verisini devralır
- `anyOf` / `oneOf` / `allOf` dalları da, eşleşen alan belgeleri mevcut olduğunda aynı belge üst verisini devralır
- Çalışma zamanı manifest'leri yüklenebildiğinde en iyi çabayla canlı Plugin + kanal şema üst verisi
- Geçerli yapılandırma geçersiz olsa bile temiz bir geri dönüş şeması

İlgili çalışma zamanı RPC:

- `config.schema.lookup`, tek bir normalize yapılandırma yolunu; sığ bir
  şema düğümüyle (`title`, `description`, `type`, `enum`, `const`, yaygın sınırlar),
  eşleşmiş UI ipucu üst verisiyle ve doğrudan alt özetlerle döndürür. Bunu
  Control UI veya özel istemcilerde yola kapsamlı ayrıntılı inceleme için kullanın.

```bash
openclaw config schema
```

Başka araçlarla incelemek veya doğrulamak istediğinizde bunu bir dosyaya yönlendirin:

```bash
openclaw config schema > openclaw.schema.json
```

### Yollar

Yollar nokta veya köşeli ayraç gösterimini kullanır:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Belirli bir ajanı hedeflemek için ajan liste dizinini kullanın:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Değerler

Değerler mümkün olduğunda JSON5 olarak ayrıştırılır; aksi halde dize olarak ele alınır.
JSON5 ayrıştırmasını zorunlu kılmak için `--strict-json` kullanın. `--json` eski bir takma ad olarak desteklenmeye devam eder.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`, terminale biçimlendirilmiş metin yerine ham değeri JSON olarak yazdırır.

Nesne ataması varsayılan olarak hedef yolu değiştirir. Kullanıcı tarafından eklenen girdileri sıklıkla tutan korumalı eşleme/liste yolları;
örneğin `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` ve
`auth.profiles`; siz `--replace` geçmediğiniz sürece mevcut girdileri kaldıracak
değiştirmeleri reddeder.

Bu eşlemelere giriş eklerken `--merge` kullanın:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Sağlanan değerin
tam hedef değer olmasını bilerek istiyorsanız yalnızca `--replace` kullanın.

## `config set` kipleri

`openclaw config set`, dört atama stilini destekler:

1. Değer kipi: `openclaw config set <path> <value>`
2. SecretRef oluşturucu kipi:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Sağlayıcı oluşturucu kipi (`secrets.providers.<alias>` yolu için yalnızca):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Toplu kip (`--batch-json` veya `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

İlke notu:

- SecretRef atamaları, desteklenmeyen çalışma zamanında değiştirilebilir yüzeylerde reddedilir (örneğin `hooks.token`, `commands.ownerDisplaySecret`, Discord konu-bağlama Webhook token'ları ve WhatsApp creds JSON). Bkz. [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface).

Toplu ayrıştırma her zaman gerçek kaynak olarak toplu yükü (`--batch-json`/`--batch-file`) kullanır.
`--strict-json` / `--json`, toplu ayrıştırma davranışını değiştirmez.

JSON yol/değer kipi hem SecretRef'ler hem de sağlayıcılar için desteklenmeye devam eder:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Sağlayıcı Oluşturucu Bayrakları

Sağlayıcı oluşturucu hedefleri yol olarak `secrets.providers.<alias>` kullanmalıdır.

Ortak bayraklar:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env sağlayıcısı (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (tekrarlanabilir)

Dosya sağlayıcısı (`--provider-source file`):

- `--provider-path <path>` (zorunlu)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Exec sağlayıcısı (`--provider-source exec`):

- `--provider-command <path>` (zorunlu)
- `--provider-arg <arg>` (tekrarlanabilir)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (tekrarlanabilir)
- `--provider-pass-env <ENV_VAR>` (tekrarlanabilir)
- `--provider-trusted-dir <path>` (tekrarlanabilir)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Sertleştirilmiş exec sağlayıcısı örneği:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

`openclaw.json` yazmadan değişiklikleri doğrulamak için `--dry-run` kullanın.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Dry-run davranışı:

- Oluşturucu kipi: değişen ref'ler/sağlayıcılar için SecretRef çözülebilirlik denetimleri çalıştırır.
- JSON kipi (`--strict-json`, `--json` veya toplu kip): şema doğrulaması ile SecretRef çözülebilirlik denetimlerini çalıştırır.
- İlke doğrulaması, bilinen desteklenmeyen SecretRef hedef yüzeyleri için de çalışır.
- İlke denetimleri, değişiklik sonrası tam yapılandırmayı değerlendirir; dolayısıyla üst nesne yazımları (örneğin `hooks` değerini nesne olarak ayarlamak) desteklenmeyen yüzey doğrulamasını aşamaz.
- Komut yan etkilerinden kaçınmak için dry-run sırasında exec SecretRef denetimleri varsayılan olarak atlanır.
- Exec SecretRef denetimlerine katılmak için `--dry-run` ile birlikte `--allow-exec` kullanın (bu sağlayıcı komutlarını çalıştırabilir).
- `--allow-exec` yalnızca dry-run içindir ve `--dry-run` olmadan kullanılırsa hata verir.

`--dry-run --json`, makine tarafından okunabilir bir rapor yazdırır:

- `ok`: dry-run başarılı oldu mu
- `operations`: değerlendirilen atama sayısı
- `checks`: şema/çözülebilirlik denetimlerinin çalışıp çalışmadığı
- `checks.resolvabilityComplete`: çözülebilirlik denetimlerinin tamamlanıp tamamlanmadığı (exec ref'ler atlandığında false olur)
- `refsChecked`: dry-run sırasında gerçekten çözümlenen ref sayısı
- `skippedExecRefs`: `--allow-exec` ayarlanmadığı için atlanan exec ref sayısı
- `errors`: `ok=false` olduğunda yapılandırılmış şema/çözülebilirlik hataları

### JSON Çıktı Şekli

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // çözülebilirlik hataları için bulunur
    },
  ],
}
```

Başarı örneği:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

Başarısızlık örneği:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Dry-run başarısız olursa:

- `config schema validation failed`: değişiklik sonrası yapılandırma şekliniz geçersiz; yol/değer veya sağlayıcı/ref nesnesi şeklini düzeltin.
- `Config policy validation failed: unsupported SecretRef usage`: bu kimlik bilgisini yeniden düz metin/dize girdisine taşıyın ve SecretRef'leri yalnızca desteklenen yüzeylerde tutun.
- `SecretRef assignment(s) could not be resolved`: başvurulan sağlayıcı/ref şu anda çözümlenemiyor (eksik env değişkeni, geçersiz dosya işaretçisi, exec sağlayıcı hatası veya sağlayıcı/kaynak uyumsuzluğu).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run exec ref'leri atladı; exec çözülebilirlik doğrulaması gerekiyorsa `--allow-exec` ile yeniden çalıştırın.
- Toplu kip için, başarısız girdileri düzeltin ve yazmadan önce `--dry-run` komutunu yeniden çalıştırın.

## Yazma güvenliği

`openclaw config set` ve OpenClaw'a ait diğer yapılandırma yazıcıları, tam
değişiklik sonrası yapılandırmayı diske yazmadan önce doğrular. Yeni yük şema
doğrulamasında başarısız olursa veya yıkıcı bir üzerine yazma gibi görünürse, etkin yapılandırma olduğu gibi bırakılır
ve reddedilen yük yanında `openclaw.json.rejected.*` olarak kaydedilir.
Etkin yapılandırma yolu normal bir dosya olmalıdır. Symlink'li `openclaw.json`
düzenleri yazma için desteklenmez; bunun yerine doğrudan
gerçek dosyayı göstermek için `OPENCLAW_CONFIG_PATH` kullanın.

Küçük düzenlemeler için CLI yazımlarını tercih edin:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Bir yazma reddedilirse, kaydedilmiş yükü inceleyin ve tam yapılandırma şeklini düzeltin:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Doğrudan editör yazımları hâlâ izinlidir, ancak çalışan Gateway bunları
doğrulanana kadar güvenilmez olarak ele alır. Geçersiz doğrudan düzenlemeler, başlangıç veya hot reload sırasında
son bilinen iyi yedekten geri yüklenebilir. Bkz.
[Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Alt komutlar

- `config file`: Etkin yapılandırma dosyası yolunu yazdırır (`OPENCLAW_CONFIG_PATH` veya varsayılan konumdan çözümlenir). Yol bir symlink'i değil, normal bir dosyayı göstermelidir.

Düzenlemelerden sonra Gateway'i yeniden başlatın.

## Doğrulama

Gateway'i başlatmadan geçerli yapılandırmayı etkin şemaya göre doğrulayın.

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` başarıyla geçtikten sonra, yerel TUI'yi kullanarak
gömülü bir ajanın etkin yapılandırmayı belgelerle karşılaştırmasını sağlayabilir ve her değişikliği
aynı terminalden doğrulayabilirsiniz:

Doğrulama zaten başarısız oluyorsa, `openclaw configure` veya
`openclaw doctor --fix` ile başlayın. `openclaw chat`, geçersiz yapılandırma
korumasını aşmaz.

```bash
openclaw chat
```

Ardından TUI içinde:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Tipik onarım döngüsü:

- Ajandan mevcut yapılandırmanızı ilgili belge sayfasıyla karşılaştırmasını ve en küçük düzeltmeyi önermesini isteyin.
- Hedefli düzenlemeleri `openclaw config set` veya `openclaw configure` ile uygulayın.
- Her değişiklikten sonra `openclaw config validate` komutunu yeniden çalıştırın.
- Doğrulama geçerse ama çalışma zamanı hâlâ sağlıksızsa, geçiş ve onarım yardımı için `openclaw doctor` veya `openclaw doctor --fix` çalıştırın.
