---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “Agent başına sandbox + araç kısıtlamaları, öncelik sırası ve örnekler”
title: Çoklu agent sandbox ve araçlar
x-i18n:
    generated_at: "2026-04-25T13:59:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4473b8ea0f10c891b08cb56c9ba5a073f79c55b42f5b348b69ffb3c3d94c8f88
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Çoklu Agent Sandbox ve Araç Yapılandırması

Çoklu agent kurulumunda her agent, genel sandbox ve araç
ilkesini geçersiz kılabilir. Bu sayfa agent başına yapılandırmayı, öncelik kurallarını ve
örnekleri kapsar.

- **Sandbox backend'leri ve modları**: bkz. [Sandboxing](/tr/gateway/sandboxing).
- **Engellenen araçlarda hata ayıklama**: bkz. [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) ve `openclaw sandbox explain`.
- **Elevated exec**: bkz. [Elevated Mode](/tr/tools/elevated).

Kimlik doğrulama agent başınadır: her agent, kendi `agentDir` auth deposundan
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` yolunda okur.
Kimlik bilgileri agent'lar arasında **paylaşılmaz**. `agentDir` yolunu agent'lar arasında asla yeniden kullanmayın.
Kimlik bilgilerini paylaşmak istiyorsanız `auth-profiles.json` dosyasını diğer agent'ın `agentDir` dizinine kopyalayın.

---

## Yapılandırma örnekleri

### Örnek 1: Kişisel + kısıtlı aile agent'ı

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Sonuç:**

- `main` agent'i: host üzerinde çalışır, tam araç erişimi vardır
- `family` agent'i: Docker içinde çalışır (agent başına bir container), yalnızca `read` aracı vardır

---

### Örnek 2: Paylaşılan sandbox'lı iş agent'ı

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Örnek 2b: Genel coding profili + yalnızca mesajlaşma agent'ı

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Sonuç:**

- varsayılan agent'lar coding araçlarını alır
- `support` agent'i yalnızca mesajlaşma içindir (+ Slack aracı)

---

### Örnek 3: Agent başına farklı sandbox modları

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Genel varsayılan
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Geçersiz kılma: main asla sandbox içinde değil
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Geçersiz kılma: public her zaman sandbox içinde
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Yapılandırma önceliği

Hem genel (`agents.defaults.*`) hem de agent'e özgü (`agents.list[].*`) yapılandırmalar varsa:

### Sandbox yapılandırması

Agent'e özgü ayarlar geneli geçersiz kılar:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Notlar:**

- `agents.list[].sandbox.{docker,browser,prune}.*`, o agent için `agents.defaults.sandbox.{docker,browser,prune}.*` değerlerini geçersiz kılar (`"shared"` sandbox kapsamına çözülürse yok sayılır).

### Araç kısıtlamaları

Filtreleme sırası şöyledir:

1. **Araç profili** (`tools.profile` veya `agents.list[].tools.profile`)
2. **Sağlayıcı araç profili** (`tools.byProvider[provider].profile` veya `agents.list[].tools.byProvider[provider].profile`)
3. **Genel araç ilkesi** (`tools.allow` / `tools.deny`)
4. **Sağlayıcı araç ilkesi** (`tools.byProvider[provider].allow/deny`)
5. **Agent'e özgü araç ilkesi** (`agents.list[].tools.allow/deny`)
6. **Agent sağlayıcı ilkesi** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Sandbox araç ilkesi** (`tools.sandbox.tools` veya `agents.list[].tools.sandbox.tools`)
8. **Subagent araç ilkesi** (`tools.subagents.tools`, uygulanıyorsa)

Her düzey araçları daha da kısıtlayabilir, ancak önceki düzeylerde reddedilen araçları geri veremez.
`agents.list[].tools.sandbox.tools` ayarlanmışsa o agent için `tools.sandbox.tools` yerine geçer.
`agents.list[].tools.profile` ayarlanmışsa o agent için `tools.profile` değerini geçersiz kılar.
Sağlayıcı araç anahtarları ya `provider` (ör. `google-antigravity`) ya da `provider/model` (ör. `openai/gpt-5.4`) kabul eder.

Bu zincirdeki herhangi bir açık allowlist çalışma için çağrılabilir hiç araç bırakmazsa
OpenClaw istemi modele göndermeden önce durur. Bu bilinçli bir davranıştır:
`agents.list[].tools.allow: ["query_db"]` gibi eksik bir araçla yapılandırılmış bir agent,
`query_db` kaydeden plugin etkinleştirilene kadar yüksek sesle başarısız olmalıdır;
salt metin agent olarak devam etmemelidir.

Araç ilkeleri, birden çok araca genişleyen `group:*` kısaltmalarını destekler. Tam liste için [Tool groups](/tr/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) sayfasına bakın.

Agent başına Elevated geçersiz kılmaları (`agents.list[].tools.elevated`), belirli agent'lar için elevated exec'i daha da kısıtlayabilir. Ayrıntılar için [Elevated Mode](/tr/tools/elevated) sayfasına bakın.

---

## Tek agent'tan geçiş

**Önce (tek agent):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Sonra (farklı profillerle çoklu agent):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

Eski `agent.*` yapılandırmaları `openclaw doctor` tarafından taşınır; bundan sonra `agents.defaults` + `agents.list` tercih edin.

---

## Araç kısıtlama örnekleri

### Salt okunur agent

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Güvenli yürütme agent'ı (dosya değişikliği yok)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Yalnızca iletişim agent'ı

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

Bu profilde `sessions_history` yine de ham transcript dökümü yerine sınırlı, temizlenmiş bir geri çağırma görünümü döndürür. Yardımcı geri çağırması; düşünme etiketlerini,
`<relevant-memories>` iskeletini, düz metin tool-call XML yüklerini
(` <tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kesilmiş tool-call blokları dahil),
düşürülmüş tool-call iskeletini, sızmış ASCII/tam genişlikte model denetim
token'larını ve bozuk MiniMax tool-call XML'ini redaksiyon/kısaltmadan önce çıkarır.

---

## Yaygın tuzak: `"non-main"`

`agents.defaults.sandbox.mode: "non-main"`, agent kimliğine değil `session.mainKey` değerine (varsayılan `"main"`)
dayanır.
Grup/kanal oturumları her zaman kendi anahtarlarını alır, bu yüzden
non-main kabul edilir ve sandbox içine alınır. Bir agent'in asla
sandbox kullanmamasını istiyorsanız `agents.list[].sandbox.mode: "off"` ayarlayın.

---

## Test

Çoklu agent sandbox ve araçları yapılandırdıktan sonra:

1. **Agent çözümlemesini kontrol edin:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Sandbox container'larını doğrulayın:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Araç kısıtlamalarını test edin:**
   - Kısıtlı araçlar gerektiren bir mesaj gönderin
   - Agent'in reddedilmiş araçları kullanamadığını doğrulayın

4. **Günlükleri izleyin:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Sorun giderme

### `mode: "all"` olmasına rağmen agent sandbox içinde değil

- Bunu geçersiz kılan genel bir `agents.defaults.sandbox.mode` olup olmadığını kontrol edin
- Agent'e özgü yapılandırma önceliklidir, bu yüzden `agents.list[].sandbox.mode: "all"` ayarlayın

### Ret listesine rağmen araçlar hâlâ kullanılabiliyor

- Araç filtreleme sırasını kontrol edin: genel → agent → sandbox → subagent
- Her düzey yalnızca daha fazla kısıtlayabilir, geri veremez
- Günlüklerle doğrulayın: `[tools] filtering tools for agent:${agentId}`

### Container agent başına yalıtılmamış

- Agent'e özgü sandbox yapılandırmasında `scope: "agent"` ayarlayın
- Varsayılan `"session"` olduğundan oturum başına bir container oluşturur

---

## İlgili

- [Sandboxing](/tr/gateway/sandboxing) -- tam sandbox başvurusu (modlar, kapsamlar, backend'ler, image'lar)
- [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated) -- "bu neden engellendi?" için hata ayıklama
- [Elevated Mode](/tr/tools/elevated)
- [Multi-Agent Routing](/tr/concepts/multi-agent)
- [Sandbox Configuration](/tr/gateway/config-agents#agentsdefaultssandbox)
- [Session Management](/tr/concepts/session)
