---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir geri dönüş istersiniz
    - Codex CLI veya diğer yerel AI CLI'larını çalıştırıyorsunuz ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka ucu araç erişimi için MCP loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel AI CLI geri dönüşü'
title: CLI Arka Uçları
x-i18n:
    generated_at: "2026-04-22T08:54:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3566d4f2b7a841473a4ed6379c1abd8dbd06c392dbff15ca37c4f8ea1e1ead51
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI arka uçları (geri dönüş çalışma zamanı)

OpenClaw, API sağlayıcıları kullanılamadığında, hız sınırına takıldığında
veya geçici olarak hatalı davrandığında **metinle sınırlı bir geri dönüş**
olarak **yerel AI CLI'larını** çalıştırabilir. Bu özellikle temkinli bir
tasarımdır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true`
  kullanan arka uçlar döngüsel MCP köprüsü üzerinden Gateway araçlarını
  alabilir.
- Bunu destekleyen CLI'lar için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip eden turlar tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler iletilebilir**.

Bu, birincil yol olmaktan ziyade bir **güvenlik ağı** olarak tasarlanmıştır.
Dış API'lere güvenmeden “her zaman çalışır” metin yanıtları istediğinizde bunu
kullanın.

ACP oturum denetimleri, arka plan görevleri, iş parçacığı/konuşma bağlama ve
kalıcı harici kodlama oturumları içeren tam bir harness çalışma zamanı
istiyorsanız bunun yerine [ACP Agents](/tr/tools/acp-agents) kullanın. CLI arka
uçları ACP değildir.

## Yeni başlayanlar için hızlı başlangıç

Codex CLI'ı **hiçbir yapılandırma olmadan** kullanabilirsiniz (paketlenmiş
OpenAI Plugin varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Gateway'niz launchd/systemd altında çalışıyorsa ve PATH sınırlıysa yalnızca
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

Hepsi bu kadar. CLI'ın kendisi dışında anahtar gerekmez, ek yetkilendirme
yapılandırması da gerekmez.

Paketlenmiş bir CLI arka ucunu bir Gateway ana makinesinde **birincil mesaj
sağlayıcısı** olarak kullanıyorsanız OpenClaw artık yapılandırmanız model
başvurusunda veya `agents.defaults.cliBackends` altında bu arka uca açıkça
başvurduğunda sahip olan paketlenmiş Plugin'i otomatik olarak yükler.

## Bunu geri dönüş olarak kullanma

Bir CLI arka ucunu geri dönüş listenize ekleyin; böylece yalnızca birincil
modeller başarısız olduğunda çalışır:

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

- `agents.defaults.models` (izin listesi) kullanıyorsanız CLI arka ucu
  modellerinizi de oraya eklemelisiniz.
- Birincil sağlayıcı başarısız olursa (yetkilendirme, hız sınırları, zaman
  aşımları), OpenClaw sıradaki CLI arka ucunu dener.

## Yapılandırmaya genel bakış

Tüm CLI arka uçları şunun altında bulunur:

```
agents.defaults.cliBackends
```

Her giriş bir **sağlayıcı kimliği** ile anahtarlanır (ör. `codex-cli`,
`my-cli`).
Sağlayıcı kimliği model başvurunuzun sol tarafı olur:

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

1. Sağlayıcı önekine (`codex-cli/...`) göre bir **arka uç seçer**.
2. Aynı OpenClaw istemi + çalışma alanı bağlamını kullanarak bir **sistem
   istemi oluşturur**.
3. Geçmiş tutarlı kalsın diye CLI'ı destekleniyorsa bir oturum kimliğiyle
   **çalıştırır**.
   Paketlenmiş `claude-cli` arka ucu, OpenClaw oturumu başına bir Claude stdio
   sürecini canlı tutar ve takip eden turları stream-json stdin üzerinden
   gönderir.
4. **Çıktıyı ayrıştırır** (JSON veya düz metin) ve son metni döndürür.
5. Takip eden istekler aynı CLI oturumunu yeniden kullansın diye arka uç başına
   **oturum kimliklerini kalıcı hale getirir**.

<Note>
Paketlenmiş Anthropic `claude-cli` arka ucu yeniden desteklenmektedir.
Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin
verildiğini söyledi; bu yüzden Anthropic yeni bir ilke yayımlamadığı sürece
OpenClaw, `claude -p` kullanımını bu entegrasyon için onaylı kabul eder.
</Note>

Paketlenmiş OpenAI `codex-cli` arka ucu, OpenClaw'ın sistem istemini Codex'in
`model_instructions_file` yapılandırma geçersiz kılması (`-c
model_instructions_file="..."`) üzerinden geçirir. Codex, Claude tarzı bir
`--append-system-prompt` bayrağı sunmadığı için OpenClaw her yeni Codex CLI
oturumu için derlenmiş istemi geçici bir dosyaya yazar.

Paketlenmiş Anthropic `claude-cli` arka ucu OpenClaw Skills anlık görüntüsünü
iki yolla alır: eklenen sistem istemindeki derli toplu OpenClaw Skills
kataloğu ve `--plugin-dir` ile geçirilen geçici bir Claude Code Plugin'i.
Plugin, yalnızca o aracı/oturum için uygun Skills öğelerini içerir; böylece
Claude Code'un yerel beceri çözücüsü, OpenClaw'ın aksi halde istemde
duyuracağı aynı filtrelenmiş kümeyi görür. Skill env/API anahtarı geçersiz
kılmaları yine de çalışma için alt süreç ortamına OpenClaw tarafından
uygulanır.

## Oturumlar

- CLI oturumları destekliyorsa `sessionArg` (ör. `--session-id`) veya kimliğin
  birden fazla bayrağa eklenmesi gerektiğinde `sessionArgs`
  (`{sessionId}` yer tutucusu) ayarlayın.
- CLI farklı bayraklarla bir **resume alt komutu** kullanıyorsa `resumeArgs`
  değerini ayarlayın (yeniden başlatırken `args` yerine geçer) ve isteğe bağlı
  olarak `resumeOutput` ayarlayın (JSON olmayan yeniden başlatmalar için).
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (saklı kimlik yoksa yeni
    UUID).
  - `existing`: yalnızca daha önce bir kimlik saklandıysa oturum kimliği
    gönderir.
  - `none`: hiçbir zaman oturum kimliği göndermez.
- Paketlenmiş `claude-cli` arka ucu `liveSession: "claude-stdio"` kullanır;
  böylece aktif olduğu sürece takip eden turlar canlı Claude sürecini yeniden
  kullanır. Gateway yeniden başlatılırsa veya boşta duran süreç kapanırsa
  OpenClaw saklı Claude oturum kimliğinden devam eder.

Serileştirme notları:

- `serialize: true`, aynı hat üzerindeki çalıştırmaların sıralı kalmasını
  sağlar.
- Çoğu CLI tek bir sağlayıcı hattında serileştirme yapar.
- Arka uç yetkilendirme durumu değiştiğinde, buna yeniden giriş, belirteç
  döndürme veya değişmiş bir yetkilendirme profili kimlik bilgisi dahil olmak
  üzere, OpenClaw saklı CLI oturumu yeniden kullanımını bırakır.

## Görüntüler (iletme)

CLI'ınız görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntülerini geçici dosyalara yazar. `imageArg` ayarlıysa bu
yollar CLI bağımsız değişkenleri olarak geçirilir. `imageArg` yoksa OpenClaw
dosya yollarını isteme ekler (yol ekleme); bu, düz yollardan yerel dosyaları
otomatik yükleyen CLI'lar için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan) JSON ayrıştırmayı dener ve metin + oturum
  kimliğini çıkarır.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksikse veya boşsa yanıt
  metnini `response` içinden ve kullanımı `stats` içinden okur.
- `output: "jsonl"` JSONL akışlarını ayrıştırır (örneğin Codex CLI `--json`)
  ve mevcutsa son aracı mesajını ve oturum tanımlayıcılarını çıkarır.
- `output: "text"` stdout'u son yanıt olarak ele alır.

Girdi modları:

- `input: "arg"` (varsayılan) istemi son CLI bağımsız değişkeni olarak geçirir.
- `input: "stdin"` istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlıysa stdin kullanılır.

## Varsayılanlar (Plugin tarafından sahiplenilir)

Paketlenmiş OpenAI Plugin'i `codex-cli` için de bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketlenmiş Google Plugin'i `google-gemini-cli` için de bir varsayılan
kaydeder:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Ön koşul: yerel Gemini CLI kurulmuş olmalı ve `PATH` üzerinde `gemini` olarak
erişilebilir olmalıdır (`brew install gemini-cli` veya
`npm install -g @google/gemini-cli`).

Gemini CLI JSON notları:

- Yanıt metni JSON içindeki `response` alanından okunur.
- `usage` yoksa veya boşsa kullanım `stats` alanına geri döner.
- `stats.cached`, OpenClaw `cacheRead` içine normalize edilir.
- `stats.input` eksikse OpenClaw giriş token'larını
  `stats.input_tokens - stats.cached` üzerinden türetir.

Yalnızca gerekirse geçersiz kılın (yaygın durum: mutlak `command` yolu).

## Plugin tarafından sahiplenilen varsayılanlar

CLI arka ucu varsayılanları artık Plugin yüzeyinin bir parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri model başvurularındaki sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine de
  Plugin varsayılanını geçersiz kılar.
- Arka uca özgü yapılandırma temizliği isteğe bağlı `normalizeConfig` kancası
  üzerinden Plugin sahipliğinde kalır.

Küçük istem/mesaj uyumluluk uyarlamaları gereken Plugin'ler, bir sağlayıcıyı
veya CLI arka ucunu değiştirmeden iki yönlü metin dönüşümleri tanımlayabilir:

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

`input`, CLI'a geçirilen sistem istemini ve kullanıcı istemini yeniden yazar.
`output`, OpenClaw kendi denetim işaretçilerini ve kanal teslimini
işlemeden önce akışlı yardımcı delta'larını ve ayrıştırılmış son metni yeniden
yazar.

Claude Code stream-json ile uyumlu JSONL üreten CLI'lar için o arka ucun
yapılandırmasında `jsonlDialect: "claude-stream-json"` ayarlayın.

## Bundle MCP katmanları

CLI arka uçları OpenClaw araç çağrılarını **doğrudan** almaz, ancak bir arka uç
`bundleMcp: true` ile oluşturulmuş bir MCP yapılandırma katmanını kullanmayı
seçebilir.

Mevcut paketlenmiş davranış:

- `claude-cli`: oluşturulmuş katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları
- `google-gemini-cli`: oluşturulmuş Gemini sistem ayarları dosyası

Bundle MCP etkin olduğunda OpenClaw:

- Gateway araçlarını CLI sürecine açığa çıkaran döngüsel HTTP MCP sunucusu
  başlatır
- köprüyü oturum başına belirteçle (`OPENCLAW_MCP_TOKEN`) doğrular
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkin bundle-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırması/ayar biçimiyle birleştirir
- başlatma yapılandırmasını sahip uzantının arka uç tarafından sahiplenilen
  entegrasyon modunu kullanarak yeniden yazar

Hiçbir MCP sunucusu etkin değilse bile bir arka uç bundle MCP'yi seçtiğinde
OpenClaw yine de katı bir yapılandırma enjekte eder; böylece arka plan
çalıştırmaları yalıtılmış kalır.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrıları yoktur.** OpenClaw, araç çağrılarını CLI
  arka ucu protokolüne enjekte etmez. Arka uçlar yalnızca `bundleMcp: true`
  seçtiklerinde Gateway araçlarını görür.
- **Akış arka uca özeldir.** Bazı arka uçlar JSONL akışı yapar, diğerleri çıkışa
  kadar arabelleğe alır.
- **Yapılandırılmış çıktılar** CLI'ın JSON biçimine bağlıdır.
- **Codex CLI oturumları** metin çıktısı üzerinden devam eder (JSONL yoktur);
  bu, ilk `--json` çalıştırmasına göre daha az yapılandırılmıştır. OpenClaw
  oturumları yine de normal çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI modeli eşlemesi için
  `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlı olduğundan ve `sessionMode`
  değerinin `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla
  devam edemez).
- **Görüntüler yok sayılıyor**: `imageArg` ayarlayın (ve CLI'ın dosya
  yollarını desteklediğini doğrulayın).
