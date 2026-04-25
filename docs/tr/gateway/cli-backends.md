---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir geri dönüş istiyorsunuz
    - Codex CLI veya diğer yerel AI CLI'leri çalıştırıyorsunuz ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka uç araç erişimi için MCP loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsü ile yerel AI CLI geri dönüşü'
title: CLI arka uçları
x-i18n:
    generated_at: "2026-04-25T13:46:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a4651d7faf1ebafc66bda2e3ade6e541d59c9827f314169e1593e07f0bc2f5
    source_path: gateway/cli-backends.md
    workflow: 15
---

OpenClaw, API sağlayıcıları devre dışı kaldığında, hız sınırına takıldığında veya geçici olarak hatalı davrandığında **yerel AI CLI'leri** **yalnızca metin tabanlı bir geri dönüş** olarak çalıştırabilir. Bu tasarım bilinçli olarak muhafazakârdır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true` olan arka uçlar gateway araçlarını bir loopback MCP köprüsü üzerinden alabilir.
- Bunu destekleyen CLI'ler için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip turları tutarlı kalır).
- CLI görsel yollarını kabul ediyorsa **görseller iletilebilir**.

Bu, birincil yol olmaktan çok bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lere güvenmeden “her zaman çalışan” metin yanıtları istediğinizde kullanın.

ACP oturum denetimleri, arka plan görevleri, başlık/konuşma bağlama ve kalıcı harici kodlama oturumları içeren tam bir harness çalışma zamanı istiyorsanız bunun yerine [ACP Agents](/tr/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

## Başlangıç dostu hızlı başlangıç

Codex CLI'yi **hiç yapılandırma olmadan** kullanabilirsiniz (paketlenmiş OpenAI Plugin'i varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway'iniz launchd/systemd altında çalışıyorsa ve PATH minimal ise yalnızca komut yolunu ekleyin:

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

Hepsi bu kadar. CLI'nin kendisi dışında anahtar, ek kimlik doğrulama yapılandırması gerekmez.

Bir paketlenmiş CLI arka ucunu gateway ana makinesinde **birincil mesaj sağlayıcısı** olarak kullanırsanız OpenClaw artık yapılandırmanız bu arka uca bir model referansında veya `agents.defaults.cliBackends` altında açıkça başvurduğunda sahip paketlenmiş Plugin'i otomatik yükler.

## Geri dönüş olarak kullanma

Bir CLI arka ucunu geri dönüş listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Notlar:

- `agents.defaults.models` (izin listesi) kullanıyorsanız CLI arka uç modellerinizi de oraya eklemelisiniz.
- Birincil sağlayıcı başarısız olursa (kimlik doğrulama, hız sınırları, zaman aşımları), OpenClaw bir sonraki olarak CLI arka ucunu dener.

## Yapılandırma genel bakışı

Tüm CLI arka uçları şu konumda bulunur:

```
agents.defaults.cliBackends
```

Her girdi bir **sağlayıcı kimliği** ile anahtarlanır (ör. `codex-cli`, `my-cli`).
Sağlayıcı kimliği model referansınızın sol tarafı olur:

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
          // Ayrı bir prompt-file bayrağı olan CLI'ler için:
          // systemPromptFileArg: "--system-file",
          // Codex tarzı CLI'ler bunun yerine bir prompt dosyasını işaret edebilir:
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

1. Sağlayıcı önekine göre bir arka uç seçer (`codex-cli/...`).
2. Aynı OpenClaw prompt'u + çalışma alanı bağlamını kullanarak bir sistem prompt'u oluşturur.
3. Geçmiş tutarlı kalsın diye CLI'yi bir oturum kimliğiyle (destekleniyorsa) çalıştırır.
   Paketlenmiş `claude-cli` arka ucu, OpenClaw oturumu başına bir Claude stdio sürecini canlı tutar ve takip turlarını stream-json stdin üzerinden gönderir.
4. Çıktıyı ayrıştırır (JSON veya düz metin) ve son metni döndürür.
5. Takiplerin aynı CLI oturumunu yeniden kullanması için arka uç başına oturum kimliklerini kalıcılaştırır.

<Note>
Paketlenmiş Anthropic `claude-cli` arka ucu yeniden desteklenmektedir. Anthropic ekibi bize OpenClaw tarzı Claude CLI kullanımına tekrar izin verildiğini söyledi, bu yüzden Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw bu entegrasyon için `claude -p` kullanımını izinli kabul eder.
</Note>

Paketlenmiş OpenAI `codex-cli` arka ucu, OpenClaw'ın sistem prompt'unu Codex'in `model_instructions_file` yapılandırma geçersiz kılmasından geçirir (`-c model_instructions_file="..."`). Codex, Claude tarzı bir `--append-system-prompt` bayrağı sunmadığından OpenClaw her yeni Codex CLI oturumu için birleştirilmiş prompt'u geçici bir dosyaya yazar.

Paketlenmiş Anthropic `claude-cli` arka ucu OpenClaw Skills anlık görüntüsünü iki şekilde alır: eklenmiş sistem prompt'undaki kompakt OpenClaw Skills kataloğu ve `--plugin-dir` ile geçirilen geçici bir Claude Code Plugin'i. Plugin yalnızca o ajan/oturum için uygun Skills'i içerir; böylece Claude Code'un yerel skill çözücüsü, OpenClaw'ın normalde prompt'ta duyuracağı aynı filtrelenmiş kümeyi görür. Skill env/API anahtarı geçersiz kılmaları yine de çalıştırma için alt süreç ortamına OpenClaw tarafından uygulanır.

Claude CLI'nin kendi etkileşimsiz izin modu da vardır. OpenClaw, Claude'a özgü yapılandırma eklemek yerine bunu mevcut exec ilkesine eşler: etkin istenen exec ilkesi YOLO ise (`tools.exec.security: "full"` ve `tools.exec.ask: "off"`), OpenClaw `--permission-mode bypassPermissions` ekler. Ajan başına `agents.list[].tools.exec` ayarları, o ajan için genel `tools.exec` ayarını geçersiz kılar. Farklı bir Claude modunu zorlamak için `agents.defaults.cliBackends.claude-cli.args` altında ve eşleşen `resumeArgs` içinde `--permission-mode default` veya `--permission-mode acceptEdits` gibi açık ham arka uç argümanları ayarlayın.

OpenClaw paketlenmiş `claude-cli` arka ucunu kullanmadan önce Claude Code'un aynı ana makinede zaten oturum açmış olması gerekir:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`claude` ikilisi zaten `PATH` üzerinde değilse yalnızca `agents.defaults.cliBackends.claude-cli.command` kullanın.

## Oturumlar

- CLI oturumları destekliyorsa `sessionArg` (ör. `--session-id`) veya kimlik birden çok bayrağa eklenecekse `sessionArgs` (`{sessionId}` yer tutucusu) ayarlayın.
- CLI farklı bayraklarla bir **resume alt komutu** kullanıyorsa `resumeArgs` ayarlayın (resume sırasında `args` yerine geçer) ve isteğe bağlı olarak `resumeOutput` ayarlayın (JSON olmayan resume'lar için).
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (saklı yoksa yeni UUID).
  - `existing`: yalnızca daha önce bir oturum kimliği saklandıysa gönderir.
  - `none`: asla oturum kimliği göndermez.
- `claude-cli`, varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"` ve `input: "stdin"` kullanır; böylece takip turları etkin olduğu sürece canlı Claude sürecini yeniden kullanır. Sıcak stdio artık varsayılandır; taşıma alanlarını atlayan özel yapılandırmalar için de geçerlidir. Gateway yeniden başlarsa veya boşta süreç çıkarsa OpenClaw saklı Claude oturum kimliğinden devam eder. Saklı oturum kimlikleri resume öncesinde mevcut ve okunabilir bir proje transkriptine karşı doğrulanır; böylece hayalet bağlamalar `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine `reason=transcript-missing` ile temizlenir.
- Saklı CLI oturumları sağlayıcıya ait sürekliliktir. Örtük günlük oturum sıfırlaması bunları kesmez; `/reset` ve açık `session.reset` ilkeleri ise keser.

Serileştirme notları:

- `serialize: true`, aynı hattaki çalıştırmaları sıralı tutar.
- Çoğu CLI tek bir sağlayıcı hattında serileştirir.
- Seçilen kimlik doğrulama kimliği değiştiğinde OpenClaw saklı CLI oturum yeniden kullanımını bırakır; buna değişen auth profile kimliği, statik API anahtarı, statik token veya CLI bunu açığa çıkarıyorsa OAuth hesap kimliği dahildir. OAuth erişim ve yenileme token rotasyonu saklı CLI oturumunu kesmez. Bir CLI kararlı bir OAuth hesap kimliği açığa çıkarmıyorsa OpenClaw resume izinlerini o CLI'nin uygulamasına bırakır.

## Görseller (iletim)

CLI'niz görsel yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görselleri geçici dosyalara yazar. `imageArg` ayarlıysa bu yollar CLI argümanları olarak geçirilir. `imageArg` yoksa OpenClaw dosya yollarını prompt'a ekler (path injection); bu, düz yollardan yerel dosyaları otomatik yükleyen CLI'ler için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan), JSON ayrıştırmayı ve metin + oturum kimliği çıkarmayı dener.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksik veya boş olduğunda yanıt metnini `response` alanından ve kullanım bilgisini `stats` alanından okur.
- `output: "jsonl"`, JSONL akışlarını ayrıştırır (örneğin Codex CLI `--json`) ve varsa son ajan mesajını ve oturum tanımlayıcılarını çıkarır.
- `output: "text"`, stdout'u son yanıt olarak kabul eder.

Girdi modları:

- `input: "arg"` (varsayılan), prompt'u son CLI argümanı olarak geçirir.
- `input: "stdin"`, prompt'u stdin üzerinden gönderir.
- Prompt çok uzunsa ve `maxPromptArgChars` ayarlıysa stdin kullanılır.

## Varsayılanlar (Plugin'e ait)

Paketlenmiş OpenAI Plugin'i `codex-cli` için ayrıca bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketlenmiş Google Plugin'i `google-gemini-cli` için ayrıca bir varsayılan kaydeder:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Ön koşul: yerel Gemini CLI kurulu olmalı ve `PATH` üzerinde `gemini` olarak erişilebilir olmalıdır (`brew install gemini-cli` veya `npm install -g @google/gemini-cli`).

Gemini CLI JSON notları:

- Yanıt metni JSON `response` alanından okunur.
- Kullanım bilgisi, `usage` yoksa veya boşsa `stats` alanına geri döner.
- `stats.cached`, OpenClaw `cacheRead` alanına normalize edilir.
- `stats.input` eksikse OpenClaw giriş token'larını `stats.input_tokens - stats.cached` değerinden türetir.

Yalnızca gerektiğinde geçersiz kılın (yaygın durum: mutlak `command` yolu).

## Plugin'e ait varsayılanlar

CLI arka uç varsayılanları artık Plugin yüzeyinin bir parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id`, model referanslarında sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` altındaki kullanıcı yapılandırması yine de Plugin varsayılanını geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı `normalizeConfig` kancası üzerinden Plugin'e ait kalır.

Küçük prompt/mesaj uyumluluk katmanlarına ihtiyaç duyan Plugin'ler, bir sağlayıcıyı veya CLI arka ucunu değiştirmeden çift yönlü metin dönüşümleri bildirebilir:

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

`input`, CLI'ye geçirilen sistem prompt'unu ve kullanıcı prompt'unu yeniden yazar. `output`, OpenClaw kendi denetim işaretleyicilerini ve kanal teslimini işlemeden önce akış hâlindeki asistan deltalarını ve ayrıştırılmış son metni yeniden yazar.

Claude Code stream-json ile uyumlu JSONL üreten CLI'ler için, o arka ucun yapılandırmasında `jsonlDialect: "claude-stream-json"` ayarlayın.

## Bundle MCP katmanları

CLI arka uçları OpenClaw araç çağrılarını **doğrudan** almaz, ancak bir arka uç `bundleMcp: true` ile oluşturulmuş bir MCP yapılandırma katmanına katılmayı seçebilir.

Geçerli paketlenmiş davranış:

- `claude-cli`: oluşturulmuş katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları; oluşturulan OpenClaw loopback sunucusu, Codex'in sunucu başına araç onay modu ile işaretlenir; böylece MCP çağrıları yerel onay istemlerinde takılamaz
- `google-gemini-cli`: oluşturulmuş Gemini sistem ayarları dosyası

Bundle MCP etkin olduğunda OpenClaw:

- Gateway araçlarını CLI sürecine açan bir loopback HTTP MCP sunucusu başlatır
- Köprüyü oturum başına bir token ile kimlik doğrular (`OPENCLAW_MCP_TOKEN`)
- Araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- Geçerli çalışma alanı için etkin bundle-MCP sunucularını yükler
- Bunları mevcut arka uç MCP yapılandırması/ayar şekli ile birleştirir
- Başlatma yapılandırmasını sahip uzantının sahip olduğu entegrasyon modunu kullanarak yeniden yazar

Hiçbir MCP sunucusu etkin değilse, bir arka uç bundle MCP'ye katıldığında OpenClaw yine de katı bir yapılandırma enjekte eder; böylece arka plan çalıştırmaları yalıtılmış kalır.

Oturum kapsamlı paketlenmiş MCP çalışma zamanları, bir oturum içinde yeniden kullanım için önbelleğe alınır; ardından boşta geçen `mcp.sessionIdleTtlMs` milisaniyeden sonra toplanır (varsayılan 10 dakika; devre dışı bırakmak için `0` ayarlayın). Kimlik doğrulama incelemeleri, slug üretimi ve Active Memory geri çağırma isteği temizliği gibi tek seferlik gömülü çalıştırmalar, stdio alt süreçleri ve Streamable HTTP/SSE akışları çalıştırma süresini aşmasın diye çalıştırma sonunda temizleme ister.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrısı yoktur.** OpenClaw, CLI arka uç protokolüne araç çağrılarını enjekte etmez. Arka uçlar gateway araçlarını yalnızca `bundleMcp: true` seçtiklerinde görür.
- **Akış arka uca özeldir.** Bazı arka uçlar JSONL akışı yapar; diğerleri çıkışa kadar tamponlar.
- **Yapılandırılmış çıktılar**, CLI'nin JSON biçimine bağlıdır.
- **Codex CLI oturumları** metin çıktısı üzerinden devam eder (JSONL yoktur); bu, ilk `--json` çalıştırmasına göre daha az yapılandırılmıştır. OpenClaw oturumları yine normal şekilde çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI modeli eşlemesi yapmak için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlı olduğundan ve `sessionMode` değerinin `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla devam edemez).
- **Görseller yok sayılıyor**: `imageArg` ayarlayın (ve CLI'nin dosya yollarını desteklediğini doğrulayın).

## İlgili

- [Gateway runbook](/tr/gateway)
- [Yerel modeller](/tr/gateway/local-models)
