---
read_when:
    - Exec aracını kullanma veya değiştirme
    - stdin veya TTY davranışında hata ayıklama
summary: Exec aracı kullanımı, stdin modları ve TTY desteği
title: Exec aracı
x-i18n:
    generated_at: "2026-04-25T13:58:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

Çalışma alanında kabuk komutları çalıştırın. `process` üzerinden ön plan + arka plan yürütmesini destekler.
`process` izinli değilse, `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
Arka plan oturumları aracı başına kapsamlıdır; `process` yalnızca aynı aracıdaki oturumları görür.

## Parametreler

<ParamField path="command" type="string" required>
Çalıştırılacak kabuk komutu.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Komutun çalışma dizini.
</ParamField>

<ParamField path="env" type="object">
Devralınan ortamın üzerine birleştirilen anahtar/değer ortam geçersiz kılmaları.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Bu gecikmeden sonra (ms) komutu otomatik olarak arka plana alır.
</ParamField>

<ParamField path="background" type="boolean" default="false">
`yieldMs` değerini beklemek yerine komutu hemen arka plana alır.
</ParamField>

<ParamField path="timeout" type="number" default="1800">
Bu kadar saniye sonra komutu sonlandırır.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Mümkün olduğunda sahte terminalde çalıştırır. Yalnızca TTY destekleyen CLI'ler, kodlama aracıları ve terminal UI'leri için kullanın.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Yürütmenin nerede yapılacağı. `auto`, oturum için bir sandbox çalışma zamanı etkinse `sandbox`, aksi halde `gateway` olarak çözülür.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
`gateway` / `node` yürütmesi için yaptırım modu.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway` / `node` yürütmesi için onay istemi davranışı.
</ParamField>

<ParamField path="node" type="string">
`host=node` olduğunda Node kimliği/adı.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yükseltilmiş mod isteyin — sandbox'tan çıkarak yapılandırılmış host yoluna geçer. `security=full`, yalnızca elevated `full` olarak çözüldüğünde zorlanır.
</ParamField>

Notlar:

- `host` varsayılan olarak `auto` kullanır: oturum için sandbox çalışma zamanı etkinse `sandbox`, aksi halde `gateway`.
- `auto` varsayılan yönlendirme stratejisidir, joker değildir. Çağrı başına `host=node`, `auto` içinden izinlidir; çağrı başına `host=gateway` ise yalnızca etkin bir sandbox çalışma zamanı yoksa izinlidir.
- Ek yapılandırma olmadan `host=auto` yine de "çalışır": sandbox yoksa `gateway` olarak çözülür; canlı bir sandbox varsa sandbox içinde kalır.
- `elevated`, sandbox'tan çıkarak yapılandırılmış host yoluna geçer: varsayılan olarak `gateway`, veya `tools.exec.host=node` olduğunda (ya da oturum varsayılanı `host=node` ise) `node`. Yalnızca mevcut oturum/sağlayıcı için yükseltilmiş erişim etkinse kullanılabilir.
- `gateway`/`node` onayları `~/.openclaw/exec-approvals.json` tarafından denetlenir.
- `node`, eşlenmiş bir Node gerektirir (yardımcı uygulama veya başsız node host).
- Birden fazla Node varsa, birini seçmek için `exec.node` veya `tools.exec.node` ayarlayın.
- `exec host=node`, Node'lar için tek kabuk yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırılmıştır.
- Windows dışı host'larda, exec ayarlıysa `SHELL` kullanır; `SHELL` değeri `fish` ise, fish ile uyumsuz betikleri önlemek için önce `PATH` içinden `bash` (veya `sh`) tercih edilir, ikisi de yoksa `SHELL` değerine geri dönülür.
- Windows host'larda, exec önce PowerShell 7 (`pwsh`) bulmayı dener (Program Files, ProgramW6432, sonra PATH), ardından Windows PowerShell 5.1'e geri döner.
- Host yürütmesi (`gateway`/`node`), ikili dosya ele geçirme veya enjekte edilmiş kodu önlemek için `env.PATH` ve yükleyici geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, kabuk/profil kurallarının exec-tool bağlamını algılayabilmesi için oluşturulan komut ortamına `OPENCLAW_SHELL=exec` ayarlar (PTY ve sandbox yürütmesi dahil).
- Önemli: sandboxing varsayılan olarak **kapalıdır**. Sandboxing kapalıysa, örtük `host=auto`
  `gateway` olarak çözülür. Açık `host=sandbox` ise sessizce gateway host'ta
  çalışmak yerine yine kapalı şekilde başarısız olur. Sandboxing'i etkinleştirin veya onaylarla `host=gateway` kullanın.
- Betik ön kontrolü (yaygın Python/Node kabuk sözdizimi hataları için) yalnızca etkili
  `workdir` sınırı içindeki dosyaları inceler. Bir betik yolu `workdir` dışına çözülürse,
  o dosya için ön kontrol atlanır.
- Şimdi başlayan uzun süreli işler için, bunu bir kez başlatın ve
  etkinse komut çıktı ürettiğinde veya başarısız olduğunda otomatik tamamlama uyandırmasına güvenin.
  Günlükler, durum, girdi veya müdahale için `process` kullanın; zamanlama
  davranışını uyku döngüleri, zaman aşımı döngüleri veya tekrarlanan yoklamalarla taklit etmeyin.
- Daha sonra veya zamanlamaya göre gerçekleşmesi gereken işler için,
  `exec` uyku/gecikme desenleri yerine Cron kullanın.

## Yapılandırma

- `tools.exec.notifyOnExit` (varsayılan: true): true olduğunda, arka plana alınmış exec oturumları çıkışta bir sistem olayı kuyruğa alır ve bir Heartbeat ister.
- `tools.exec.approvalRunningNoticeMs` (varsayılan: 10000): onay gerektiren bir exec bu süreden uzun sürerse tek bir “çalışıyor” bildirimi yayımlar (0 devre dışı bırakır).
- `tools.exec.host` (varsayılan: `auto`; oturum için sandbox çalışma zamanı etkinse `sandbox`, aksi halde `gateway` olarak çözülür)
- `tools.exec.security` (varsayılan: sandbox için `deny`, gateway + node için ayarlanmadığında `full`)
- `tools.exec.ask` (varsayılan: `off`)
- Onaysız host exec, gateway + node için varsayılandır. Onay/allowlist davranışı istiyorsanız, hem `tools.exec.*` hem de host `~/.openclaw/exec-approvals.json` yapılandırmasını sıkılaştırın; bkz. [Exec onayları](/tr/tools/exec-approvals#no-approval-yolo-mode).
- YOLO, `host=auto` değerinden değil, host-ilkesi varsayılanlarından (`security=full`, `ask=off`) gelir. Gateway veya node yönlendirmesini zorlamak istiyorsanız, `tools.exec.host` ayarlayın veya `/exec host=...` kullanın.
- `security=full` artı `ask=off` modunda, host exec doğrudan yapılandırılmış ilkeyi izler; ek bir sezgisel komut gizleme ön filtresi veya betik ön-kontrol reddi katmanı yoktur.
- `tools.exec.node` (varsayılan: ayarsız)
- `tools.exec.strictInlineEval` (varsayılan: false): true olduğunda, `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` ve `osascript -e` gibi satır içi yorumlayıcı eval biçimleri her zaman açık onay gerektirir. `allow-always` zararsız yorumlayıcı/betik çağrılarını yine de kalıcı hale getirebilir, ancak satır içi eval biçimleri her seferinde istem göstermeye devam eder.
- `tools.exec.pathPrepend`: exec çalıştırmaları için `PATH` başına eklenecek dizin listesi (yalnızca gateway + sandbox).
- `tools.exec.safeBins`: açık allowlist girdileri olmadan çalışabilen, yalnızca stdin kullanan güvenli ikili dosyalar. Davranış ayrıntıları için bkz. [Güvenli ikili dosyalar](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: `safeBins` yol denetimleri için ek açık güvenilir dizinler. `PATH` girdileri asla otomatik olarak güvenilir sayılmaz. Yerleşik varsayılanlar `/bin` ve `/usr/bin` dizinleridir.
- `tools.exec.safeBinProfiles`: güvenli ikili dosya başına isteğe bağlı özel argv ilkesi (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Örnek:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH işleme

- `host=gateway`: oturum açma kabuğunuzun `PATH` değerini exec ortamına birleştirir. Host yürütmesi için `env.PATH` geçersiz kılmaları
  reddedilir. Daemon'un kendisi yine de en düşük `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: kapsayıcı içinde `sh -lc` (oturum açma kabuğu) çalıştırır, bu nedenle `/etc/profile` `PATH` değerini sıfırlayabilir.
  OpenClaw, profil kaynağından sonra `env.PATH` değerini dahili bir ortam değişkeniyle başa ekler (kabuk enterpolasyonu yok);
  `tools.exec.pathPrepend` burada da uygulanır.
- `host=node`: yalnızca geçirdiğiniz engellenmemiş ortam geçersiz kılmaları node'a gönderilir. `env.PATH` geçersiz kılmaları
  host yürütmesi için reddedilir ve node host'ları tarafından yok sayılır. Bir node üzerinde ek PATH girdilerine ihtiyacınız varsa,
  node host hizmet ortamını (systemd/launchd) yapılandırın veya araçları standart konumlara kurun.

Aracı başına node bağlama (yapılandırmada aracı listesi dizinini kullanın):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes sekmesi aynı ayarlar için küçük bir “Exec node binding” paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanları ayarlamak üzere `/exec` kullanın.
Geçerli değerleri göstermek için bağımsız olarak `/exec` gönderin.

Örnek:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Yetkilendirme modeli

`/exec` yalnızca **yetkili göndericiler** için dikkate alınır (kanal allowlist'leri/eşleştirme artı `commands.useAccessGroups`).
Yalnızca **oturum durumunu** günceller ve yapılandırma yazmaz. Exec'i kalıcı olarak devre dışı bırakmak için,
araç ilkesiyle reddedin (`tools.deny: ["exec"]` veya aracı başına). Açıkça `security=full` ve `ask=off` ayarlamadığınız sürece host onayları yine de geçerlidir.

## Exec onayları (yardımcı uygulama / node host)

Sandbox içindeki aracılar, exec'in gateway veya node host üzerinde çalışmasından önce istek başına onay gerektirebilir.
İlke, allowlist ve UI akışı için bkz. [Exec onayları](/tr/tools/exec-approvals).

Onay gerektiğinde, exec aracı hemen
`status: "approval-pending"` ve bir onay kimliğiyle döner. Onaylandığında (veya reddedildiğinde / zaman aşımına uğradığında),
Gateway sistem olayları yayar (`Exec finished` / `Exec denied`). Komut hâlâ
`tools.exec.approvalRunningNoticeMs` sonrasında çalışıyorsa, tek bir `Exec running` bildirimi yayımlanır.
Yerel onay kartları/düğmeleri olan kanallarda, aracı önce bu
yerel UI'ye güvenmeli ve yalnızca araç
sonucu sohbet onaylarının kullanılamadığını veya manuel onayın tek yol olduğunu açıkça söylüyorsa el ile `/approve` komutu eklemelidir.

## Allowlist + güvenli ikili dosyalar

El ile allowlist uygulaması, çözümlenmiş ikili dosya yolu glob'ları ve yalın komut adı
glob'larıyla eşleşir. Yalın adlar yalnızca PATH üzerinden çağrılan komutlarla eşleşir; bu yüzden `rg`
komut `rg` olduğunda `/opt/homebrew/bin/rg` ile eşleşebilir, ancak `./rg` veya `/tmp/rg` ile eşleşmez.
`security=allowlist` olduğunda, her ardışık düzen
segmenti allowlist'te veya güvenli ikili dosya değilse kabuk komutlarına otomatik izin verilmez. Zincirleme (`;`, `&&`, `||`) ve yönlendirmeler
allowlist modunda, her üst düzey segment
allowlist'i sağlamadıkça reddedilir (güvenli ikili dosyalar dahil). Yönlendirmeler hâlâ desteklenmez.
Kalıcı `allow-always` güveni bu kuralı aşmaz: zincirlenmiş bir komut için yine de her
üst düzey segmentin eşleşmesi gerekir.

`autoAllowSkills`, exec onaylarında ayrı bir kolaylık yoludur. El ile yol allowlist girdileriyle aynı şey değildir.
Sıkı açık güven için `autoAllowSkills` özelliğini devre dışı bırakın.

İki denetimi farklı işler için kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin kullanan akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: güvenli ikili dosya çalıştırılabilir yolları için açık ek güvenilir dizinler.
- `tools.exec.safeBinProfiles`: özel güvenli ikili dosyalar için açık argv ilkesi.
- allowlist: çalıştırılabilir dosya yolları için açık güven.

`safeBins` değerini genel bir allowlist gibi kullanmayın ve yorumlayıcı/çalışma zamanı ikili dosyaları (örneğin `python3`, `node`, `ruby`, `bash`) eklemeyin. Bunlara ihtiyacınız varsa açık allowlist girdileri kullanın ve onay istemlerini etkin tutun.
`openclaw security audit`, yorumlayıcı/çalışma zamanı `safeBins` girdilerinde açık profiller eksikse uyarır ve `openclaw doctor --fix` eksik özel `safeBinProfiles` girdilerini iskelet olarak oluşturabilir.
`openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı ikili dosyaları `safeBins` içine açıkça geri eklediğinizde de uyarır.
Yorumlayıcıları açıkça allowlist'e alıyorsanız, satır içi kod eval biçimleri yine de yeni onay gerektirsin diye `tools.exec.strictInlineEval` özelliğini etkinleştirin.

Tam ilke ayrıntıları ve örnekler için bkz. [Exec onayları](/tr/tools/exec-approvals-advanced#safe-bins-stdin-only) ve [Güvenli ikili dosyalar ve allowlist karşılaştırması](/tr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Örnekler

Ön plan:

```json
{ "tool": "exec", "command": "ls -la" }
```

Arka plan + yoklama:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Yoklama, bekleme döngüleri için değil, isteğe bağlı durum içindir. Otomatik tamamlama uyandırması
etkinse, komut çıktı ürettiğinde veya başarısız olduğunda oturumu uyandırabilir.

Tuş gönder (tmux tarzı):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Gönder (yalnızca CR gönder):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Yapıştır (varsayılan olarak parantezli):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`, yapılandırılmış çok dosyalı düzenlemeler için `exec` aracının bir alt aracıdır.
Varsayılan olarak OpenAI ve OpenAI Codex modelleri için etkindir. Yapılandırmayı yalnızca
devre dışı bırakmak veya belirli modellerle sınırlamak istediğinizde kullanın:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Notlar:

- Yalnızca OpenAI/OpenAI Codex modelleri için kullanılabilir.
- Araç ilkesi yine de geçerlidir; `allow: ["write"]`, `apply_patch` için örtük izin verir.
- Yapılandırma `tools.exec.applyPatch` altında bulunur.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` değerindedir; OpenAI modelleri için aracı devre dışı bırakmak üzere `false` yapın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerindedir (çalışma alanı ile sınırlı). `apply_patch` aracının çalışma alanı dizini dışında yazmasını/silmesini bilerek istiyorsanız yalnızca `false` yapın.

## İlgili

- [Exec Onayları](/tr/tools/exec-approvals) — kabuk komutları için onay kapıları
- [Sandboxing](/tr/gateway/sandboxing) — komutları sandbox ortamlarında çalıştırma
- [Arka Plan Süreci](/tr/gateway/background-process) — uzun süre çalışan exec ve process aracı
- [Güvenlik](/tr/gateway/security) — araç ilkesi ve yükseltilmiş erişim
