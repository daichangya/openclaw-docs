---
read_when:
    - API provider'ları başarısız olduğunda güvenilir bir geri dönüş istiyorsunuz.
    - Codex CLI veya diğer yerel AI CLI'ları çalıştırıyorsunuz ve bunları yeniden kullanmak istiyorsunuz.
    - CLI arka ucu araç erişimi için MCP loopback köprüsünü anlamak istiyorsunuz.
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüne sahip yerel AI CLI geri dönüşü'
title: CLI Arka Uçları
x-i18n:
    generated_at: "2026-04-23T09:02:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI arka uçları (geri dönüş çalışma zamanı)

OpenClaw, API provider'lar kapalıyken,
hız sınırına takıldığında veya geçici olarak hatalı davrandığında **metin odaklı geri dönüş** olarak **yerel AI CLI'larını** çalıştırabilir. Bu özellikle temkinli şekilde tasarlanmıştır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true` olan arka uçlar
  Gateway araçlarını bir loopback MCP köprüsü üzerinden alabilir.
- Bunu destekleyen CLI'lar için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip eden dönüşler tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler iletilebilir**.

Bu, birincil yol olmaktan çok bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lere güvenmeden
“her zaman çalışan” metin yanıtları istediğinizde kullanın.

Tam bir harness çalışma zamanı; ACP oturum denetimleri, arka plan görevleri,
thread/konuşma bağlama ve kalıcı harici coding oturumları istiyorsanız
bunun yerine [ACP Agents](/tr/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

## Yeni başlayanlar için hızlı başlangıç

Codex CLI'ı **hiç yapılandırma olmadan** kullanabilirsiniz (paketli OpenAI Plugin'i
varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Gateway'iniz launchd/systemd altında çalışıyorsa ve PATH sınırlıysa, yalnızca
komut yolunu ekleyin:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Hepsi bu. CLI'ın kendisinin gerektirdiği şeylerin ötesinde anahtar, ek kimlik doğrulama yapılandırması gerekmez.

Paketli bir CLI arka ucunu Gateway host'unda **birincil mesaj provider'ı** olarak kullanırsanız,
yapılandırmanız bu arka uca açıkça bir model ref içinde veya
`agents.defaults.cliBackends` altında başvuruyorsa OpenClaw artık ilgili paketli Plugin'i otomatik yükler.

## Geri dönüş olarak kullanma

Bir CLI arka ucunu geri dönüş listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Notlar:

- `agents.defaults.models` (allowlist) kullanıyorsanız CLI arka ucu modellerinizi de oraya eklemelisiniz.
- Birincil provider başarısız olursa (kimlik doğrulama, hız sınırları, zaman aşımları), OpenClaw
  sırada CLI arka ucunu dener.

## Yapılandırmaya genel bakış

Tüm CLI arka uçları şunun altında bulunur:

```
agents.defaults.cliBackends
```

Her giriş bir **provider id** ile anahtarlanır (ör. `codex-cli`, `my-cli`).
Provider id, model ref'inizin sol tarafı olur:

```
<provider>/<model>
```

### Örnek yapılandırma

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // Codex tarzı CLI'lar bunun yerine bir istem dosyasına işaret edebilir:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Nasıl çalışır

1. Provider önekine göre (`codex-cli/...`) **bir arka uç seçer**.
2. Aynı OpenClaw istemi + çalışma alanı bağlamını kullanarak **bir sistem istemi oluşturur**.
3. Geçmiş tutarlı kalsın diye CLI'ı bir oturum kimliğiyle çalıştırır (destekleniyorsa).
   Paketli `claude-cli` arka ucu, her
   OpenClaw oturumu için bir Claude stdio sürecini canlı tutar ve takip eden dönüşleri stream-json stdin üzerinden gönderir.
4. **Çıktıyı ayrıştırır** (JSON veya düz metin) ve son metni döndürür.
5. **Oturum kimliklerini** arka uç başına kalıcılaştırır; böylece takip eden dönüşler aynı CLI oturumunu yeniden kullanır.

<Note>
Paketli Anthropic `claude-cli` arka ucu yeniden desteklenmektedir. Anthropic çalışanları
bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini
söyledi; bu nedenle Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw,
`claude -p` kullanımını bu entegrasyon için onaylanmış kabul eder.
</Note>

Paketli OpenAI `codex-cli` arka ucu, OpenClaw'un sistem istemini
Codex'in `model_instructions_file` yapılandırma geçersiz kılması (`-c
model_instructions_file="..."`) üzerinden geçirir. Codex, Claude tarzı
bir `--append-system-prompt` bayrağı sunmadığından OpenClaw, her yeni Codex CLI oturumu için birleştirilmiş istemi geçici bir dosyaya yazar.

Paketli Anthropic `claude-cli` arka ucu, OpenClaw Skills anlık görüntüsünü
iki yolla alır: eklenmiş sistem istemindeki kompakt OpenClaw Skills kataloğu ve
`--plugin-dir` ile geçirilen geçici bir Claude Code Plugin'i. Plugin yalnızca o agent/oturum için uygun Skills öğelerini içerir; böylece Claude Code'un yerel skill çözücüsü, OpenClaw'un istemde başka türlü duyuracağı aynı filtrelenmiş kümeyi görür. Skill env/API anahtarı geçersiz kılmaları yine de çalışma için alt süreç ortamına OpenClaw tarafından uygulanır.

## Oturumlar

- CLI oturumları destekliyorsa, oturum kimliğini birden çok bayrağa
  yerleştirmek gerektiğinde `sessionArg` (ör. `--session-id`) veya
  `sessionArgs` (`{sessionId}` yer tutucusu) ayarlayın.
- CLI, farklı bayraklarla **resume alt komutu** kullanıyorsa,
  `resumeArgs` (`resume` sırasında `args` yerine geçer) ve isteğe bağlı olarak
  `resumeOutput` (JSON olmayan resume durumları için) ayarlayın.
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (saklanmış yoksa yeni UUID).
  - `existing`: yalnızca daha önce bir oturum kimliği saklandıysa gönderir.
  - `none`: asla oturum kimliği göndermez.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"`
  ve `input: "stdin"` kullanır; böylece takip eden dönüşler etkin olduğu sürece
  canlı Claude sürecini yeniden kullanır. Sıcak stdio artık varsayılandır; taşıma alanlarını atlayan özel yapılandırmalarda da böyledir. Gateway yeniden başlarsa veya boşta duran süreç
  çıkarsa OpenClaw saklanan Claude oturum kimliğinden resume yapar. Saklanan oturum kimlikleri,
  resume öncesinde mevcut okunabilir bir proje transcript'ine karşı doğrulanır; böylece hayalet bağlar
  `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine `reason=transcript-missing`
  ile temizlenir.
- Saklanan CLI oturumları provider'a ait sürekliliktir. Örtük günlük oturum
  sıfırlaması bunları kesmez; `/reset` ve açık `session.reset` ilkeleri yine keser.

Serileştirme notları:

- `serialize: true`, aynı şeritli çalıştırmaları sıralı tutar.
- Çoğu CLI tek bir provider şeridinde serileştirilir.
- Seçilen kimlik doğrulama kimliği değiştiğinde OpenClaw saklanan CLI oturumu yeniden kullanımını bırakır;
  buna değişen auth profile id, statik API anahtarı, statik token veya CLI bunu sunuyorsa OAuth
  hesap kimliği dahildir. OAuth erişim ve yenileme token'ı
  dönüşümü saklanan CLI oturumunu kesmez. Bir CLI kararlı bir OAuth hesap kimliği sunmuyorsa,
  OpenClaw resume izinlerini o CLI'ın uygulamasına bırakır.

## Görüntüler (iletim)

CLI'ınız görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlanmışsa bu
yollar CLI bağımsız değişkenleri olarak geçirilir. `imageArg` eksikse OpenClaw
dosya yollarını isteme ekler (yol enjeksiyonu); bu, düz yollardan yerel dosyaları otomatik
yükleyen CLI'lar için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan), JSON ayrıştırmayı ve metin + oturum kimliği çıkarmayı dener.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksik veya boş olduğunda
  yanıt metnini `response` içinden ve kullanımı `stats` içinden okur.
- `output: "jsonl"`, JSONL akışlarını ayrıştırır (örneğin Codex CLI `--json`) ve son agent mesajını, varsa oturum
  tanımlayıcılarıyla birlikte çıkarır.
- `output: "text"`, stdout'u son yanıt olarak kabul eder.

Girdi modları:

- `input: "arg"` (varsayılan), istemi son CLI bağımsız değişkeni olarak geçirir.
- `input: "stdin"`, istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlanmışsa stdin kullanılır.

## Varsayılanlar (Plugin'e ait)

Paketli OpenAI Plugin'i ayrıca `codex-cli` için bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketli Google Plugin'i ayrıca `google-gemini-cli` için bir varsayılan kaydeder:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Ön koşul: yerel Gemini CLI kurulu olmalı ve `PATH` üzerinde
`gemini` olarak erişilebilir olmalıdır (`brew install gemini-cli` veya
`npm install -g @google/gemini-cli`).

Gemini CLI JSON notları:

- Yanıt metni JSON `response` alanından okunur.
- `usage` yoksa veya boşsa kullanım için `stats` geri dönüş olarak kullanılır.
- `stats.cached`, OpenClaw `cacheRead` içine normalize edilir.
- `stats.input` eksikse OpenClaw giriş token'larını
  `stats.input_tokens - stats.cached` üzerinden türetir.

Yalnızca gerektiğinde geçersiz kılın (yaygın durum: mutlak `command` yolu).

## Plugin'e ait varsayılanlar

CLI arka ucu varsayılanları artık Plugin yüzeyinin parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri, model ref'lerde provider öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine de Plugin varsayılanını geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı
  `normalizeConfig` kancası üzerinden Plugin'e ait kalır.

Küçük istem/mesaj uyumluluk uyarlamalarına ihtiyaç duyan Plugin'ler,
bir provider veya CLI arka ucunu değiştirmeden çift yönlü metin dönüşümleri bildirebilir:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input`, CLI'a geçirilen sistem istemini ve kullanıcı istemini yeniden yazar. `output`,
OpenClaw kendi denetim işaretleyicilerini ve kanal teslimatını ele almadan önce
akışlı assistant deltalarını ve ayrıştırılmış son metni yeniden yazar.

Claude Code stream-json uyumlu JSONL üreten CLI'lar için,
o arka ucun yapılandırmasında `jsonlDialect: "claude-stream-json"` ayarlayın.

## MCP paket bindirmeleri

CLI arka uçları OpenClaw araç çağrılarını **doğrudan** almaz, ancak bir arka uç
`bundleMcp: true` ile üretilmiş bir MCP yapılandırma bindirmesine katılabilir.

Geçerli paketli davranış:

- `claude-cli`: üretilmiş katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları
- `google-gemini-cli`: üretilmiş Gemini sistem ayarları dosyası

MCP paketi etkinleştirildiğinde OpenClaw:

- CLI sürecine Gateway araçlarını sunan bir loopback HTTP MCP sunucusu başlatır
- köprüyü oturum başına token ile kimlik doğrular (`OPENCLAW_MCP_TOKEN`)
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkin bundle-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırması/ayar biçimiyle birleştirir
- başlatma yapılandırmasını, ilgili extension'dan gelen arka uca ait entegrasyon modunu kullanarak yeniden yazar

Hiçbir MCP sunucusu etkin değilse bile, bir arka uç
bundle MCP'ye katıldığında OpenClaw yine de katı bir yapılandırma enjekte eder; böylece arka plan çalıştırmaları yalıtılmış kalır.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrıları yoktur.** OpenClaw, CLI arka ucu protokolüne
  araç çağrıları enjekte etmez. Arka uçlar Gateway araçlarını yalnızca
  `bundleMcp: true` seçeneğine katıldıklarında görür.
- **Akış arka uca özeldir.** Bazı arka uçlar JSONL akışı yapar; diğerleri
  çıkışa kadar tamponlar.
- **Yapılandırılmış çıktılar**, CLI'ın JSON biçimine bağlıdır.
- **Codex CLI oturumları**, metin çıktısı üzerinden resume eder (JSONL yoktur); bu,
  ilk `--json` çalıştırmasına göre daha az yapılandırılmıştır. OpenClaw oturumları yine de normal çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI model eşlemesi yapmak için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlandığından ve `sessionMode` değerinin
  `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla resume edemez).
- **Görüntüler yok sayılıyor**: `imageArg` ayarlayın (ve CLI'ın dosya yollarını desteklediğini doğrulayın).
