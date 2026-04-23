---
read_when:
    - Kodlama harness'lerini ACP üzerinden çalıştırma
    - Mesajlaşma kanallarında konuşmaya bağlı ACP oturumları ayarlama
    - Bir mesaj kanalı konuşmasını kalıcı ACP oturumuna bağlama
    - ACP arka uç ve plugin kablolamasında sorun giderme
    - ACP tamamlama teslimini veya agent-to-agent döngülerini hata ayıklama
    - Sohbetten `/acp` komutlarını yönetme
summary: Codex, Claude Code, Cursor, Gemini CLI, OpenClaw ACP ve diğer harness agent'ları için ACP çalışma zamanı oturumlarını kullanın
title: ACP Agents
x-i18n:
    generated_at: "2026-04-23T09:11:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 617103fe47ef90592bad4882da719c47c801ebc916d3614c148a66e6601e8cf5
    source_path: tools/acp-agents.md
    workflow: 15
---

# ACP Agents

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) oturumları, OpenClaw'ın harici kodlama harness'lerini (örneğin Pi, Claude Code, Codex, Cursor, Copilot, OpenClaw ACP, OpenCode, Gemini CLI ve diğer desteklenen ACPX harness'leri) bir ACP arka uç plugin'i üzerinden çalıştırmasını sağlar.

OpenClaw'dan doğal dilde “bunu Codex'te çalıştır” veya “bir iş parçacığında Claude Code başlat” derseniz, OpenClaw bu isteği yerel alt agent çalışma zamanına değil ACP çalışma zamanına yönlendirmelidir. Her ACP oturumu oluşturma işlemi bir [arka plan görevi](/tr/automation/tasks) olarak izlenir.

Codex veya Claude Code'un harici bir MCP istemcisi olarak doğrudan mevcut
OpenClaw kanal konuşmalarına bağlanmasını istiyorsanız, ACP yerine
[`openclaw mcp serve`](/tr/cli/mcp) kullanın.

## Hangi sayfayı istiyorum?

Birbirine yakın ve kolay karışan üç yüzey vardır:

| Şunu yapmak istiyorsunuz...                                                         | Bunu kullanın                         | Notlar                                                                                                            |
| ----------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Codex, Claude Code, Gemini CLI veya başka bir harici harness'i OpenClaw _üzerinden_ çalıştırmak | Bu sayfa: ACP Agents                 | Sohbete bağlı oturumlar, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, arka plan görevleri, çalışma zamanı denetimleri |
| Bir OpenClaw Gateway oturumunu bir editör veya istemci için ACP sunucusu _olarak_ açığa çıkarmak | [`openclaw acp`](/tr/cli/acp)            | Köprü kipi. IDE/istemci stdio/WebSocket üzerinden ACP ile OpenClaw'a konuşur                                      |
| Yerel bir AI CLI'yi yalnızca metin tabanlı geri dönüş modeli olarak yeniden kullanmak | [CLI Backends](/tr/gateway/cli-backends) | ACP değildir. OpenClaw araçları yok, ACP denetimleri yok, harness çalışma zamanı yok                              |

## Bu kutudan çıktığı gibi çalışır mı?

Genellikle evet.

- Yeni kurulumlar artık paketle birlikte gelen `acpx` çalışma zamanı plugin'ini varsayılan olarak etkin gönderir.
- Paketle birlikte gelen `acpx` plugin'i kendi plugin-yerel sabitlenmiş `acpx` ikilisini tercih eder.
- Başlangıçta OpenClaw bu ikiliyi yoklar ve gerekirse kendi kendine onarır.
- Hızlı bir hazır olma denetimi istiyorsanız `/acp doctor` ile başlayın.

İlk kullanımda yine de olabilecekler:

- Hedef harness uyarlayıcısı, o harness'i ilk kullandığınızda isteğe bağlı olarak `npx` ile getirilebilir.
- Satıcı kimlik doğrulamasının o ana makinede zaten mevcut olması gerekir.
- Ana makinede npm/ağ erişimi yoksa, ilk çalıştırma uyarlayıcı getirmeleri önbellekler önceden ısıtılana veya uyarlayıcı başka bir yolla kurulana kadar başarısız olabilir.

Örnekler:

- `/acp spawn codex`: OpenClaw `acpx` bootstrap için hazır olmalıdır, ancak Codex ACP uyarlayıcısının yine de ilk çalıştırma getirmesine ihtiyacı olabilir.
- `/acp spawn claude`: Claude ACP uyarlayıcısı için de aynı durum geçerlidir, ayrıca o ana makinede Claude tarafı kimlik doğrulaması gerekir.

## Hızlı operatör akışı

Pratik bir `/acp` runbook istediğinizde bunu kullanın:

1. Bir oturum oluşturun:
   - `/acp spawn codex --bind here`
   - `/acp spawn codex --mode persistent --thread auto`
2. Bağlı konuşmada veya iş parçacığında çalışın (ya da bu oturum anahtarını açıkça hedefleyin).
3. Çalışma zamanı durumunu denetleyin:
   - `/acp status`
4. Gerektikçe çalışma zamanı seçeneklerini ayarlayın:
   - `/acp model <provider/model>`
   - `/acp permissions <profile>`
   - `/acp timeout <seconds>`
5. Bağlamı değiştirmeden etkin bir oturuma yön verin:
   - `/acp steer tighten logging and continue`
6. Çalışmayı durdurun:
   - `/acp cancel` (geçerli turu durdurur) veya
   - `/acp close` (oturumu kapatır + bağlamaları kaldırır)

## İnsanlar için hızlı başlangıç

Doğal istek örnekleri:

- "Bu Discord kanalını Codex'e bağla."
- "Burada bir iş parçacığında kalıcı bir Codex oturumu başlat ve odaklı tut."
- "Bunu tek seferlik bir Claude Code ACP oturumu olarak çalıştır ve sonucu özetle."
- "Bu iMessage sohbetini Codex'e bağla ve takipleri aynı çalışma alanında tut."
- "Bu görev için Gemini CLI'yi bir iş parçacığında kullan, sonra takipleri aynı iş parçacığında tut."

OpenClaw'ın yapması gereken:

1. `runtime: "acp"` seçmek.
2. İstenen harness hedefini çözümlemek (`agentId`, örneğin `codex`).
3. Geçerli konuşmaya bağlama isteniyorsa ve etkin kanal bunu destekliyorsa, ACP oturumunu bu konuşmaya bağlamak.
4. Aksi halde iş parçacığına bağlama isteniyorsa ve geçerli kanal bunu destekliyorsa, ACP oturumunu iş parçacığına bağlamak.
5. Takip eden bağlı mesajları odak kaldırılana/kapanana/süresi dolana kadar aynı ACP oturumuna yönlendirmek.

## ACP ve alt agent'lar karşılaştırması

Harici bir harness çalışma zamanı istediğinizde ACP kullanın. OpenClaw yerel delege çalıştırmaları istediğinizde alt agent'ları kullanın.

| Alan          | ACP oturumu                           | Alt agent çalıştırması              |
| ------------- | ------------------------------------- | ----------------------------------- |
| Çalışma zamanı| ACP arka uç plugin'i (örneğin acpx)   | OpenClaw yerel alt agent çalışma zamanı |
| Oturum anahtarı | `agent:<agentId>:acp:<uuid>`        | `agent:<agentId>:subagent:<uuid>`   |
| Ana komutlar  | `/acp ...`                            | `/subagents ...`                    |
| Oluşturma aracı | `runtime:"acp"` ile `sessions_spawn` | `sessions_spawn` (varsayılan çalışma zamanı) |

Ayrıca bkz. [Sub-agents](/tr/tools/subagents).

## ACP, Claude Code'u nasıl çalıştırır

ACP üzerinden Claude Code için yığın şöyledir:

1. OpenClaw ACP oturumu kontrol düzlemi
2. paketle birlikte gelen `acpx` çalışma zamanı plugin'i
3. Claude ACP uyarlayıcısı
4. Claude tarafı çalışma zamanı/oturum düzeni

Önemli ayrım:

- ACP Claude; ACP denetimleri, oturum sürdürme, arka plan görevi izleme ve isteğe bağlı konuşma/iş parçacığı bağlaması olan bir harness oturumudur.
- CLI arka uçları ayrı yalnızca metin tabanlı yerel geri dönüş çalışma zamanlarıdır. Bkz. [CLI Backends](/tr/gateway/cli-backends).

Operatörler için pratik kural:

- `/acp spawn`, bağlanabilir oturumlar, çalışma zamanı denetimleri veya kalıcı harness çalışması istiyorsanız ACP kullanın
- Ham CLI üzerinden basit yerel metin geri dönüşü istiyorsanız CLI arka uçlarını kullanın

## Bağlı oturumlar

### Geçerli konuşmaya bağlamalar

Yeni bir alt iş parçacığı oluşturmadan geçerli konuşmanın kalıcı bir ACP çalışma alanına dönüşmesini istediğinizde `/acp spawn <harness> --bind here` kullanın.

Davranış:

- OpenClaw kanal aktarımının, kimlik doğrulamasının, güvenliğin ve teslimin sahibi olmaya devam eder.
- Geçerli konuşma, oluşturulan ACP oturum anahtarına sabitlenir.
- O konuşmadaki takip eden mesajlar aynı ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, oturumu kapatır ve geçerli konuşma bağlamasını kaldırır.

Pratikte bunun anlamı:

- `--bind here` aynı sohbet yüzeyini korur. Discord'da geçerli kanal geçerli kanal olarak kalır.
- `--bind here`, yeni çalışma oluşturuyorsanız yine de yeni bir ACP oturumu oluşturabilir. Bağlama, o oturumu geçerli konuşmaya ekler.
- `--bind here`, kendi başına alt Discord iş parçacığı veya Telegram konusu oluşturmaz.
- ACP çalışma zamanı yine de kendi çalışma dizinine (`cwd`) veya arka uç tarafından yönetilen disk çalışma alanına sahip olabilir. Bu çalışma zamanı çalışma alanı sohbet yüzeyinden ayrıdır ve yeni mesajlaşma iş parçacığı anlamına gelmez.
- Farklı bir ACP agent'ına oluşturma yaparsanız ve `--cwd` geçmezseniz, OpenClaw varsayılan olarak istekte bulunanın değil **hedef agent'ın** çalışma alanını devralır.
- Bu devralınan çalışma alanı yolu eksikse (`ENOENT`/`ENOTDIR`), OpenClaw yanlış ağacı sessizce yeniden kullanmak yerine arka ucun varsayılan cwd'sine geri döner.
- Devralınan çalışma alanı varsa ama erişilemiyorsa (örneğin `EACCES`), oluşturma `cwd`'yi düşürmek yerine gerçek erişim hatasını döndürür.

Zihinsel model:

- sohbet yüzeyi: insanların konuşmayı sürdürdüğü yer (`Discord kanalı`, `Telegram konusu`, `iMessage sohbeti`)
- ACP oturumu: OpenClaw'ın yönlendirdiği kalıcı Codex/Claude/Gemini çalışma zamanı durumu
- alt iş parçacığı/konu: yalnızca `--thread ...` ile oluşturulan isteğe bağlı ek mesajlaşma yüzeyi
- çalışma zamanı çalışma alanı: harness'in çalıştığı dosya sistemi konumu (`cwd`, depo checkout'u, arka uç çalışma alanı)

Örnekler:

- `/acp spawn codex --bind here`: bu sohbeti koru, bir Codex ACP oturumu oluştur veya bağlan ve gelecekteki mesajları buradan ona yönlendir
- `/acp spawn codex --thread auto`: OpenClaw bir alt iş parçacığı/konu oluşturabilir ve ACP oturumunu oraya bağlayabilir
- `/acp spawn codex --bind here --cwd /workspace/repo`: yukarıdakiyle aynı sohbet bağlaması, ancak Codex `/workspace/repo` içinde çalışır

Geçerli konuşmaya bağlama desteği:

- Geçerli konuşma ACP bağlama desteğini ilan eden sohbet/mesaj kanalları, `--bind here` seçeneğini paylaşılan konuşma bağlama yolu üzerinden kullanabilir.
- Özel iş parçacığı/konu semantiğine sahip kanallar, yine aynı paylaşılan arayüz arkasında kanala özgü kanonikleştirme sağlayabilir.
- `--bind here` her zaman “geçerli konuşmayı yerinde bağla” anlamına gelir.
- Genel geçerli konuşma bağlamaları, paylaşılan OpenClaw bağlama deposunu kullanır ve normal gateway yeniden başlatmalarında korunur.

Notlar:

- `/acp spawn` üzerinde `--bind here` ve `--thread ...` birbirini dışlar.
- Discord'da `--bind here`, geçerli kanalı veya iş parçacığını yerinde bağlar. `spawnAcpSessions`, yalnızca OpenClaw `--thread auto|here` için bir alt iş parçacığı oluşturmak zorundaysa gereklidir.
- Etkin kanal geçerli konuşma ACP bağlamalarını sunmuyorsa, OpenClaw açık bir desteklenmiyor iletisi döndürür.
- `resume` ve “yeni oturum” soruları kanal soruları değil, ACP oturumu sorularıdır. Geçerli sohbet yüzeyini değiştirmeden çalışma zamanı durumunu yeniden kullanabilir veya değiştirebilirsiniz.

### İş parçacığına bağlı oturumlar

Bir kanal uyarlayıcısı için iş parçacığı bağlamaları etkinse, ACP oturumları iş parçacıklarına bağlanabilir:

- OpenClaw bir iş parçacığını hedef ACP oturumuna bağlar.
- O iş parçacığındaki takip mesajları bağlı ACP oturumuna yönlendirilir.
- ACP çıktısı aynı iş parçacığına geri teslim edilir.
- Odak kaldırma/kapatma/arşivleme/boşta zaman aşımı veya azami yaş süresi dolması bağlamayı kaldırır.

İş parçacığı bağlama desteği uyarlayıcıya özgüdür. Etkin kanal uyarlayıcısı iş parçacığı bağlamalarını desteklemiyorsa, OpenClaw açık bir desteklenmiyor/kullanılamıyor iletisi döndürür.

İş parçacığına bağlı ACP için gerekli özellik bayrakları:

- `acp.enabled=true`
- `acp.dispatch.enabled` varsayılan olarak açıktır (`false` ayarlanırsa ACP gönderimi duraklar)
- Kanal uyarlayıcısına özgü ACP iş parçacığı oluşturma bayrağı etkin
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

### İş parçacığını destekleyen kanallar

- Oturum/iş parçacığı bağlama yeteneği sunan tüm kanal uyarlayıcıları.
- Mevcut yerleşik destek:
  - Discord iş parçacıkları/kanalları
  - Telegram konuları (gruplar/süper gruplardaki forum konuları ve DM konuları)
- Plugin kanalları da aynı bağlama arayüzü üzerinden destek ekleyebilir.

## Kanala özgü ayarlar

Geçici olmayan iş akışları için, kalıcı ACP bağlamalarını üst düzey `bindings[]` girdilerinde yapılandırın.

### Bağlama modeli

- `bindings[].type="acp"`, kalıcı ACP konuşma bağlamasını işaretler.
- `bindings[].match`, hedef konuşmayı tanımlar:
  - Discord kanalı veya iş parçacığı: `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
  - Telegram forum konusu: `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
  - BlueBubbles DM/grup sohbeti: `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup bağlamaları için `chat_id:*` veya `chat_identifier:*` tercih edin.
  - iMessage DM/grup sohbeti: `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`
    Kararlı grup bağlamaları için `chat_id:*` tercih edin.
- `bindings[].agentId`, sahibi olan OpenClaw agent kimliğidir.
- İsteğe bağlı ACP geçersiz kılmaları `bindings[].acp` altında bulunur:
  - `mode` (`persistent` veya `oneshot`)
  - `label`
  - `cwd`
  - `backend`

### Agent başına çalışma zamanı varsayılanları

ACP varsayılanlarını agent başına bir kez tanımlamak için `agents.list[].runtime` kullanın:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (harness kimliği, örneğin `codex` veya `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

ACP bağlı oturumları için geçersiz kılma önceliği:

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

- OpenClaw, yapılandırılmış ACP oturumunun kullanımdan önce var olduğundan emin olur.
- O kanal veya konudaki mesajlar yapılandırılmış ACP oturumuna yönlendirilir.
- Bağlı konuşmalarda `/new` ve `/reset`, aynı ACP oturum anahtarını yerinde sıfırlar.
- Geçici çalışma zamanı bağlamaları (örneğin iş parçacığı odak akışlarının oluşturdukları) varsa yine uygulanır.
- Açık bir `cwd` olmadan yapılan agent'lar arası ACP oluşturmalarında OpenClaw, agent yapılandırmasından hedef agent çalışma alanını devralır.
- Eksik devralınmış çalışma alanı yolları arka ucun varsayılan cwd'sine geri düşer; eksik olmayan erişim hataları ise oluşturma hataları olarak yüzeye çıkar.

## ACP oturumlarını başlatma (arayüzler)

### `sessions_spawn` içinden

Bir agent turundan veya araç çağrısından ACP oturumu başlatmak için `runtime: "acp"` kullanın.

```json
{
  "task": "Depoyu aç ve başarısız testleri özetle",
  "runtime": "acp",
  "agentId": "codex",
  "thread": true,
  "mode": "session"
}
```

Notlar:

- `runtime` varsayılan olarak `subagent` olduğu için ACP oturumlarında açıkça `runtime: "acp"` ayarlayın.
- `agentId` atlanırsa, yapılandırılmışsa OpenClaw `acp.defaultAgent` kullanır.
- `mode: "session"`, kalıcı bağlı konuşmayı korumak için `thread: true` gerektirir.

Arayüz ayrıntıları:

- `task` (zorunlu): ACP oturumuna gönderilen başlangıç istemi.
- `runtime` (ACP için zorunlu): `"acp"` olmalıdır.
- `agentId` (isteğe bağlı): ACP hedef harness kimliği. Ayarlıysa `acp.defaultAgent` değerine geri düşer.
- `thread` (isteğe bağlı, varsayılan `false`): desteklendiği yerde iş parçacığı bağlama akışı ister.
- `mode` (isteğe bağlı): `run` (tek seferlik) veya `session` (kalıcı).
  - varsayılan `run`dur
  - `thread: true` ve mode atlanmışsa, OpenClaw çalışma zamanı yoluna göre varsayılan olarak kalıcı davranış seçebilir
  - `mode: "session"`, `thread: true` gerektirir
- `cwd` (isteğe bağlı): istenen çalışma zamanı çalışma dizini (arka uç/çalışma zamanı ilkesine göre doğrulanır). Atlanırsa ACP oluşturma, yapılandırılmışsa hedef agent çalışma alanını devralır; eksik devralınmış yollar arka uç varsayılanlarına geri düşer, gerçek erişim hataları ise döndürülür.
- `label` (isteğe bağlı): oturum/banner metninde kullanılan operatör odaklı etiket.
- `resumeSessionId` (isteğe bağlı): yeni bir tane oluşturmak yerine mevcut ACP oturumunu sürdürür. Agent, konuşma geçmişini `session/load` ile yeniden oynatır. `runtime: "acp"` gerektirir.
- `streamTo` (isteğe bağlı): `"parent"`, başlangıç ACP çalıştırma ilerleme özetlerini sistem olayları olarak istekte bulunan oturuma geri akıtır.
  - Mevcut olduğunda kabul edilen yanıtlar, tam relay geçmişi için kuyruğunu izleyebileceğiniz oturum kapsamlı bir JSONL günlüğüne (`<sessionId>.acp-stream.jsonl`) işaret eden `streamLogPath` içerebilir.
- `model` (isteğe bağlı): ACP alt oturumu için açık model geçersiz kılması. `runtime: "acp"` için dikkate alınır; böylece alt oturum sessizce hedef agent varsayılanına geri düşmek yerine istenen modeli kullanır.

## Teslim modeli

ACP oturumları etkileşimli çalışma alanları veya üst oturuma ait arka plan çalışmaları olabilir. Teslim yolu bu şekle bağlıdır.

### Etkileşimli ACP oturumları

Etkileşimli oturumlar görünür bir sohbet yüzeyinde konuşmayı sürdürmek içindir:

- `/acp spawn ... --bind here`, geçerli konuşmayı ACP oturumuna bağlar.
- `/acp spawn ... --thread ...`, kanal iş parçacığını/konusunu ACP oturumuna bağlar.
- Kalıcı yapılandırılmış `bindings[].type="acp"`, eşleşen konuşmaları aynı ACP oturumuna yönlendirir.

Bağlı konuşmadaki takip mesajları doğrudan ACP oturumuna yönlendirilir ve ACP çıktısı aynı kanal/iş parçacığına/konuya geri teslim edilir.

### Üst oturuma ait tek seferlik ACP oturumları

Başka bir agent çalıştırması tarafından oluşturulan tek seferlik ACP oturumları, alt agent'lara benzer arka plan alt öğeleridir:

- Üst oturum, `sessions_spawn({ runtime: "acp", mode: "run" })` ile iş ister.
- Alt oturum kendi ACP harness oturumunda çalışır.
- Tamamlanma iç görev-tamamlama duyuru yolu üzerinden geri bildirilir.
- Kullanıcıya dönük yanıt yararlıysa üst oturum, alt sonucun yazımını normal assistant sesiyle yeniden yapar.

Bu yolu üst ve alt arasında eşler arası sohbet gibi değerlendirmeyin. Alt oturumun zaten üst oturuma geri dönen bir tamamlama kanalı vardır.

### `sessions_send` ve A2A teslimi

`sessions_send`, oluşturmadan sonra başka bir oturumu hedefleyebilir. Normal eş oturumlar için OpenClaw, mesajı enjekte ettikten sonra agent'tan agent'a (A2A) takip yolu kullanır:

- hedef oturumun yanıtını bekler
- isteğe bağlı olarak isteyen ve hedefin sınırlı sayıda takip turu alışverişi yapmasına izin verir
- hedeften bir duyuru mesajı üretmesini ister
- bu duyuruyu görünür kanala veya iş parçacığına teslim eder

Bu A2A yolu, gönderen görünür bir takip istediğinde eş gönderimler için bir geri dönüştür. İlgisiz bir oturum geniş `tools.sessions.visibility` ayarları altında bir ACP hedefini görebildiğinde ve ona mesaj gönderebildiğinde etkin kalır.

OpenClaw, yalnızca istekte bulunan kendi üst oturumuna ait tek seferlik ACP alt oturumunun ebeveyni olduğunda A2A takibini atlar. Bu durumda görev tamamlanmasının üzerine A2A çalıştırmak, alt sonucun üst oturumu uyandırmasına, üst yanıtını tekrar alt oturuma iletmesine ve bir üst/alt yankı döngüsü oluşturmasına neden olabilir. `sessions_send` sonucu, bu sahip olunan alt oturum durumunda `delivery.status="skipped"` bildirir çünkü sonuçtan zaten tamamlama yolu sorumludur.

### Mevcut bir oturumu sürdürme

Sıfırdan başlamak yerine önceki bir ACP oturumunu sürdürmek için `resumeSessionId` kullanın. Agent konuşma geçmişini `session/load` ile yeniden oynatır; böylece önceden gelenlerin tam bağlamıyla kaldığı yerden devam eder.

```json
{
  "task": "Kaldığımız yerden devam et — kalan test hatalarını düzelt",
  "runtime": "acp",
  "agentId": "codex",
  "resumeSessionId": "<previous-session-id>"
}
```

Yaygın kullanım durumları:

- Bir Codex oturumunu dizüstü bilgisayarınızdan telefonunuza devredin — agent'ınıza kaldığınız yerden devam etmesini söyleyin
- CLI içinde etkileşimli başlattığınız bir kodlama oturumuna şimdi agent'ınız üzerinden başsız olarak devam edin
- Gateway yeniden başlatması veya boşta zaman aşımıyla kesilen işi sürdürün

Notlar:

- `resumeSessionId`, `runtime: "acp"` gerektirir — alt agent çalışma zamanıyla kullanılırsa hata döndürür.
- `resumeSessionId`, yukarı akış ACP konuşma geçmişini geri yükler; `thread` ve `mode`, oluşturduğunuz yeni OpenClaw oturumuna yine normal şekilde uygulanır, dolayısıyla `mode: "session"` yine `thread: true` gerektirir.
- Hedef agent `session/load` desteği sunmalıdır (Codex ve Claude Code sunar).
- Oturum kimliği bulunamazsa oluşturma açık bir hatayla başarısız olur — yeni oturuma sessiz geri dönüş yoktur.

### Operatör smoke test

Bir Gateway dağıtımından sonra ACP oluşturmanın yalnızca birim testlerini geçmediğini,
gerçekten uçtan uca çalıştığını hızlıca canlı denetlemek istediğinizde bunu kullanın.

Önerilen kapı:

1. Hedef ana makinede dağıtılmış gateway sürümünü/commit'ini doğrulayın.
2. Dağıtılmış kaynağın,
   `src/gateway/sessions-patch.ts` içinde ACP soy kabulünü
   (`subagent:* or acp:* sessions`) içerdiğini doğrulayın.
3. Canlı bir agent'a geçici ACPX köprü oturumu açın (örneğin
   `jpclawhq` üzerindeki `razor(main)`).
4. O agent'tan `sessions_spawn` çağrısını şu değerlerle yapmasını isteyin:
   - `runtime: "acp"`
   - `agentId: "codex"`
   - `mode: "run"`
   - görev: `Reply with exactly LIVE-ACP-SPAWN-OK`
5. Agent'ın şunları bildirdiğini doğrulayın:
   - `accepted=yes`
   - gerçek bir `childSessionKey`
   - doğrulayıcı hatası yok
6. Geçici ACPX köprü oturumunu temizleyin.

Canlı agent için örnek istem:

```text
Use the sessions_spawn tool now with runtime: "acp", agentId: "codex", and mode: "run".
Set the task to: "Reply with exactly LIVE-ACP-SPAWN-OK".
Then report only: accepted=<yes/no>; childSessionKey=<value or none>; error=<exact text or none>.
```

Notlar:

- İş parçacığına bağlı kalıcı ACP oturumlarını bilerek test etmiyorsanız
  bu smoke test'i `mode: "run"` üzerinde tutun.
- Temel kapı için `streamTo: "parent"` gerektirmeyin. O yol
  isteyen/oturum yeteneklerine bağlıdır ve ayrı bir entegrasyon denetimidir.
- İş parçacığına bağlı `mode: "session"` testini gerçek bir Discord iş parçacığı veya Telegram konusunda
  ikinci, daha zengin bir entegrasyon geçişi olarak değerlendirin.

## Sandbox uyumluluğu

ACP oturumları şu anda OpenClaw sandbox'ı içinde değil, ana makine çalışma zamanında çalışır.

Geçerli sınırlamalar:

- İstekte bulunan oturum sandbox içindeyse ACP oluşturma hem `sessions_spawn({ runtime: "acp" })` hem de `/acp spawn` için engellenir.
  - Hata: `Sandboxed sessions cannot spawn ACP sessions because runtime="acp" runs on the host. Use runtime="subagent" from sandboxed sessions.`
- `runtime: "acp"` ile `sessions_spawn`, `sandbox: "require"` desteklemez.
  - Hata: `sessions_spawn sandbox="require" is unsupported for runtime="acp" because ACP sessions run outside the sandbox. Use runtime="subagent" or sandbox="inherit".`

Sandbox zorlamalı yürütmeye ihtiyaç duyduğunuzda `runtime: "subagent"` kullanın.

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

Bkz. [Slash Commands](/tr/tools/slash-commands).

## Oturum hedefi çözümleme

Çoğu `/acp` eylemi isteğe bağlı oturum hedefi kabul eder (`session-key`, `session-id` veya `session-label`).

Çözümleme sırası:

1. Açık hedef argümanı (veya `/acp steer` için `--session`)
   - önce anahtarı dener
   - sonra UUID biçimli oturum kimliğini
   - sonra etiketi
2. Geçerli iş parçacığı bağlaması (bu konuşma/iş parçacığı bir ACP oturumuna bağlıysa)
3. Geçerli isteyen oturum geri dönüşü

Geçerli konuşma bağlamaları ve iş parçacığı bağlamaları 2. adıma katılır.

Hiçbir hedef çözümlenmezse, OpenClaw açık bir hata döndürür (`Unable to resolve session target: ...`).

## Oluşturma bağlama kipleri

`/acp spawn`, `--bind here|off` destekler.

| Kip    | Davranış                                                             |
| ------ | -------------------------------------------------------------------- |
| `here` | Geçerli etkin konuşmayı yerinde bağlar; etkin bir konuşma yoksa başarısız olur. |
| `off`  | Geçerli konuşma bağlaması oluşturmaz.                                |

Notlar:

- `--bind here`, “bu kanal veya sohbeti Codex destekli yap” için en basit operatör yoludur.
- `--bind here`, alt iş parçacığı oluşturmaz.
- `--bind here`, yalnızca geçerli konuşma bağlama desteği sunan kanallarda kullanılabilir.
- `--bind` ve `--thread`, aynı `/acp spawn` çağrısında birleştirilemez.

## Oluşturma iş parçacığı kipleri

`/acp spawn`, `--thread auto|here|off` destekler.

| Kip    | Davranış                                                                                           |
| ------ | -------------------------------------------------------------------------------------------------- |
| `auto` | Etkin bir iş parçacığında: o iş parçacığını bağlar. İş parçacığı dışında: destekleniyorsa bir alt iş parçacığı oluşturur/bağlar. |
| `here` | Geçerli etkin iş parçacığını zorunlu kılar; iş parçacığında değilse başarısız olur.              |
| `off`  | Bağlama yok. Oturum bağlanmamış olarak başlar.                                                     |

Notlar:

- İş parçacığı bağlama yüzeyi olmayan yerlerde varsayılan davranış fiilen `off` olur.
- İş parçacığına bağlı oluşturma, kanal ilke desteği gerektirir:
  - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
  - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
- Alt iş parçacığı oluşturmadan geçerli konuşmayı sabitlemek istediğinizde `--bind here` kullanın.

## ACP denetimleri

Kullanılabilir komut ailesi:

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

`/acp status`, etkin çalışma zamanı seçeneklerini ve mevcutsa hem çalışma zamanı düzeyi hem de arka uç düzeyi oturum tanımlayıcılarını gösterir.

Bazı denetimler arka uç yeteneklerine bağlıdır. Bir arka uç bir denetimi desteklemiyorsa OpenClaw açık bir desteklenmeyen-denetim hatası döndürür.

## ACP komut yemek kitabı

| Komut                | Ne yapar                                                 | Örnek                                                        |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| `/acp spawn`         | ACP oturumu oluşturur; isteğe bağlı geçerli bağlama veya iş parçacığı bağlama. | `/acp spawn codex --bind here --cwd /repo`                   |
| `/acp cancel`        | Hedef oturum için devam eden turu iptal eder.            | `/acp cancel agent:codex:acp:<uuid>`                         |
| `/acp steer`         | Çalışan oturuma yönlendirme talimatı gönderir.           | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Oturumu kapatır ve iş parçacığı hedeflerinin bağını kaldırır. | `/acp close`                                               |
| `/acp status`        | Arka uç, kip, durum, çalışma zamanı seçenekleri, yetenekleri gösterir. | `/acp status`                                           |
| `/acp set-mode`      | Hedef oturum için çalışma zamanı kipini ayarlar.         | `/acp set-mode plan`                                         |
| `/acp set`           | Genel çalışma zamanı yapılandırma seçeneği yazımı.       | `/acp set model openai/gpt-5.4`                              |
| `/acp cwd`           | Çalışma zamanı çalışma dizini geçersiz kılmasını ayarlar.| `/acp cwd /Users/user/Projects/repo`                         |
| `/acp permissions`   | Onay ilkesi profilini ayarlar.                           | `/acp permissions strict`                                    |
| `/acp timeout`       | Çalışma zamanı zaman aşımını ayarlar (saniye).           | `/acp timeout 120`                                           |
| `/acp model`         | Çalışma zamanı model geçersiz kılmasını ayarlar.         | `/acp model anthropic/claude-opus-4-6`                       |
| `/acp reset-options` | Oturum çalışma zamanı geçersiz kılmalarını kaldırır.     | `/acp reset-options`                                         |
| `/acp sessions`      | Depodan son ACP oturumlarını listeler.                   | `/acp sessions`                                              |
| `/acp doctor`        | Arka uç sağlığı, yetenekler, uygulanabilir düzeltmeler.  | `/acp doctor`                                                |
| `/acp install`       | Belirlenimci kurulum ve etkinleştirme adımlarını yazdırır. | `/acp install`                                             |

`/acp sessions`, geçerli bağlı veya isteyen oturum için depoyu okur. `session-key`, `session-id` veya `session-label` belirteçlerini kabul eden komutlar; özel agent başına `session.store` kökleri dahil gateway oturum keşfi üzerinden hedefleri çözümler.

## Çalışma zamanı seçenek eşlemesi

`/acp`, kolaylık komutları ve genel bir ayarlayıcı içerir.

Eşdeğer işlemler:

- `/acp model <id>`, çalışma zamanı yapılandırma anahtarı `model` ile eşleşir.
- `/acp permissions <profile>`, çalışma zamanı yapılandırma anahtarı `approval_policy` ile eşleşir.
- `/acp timeout <seconds>`, çalışma zamanı yapılandırma anahtarı `timeout` ile eşleşir.
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

OpenClaw acpx arka ucunu kullandığında, acpx yapılandırmanız özel agent takma adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz ACP'yi hâlâ `agent acp` olarak açığa çıkarıyorsa, yerleşik varsayılanı değiştirmek yerine acpx yapılandırmanızdaki `cursor` agent komutunu geçersiz kılın.

Doğrudan acpx CLI kullanımı ayrıca `--agent <command>` aracılığıyla rastgele uyarlayıcıları da hedefleyebilir, ancak bu ham kaçış kapısı bir acpx CLI özelliğidir (normal OpenClaw `agentId` yolu değildir).

## Gerekli yapılandırma

Çekirdek ACP temeli:

```json5
{
  acp: {
    enabled: true,
    // İsteğe bağlı. Varsayılan true'dur; /acp denetimlerini korurken ACP gönderimini duraklatmak için false ayarlayın.
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

İş parçacığı bağlama yapılandırması kanal uyarlayıcısına özgüdür. Discord için örnek:

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

İş parçacığına bağlı ACP oluşturma çalışmıyorsa önce uyarlayıcı özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Geçerli konuşma bağlamaları alt iş parçacığı oluşturma gerektirmez. Etkin bir konuşma bağlamı ve ACP konuşma bağlamalarını açığa çıkaran bir kanal uyarlayıcısı gerektirir.

Bkz. [Configuration Reference](/tr/gateway/configuration-reference).

## acpx arka ucu için plugin kurulumu

Yeni kurulumlar paketle birlikte gelen `acpx` çalışma zamanı plugin'ini varsayılan olarak etkin gönderir, bu nedenle ACP
genellikle elle plugin kurma adımı gerektirmeden çalışır.

Şununla başlayın:

```text
/acp doctor
```

`acpx` devre dışı bıraktıysanız, `plugins.allow` / `plugins.deny` ile reddettiyseniz veya
yerel bir geliştirme checkout'una geçmek istiyorsanız, açık plugin yolunu kullanın:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Geliştirme sırasında yerel çalışma alanı kurulumu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Ardından arka uç sağlığını doğrulayın:

```text
/acp doctor
```

### acpx komut ve sürüm yapılandırması

Varsayılan olarak paketle birlikte gelen acpx arka uç plugin'i (`acpx`), plugin-yerel sabitlenmiş ikiliyi kullanır:

1. Komut, ACPX plugin paketinin içindeki plugin-yerel `node_modules/.bin/acpx` varsayılanını kullanır.
2. Beklenen sürüm, extension pin varsayılanını kullanır.
3. Başlangıç, ACP arka ucunu anında hazır değil olarak kaydeder.
4. Arka plan ensure işi `acpx --version` doğrulaması yapar.
5. Plugin-yerel ikili eksikse veya eşleşmiyorsa şunu çalıştırır:
   `npm install --omit=dev --no-save acpx@<pinned>` ve tekrar doğrular.

Komut/sürümü plugin yapılandırmasında geçersiz kılabilirsiniz:

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
- `expectedVersion: "any"`, katı sürüm eşlemesini devre dışı bırakır.
- `command` özel bir ikili/yola işaret ettiğinde, plugin-yerel otomatik kurulum devre dışı kalır.
- Arka uç sağlık denetimi çalışırken OpenClaw başlangıcı engelleyici olmamaya devam eder.

Bkz. [Plugins](/tr/tools/plugin).

### Otomatik bağımlılık kurulumu

OpenClaw'ı `npm install -g openclaw` ile genel olarak kurduğunuzda, acpx
çalışma zamanı bağımlılıkları (platforma özgü ikililer) bir postinstall hook
aracılığıyla otomatik kurulur. Otomatik kurulum başarısız olursa gateway yine de
normal başlar ve eksik bağımlılığı `openclaw acp doctor` üzerinden bildirir.

### Plugin araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, OpenClaw plugin kayıtlı araçlarını
ACP harness'e açığa çıkarmaz.

Codex veya Claude Code gibi ACP agent'larının kurulu
OpenClaw plugin araçlarını, örneğin bellek geri çağırma/depolamayı çağırmasını istiyorsanız, ayrılmış köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturum bootstrap'ine `openclaw-plugin-tools` adlı yerleşik MCP sunucusunu enjekte eder.
- Kurulu ve etkin OpenClaw
  plugin'leri tarafından zaten kaydedilmiş plugin araçlarını açığa çıkarır.
- Özelliği açık ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP harness araç yüzeyini genişletir.
- ACP agent'ları yalnızca gateway içinde zaten etkin olan plugin araçlarına erişim alır.
- Bunu, bu plugin'lerin OpenClaw içinde çalışmasına izin vermekle aynı güven sınırı olarak değerlendirin.
- Etkinleştirmeden önce kurulu plugin'leri inceleyin.

Özel `mcpServers` önceden olduğu gibi çalışmaya devam eder. Yerleşik plugin-tools köprüsü,
genel MCP sunucusu yapılandırmasının yerine geçmez; ek isteğe bağlı bir kolaylıktır.

### OpenClaw araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, yerleşik OpenClaw araçlarını da MCP üzerinden açığa çıkarmaz. Bir ACP agent'ı `cron` gibi seçili yerleşik araçlara ihtiyaç duyduğunda ayrı çekirdek araçlar köprüsünü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturum bootstrap'ine `openclaw-tools` adlı yerleşik MCP sunucusunu enjekte eder.
- Seçili yerleşik OpenClaw araçlarını açığa çıkarır. İlk sunucu `cron` aracını sunar.
- Çekirdek araç açığa çıkarmayı açık ve varsayılan olarak kapalı tutar.

### Çalışma zamanı zaman aşımı yapılandırması

Paketle birlikte gelen `acpx` plugin'i, gömülü çalışma zamanı turlarını varsayılan olarak 120 saniyelik
zaman aşımıyla çalıştırır. Bu, Gemini CLI gibi daha yavaş harness'lere
ACP başlangıcını ve ilklenmesini tamamlamaları için yeterli zaman verir. Ana makineniz farklı
bir çalışma zamanı sınırına ihtiyaç duyuyorsa bunu geçersiz kılın:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Bu değeri değiştirdikten sonra gateway'i yeniden başlatın.

### Sağlık probe agent yapılandırması

Paketle birlikte gelen `acpx` plugin'i, gömülü çalışma zamanı arka ucunun hazır olup olmadığına
karar verirken bir harness agent'ını prob eder. Varsayılan olarak `codex` kullanır. Dağıtımınız
farklı bir varsayılan ACP agent'ı kullanıyorsa, probe agent'ını aynı kimliğe ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Bu değeri değiştirdikten sonra gateway'i yeniden başlatın.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır — dosya yazma ve kabuk yürütme izin istemlerini onaylayıp reddedecek TTY yoktur. acpx plugin'i, izinlerin nasıl ele alınacağını denetleyen iki yapılandırma anahtarı sağlar:

Bu ACPX harness izinleri, OpenClaw exec onaylarından ayrıdır ve Claude CLI `--permission-mode bypassPermissions` gibi CLI arka uç satıcı atlama bayraklarından da ayrıdır. ACPX `approve-all`, ACP oturumları için harness düzeyi acil durum anahtarıdır.

### `permissionMode`

Harness agent'ının istem göstermeden hangi işlemleri yapabileceğini denetler.

| Değer            | Davranış                                                  |
| ---------------- | --------------------------------------------------------- |
| `approve-all`    | Tüm dosya yazmalarını ve kabuk komutlarını otomatik onaylar. |
| `approve-reads`  | Yalnızca okumaları otomatik onaylar; yazma ve exec istem gerektirir. |
| `deny-all`       | Tüm izin istemlerini reddeder.                            |

### `nonInteractivePermissions`

İzin isteminin gösterilmesi gerektiğinde ancak etkileşimli TTY mevcut olmadığında ne olacağını denetler (ACP oturumları için bu her zaman böyledir).

| Değer  | Davranış                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Oturumu `AcpRuntimeError` ile sonlandırır. **(varsayılan)**       |
| `deny` | İzni sessizce reddeder ve devam eder (zarif bozulma).             |

### Yapılandırma

Plugin yapılandırması üzerinden ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra gateway'i yeniden başlatın.

> **Önemli:** OpenClaw şu anda varsayılan olarak `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` kullanır. Etkileşimsiz ACP oturumlarında, izin istemi tetikleyen herhangi bir yazma veya exec işlemi `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` ile başarısız olabilir.
>
> İzinleri kısıtlamanız gerekiyorsa, oturumların çökmesi yerine zarif biçimde bozulması için `nonInteractivePermissions` değerini `deny` olarak ayarlayın.

## Sorun giderme

| Belirti                                                                     | Olası neden                                                                   | Düzeltme                                                                                                                                                            |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Arka uç plugin'i eksik veya devre dışı.                                       | Arka uç plugin'ini kurup etkinleştirin, sonra `/acp doctor` çalıştırın.                                                                                            |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP genel olarak devre dışı.                                                  | `acp.enabled=true` ayarlayın.                                                                                                                                       |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Normal iş parçacığı mesajlarından gönderim devre dışı.                        | `acp.dispatch.enabled=true` ayarlayın.                                                                                                                              |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent izin listesinde değil.                                                  | İzin verilen `agentId` kullanın veya `acp.allowedAgents` değerini güncelleyin.                                                                                     |
| `Unable to resolve session target: ...`                                     | Hatalı anahtar/kimlik/etiket belirteci.                                       | `/acp sessions` çalıştırın, tam anahtarı/etiketi kopyalayın, yeniden deneyin.                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here`, etkin bağlanabilir konuşma olmadan kullanıldı.                 | Hedef sohbet/kanala geçin ve yeniden deneyin veya bağlanmamış oluşturma kullanın.                                                                                   |
| `Conversation bindings are unavailable for <channel>.`                      | Uyarlayıcıda geçerli konuşma ACP bağlama yeteneği yok.                        | Destekleniyorsa `/acp spawn ... --thread ...` kullanın, üst düzey `bindings[]` yapılandırın veya desteklenen kanala geçin.                                       |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here`, iş parçacığı bağlamı dışında kullanıldı.                     | Hedef iş parçacığına geçin veya `--thread auto`/`off` kullanın.                                                                                                     |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Başka bir kullanıcı etkin bağlama hedefinin sahibi.                           | Sahip olarak yeniden bağlayın veya farklı bir konuşma ya da iş parçacığı kullanın.                                                                                  |
| `Thread bindings are unavailable for <channel>.`                            | Uyarlayıcıda iş parçacığı bağlama yeteneği yok.                               | `--thread off` kullanın veya desteklenen uyarlayıcı/kanala geçin.                                                                                                   |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP çalışma zamanı ana makine tarafındadır; isteyen oturum sandbox içindedir. | Sandbox içindeki oturumlardan `runtime="subagent"` kullanın veya ACP oluşturmayı sandbox olmayan oturumdan çalıştırın.                                             |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP çalışma zamanı için `sandbox="require"` istendi.                          | Zorunlu sandboxing için `runtime="subagent"` kullanın veya sandbox olmayan oturumdan `sandbox="inherit"` ile ACP kullanın.                                         |
| Bağlı oturum için ACP meta verisi eksik                                     | Bayat/silinmiş ACP oturum meta verisi.                                        | `/acp spawn` ile yeniden oluşturun, sonra iş parçacığını yeniden bağlayın/odaklayın.                                                                               |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode`, etkileşimsiz ACP oturumunda yazma/exec işlemlerini engelliyor. | `plugins.entries.acpx.config.permissionMode` değerini `approve-all` yapın ve gateway'i yeniden başlatın. Bkz. [İzin yapılandırması](#permission-configuration). |
| ACP oturumu çok az çıktı ile erken başarısız oluyor                         | İzin istemleri `permissionMode`/`nonInteractivePermissions` tarafından engelleniyor. | `AcpRuntimeError` için gateway günlüklerini kontrol edin. Tam izinler için `permissionMode=approve-all`; zarif bozulma için `nonInteractivePermissions=deny` ayarlayın. |
| İş tamamlandıktan sonra ACP oturumu süresiz takılı kalıyor                  | Harness süreci bitti ama ACP oturumu tamamlanmayı bildirmedi.                 | `ps aux \| grep acpx` ile izleyin; bayat süreçleri elle öldürün.                                                                                                    |
