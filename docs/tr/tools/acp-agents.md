---
read_when:
    - Kodlama harness'lerini ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumlarını ayarlama
    - Bir mesaj kanalı konuşmasını kalıcı bir ACP oturumuna bağlama
    - ACP arka ucu ve Plugin bağlantısında sorun giderme
    - Sohbetten `/acp` komutlarını kullanma
summary: Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP ve diğer harness aracılar için ACP çalışma zamanı oturumlarını kullanın
title: ACP Aracıları
x-i18n:
    generated_at: "2026-04-21T09:06:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e458ff21d63e52ed0eed4ed65ba2c45aecae20563a3ef10bf4b64e948284b51a
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP aracıları

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları, OpenClaw'ın harici kodlama harness'lerini (örneğin Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI ve desteklenen diğer ACPX harness'leri) bir ACP arka uç Plugin'i üzerinden çalıştırmasına izin verir.

OpenClaw'a doğal dilde "bunu Codex'te çalıştır" veya "bir thread içinde Claude Code başlat" derseniz, OpenClaw bu isteği yerel alt aracı çalışma zamanına değil ACP çalışma zamanına yönlendirmelidir. Her ACP oturumu başlatması bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

Codex veya Claude Code'un mevcut OpenClaw kanal konuşmalarına harici bir MCP istemcisi olarak doğrudan bağlanmasını istiyorsanız,
ACP yerine [`openclaw mcp serve`](/cli/mcp) kullanın.

## Hangi sayfayı istiyorum?

Kolayca karıştırılabilen üç yakın yüzey vardır:

| Şunu istiyorsunuz... | Bunu kullanın | Notlar |
| ---------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Codex, Claude Code, Gemini CLI veya başka bir harici harness'i OpenClaw _üzerinden_ çalıştırmak | Bu sayfa: ACP aracıları | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı denetimleri |
| Bir OpenClaw Gateway oturumunu bir editör veya istemci için ACP sunucusu _olarak_ açığa çıkarmak | [`openclaw acp`](/cli/acp) | Köprü modu. IDE/istemci stdio/WebSocket üzerinden OpenClaw ile ACP konuşur |
| Yerel bir AI CLI'yi yalnızca metin tabanlı bir geri dönüş modeli olarak yeniden kullanmak | [CLI Arka Uçları](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yok, ACP denetimleri yok, harness çalışma zamanı yok |

## Bu hazır olarak çalışır mı?

Genellikle evet.

- Yeni kurulumlar artık paketlenmiş `acpx` çalışma zamanı Plugin'i varsayılan olarak etkin şekilde gelir.
- Paketlenmiş `acpx` Plugin'i kendi plugin-yerel sabitlenmiş `acpx` ikili dosyasını tercih eder.
- Başlangıçta OpenClaw bu ikili dosyayı yoklar ve gerekirse kendi kendine onarır.
- Hızlı bir hazırlık denetimi istiyorsanız `/acp doctor` ile başlayın.

İlk kullanımda yine de olabilecekler:

- Bir hedef harness bağdaştırıcısı, o harness'i ilk kez kullandığınızda istek üzerine `npx` ile getirilebilir.
- O harness için üretici kimlik doğrulamasının yine de ana makinede mevcut olması gerekir.
- Ana makinede npm/ağ erişimi yoksa, önbellekler önceden ısıtılana veya bağdaştırıcı başka bir şekilde kurulana kadar ilk çalıştırma bağdaştırıcı getirmeleri başarısız olabilir.

Örnekler:

- `/acp spawn codex`: OpenClaw `acpx` önyüklemesini yapmaya hazır olmalıdır, ancak Codex ACP bağdaştırıcısının yine de ilk çalıştırma getirmesine ihtiyacı olabilir.
- `/acp spawn claude`: Claude ACP bağdaştırıcısı için de aynı durum geçerlidir, ayrıca o ana makinede Claude tarafı kimlik doğrulaması gerekir.

## Hızlı operatör akışı

Pratik bir `/acp` çalışma kitabı istediğinizde bunu kullanın:

1. Bir oturum başlatın:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Bağlı konuşmada veya thread içinde çalışın (ya da o oturum anahtarını açıkça hedefleyin).
3. Çalışma zamanı durumunu denetleyin:
   - `/acp status`
4. Gerektiğinde çalışma zamanı seçeneklerini ayarlayın:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Bağlamı değiştirmeden etkin bir oturumu yönlendirin:
   - `/acp steer tighten logging and continue`
6. Çalışmayı durdurun:
   - `/acp cancel` (geçerli dönüşü durdur), veya
   - `/acp close` (oturumu kapat + bağları kaldır)

## İnsanlar için hızlı başlangıç

Doğal istek örnekleri:

- "Bu Discord kanalını Codex'e bağla."
- "Burada bir thread içinde kalıcı bir Codex oturumu başlat ve odaklı tut."
- "Bunu tek seferlik bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
- "Bu iMessage sohbetini Codex'e bağla ve takipleri aynı çalışma alanında tut."
- "Bu görev için bir thread içinde Gemini CLI kullan, sonra takipleri aynı thread içinde tut."

OpenClaw'ın yapması gerekenler:

1. `runtime: "acp"` seçmek.
2. İstenen harness hedefini (`agentId`, örneğin `codex`) çözümlemek.
3. Geçerli konuşma bağlaması isteniyorsa ve etkin kanal bunu destekliyorsa, ACP oturumunu bu konuşmaya bağlamak.
4. Aksi takdirde, thread bağlaması isteniyorsa ve geçerli kanal bunu destekliyorsa, ACP oturumunu thread'e bağlamak.
5. Sonraki bağlı mesajları odak kaldırılana/kapatılana/süresi dolana kadar aynı ACP oturumuna yönlendirmek.

## ACP ve alt aracılar

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. OpenClaw yerel devredilmiş çalıştırmalar istediğinizde alt aracıları kullanın.

| Alan | ACP oturumu | Alt aracı çalıştırması |
| ------------- | ------------------------------------- | ---------------------------------- |
| Çalışma zamanı | ACP arka uç Plugin'i (örneğin acpx) | OpenClaw yerel alt aracı çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>` | `agent:<agentId>:subagent:<uuid>` |
| Ana komutlar | `/acp ...` | `/subagents ...` |
| Başlatma aracı | `runtime:"acp"` ile `sessions_spawn` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Alt aracılar](/tr/tools/subagents).

## ACP, Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için yığın şudur:

1. OpenClaw ACP oturumu denetim düzlemi
2. paketlenmiş `acpx` çalışma zamanı Plugin'i
3. Claude ACP bağdaştırıcısı
4. Claude tarafı çalışma zamanı/oturum mekanizması

Önemli ayrım:

- ACP Claude; ACP denetimleri, oturum sürdürme, arka plan görevi takibi ve isteğe bağlı konuşma/thread bağlaması olan bir harness oturumudur.
- CLI arka uçları ayrı, yalnızca metin tabanlı yerel geri dönüş çalışma zamanlarıdır. Bkz. [CLI Arka Uçları](/tr/gateway/cli-backends).

Operatörler için pratik kural şudur:

- `/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness işi istiyorsanız: ACP kullanın
- ham CLI üzerinden basit yerel metin geri dönüşü istiyorsanız: CLI arka uçlarını kullanın

## Bağlı oturumlar

### Geçerli konuşma bağları

Geçerli konuşmanın alt thread oluşturmadan kalıcı bir ACP çalışma alanı olmasını istediğinizde `/acp spawn <harness> --bind here` kullanın.

Davranış:

- OpenClaw kanal taşımasını, kimlik doğrulamayı, güvenliği ve teslimatı sahiplenmeye devam eder.
- Geçerli konuşma, başlatılan ACP oturum anahtarına sabitlenir.
- Bu konuşmadaki takip mesajları aynı ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, oturumu kapatır ve geçerli konuşma bağını kaldırır.

Bunun pratikte anlamı:

- `--bind here` aynı sohbet yüzeyini korur. Discord'da geçerli kanal aynı kanal olarak kalır.
- `--bind here`, yeni iş başlatıyorsanız yine de yeni bir ACP oturumu oluşturabilir. Bağ, bu oturumu geçerli konuşmaya iliştirir.
- `--bind here`, kendiliğinden alt Discord thread'i veya Telegram konusu oluşturmaz.
- ACP çalışma zamanı diskte yine de kendi çalışma dizinine (`cwd`) veya arka uç tarafından yönetilen çalışma alanına sahip olabilir. Bu çalışma zamanı çalışma alanı sohbet yüzeyinden ayrıdır ve yeni bir mesajlaşma thread'i anlamına gelmez.
- Başka bir ACP aracısına başlatıyor ve `--cwd` geçmiyorsanız, OpenClaw varsayılan olarak isteği yapanın değil **hedef aracının** çalışma alanını devralır.
- Bu devralınan çalışma alanı yolu eksikse (`ENOENT`/`ENOTDIR`), OpenClaw yanlış ağacı sessizce yeniden kullanmak yerine arka uç varsayılan cwd'sine geri döner.
- Devralınan çalışma alanı varsa ama erişilemiyorsa (örneğin `EACCES`), başlatma `cwd` düşürmek yerine gerçek erişim hatasını döndürür.

Zihinsel model:

- sohbet yüzeyi: insanların konuşmaya devam ettiği yer (`Discord channel`, `Telegram topic`, `iMessage chat`)
- ACP oturumu: OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu
- alt thread/konu: yalnızca `--thread ...` ile oluşturulan isteğe bağlı ek mesajlaşma yüzeyi
- çalışma zamanı çalışma alanı: harness'in çalıştığı dosya sistemi konumu (`cwd`, repo checkout, arka uç çalışma alanı)

Örnekler:

- `/acp spawn codex --bind here`: bu sohbeti koru, bir Codex ACP oturumu başlat veya iliştir ve gelecekteki mesajları burada ona yönlendir
- `/acp spawn codex --thread auto`: OpenClaw bir alt thread/konu oluşturabilir ve ACP oturumunu oraya bağlayabilir
- `/acp spawn codex --bind here --cwd /workspace/repo`: yukarıdakiyle aynı sohbet bağı, ancak Codex `/workspace/repo` içinde çalışır

Geçerli konuşma bağlama desteği:

- Geçerli konuşma bağlama desteği ilan eden sohbet/mesaj kanalları, paylaşılan konuşma bağlama yolu üzerinden `--bind here` kullanabilir.
- Özel thread/konu semantiği olan kanallar, yine aynı paylaşılan arayüzün arkasında kanala özgü kanonikleştirme sağlayabilir.
- `--bind here` her zaman "geçerli konuşmayı yerinde bağla" anlamına gelir.
- Genel geçerli konuşma bağları paylaşılan OpenClaw bağ deposunu kullanır ve normal Gateway yeniden başlatmalarında kalıcı olur.

Notlar:

- `/acp spawn` üzerinde `--bind here` ve `--thread ...` birbirini dışlar.
- Discord'da `--bind here`, geçerli kanalı veya thread'i yerinde bağlar. `spawnAcpSessions` yalnızca OpenClaw'ın `--thread auto|here` için alt thread oluşturması gerektiğinde gerekir.
- Etkin kanal geçerli konuşma ACP bağlarını açığa çıkarmıyorsa, OpenClaw açık bir desteklenmiyor mesajı döndürür.
- `resume` ve "new session" soruları kanal soruları değil, ACP oturum sorularıdır. Geçerli sohbet yüzeyini değiştirmeden çalışma zamanı durumunu yeniden kullanabilir veya değiştirebilirsiniz.

### Thread'e bağlı oturumlar

Bir kanal bağdaştırıcısında thread bağları etkinleştirildiğinde, ACP oturumları thread'lere bağlanabilir:

- OpenClaw bir thread'i hedef ACP oturumuna bağlar.
- O thread içindeki takip mesajları bağlı ACP oturumuna yönlendirilir.
- ACP çıktısı aynı thread'e geri teslim edilir.
- Odak kaldırma/kapatma/arşivleme/boşta kalma zaman aşımı veya azami yaş dolumu bağı kaldırır.

Thread bağlama desteği bağdaştırıcıya özeldir. Etkin kanal bağdaştırıcısı thread bağlarını desteklemiyorsa, OpenClaw açık bir desteklenmiyor/kullanılamıyor mesajı döndürür.

Thread'e bağlı ACP için gerekli özellik bayrakları:

- `acp.enabled=true`
- `acp.dispatch.enabled` varsayılan olarak açıktır (ACP dağıtımını duraklatmak için `false` ayarlayın)
- Kanal bağdaştırıcısı ACP thread başlatma bayrağı etkin (bağdaştırıcıya özgü)
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### Thread destekleyen kanallar

- Oturum/thread bağlama yeteneği sunan tüm kanal bağdaştırıcıları.
- Geçerli yerleşik destek:
  - Discord thread'leri/kanalları
  - Telegram konuları (grup/süpergruplardaki forum konuları ve DM konuları)
- Plugin kanalları aynı bağlama arayüzü üzerinden destek ekleyebilir.

## Kanala özgü ayarlar

Geçici olmayan iş akışları için kalıcı ACP bağlarını üst düzey `bindings[]` girdilerinde yapılandırın.

### Bağlama modeli

- `bindings[].type="acp"` kalıcı bir ACP konuşma bağını işaretler.
- `bindings[].match` hedef konuşmayı tanımlar:
  - Discord kanalı veya thread'i: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum konusu: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/grup sohbeti: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup bağları için `chat_id:*` veya `chat_identifier:*` tercih edin.
  - iMessage DM/grup sohbeti: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup bağları için `chat_id:*` tercih edin.
- `bindings[].agentId` sahip OpenClaw aracı kimliğidir.
- İsteğe bağlı ACP geçersiz kılmaları `bindings[].acp` altında bulunur:
  - `mode` (`persistent` veya `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Aracı başına çalışma zamanı varsayılanları

ACP varsayılanlarını aracı başına bir kez tanımlamak için `agents.list[].runtime` kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness kimliği, örneğin `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP'ye bağlı oturumlar için geçersiz kılma önceliği:

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. genel ACP varsayılanları (örneğin `acp.backend`)

Örnek:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

Davranış:

- OpenClaw, yapılandırılmış ACP oturumunun kullanımdan önce var olmasını sağlar.
- O kanal veya konudaki mesajlar yapılandırılmış ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağları (örneğin thread-focus akışları tarafından oluşturulanlar) mevcut oldukları yerde yine uygulanır.
- Açık bir `cwd` olmadan aracılar arası ACP başlatmalarında OpenClaw, hedef aracı çalışma alanını aracı yapılandırmasından devralır.
- Eksik devralınan çalışma alanı yolları arka uç varsayılan cwd'sine geri döner; eksik olmayan erişim hataları başlatma hataları olarak görünür.

## ACP oturumlarını başlatma (arayüzler)

### `sessions_spawn` içinden

Bir aracı dönüşünden veya araç çağrısından ACP oturumu başlatmak için `runtime: "acp"` kullanın.

```json
{
  "task": "Open the repo and summarize failing tests",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notlar:

- `runtime` varsayılan olarak `subagent` olur, bu yüzden ACP oturumları için açıkça `runtime: "acp"` ayarlayın.
- `agentId` atlanırsa, OpenClaw yapılandırılmışsa `acp.defaultAgent` kullanır.
- `mode: "session"`, kalıcı bağlı bir konuşmayı korumak için `thread: true` gerektirir.

Arayüz ayrıntıları:

- `task` (zorunlu): ACP oturumuna gönderilen ilk istem.
- `runtime` (ACP için zorunlu): `"acp"` olmalıdır.
- `agentId` (isteğe bağlı): ACP hedef harness kimliği. Ayarlanmışsa `acp.defaultAgent` değerine geri düşer.
- `thread` (isteğe bağlı, varsayılan `false`): desteklendiği yerde thread bağlama akışını ister.
- `mode` (isteğe bağlı): `run` (tek seferlik) veya `session` (kalıcı).
  - varsayılan `run` olur
  - `thread: true` ise ve mod atlanmışsa, OpenClaw çalışma zamanı yoluna göre varsayılan olarak kalıcı davranış kullanabilir
  - `mode: "session"` için `thread: true` gerekir
- `cwd` (isteğe bağlı): istenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı ilkesiyle doğrulanır). Atlanırsa ACP başlatma, yapılandırılmışsa hedef aracı çalışma alanını devralır; eksik devralınan yollar arka uç varsayılanlarına geri dönerken, gerçek erişim hataları döndürülür.
- `label` (isteğe bağlı): oturum/banner metninde kullanılan operatöre dönük etiket.
- `resumeSessionId` (isteğe bağlı): yeni bir oturum oluşturmak yerine mevcut bir ACP oturumunu sürdürür. Aracı konuşma geçmişini `session/load` üzerinden yeniden oynatır. `runtime: "acp"` gerektirir.
- `streamTo` (isteğe bağlı): `"parent"`, ilk ACP çalıştırma ilerleme özetlerini sistem olayları olarak istekte bulunan oturuma geri akıtır.
  - Mevcut olduğunda, kabul edilen yanıtlara tam aktarma geçmişi için takip edebileceğiniz oturum kapsamlı bir JSONL günlüğüne (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` dahil olur.

### Mevcut bir oturumu sürdürme

Yeni başlatmak yerine önceki bir ACP oturumunu sürdürmek için `resumeSessionId` kullanın. Aracı konuşma geçmişini `session/load` üzerinden yeniden oynatır, böylece önce gelenlerin tam bağlamıyla kaldığı yerden devam eder.

```json
{
  "task": "Continue where we left off — fix the remaining test failures",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Yaygın kullanım örnekleri:

- Bir Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devretmek — aracınıza kaldığınız yerden devam etmesini söyleyin
- CLI içinde etkileşimli olarak başlattığınız bir kodlama oturumunu şimdi aracınız üzerinden başsız biçimde sürdürmek
- Bir Gateway yeniden başlatması veya boşta kalma zaman aşımı nedeniyle kesintiye uğrayan işi devam ettirmek

Notlar:

- `resumeSessionId`, `runtime: "acp"` gerektirir — alt aracı çalışma zamanıyla kullanılırsa hata döndürür.
- `resumeSessionId`, üst akış ACP konuşma geçmişini geri yükler; `thread` ve `mode` yine oluşturduğunuz yeni OpenClaw oturumuna normal biçimde uygulanır, bu nedenle `mode: "session"` için yine `thread: true` gerekir.
- Hedef aracı `session/load` desteğine sahip olmalıdır (Codex ve Claude Code sahiptir).
- Oturum kimliği bulunamazsa, başlatma açık bir hatayla başarısız olur — yeni bir oturuma sessiz geri dönüş yapılmaz.

### Operatör smoke testi

Bir Gateway dağıtımından sonra ACP başlatmanın yalnızca birim testlerini
geçmediğini, gerçekten uçtan uca çalıştığını hızlıca canlı denetlemek istediğinizde bunu kullanın.

Önerilen geçit:

1. Hedef ana makinede dağıtılan Gateway sürümünü/commit'ini doğrulayın.
2. Dağıtılan kaynağın
   `src/gateway/sessions-patch.ts` içinde ACP soy kabulünü içerdiğini doğrulayın (`subagent:* or acp:* sessions`).
3. Canlı bir aracıya (örneğin
   `jpclawhq` üzerindeki `razor(main)`) geçici bir ACPX köprü oturumu açın.
4. O aracıdan şunlarla `sessions_spawn` çağırmasını isteyin:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - görev: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Aracının şunları bildirdiğini doğrulayın:
   - `accepted=yes`
   - gerçek bir `childSessionKey`
   - doğrulayıcı hatası yok
6. Geçici ACPX köprü oturumunu temizleyin.

Canlı aracıya örnek istem:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notlar:

- Bu smoke testini, özellikle thread'e bağlı kalıcı ACP oturumlarını test etmiyorsanız,
  `mode: "run"` üzerinde tutun.
- Temel geçit için `streamTo: "parent"` zorunlu tutmayın. Bu yol
  istekte bulunan/oturum yeteneklerine bağlıdır ve ayrı bir entegrasyon denetimidir.
- Thread'e bağlı `mode: "session"` testini gerçek bir Discord thread'i veya Telegram konusunda
  ikinci, daha zengin bir entegrasyon geçişi olarak ele alın.

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox'ı içinde değil, ana makine çalışma zamanında çalışır.

Geçerli sınırlamalar:

- İsteği yapan oturum sandbox içindeyse, ACP başlatmaları hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
  - Hata: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteğine sahip değildir.
  - Hata: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Sandbox zorlamalı yürütmeye ihtiyacınız olduğunda `runtime: "subagent"` kullanın.

### `/acp` komutundan

Gerektiğinde sohbetten açık operatör denetimi için `/acp spawn` kullanın.

```text
/acp spawn codex --mode persistent --thread auto
/acp spawn codex --mode oneshot --thread off
/acp spawn codex --bind here
/acp spawn codex --thread here
```

Temel bayraklar:

- `--mode persistent|oneshot`
- `--bind here|off`
- `--thread auto|here|off`
- `--cwd <absolute-path>`
- `--label <name>`

Bkz. [Slash Komutları](/tr/tools/slash-commands).

## Oturum hedefi çözümleme

Çoğu `/acp` eylemi isteğe bağlı bir oturum hedefini kabul eder (`session-key`, `session-id` veya `session-label`).

Çözümleme sırası:

1. Açık hedef argümanı (veya `/acp steer` için `--session`)
   - önce anahtarı dener
   - sonra UUID biçimli oturum kimliğini
   - sonra etiketi
2. Geçerli thread bağı (bu konuşma/thread bir ACP oturumuna bağlıysa)
3. Geçerli istekte bulunan oturumu geri dönüşü

Geçerli konuşma bağları ve thread bağları ikisi de 2. adıma katılır.

Hedef çözümlenemezse, OpenClaw açık bir hata döndürür (`Unable to resolve session target: ...`).

## Başlatma bağ modları

`/acp spawn`, `--bind here|off` destekler.

| Mod | Davranış |
| ------ | ---------------------------------------------------------------------- |
| `here` | Geçerli etkin konuşmayı yerinde bağlar; etkin konuşma yoksa başarısız olur. |
| `off` | Geçerli konuşma bağı oluşturmaz. |

Notlar:

- `--bind here`, "bu kanalı veya sohbeti Codex destekli yap" için en basit operatör yoludur.
- `--bind here` alt thread oluşturmaz.
- `--bind here` yalnızca geçerli konuşma bağlama desteği sunan kanallarda kullanılabilir.
- `--bind` ve `--thread`, aynı `/acp spawn` çağrısında birleştirilemez.

## Başlatma thread modları

`/acp spawn`, `--thread auto|here|off` destekler.

| Mod | Davranış |
| ------ | --------------------------------------------------------------------------------------------------- |
| `auto` | Etkin bir thread içinde: o thread'i bağlar. Thread dışında: destekleniyorsa alt thread oluşturur/bağlar. |
| `here` | Geçerli etkin thread'i zorunlu kılar; bir thread içinde değilse başarısız olur. |
| `off` | Bağ yoktur. Oturum bağlı olmadan başlar. |

Notlar:

- Thread bağlama yüzeyi olmayan yerlerde varsayılan davranış fiilen `off` olur.
- Thread'e bağlı başlatma kanal ilkesi desteği gerektirir:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Alt thread oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

## ACP denetimleri

Mevcut komut ailesi:

- `/acp spawn`
- `/acp cancel`
- `/acp steer`
- `/acp close`
- `/acp status`
- `/acp set-mode`
- `/acp set`
- `/acp cwd`
- `/acp permissions`
- `/acp timeout`
- `/acp model`
- `/acp reset-options`
- `/acp sessions`
- `/acp doctor`
- `/acp install`

`/acp status`, etkin çalışma zamanı seçeneklerini ve mevcut olduğunda hem çalışma zamanı düzeyi hem de arka uç düzeyi oturum tanımlayıcılarını gösterir.

Bazı denetimler arka uç yeteneklerine bağlıdır. Bir arka uç bir denetimi desteklemiyorsa, OpenClaw açık bir desteklenmeyen-denetim hatası döndürür.

## ACP komut yemek kitabı

| Komut | Ne yapar | Örnek |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn` | ACP oturumu oluşturur; isteğe bağlı geçerli bağ veya thread bağı. | `/acp spawn codex --bind here --cwd /repo` |
| `/acp cancel` | Hedef oturum için işlemdeki dönüşü iptal eder. | `/acp cancel agent:codex:acp:<uuid>` |
| `/acp steer` | Çalışan oturuma yönlendirme talimatı gönderir. | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close` | Oturumu kapatır ve thread hedef bağlarını kaldırır. | `/acp close` |
| `/acp status` | Arka ucu, modu, durumu, çalışma zamanı seçeneklerini, yetenekleri gösterir. | `/acp status` |
| `/acp set-mode` | Hedef oturum için çalışma zamanı modunu ayarlar. | `/acp set-mode plan` |
| `/acp set` | Genel çalışma zamanı yapılandırma seçeneği yazımı. | `/acp set model openai/gpt-5.4` |
| `/acp cwd` | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar. | `/acp cwd /Users/user/Projects/repo` |
| `/acp permissions` | Onay ilkesi profilini ayarlar. | `/acp permissions strict` |
| `/acp timeout` | Çalışma zamanı zaman aşımını (saniye) ayarlar. | `/acp timeout 120` |
| `/acp model` | Çalışma zamanı model geçersiz kılmasını ayarlar. | `/acp model anthropic/claude-opus-4-6` |
| `/acp reset-options` | Oturum çalışma zamanı seçenek geçersiz kılmalarını kaldırır. | `/acp reset-options` |
| `/acp sessions` | Depodan son ACP oturumlarını listeler. | `/acp sessions` |
| `/acp doctor` | Arka uç sağlığı, yetenekler, uygulanabilir düzeltmeler. | `/acp doctor` |
| `/acp install` | Belirlenimci kurulum ve etkinleştirme adımlarını yazdırır. | `/acp install` |

`/acp sessions`, geçerli bağlı veya istekte bulunan oturum için depoyu okur. `session-key`, `session-id` veya `session-label` belirteçlerini kabul eden komutlar, özel aracı başına `session.store` kökleri dahil Gateway oturum keşfi üzerinden hedefleri çözümler.

## Çalışma zamanı seçenekleri eşlemesi

`/acp`, kolaylık komutlarına ve genel bir ayarlayıcıya sahiptir.

Eşdeğer işlemler:

- `/acp model <id>`, çalışma zamanı yapılandırma anahtarı `model` ile eşlenir.
- `/acp permissions <profile>`, çalışma zamanı yapılandırma anahtarı `approval_policy` ile eşlenir.
- `/acp timeout <seconds>`, çalışma zamanı yapılandırma anahtarı `timeout` ile eşlenir.
- `/acp cwd <path>`, çalışma zamanı cwd geçersiz kılmasını doğrudan günceller.
- `/acp set <key> <value>`, genel yoldur.
  - Özel durum: `key=cwd`, cwd geçersiz kılma yolunu kullanır.
- `/acp reset-options`, hedef oturum için tüm çalışma zamanı geçersiz kılmalarını temizler.

## acpx harness desteği (güncel)

Geçerli acpx yerleşik harness takma adları:

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

OpenClaw acpx arka ucunu kullandığında, acpx yapılandırmanız özel aracı takma adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz ACP'yi hâlâ `agent acp` olarak açığa çıkarıyorsa, yerleşik varsayılanı değiştirmek yerine `cursor` aracı komutunu acpx yapılandırmanızda geçersiz kılın.

Doğrudan acpx CLI kullanımı ayrıca `--agent <command>` aracılığıyla keyfi bağdaştırıcıları hedefleyebilir, ancak bu ham kaçış yolu normal OpenClaw `agentId` yolu değil, bir acpx CLI özelliğidir.

## Gerekli yapılandırma

Çekirdek ACP taban çizgisi:

```json5
{
  acp: {
    enabled: true,
    // İsteğe bağlı. Varsayılan true'dur; /acp denetimlerini korurken ACP dağıtımını duraklatmak için false ayarlayın.
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

Thread bağlama yapılandırması kanal bağdaştırıcısına özeldir. Discord için örnek:

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

Thread'e bağlı ACP başlatması çalışmıyorsa, önce bağdaştırıcı özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Geçerli konuşma bağları alt thread oluşturma gerektirmez. Etkin bir konuşma bağlamı ve ACP konuşma bağlarını açığa çıkaran bir kanal bağdaştırıcısı gerektirir.

Bkz. [Yapılandırma Başvurusu](/tr/gateway/configuration-reference).

## acpx arka ucu için Plugin kurulumu

Yeni kurulumlar paketlenmiş `acpx` çalışma zamanı Plugin'i varsayılan olarak etkin getirir, bu yüzden ACP
genellikle el ile Plugin kurulum adımı olmadan çalışır.

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

Sonra arka uç sağlığını doğrulayın:

```text
/acp doctor
```

### acpx komut ve sürüm yapılandırması

Varsayılan olarak paketlenmiş acpx arka uç Plugin'i (`acpx`), plugin-yerel sabitlenmiş ikili dosyayı kullanır:

1. Komut, ACPX Plugin paketi içindeki plugin-yerel `node_modules/.bin/acpx` değerine varsayılan olur.
2. Beklenen sürüm, eklenti sabitlemesine varsayılan olur.
3. Başlangıç ACP arka ucunu hemen hazır değil olarak kaydeder.
4. Arka plandaki bir ensure işi `acpx --version` doğrular.
5. Plugin-yerel ikili dosya eksikse veya eşleşmiyorsa şu komutu çalıştırır:
   `npm install --omit=dev --no-save acpx@<pinned>` ve yeniden doğrular.

Plugin yapılandırmasında komutu/sürümü geçersiz kılabilirsiniz:

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

Notlar:

- `command`, mutlak yol, göreli yol veya komut adı (`acpx`) kabul eder.
- Göreli yollar OpenClaw çalışma alanı dizininden çözülür.
- `expectedVersion: "any"`, sıkı sürüm eşlemesini devre dışı bırakır.
- `command`, özel bir ikili dosya/yolu işaret ettiğinde plugin-yerel otomatik kurulum devre dışı bırakılır.
- OpenClaw başlangıcı, arka uç sağlık denetimi çalışırken engellemesiz kalır.

Bkz. [Plugin'ler](/tr/tools/plugin).

### Otomatik bağımlılık kurulumu

OpenClaw'ı `npm install -g openclaw` ile genel olarak kurduğunuzda, acpx
çalışma zamanı bağımlılıkları (platforma özgü ikili dosyalar) bir postinstall kancası
aracılığıyla otomatik olarak kurulur. Otomatik kurulum başarısız olursa, Gateway yine normal
şekilde başlar ve eksik bağımlılığı `openclaw acp doctor` üzerinden bildirir.

### Plugin araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, ACP harness'ine OpenClaw tarafından kaydedilmiş Plugin araçlarını **açığa çıkarmaz**.

Codex veya Claude Code gibi ACP aracılarının
memory geri çağırma/kaydetme gibi kurulu OpenClaw Plugin araçlarını çağırmasını istiyorsanız, ayrılmış köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturum önyüklemesine `openclaw-plugin-tools` adlı yerleşik bir MCP sunucusu ekler.
- Kurulu ve etkin OpenClaw Plugin'leri tarafından zaten kaydedilmiş Plugin araçlarını açığa çıkarır.
- Özelliği açık ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP harness araç yüzeyini genişletir.
- ACP aracıları yalnızca Gateway'de zaten etkin olan Plugin araçlarına erişim kazanır.
- Bunu, o Plugin'lerin OpenClaw'ın kendisinde çalışmasına izin vermekle aynı güven sınırı olarak değerlendirin.
- Etkinleştirmeden önce kurulu Plugin'leri gözden geçirin.

Özel `mcpServers`, önceki gibi yine çalışır. Yerleşik plugin-tools köprüsü,
genel MCP sunucu yapılandırmasının yerine geçen değil, ek bir isteğe bağlı kolaylıktır.

### Çalışma zamanı zaman aşımı yapılandırması

Paketlenmiş `acpx` Plugin'i, yerleşik çalışma zamanı dönüşlerini varsayılan olarak
120 saniyelik zaman aşımına ayarlar. Bu, Gemini CLI gibi daha yavaş harness'lere
ACP başlangıcını ve başlatmayı tamamlamak için yeterli zaman verir. Ana makineniz
farklı bir çalışma zamanı sınırına ihtiyaç duyuyorsa bunu geçersiz kılın:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Bu değeri değiştirdikten sonra Gateway'i yeniden başlatın.

### Sağlık yoklama aracı yapılandırması

Paketlenmiş `acpx` Plugin'i, yerleşik çalışma zamanı arka ucunun hazır olup olmadığını
belirlerken bir harness aracısını yoklar. Varsayılan olarak `codex` kullanır. Dağıtımınız
farklı bir varsayılan ACP aracısı kullanıyorsa, yoklama aracısını aynı kimliğe ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Bu değeri değiştirdikten sonra Gateway'i yeniden başlatın.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır — dosya yazma ve kabuk yürütme izin istemlerini onaylamak veya reddetmek için TTY yoktur. acpx Plugin'i, izinlerin nasıl işleneceğini denetleyen iki yapılandırma anahtarı sağlar:

Bu ACPX harness izinleri, OpenClaw exec onaylarından ve Claude CLI `--permission-mode bypassPermissions` gibi CLI arka uç üretici atlatma bayraklarından ayrıdır. ACPX `approve-all`, ACP oturumları için harness düzeyinde acil durum anahtarıdır.

### `permissionMode`

Harness aracısının istem göstermeden hangi işlemleri gerçekleştirebileceğini denetler.

| Değer | Davranış |
| --------------- | --------------------------------------------------------- |
| `approve-all` | Tüm dosya yazmaları ve kabuk komutlarını otomatik onaylar. |
| `approve-reads` | Yalnızca okumaları otomatik onaylar; yazma ve exec istem gerektirir. |
| `deny-all` | Tüm izin istemlerini reddeder. |

### `nonInteractivePermissions`

İzin istemi gösterilecek ama etkileşimli TTY mevcut olmayacaksa ne olacağını denetler (ACP oturumları için durum her zaman böyledir).

| Değer | Davranış |
| ------ | ----------------------------------------------------------------- |
| `fail` | Oturumu `AcpRuntimeError` ile iptal eder. **(varsayılan)** |
| `deny` | İzni sessizce reddeder ve devam eder (zarif bozulma). |

### Yapılandırma

Plugin yapılandırması üzerinden ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra Gateway'i yeniden başlatın.

> **Önemli:** OpenClaw şu anda varsayılan olarak `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` kullanır. Etkileşimsiz ACP oturumlarında, izin istemini tetikleyen herhangi bir yazma veya exec işlemi `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` hatasıyla başarısız olabilir.
>
> İzinleri kısıtlamanız gerekiyorsa, oturumların çökmesi yerine zarif biçimde bozulması için `nonInteractivePermissions` değerini `deny` olarak ayarlayın.

## Sorun giderme

| Belirti | Olası neden | Düzeltme |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured` | Arka uç Plugin'i eksik veya devre dışı. | Arka uç Plugin'ini kurup etkinleştirin, ardından `/acp doctor` çalıştırın. |
| `ACP is disabled by policy (acp.enabled=false)` | ACP genel olarak devre dışı. | `acp.enabled=true` ayarlayın. |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)` | Normal thread mesajlarından dağıtım devre dışı. | `acp.dispatch.enabled=true` ayarlayın. |
| `ACP agent "<id>" is not allowed by policy` | Aracı izin listesinde yok. | İzin verilen `agentId` kullanın veya `acp.allowedAgents` güncelleyin. |
| `Unable to resolve session target: ...` | Hatalı anahtar/kimlik/etiket belirteci. | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın, yeniden deneyin. |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin bağlanabilir konuşma olmadan kullanıldı. | Hedef sohbete/kanala gidip yeniden deneyin veya bağlı olmayan başlatma kullanın. |
| `Conversation bindings are unavailable for <channel>.` | Bağdaştırıcı geçerli konuşma ACP bağlama yeteneğine sahip değil. | Desteklenen yerde `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen bir kanala geçin. |
| `--thread here requires running /acp spawn inside an active ... thread` | `--thread here`, thread bağlamı dışında kullanıldı. | Hedef thread'e gidin veya `--thread auto`/`off` kullanın. |
| `Only <user-id> can rebind this channel/conversation/thread.` | Etkin bağ hedefinin sahibi başka bir kullanıcı. | Yeniden bağlamayı sahip olarak yapın veya farklı bir konuşma ya da thread kullanın. |
| `Thread bindings are unavailable for <channel>.` | Bağdaştırıcı thread bağlama yeteneğine sahip değil. | `--thread off` kullanın veya desteklenen bağdaştırıcı/kanala geçin. |
| `Sandboxed sessions cannot spawn ACP sessions ...` | ACP çalışma zamanı ana makine tarafında; istekte bulunan oturum sandbox içinde. | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP başlatmayı sandbox dışı bir oturumdan yapın. |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...` | ACP çalışma zamanı için `sandbox="require"` istendi. | Zorunlu sandbox kullanımı için `runtime="subagent"` kullanın veya ACP'yi sandbox dışı bir oturumdan `sandbox="inherit"` ile kullanın. |
| Bağlı oturum için ACP meta verisi eksik | Eski/silinmiş ACP oturum meta verisi. | `/acp spawn` ile yeniden oluşturun, sonra yeniden bağlayın/thread'e odaklayın. |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` | `permissionMode`, etkileşimsiz ACP oturumunda yazma/exec işlemlerini engelliyor. | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` olarak ayarlayın ve Gateway'i yeniden başlatın. Bkz. [İzin yapılandırması](#permission-configuration). |
| ACP oturumu az çıktı ile erkenden başarısız oluyor | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor. | `AcpRuntimeError` için Gateway günlüklerini kontrol edin. Tam izinler için `permissionMode=approve-all`; zarif bozulma için `nonInteractivePermissions=deny` ayarlayın. |
| ACP oturumu iş tamamlandıktan sonra süresiz takılıyor | Harness süreci bitti ama ACP oturumu tamamlanmayı bildirmedi. | `ps aux \| grep acpx` ile izleyin; eski süreçleri el ile öldürün. |
