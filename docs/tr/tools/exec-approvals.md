---
read_when:
    - Exec onaylarını veya allowlist’leri yapılandırma
    - macOS uygulamasında exec onay UX’ini uygulama
    - Sandbox’tan çıkış istemlerini ve etkilerini gözden geçirme
summary: Exec onayları, allowlist’ler ve sandbox’tan çıkış istemleri
title: Exec onayları
x-i18n:
    generated_at: "2026-04-25T13:58:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

Exec onayları, sandbox içindeki bir ajanın gerçek bir ana makinede (`gateway` veya `node`) komut çalıştırmasına izin vermek için kullanılan **yardımcı uygulama / node host korkuluğudur**. Bir güvenlik ara kilidi olarak çalışır: komutlara yalnızca politika + allowlist + (isteğe bağlı) kullanıcı onayı birlikte izin verirse izin verilir. Exec onayları, araç politikası ve elevated geçidinin **üzerine eklenir** (`elevated` değeri onayları atlayan `full` olarak ayarlanmadıkça).

<Note>
Geçerli politika, `tools.exec.*` ile onay varsayılanları arasındaki **daha sıkı** olandır; bir onay alanı belirtilmezse `tools.exec` değeri kullanılır. Host exec ayrıca o makinedeki yerel onay durumunu da kullanır — `~/.openclaw/exec-approvals.json` içindeki host-yerel `ask: "always"`, oturum veya yapılandırma varsayılanları `ask: "on-miss"` istese bile istem göstermeye devam eder.
</Note>

## Geçerli politikayı inceleme

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — istenen politikayı, host politika kaynaklarını ve geçerli sonucu gösterir.
- `openclaw exec-policy show` — yerel makinede birleştirilmiş görünüm.
- `openclaw exec-policy set|preset` — yerel istenen politikayı yerel host onay dosyasıyla tek adımda eşzamanlar.

Yerel bir kapsam `host=node` istediğinde, `exec-policy show` yerel onay dosyasının doğruluk kaynağı olduğunu varsaymak yerine bu kapsamı çalışma zamanında node tarafından yönetiliyor olarak bildirir.

Yardımcı uygulama UI’si **mevcut değilse**, normalde istem gösterecek her istek **ask fallback** ile çözülür (varsayılan: deny).

<Tip>
Yerel sohbet onay istemcileri, bekleyen onay mesajı üzerinde kanala özgü kolaylıklar başlatabilir. Örneğin Matrix, yedek olarak mesaj içinde `/approve ...` komutlarını bırakırken tepki kısayolları (`✅` bir kez izin ver, `❌` reddet, `♾️` her zaman izin ver) başlatır.
</Tip>

## Nerede uygulanır

Exec onayları, yürütme host’unda yerel olarak uygulanır:

- **gateway host** → gateway makinesindeki `openclaw` süreci
- **node host** → node runner (macOS yardımcı uygulaması veya başsız node host)

Güven modeli notu:

- Gateway kimliği doğrulanmış çağıranlar, bu Gateway için güvenilir operatörlerdir.
- Eşleştirilmiş node’lar, bu güvenilir operatör yeteneğini node host’a genişletir.
- Exec onayları, yanlışlıkla yürütme riskini azaltır ancak kullanıcı başına bir kimlik doğrulama sınırı değildir.
- Onaylanan node-host çalıştırmaları kanonik yürütme bağlamını bağlar: kanonik cwd, tam argv, mevcut olduğunda env bağı ve geçerliyse sabitlenmiş çalıştırılabilir yol.
- Kabuk betikleri ve doğrudan yorumlayıcı/çalışma zamanı dosya çağrıları için OpenClaw ayrıca tek bir somut yerel dosya operandını bağlamaya çalışır. Bu bağlı dosya onaydan sonra ama yürütmeden önce değişirse, sürüklenen içerik yürütülmek yerine çalışma reddedilir.
- Bu dosya bağlama kasıtlı olarak en iyi çabadır; her yorumlayıcı/çalışma zamanı yükleyici yolunun tam bir anlamsal modeli değildir. Onay modu bağlamak için tam olarak bir somut yerel dosya belirleyemezse, tam kapsam varmış gibi davranmak yerine onay destekli bir çalıştırma üretmeyi reddeder.

macOS ayrımı:

- **node host service**, `system.run` çağrısını yerel IPC üzerinden **macOS uygulaması**na iletir.
- **macOS uygulaması**, onayları uygular ve komutu UI bağlamında yürütür.

## Ayarlar ve depolama

Onaylar, yürütme host’unda yerel bir JSON dosyasında tutulur:

`~/.openclaw/exec-approvals.json`

Örnek şema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Onaysız "YOLO" modu

Host exec’in onay istemleri olmadan çalışmasını istiyorsanız, **her iki** politika katmanını da açmanız gerekir:

- OpenClaw yapılandırmasındaki istenen exec politikası (`tools.exec.*`)
- `~/.openclaw/exec-approvals.json` içindeki host-yerel onay politikası

Açıkça sıkılaştırmadığınız sürece bu artık varsayılan host davranışıdır:

- `tools.exec.security`: `gateway`/`node` üzerinde `full`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Önemli ayrım:

- `tools.exec.host=auto`, exec’in nerede çalışacağını seçer: varsa sandbox, yoksa gateway.
- YOLO, host exec’in nasıl onaylanacağını seçer: `security=full` artı `ask=off`.
- Kendi etkileşimsiz izin modunu sunan CLI destekli sağlayıcılar bu politikayı izleyebilir.
  Claude CLI, OpenClaw’ın istenen exec politikası YOLO olduğunda `--permission-mode bypassPermissions` ekler. Bu arka uç davranışını, örneğin
  `--permission-mode default`, `acceptEdits` veya `bypassPermissions` gibi açık Claude argümanlarıyla
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` altında geçersiz kılın.
- YOLO modunda OpenClaw, yapılandırılmış host exec politikasının üzerine ayrı bir sezgisel komut gizleme onay geçidi veya script-preflight reddetme katmanı eklemez.
- `auto`, sandbox içindeki bir oturumdan gateway yönlendirmesini ücretsiz bir geçersiz kılma yapmaz. Çağrı başına `host=node` isteğine `auto` içinden izin verilir; `host=gateway` ise yalnızca etkin bir sandbox çalışma zamanı yoksa `auto` içinden izin alır. Kararlı bir auto olmayan varsayılan istiyorsanız `tools.exec.host` ayarlayın veya `/exec host=...` değerini açıkça kullanın.

Daha muhafazakâr bir kurulum istiyorsanız katmanlardan birini `allowlist` / `on-miss`
veya `deny` olarak yeniden sıkılaştırın.

Kalıcı gateway-host "asla istem gösterme" kurulumu:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Ardından host onay dosyasını eşleşecek şekilde ayarlayın:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Geçerli makinede aynı gateway-host politikası için yerel kısayol:

```bash
openclaw exec-policy preset yolo
```

Bu yerel kısayol şunların ikisini de günceller:

- yerel `tools.exec.host/security/ask`
- yerel `~/.openclaw/exec-approvals.json` varsayılanları

Bu bilerek yalnızca yerlidir. Gateway-host veya node-host onaylarını uzaktan değiştirmeniz gerekiyorsa `openclaw approvals set --gateway` veya
`openclaw approvals set --node <id|name|ip>` kullanmaya devam edin.

Bir node host için aynı onay dosyasını bunun yerine o node üzerinde uygulayın:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Önemli yalnızca-yerel sınırlama:

- `openclaw exec-policy`, node onaylarını eşzamanlamaz
- `openclaw exec-policy set --host node` reddedilir
- node exec onayları çalışma zamanında node’dan alınır, bu nedenle node hedefli güncellemelerde `openclaw approvals --node ...` kullanılmalıdır

Yalnızca oturum kısayolu:

- `/exec security=full ask=off` yalnızca geçerli oturumu değiştirir.
- `/elevated full`, bu oturum için exec onaylarını da atlayan bir acil durum kısayoludur.

Host onay dosyası yapılandırmadan daha sıkı kalırsa, daha sıkı host politikası yine kazanır.

## Politika düğmeleri

### Security (`exec.security`)

- **deny**: tüm host exec isteklerini engeller.
- **allowlist**: yalnızca allowlist’e alınmış komutlara izin verir.
- **full**: her şeye izin verir (elevated ile eşdeğer).

### Ask (`exec.ask`)

- **off**: asla istem gösterme.
- **on-miss**: yalnızca allowlist eşleşmediğinde istem göster.
- **always**: her komutta istem göster.
- Etkin ask modu `always` olduğunda `allow-always` kalıcı güven yeni istemleri bastırmaz

### Ask fallback (`askFallback`)

Bir istem gerekliyse ancak hiçbir UI erişilebilir değilse, fallback şuna karar verir:

- **deny**: engelle.
- **allowlist**: yalnızca allowlist eşleşirse izin ver.
- **full**: izin ver.

### Satır içi yorumlayıcı eval sıkılaştırması (`tools.exec.strictInlineEval`)

`tools.exec.strictInlineEval=true` olduğunda OpenClaw, yorumlayıcı ikili dosyasının kendisi allowlist’te olsa bile satır içi code-eval biçimlerini yalnızca onaylı olarak ele alır.

Örnekler:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Bu, tek bir sabit dosya operandına temiz biçimde eşlenmeyen yorumlayıcı yükleyicileri için savunmayı derinleştirme önlemidir. Sıkı modda:

- bu komutlar yine de açık onay gerektirir;
- `allow-always`, bunlar için yeni allowlist girdilerini otomatik olarak kalıcılaştırmaz.

## Allowlist (ajan başına)

Allowlist’ler **ajan başınadır**. Birden fazla ajan varsa, macOS uygulamasında düzenlediğiniz ajanı değiştirin. Desenler glob eşleşmeleridir.
Desenler çözümlenmiş ikili yol glob’ları veya yalın komut adı glob’ları olabilir. Yalın adlar yalnızca PATH üzerinden çağrılan komutlarla eşleşir; yani komut `rg` ise `rg`, `/opt/homebrew/bin/rg` ile eşleşebilir ama `./rg` veya `/tmp/rg` ile eşleşmez. Belirli bir ikili konumuna güvenmek istediğinizde bir yol glob’u kullanın.
Eski `agents.default` girdileri yükleme sırasında `agents.main` içine taşınır.
`echo ok && pwd` gibi kabuk zincirlerinde yine de her üst düzey parçanın allowlist kurallarını karşılaması gerekir.

Örnekler:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Her allowlist girdisi şunları izler:

- UI kimliği için kullanılan kararlı UUID **id** (isteğe bağlı)
- **son kullanım** zaman damgası
- **son kullanılan komut**
- **son çözümlenen yol**

## Skill CLI’lerini otomatik allowlist’e alma

**Auto-allow skill CLIs** etkin olduğunda, bilinen Skills tarafından başvurulan çalıştırılabilir dosyalar node’larda (macOS node veya başsız node host) allowlist’te sayılır. Bu, skill bin listesini almak için Gateway RPC üzerinden `skills.bins` kullanır. Sıkı manuel allowlist’ler istiyorsanız bunu devre dışı bırakın.

Önemli güven notları:

- Bu, manuel yol allowlist girdilerinden ayrı bir **örtük kolaylık allowlist’idir**.
- Gateway ve node’un aynı güven sınırı içinde olduğu güvenilir operatör ortamları için tasarlanmıştır.
- Sıkı açık güven gerektiriyorsanız `autoAllowSkills: false` olarak tutun ve yalnızca manuel yol allowlist girdilerini kullanın.

## Güvenli bin’ler ve onay yönlendirme

Güvenli bin’ler (yalnızca stdin hızlı yolu), yorumlayıcı bağlama ayrıntıları ve onay istemlerinin Slack/Discord/Telegram’a nasıl yönlendirileceği (veya bunların yerel onay istemcileri olarak nasıl çalıştırılacağı) için [Exec approvals — advanced](/tr/tools/exec-approvals-advanced) bölümüne bakın.

<!-- /tools/exec-approvals-advanced bölümüne taşındı -->

## Control UI düzenleme

Varsayılanları, ajan başına geçersiz kılmaları ve allowlist’leri düzenlemek için **Control UI → Nodes → Exec approvals** kartını kullanın. Bir kapsam seçin (Varsayılanlar veya bir ajan), politikayı ayarlayın, allowlist desenleri ekleyin/kaldırın ve ardından **Kaydet**’e tıklayın. UI, listeyi düzenli tutabilmeniz için desen başına **son kullanım** meta verilerini gösterir.

Hedef seçici **Gateway**’i (yerel onaylar) veya bir **Node**’u seçer. Node’ların `system.execApprovals.get/set` bildirmesi gerekir (macOS uygulaması veya başsız node host).
Bir node henüz exec onayları bildirmiyorsa, yerel
`~/.openclaw/exec-approvals.json` dosyasını doğrudan düzenleyin.

CLI: `openclaw approvals`, gateway veya node düzenlemeyi destekler ([Approvals CLI](/tr/cli/approvals) bölümüne bakın).

## Onay akışı

Bir istem gerektiğinde gateway, operatör istemcilerine `exec.approval.requested` yayınlar.
Control UI ve macOS uygulaması bunu `exec.approval.resolve` ile çözer; ardından gateway onaylanmış isteği node host’a iletir.

`host=node` için onay istekleri, kanonik bir `systemRunPlan` yükü içerir. Gateway, onaylanmış `system.run` isteklerini iletirken bu planı yetkili komut/cwd/oturum bağlamı olarak kullanır.

Bu, eşzamansız onay gecikmesi için önemlidir:

- node exec yolu en başta tek bir kanonik plan hazırlar
- onay kaydı bu planı ve bağlama meta verilerini saklar
- onay verildikten sonra son iletilen `system.run` çağrısı, daha sonraki çağıran düzenlemelerine güvenmek yerine saklanan planı yeniden kullanır
- çağıran, onay isteği oluşturulduktan sonra `command`, `rawCommand`, `cwd`, `agentId` veya `sessionKey` değerlerini değiştirirse gateway iletilen çalıştırmayı bir onay uyumsuzluğu olarak reddeder

## Sistem olayları

Exec yaşam döngüsü sistem mesajları olarak gösterilir:

- `Exec running` (yalnızca komut çalışma bildirimi eşiğini aşarsa)
- `Exec finished`
- `Exec denied`

Bunlar, node olayı bildirdikten sonra ajanın oturumuna gönderilir.
Gateway-host exec onayları, komut bittiğinde aynı yaşam döngüsü olaylarını yayar (ve isteğe bağlı olarak eşikten daha uzun süre çalıştığında da).
Onay geçidinden geçen exec’ler, kolay ilişkilendirme için bu mesajlarda `runId` olarak onay kimliğini yeniden kullanır.

## Reddedilen onay davranışı

Eşzamansız bir exec onayı reddedildiğinde OpenClaw, ajanın oturum içindeki aynı komutun daha önceki herhangi bir çalıştırmasından gelen çıktıyı yeniden kullanmasını engeller. Reddetme nedeni, hiçbir komut çıktısının mevcut olmadığına dair açık yönlendirmeyle birlikte iletilir; bu da ajanın yeni çıktı varmış gibi iddia etmesini veya önceki başarılı bir çalıştırmadan kalan eski sonuçlarla reddedilen komutu tekrarlamasını durdurur.

## Etkiler

- **full** güçlüdür; mümkün olduğunda allowlist tercih edin.
- **ask**, hızlı onaylara izin verirken sizi sürecin içinde tutar.
- Ajan başına allowlist’ler, bir ajanın onaylarının diğerlerine sızmasını önler.
- Onaylar yalnızca **yetkili gönderenlerden** gelen host exec isteklerine uygulanır. Yetkisiz gönderenler `/exec` veremez.
- `/exec security=full`, yetkili operatörler için oturum düzeyinde bir kolaylıktır ve tasarım gereği onayları atlar. Host exec’i kesin olarak engellemek için onay security değerini `deny` yapın veya araç politikası üzerinden `exec` aracını reddedin.

## İlgili

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/tr/tools/exec-approvals-advanced" icon="gear">
    Güvenli bin’ler, yorumlayıcı bağlama ve sohbete onay yönlendirme.
  </Card>
  <Card title="Exec aracı" href="/tr/tools/exec" icon="terminal">
    Shell komutu yürütme aracı.
  </Card>
  <Card title="Elevated mode" href="/tr/tools/elevated" icon="shield-exclamation">
    Onayları da atlayan acil durum yolu.
  </Card>
  <Card title="Sandboxing" href="/tr/gateway/sandboxing" icon="box">
    Sandbox modları ve çalışma alanı erişimi.
  </Card>
  <Card title="Güvenlik" href="/tr/gateway/security" icon="lock">
    Güvenlik modeli ve sıkılaştırma.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Her denetime ne zaman başvurulmalı.
  </Card>
  <Card title="Skills" href="/tr/tools/skills" icon="sparkles">
    Skill destekli otomatik allow davranışı.
  </Card>
</CardGroup>
