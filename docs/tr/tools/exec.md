---
read_when:
    - Exec aracını kullanma veya değiştirme
    - stdin veya TTY davranışında hata ayıklama
summary: Exec araç kullanımı, stdin modları ve TTY desteği
title: Exec aracı
x-i18n:
    generated_at: "2026-04-21T09:06:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5018468f31bb76fc142ddef7002c7bbc617406de7ce912670d1b9edef6a9a042
    source_path: tools/exec.md
    workflow: 15
---

# Exec aracı

Çalışma alanında shell komutları çalıştırın. `process` aracılığıyla ön plan + arka plan yürütmeyi destekler.
`process` izinli değilse `exec` eşzamanlı çalışır ve `yieldMs`/`background` değerlerini yok sayar.
Arka plan oturumları agent başına kapsamlıdır; `process` yalnızca aynı agent'taki oturumları görür.

## Parametreler

- `command` (gerekli)
- `workdir` (varsayılan olarak cwd)
- `env` (anahtar/değer geçersiz kılmaları)
- `yieldMs` (varsayılan 10000): gecikmeden sonra otomatik arka plan
- `background` (bool): hemen arka plana al
- `timeout` (saniye, varsayılan 1800): süresi dolunca öldür
- `pty` (bool): mevcutsa pseudo-terminal içinde çalıştır (yalnızca TTY CLI'ler, coding agent'lar, terminal UI'ları)
- `host` (`auto | sandbox | gateway | node`): nerede yürütüleceği
- `security` (`deny | allowlist | full`): `gateway`/`node` için yaptırım modu
- `ask` (`off | on-miss | always`): `gateway`/`node` için onay istemleri
- `node` (string): `host=node` için node kimliği/adı
- `elevated` (bool): elevated mod iste (sandbox'tan yapılandırılmış host yoluna kaç); `security=full` yalnızca elevated `full` olarak çözümlendiğinde zorlanır

Notlar:

- `host` varsayılan olarak `auto` kullanır: oturum için sandbox çalışma zamanı etkinse sandbox, aksi halde gateway.
- `auto` joker değil, varsayılan yönlendirme stratejisidir. Çağrı başına `host=node`, `auto` içinden izinlidir; çağrı başına `host=gateway` yalnızca sandbox çalışma zamanı etkin değilse izinlidir.
- Ek yapılandırma olmadan `host=auto` yine de "olduğu gibi çalışır": sandbox yoksa `gateway` olarak çözülür; canlı sandbox varsa sandbox içinde kalır.
- `elevated`, yapılandırılmış host yoluna sandbox'tan kaçar: varsayılan olarak `gateway`, veya `tools.exec.host=node` olduğunda (ya da oturum varsayılanı `host=node` ise) `node`. Yalnızca elevated erişim mevcut oturum/sağlayıcı için etkinse kullanılabilir.
- `gateway`/`node` onayları `~/.openclaw/exec-approvals.json` ile denetlenir.
- `node`, eşlenmiş bir node gerektirir (yardımcı uygulama veya headless node host).
- Birden fazla node varsa birini seçmek için `exec.node` veya `tools.exec.node` ayarlayın.
- `exec host=node`, node'lar için tek shell yürütme yoludur; eski `nodes.run` sarmalayıcısı kaldırılmıştır.
- Windows olmayan hostlarda exec, ayarlıysa `SHELL` kullanır; `SHELL` `fish` ise fish ile uyumsuz betikleri önlemek için önce `PATH`
  içinden `bash` (veya `sh`) tercih eder, sonra ikisi de yoksa `SHELL` değerine geri döner.
- Windows hostlarda exec önce PowerShell 7 (`pwsh`) keşfini tercih eder (Program Files, ProgramW6432, sonra PATH),
  ardından Windows PowerShell 5.1'e geri döner.
- Host yürütmesi (`gateway`/`node`), ikili ele geçirme veya eklenmiş kodu önlemek için `env.PATH` ve loader geçersiz kılmalarını (`LD_*`/`DYLD_*`) reddeder.
- OpenClaw, shell/profile kurallarının exec-tool bağlamını algılayabilmesi için başlatılan komut ortamında `OPENCLAW_SHELL=exec` ayarlar (PTY ve sandbox yürütmesi dahil).
- Önemli: sandboxing varsayılan olarak **kapalıdır**. Sandbox kapalıysa örtük `host=auto`
  `gateway` olarak çözülür. Açık `host=sandbox` ise sessizce
  gateway hostunda çalışmak yerine yine fail-closed olur. Sandboxing'i etkinleştirin veya onaylarla `host=gateway` kullanın.
- Betik ön kontrol denetimleri (yaygın Python/Node shell sözdizimi hataları için) yalnızca
  etkin `workdir` sınırı içindeki dosyaları inceler. Bir betik yolu `workdir` dışına çözülürse o
  dosya için ön kontrol atlanır.
- Şimdi başlayan uzun süreli işler için bir kez başlatın ve otomatik
  tamamlama uyandırmasına güvenin; etkinse ve komut çıktı üretirse veya başarısız olursa bu çalışır.
  Günlükler, durum, girdi veya müdahale için `process` kullanın; zamanlama taklidini
  sleep döngüleri, timeout döngüleri veya yinelenen yoklama ile yapmayın.
- Daha sonra veya bir zamanlamaya göre gerçekleşmesi gereken işler için
  `exec` sleep/delay örüntüleri yerine Cron kullanın.

## Yapılandırma

- `tools.exec.notifyOnExit` (varsayılan: true): true olduğunda arka plana alınmış exec oturumları çıkışta bir sistem olayı kuyruğa alır ve Heartbeat ister.
- `tools.exec.approvalRunningNoticeMs` (varsayılan: 10000): onay geçitli bir exec bundan daha uzun sürerse tek bir “running” bildirimi yayar (0 devre dışı bırakır).
- `tools.exec.host` (varsayılan: `auto`; sandbox çalışma zamanı etkinse `sandbox`, aksi halde `gateway` olarak çözülür)
- `tools.exec.security` (varsayılan: sandbox için `deny`, ayarlanmamışsa gateway + node için `full`)
- `tools.exec.ask` (varsayılan: `off`)
- Onaysız host exec, gateway + node için varsayılandır. Onaylar/allowlist davranışı istiyorsanız hem `tools.exec.*` ayarlarını hem de host `~/.openclaw/exec-approvals.json` dosyasını sıkılaştırın; bkz. [Exec approvals](/tr/tools/exec-approvals#no-approval-yolo-mode).
- YOLO, `host=auto` değerinden değil, host-ilkesi varsayılanlarından (`security=full`, `ask=off`) gelir. Gateway veya node yönlendirmesini zorlamak istiyorsanız `tools.exec.host` ayarlayın veya `/exec host=...` kullanın.
- `security=full` artı `ask=off` modunda host exec doğrudan yapılandırılmış ilkeyi izler; ek sezgisel komut-karartma ön filtresi veya betik-ön-kontrol ret katmanı yoktur.
- `tools.exec.node` (varsayılan: ayarlanmamış)
- `tools.exec.strictInlineEval` (varsayılan: false): true olduğunda `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` ve `osascript -e` gibi satır içi yorumlayıcı eval biçimleri her zaman açık onay gerektirir. `allow-always` iyi huylu yorumlayıcı/betik çağrılarını yine kalıcı kılabilir, ancak satır içi eval biçimleri yine her seferinde istem gösterir.
- `tools.exec.pathPrepend`: exec çalıştırmaları için `PATH` başına eklenecek dizin listesi (yalnızca gateway + sandbox).
- `tools.exec.safeBins`: açık allowlist girdileri olmadan çalışabilen yalnızca stdin güvenli ikilileri. Davranış ayrıntıları için bkz. [Safe bins](/tr/tools/exec-approvals#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: `safeBins` yol denetimleri için ayrıca açıkça güvenilen dizinler. `PATH` girdilerine asla otomatik güvenilmez. Yerleşik varsayılanlar `/bin` ve `/usr/bin` olur.
- `tools.exec.safeBinProfiles`: özel safe bin başına isteğe bağlı özel argv ilkesi (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: login-shell `PATH` değeriniz exec ortamına birleştirilir. `env.PATH` geçersiz kılmaları
  host yürütmesi için reddedilir. Daemon'ın kendisi yine minimal bir `PATH` ile çalışır:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: kapsayıcı içinde `sh -lc` (login shell) çalıştırır, bu yüzden `/etc/profile` `PATH` sıfırlayabilir.
  OpenClaw, profil kaynağı sonrası `env.PATH` değerini dahili bir env değişkeniyle başa ekler (shell interpolation yok);
  `tools.exec.pathPrepend` burada da uygulanır.
- `host=node`: geçirdiğiniz ve engellenmemiş env geçersiz kılmaları node'a gönderilir. `env.PATH` geçersiz kılmaları
  host yürütmesi için reddedilir ve node hostlar tarafından yok sayılır. Bir node üzerinde ek PATH girdilerine ihtiyacınız varsa,
  node host hizmet ortamını yapılandırın (systemd/launchd) veya araçları standart konumlara kurun.

Agent başına node bağlama (yapılandırmada agent liste dizinini kullanın):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes sekmesi aynı ayarlar için küçük bir “Exec node binding” paneli içerir.

## Oturum geçersiz kılmaları (`/exec`)

`host`, `security`, `ask` ve `node` için **oturum başına** varsayılanları ayarlamak üzere `/exec` kullanın.
Geçerli değerleri göstermek için bağımsız değişken olmadan `/exec` gönderin.

Örnek:

```txt
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Yetkilendirme modeli

`/exec` yalnızca **yetkili göndericiler** için uygulanır (kanal allowlist'leri/eşleme artı `commands.useAccessGroups`).
Yalnızca **oturum durumunu** günceller ve yapılandırma yazmaz. Exec'i kesin olarak devre dışı bırakmak için araç
ilkesiyle reddedin (`tools.deny: ["exec"]` veya agent başına). Açıkça
`security=full` ve `ask=off` ayarlamadığınız sürece host onayları yine geçerlidir.

## Exec approvals (yardımcı uygulama / node host)

Sandbox içindeki agent'lar, exec gateway veya node host üzerinde çalışmadan önce istek başına onay gerektirebilir.
İlke, allowlist ve UI akışı için bkz. [Exec approvals](/tr/tools/exec-approvals).

Onay gerektiğinde exec aracı hemen
`status: "approval-pending"` ve bir onay kimliğiyle döner. Onaylandıktan sonra (veya reddedildiğinde / zaman aşımına uğradığında),
Gateway sistem olayları yayar (`Exec finished` / `Exec denied`). Komut hâlâ
`tools.exec.approvalRunningNoticeMs` sonrasında çalışıyorsa tek bir `Exec running` bildirimi yayılır.
Yerel onay kartları/düğmeleri olan kanallarda agent önce bu
yerel UI'a güvenmeli ve yalnızca araç
sonucu sohbet onaylarının kullanılamadığını veya tek yolun manuel yol olduğunu açıkça söylediğinde elle `/approve` komutu eklemelidir.

## Allowlist + safe bins

Elle allowlist yaptırımı **yalnızca çözülmüş ikili yollarıyla** eşleşir (basename eşleşmesi yok). `security=allowlist`
olduğunda shell komutlarına yalnızca her pipeline segmenti
allowlist'te veya safe bin ise otomatik izin verilir. Zincirleme (`;`, `&&`, `||`) ve yeniden yönlendirmeler,
allowlist modunda her üst düzey segment allowlist'i karşılamadıkça reddedilir
(safe bin'ler dahil). Yeniden yönlendirmeler yine desteklenmez.
Kalıcı `allow-always` güveni bu kuralı aşmaz: zincirlenmiş bir komut yine her
üst düzey segmentin eşleşmesini gerektirir.

`autoAllowSkills`, exec approvals içinde ayrı bir kolaylık yoludur. Bu,
elle yol allowlist girdileriyle aynı şey değildir. Sıkı açık güven için
`autoAllowSkills` devre dışı bırakılmış halde kalsın.

İki denetimi farklı işler için kullanın:

- `tools.exec.safeBins`: küçük, yalnızca stdin akış filtreleri.
- `tools.exec.safeBinTrustedDirs`: safe bin yürütülebilir yolları için açık ek güvenilir dizinler.
- `tools.exec.safeBinProfiles`: özel safe bin'ler için açık argv ilkesi.
- allowlist: yürütülebilir yollar için açık güven.

`safeBins` öğelerini genel bir allowlist gibi ele almayın ve yorumlayıcı/çalışma zamanı ikilileri eklemeyin (örneğin `python3`, `node`, `ruby`, `bash`). Bunlara ihtiyacınız varsa açık allowlist girdileri kullanın ve onay istemlerini etkin tutun.
`openclaw security audit`, yorumlayıcı/çalışma zamanı `safeBins` girdilerinde açık profil eksik olduğunda uyarır ve `openclaw doctor --fix`, eksik özel `safeBinProfiles` girdilerini iskeletleyebilir.
`openclaw security audit` ve `openclaw doctor`, `jq` gibi geniş davranışlı bin'leri açıkça yeniden `safeBins` içine eklediğinizde de uyarır.
Yorumlayıcıları açıkça allowlist'e alırsanız satır içi kod-eval biçimlerinin yine yeni onay gerektirmesi için `tools.exec.strictInlineEval` etkinleştirin.

Tam ilke ayrıntıları ve örnekler için bkz. [Exec approvals](/tr/tools/exec-approvals#safe-bins-stdin-only) ve [Safe bins versus allowlist](/tr/tools/exec-approvals#safe-bins-versus-allowlist).

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
etkinse komut çıktı ürettiğinde veya başarısız olduğunda oturumu uyandırabilir.

Tuş gönderme (tmux tarzı):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Gönder (yalnızca CR gönder):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Yapıştır (varsayılan olarak bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch`, yapılandırılmış çok dosyalı düzenlemeler için `exec` aracının bir alt aracıdır.
OpenAI ve OpenAI Codex modelleri için varsayılan olarak etkindir. Yapılandırmayı yalnızca
devre dışı bırakmak veya belirli modellerle sınırlamak istediğinizde kullanın:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.4"] },
    },
  },
}
```

Notlar:

- Yalnızca OpenAI/OpenAI Codex modelleri için kullanılabilir.
- Araç ilkesi yine uygulanır; `allow: ["write"]`, örtük olarak `apply_patch` için de izin verir.
- Yapılandırma `tools.exec.applyPatch` altında bulunur.
- `tools.exec.applyPatch.enabled` varsayılan olarak `true` değerindedir; OpenAI modelleri için aracı devre dışı bırakmak üzere bunu `false` yapın.
- `tools.exec.applyPatch.workspaceOnly` varsayılan olarak `true` değerindedir (çalışma alanı içinde sınırlı). `apply_patch` aracının çalışma alanı dizini dışında yazma/silme yapmasını özellikle istiyorsanız bunu yalnızca o zaman `false` yapın.

## İlgili

- [Exec Approvals](/tr/tools/exec-approvals) — shell komutları için onay geçitleri
- [Sandboxing](/tr/gateway/sandboxing) — komutları sandbox ortamlarında çalıştırma
- [Background Process](/tr/gateway/background-process) — uzun süre çalışan exec ve process aracı
- [Security](/tr/gateway/security) — araç ilkesi ve elevated erişim
