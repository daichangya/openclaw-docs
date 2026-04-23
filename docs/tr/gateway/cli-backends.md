---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir yedek istersiniz
    - Codex CLI veya diğer yerel AI CLI'leri çalıştırıyorsunuz ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka ucu araç erişimi için MCP local loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsü ile yerel AI CLI yedeği'
title: CLI Arka Uçları
x-i18n:
    generated_at: "2026-04-23T14:56:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff7458d18b8a5b716930579241177917fd3edffcf7f6e211c7d570cf76519316
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI arka uçları (yedek çalışma zamanı)

OpenClaw, API sağlayıcıları kapalıyken, hız sınırına takıldığında veya geçici olarak hatalı davrandığında **metinle sınırlı bir yedek** olarak **yerel AI CLI'leri** çalıştırabilir. Bu kasıtlı olarak temkinli tasarlanmıştır:

- **OpenClaw araçları doğrudan eklenmez**, ancak `bundleMcp: true` olan arka uçlar döngüsel bir MCP köprüsü üzerinden gateway araçlarını alabilir.
- Bunu destekleyen CLI'ler için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip eden turlar tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler aktarılabilir**.

Bu, birincil yol olmaktan çok bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lere bağlı kalmadan “her zaman çalışır” metin yanıtları istediğinizde kullanın.

ACP oturum denetimleri, arka plan görevleri, iş parçacığı/konuşma bağlama ve kalıcı harici kodlama oturumları içeren tam bir harness çalışma zamanı istiyorsanız, bunun yerine [ACP Ajanları](/tr/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

## Başlangıç için hızlı kurulum

Codex CLI'yi **hiç yapılandırma olmadan** kullanabilirsiniz (paketlenmiş OpenAI plugin'i varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Gateway'niz launchd/systemd altında çalışıyorsa ve PATH sınırlıysa, yalnızca komut yolunu ekleyin:

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

Hepsi bu kadar. CLI'nin kendisinin ötesinde anahtar gerekmez, ek kimlik doğrulama yapılandırması gerekmez.

Paketlenmiş bir CLI arka ucunu bir gateway ana makinesinde **birincil mesaj sağlayıcısı** olarak kullanıyorsanız, OpenClaw artık yapılandırmanız bu arka uca bir model başvurusunda veya `agents.defaults.cliBackends` altında açıkça başvuruyorsa ilgili paketlenmiş plugin'i otomatik olarak yükler.

## Yedek olarak kullanma

Bir CLI arka ucunu yedek listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

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

- `agents.defaults.models` (izin verilenler listesi) kullanıyorsanız, CLI arka ucu modellerinizi de oraya eklemeniz gerekir.
- Birincil sağlayıcı başarısız olursa (kimlik doğrulama, hız sınırları, zaman aşımları), OpenClaw sırada CLI arka ucunu dener.

## Yapılandırmaya genel bakış

Tüm CLI arka uçları şurada bulunur:

```
agents.defaults.cliBackends
```

Her giriş bir **sağlayıcı kimliği** ile anahtarlanır (ör. `codex-cli`, `my-cli`).
Sağlayıcı kimliği model başvurunuzun sol tarafı olur:

```
<provider>/<model>
```

### Yapılandırma örneği

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
          // Codex tarzı CLI'ler bunun yerine bir prompt dosyasına işaret edebilir:
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

1. Sağlayıcı önekine göre (`codex-cli/...`) **bir arka uç seçer**.
2. Aynı OpenClaw prompt + çalışma alanı bağlamını kullanarak **bir sistem prompt'u oluşturur**.
3. Geçmiş tutarlı kalsın diye, destekleniyorsa, bir oturum kimliği ile **CLI'yi çalıştırır**.
   Paketlenmiş `claude-cli` arka ucu OpenClaw oturumu başına bir Claude stdio sürecini canlı tutar ve takip eden turları stream-json stdin üzerinden gönderir.
4. **Çıktıyı ayrıştırır** (JSON veya düz metin) ve son metni döndürür.
5. Takip eden istekler aynı CLI oturumunu yeniden kullansın diye arka uç başına **oturum kimliklerini kalıcılaştırır**.

<Note>
Paketlenmiş Anthropic `claude-cli` arka ucu yeniden desteklenmektedir. Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle Anthropic yeni bir politika yayımlamadıkça OpenClaw bu entegrasyon için `claude -p` kullanımını onaylı kabul eder.
</Note>

Paketlenmiş OpenAI `codex-cli` arka ucu OpenClaw'ın sistem prompt'unu Codex'in `model_instructions_file` yapılandırma geçersiz kılması üzerinden geçirir (`-c
model_instructions_file="..."`). Codex, Claude tarzı bir
`--append-system-prompt` bayrağı sunmadığından, OpenClaw her yeni Codex CLI oturumu için derlenen prompt'u geçici bir dosyaya yazar.

Paketlenmiş Anthropic `claude-cli` arka ucu OpenClaw Skills anlık görüntüsünü iki şekilde alır: eklenen sistem prompt'undaki derli toplu OpenClaw Skills kataloğu ve `--plugin-dir` ile geçirilen geçici bir Claude Code plugin'i. Plugin yalnızca o ajan/oturum için uygun Skills öğelerini içerir; böylece Claude Code'un yerel beceri çözücüsü, OpenClaw'ın aksi halde prompt'ta duyuracağı aynı filtrelenmiş kümeyi görür. Skill env/API anahtarı geçersiz kılmaları çalıştırma için alt süreç ortamına yine OpenClaw tarafından uygulanır.

OpenClaw paketlenmiş `claude-cli` arka ucunu kullanmadan önce, Claude Code'un kendisi aynı ana makinede zaten oturum açmış olmalıdır:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`claude` ikili dosyası zaten `PATH` üzerinde değilse yalnızca `agents.defaults.cliBackends.claude-cli.command` kullanın.

## Oturumlar

- CLI oturumları destekliyorsa, `sessionArg` (ör. `--session-id`) veya kimliğin birden fazla bayrağa eklenmesi gerektiğinde `sessionArgs` (`{sessionId}` yer tutucusu) ayarlayın.
- CLI farklı bayraklarla bir **resume alt komutu** kullanıyorsa, `resumeArgs` ayarlayın (`args` yerine geçer) ve isteğe bağlı olarak `resumeOutput` ayarlayın (JSON olmayan resume işlemleri için).
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (depolanmış yoksa yeni UUID).
  - `existing`: yalnızca daha önce depolanmışsa bir oturum kimliği gönderir.
  - `none`: asla oturum kimliği göndermez.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"` ve `input: "stdin"` kullanır; böylece takip eden turlar etkin olduğu sürece canlı Claude sürecini yeniden kullanır.
  Özel yapılandırmalar aktarım alanlarını atladığında da sıcak stdio artık varsayılandır. Gateway yeniden başlarsa veya boşta bekleyen süreç çıkarsa, OpenClaw depolanan Claude oturum kimliğinden devam eder. Depolanan oturum kimlikleri, devam etmeden önce mevcut ve okunabilir bir proje dökümüne karşı doğrulanır; böylece hayali bağlamalar `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine `reason=transcript-missing` ile temizlenir.
- Depolanan CLI oturumları sağlayıcıya ait sürekliliktir. Örtük günlük oturum sıfırlaması bunları kesmez; `/reset` ve açık `session.reset` ilkeleri keser.

Serileştirme notları:

- `serialize: true`, aynı lane'deki çalıştırmaların sıralı kalmasını sağlar.
- Çoğu CLI tek bir sağlayıcı lane'i üzerinde serileştirilir.
- OpenClaw, seçilen kimlik doğrulama kimliği değiştiğinde depolanan CLI oturumu yeniden kullanımını bırakır; buna değişmiş auth profil kimliği, statik API anahtarı, statik token veya CLI bunlardan birini açığa çıkarıyorsa OAuth hesap kimliği dahildir.
  OAuth erişim ve yenileme token'ı rotasyonu depolanan CLI oturumunu kesmez. Bir CLI kararlı bir OAuth hesap kimliği açığa çıkarmıyorsa, OpenClaw o CLI'nin resume izinlerini uygulamasına izin verir.

## Görüntüler (aktarım)

CLI'niz görüntü yollarını kabul ediyorsa, `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlanmışsa bu
yollar CLI argümanları olarak geçirilir. `imageArg` eksikse, OpenClaw dosya
yollarını prompt'a ekler (yol enjeksiyonu); bu, düz yollardan yerel dosyaları
otomatik yükleyen CLI'ler için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan) JSON ayrıştırmayı dener ve metin + oturum kimliğini çıkarır.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksik veya boş olduğunda yanıt metnini `response` içinden ve kullanımı `stats` içinden okur.
- `output: "jsonl"` JSONL akışlarını ayrıştırır (örneğin Codex CLI `--json`) ve mevcut olduğunda son ajan mesajını ve oturum tanımlayıcılarını çıkarır.
- `output: "text"` stdout'u son yanıt olarak ele alır.

Girdi modları:

- `input: "arg"` (varsayılan) prompt'u son CLI argümanı olarak geçirir.
- `input: "stdin"` prompt'u stdin üzerinden gönderir.
- Prompt çok uzunsa ve `maxPromptArgChars` ayarlanmışsa stdin kullanılır.

## Varsayılanlar (plugin'e ait)

Paketlenmiş OpenAI plugin'i ayrıca `codex-cli` için bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketlenmiş Google plugin'i ayrıca `google-gemini-cli` için bir varsayılan kaydeder:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Önkoşul: yerel Gemini CLI kurulmuş olmalı ve `PATH` üzerinde `gemini` olarak kullanılabilir olmalıdır (`brew install gemini-cli` veya `npm install -g @google/gemini-cli`).

Gemini CLI JSON notları:

- Yanıt metni JSON `response` alanından okunur.
- `usage` yoksa veya boşsa, kullanım için `stats` yedek olarak kullanılır.
- `stats.cached`, OpenClaw `cacheRead` biçimine normalize edilir.
- `stats.input` eksikse, OpenClaw girdi token'larını `stats.input_tokens - stats.cached` üzerinden türetir.

Yalnızca gerekirse geçersiz kılın (yaygın durum: mutlak `command` yolu).

## Plugin'e ait varsayılanlar

CLI arka ucu varsayılanları artık plugin yüzeyinin bir parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri model başvurularında sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` altındaki kullanıcı yapılandırması plugin varsayılanını yine geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı `normalizeConfig` hook'u üzerinden plugin'e ait kalır.

Küçük prompt/mesaj uyumluluk uyarlamalarına ihtiyaç duyan plugin'ler, bir sağlayıcıyı veya CLI arka ucunu değiştirmeden çift yönlü metin dönüşümleri tanımlayabilir:

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

`input`, CLI'ye geçirilen sistem prompt'unu ve kullanıcı prompt'unu yeniden yazar. `output`, OpenClaw kendi kontrol işaretçilerini ve kanal teslimini işlemeden önce akış halindeki asistan deltalarını ve ayrıştırılmış son metni yeniden yazar.

Claude Code stream-json ile uyumlu JSONL üreten CLI'ler için, o arka ucun yapılandırmasında `jsonlDialect: "claude-stream-json"` ayarlayın.

## Bundle MCP katmanları

CLI arka uçları OpenClaw araç çağrılarını **doğrudan** almaz, ancak bir arka uç `bundleMcp: true` ile oluşturulmuş bir MCP yapılandırma katmanını kullanmayı seçebilir.

Mevcut paketlenmiş davranış:

- `claude-cli`: oluşturulmuş katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları
- `google-gemini-cli`: oluşturulmuş Gemini sistem ayarları dosyası

Bundle MCP etkinleştirildiğinde OpenClaw:

- CLI sürecine gateway araçlarını sunan döngüsel bir HTTP MCP sunucusu başlatır
- köprüyü oturum başına bir token ile doğrular (`OPENCLAW_MCP_TOKEN`)
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkin bundle-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırması/ayar şekli ile birleştirir
- başlatma yapılandırmasını sahibi olan eklentinin sahip olduğu entegrasyon modunu kullanarak yeniden yazar

Hiçbir MCP sunucusu etkin değilse, OpenClaw bir arka uç bundle MCP'yi seçtiğinde arka plan çalıştırmaları yalıtılmış kalsın diye yine de katı bir yapılandırma ekler.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrıları yoktur.** OpenClaw, CLI arka ucu protokolüne araç çağrıları eklemez. Arka uçlar gateway araçlarını yalnızca `bundleMcp: true` seçtiklerinde görür.
- **Akış arka uca özeldir.** Bazı arka uçlar JSONL akışı yapar; diğerleri çıkışa kadar tamponlar.
- **Yapılandırılmış çıktılar** CLI'nin JSON biçimine bağlıdır.
- **Codex CLI oturumları** metin çıktısı üzerinden sürdürülür (JSONL yoktur); bu, ilk `--json` çalıştırmasına göre daha az yapılandırılmıştır. OpenClaw oturumları yine de normal çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI modeli eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlandığından ve `sessionMode` değerinin `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısı ile sürdüremez).
- **Görüntüler yok sayılıyor**: `imageArg` ayarlayın (ve CLI'nin dosya yollarını desteklediğini doğrulayın).
