# 🧯 ERROR FLOW PROTOCOL (AI AGENT CONTROL FILE)

> File điều khiển xử lý lỗi chuẩn hệ thống cho AI Agent VS Code
> Dùng chung với: `automation_master_roadmap.mb`

---

# 🎯 MỤC TIÊU

- Chuẩn hoá xử lý lỗi
- Không loạn luồng
- Không đoán lỗi
- Không skip step
- Không phá phase
- Không động prod
- Không tự sửa dữ liệu

👉 Mọi lỗi = quy trình xác định

---

# 🚦 KÍCH HOẠT

Trong AI Agent VS Code, khi có lỗi, gõ:

```
ERROR-FLOW
```

---

# 🔴 FORMAT BẮT BUỘC KHI CÓ LỖI

AI Agent **bắt buộc** trả đúng format:

```
STATUS: ❌ ERROR
STEP: <STEP_ID>
ERROR_TYPE: <TYPE>
ERROR_MESSAGE: <RAW ERROR>
REQUIRED_ACTION: RUN_COMMAND | PROVIDE_CONFIG | PROVIDE_OUTPUT
COMMAND:
<command_here>
```

---

# 🧱 ERROR TYPES

| TYPE | Ý nghĩa |
|------|--------|
| ENV_MISSING | thiếu biến môi trường |
| DB_CONN_FAIL | không kết nối DB |
| MIGRATION_FAIL | lỗi migration |
| SCRIPT_FAIL | lỗi script |
| DEP_MISSING | thiếu package |
| PERMISSION_DENIED | lỗi quyền |
| CONFIG_INVALID | config sai |
| CI_FAIL | pipeline fail |
| TEST_FAIL | test fail |
| UNKNOWN | không xác định |

---

# ⚙️ CHUẨN LỆNH THEO LỖI

## ENV ERROR
```
STATUS: ❌ ERROR
ERROR_TYPE: ENV_MISSING
REQUIRED_ACTION: PROVIDE_CONFIG
NEED:
.env
```

Bạn dán:
```
DB_CONN=...
IAM_KMS_SIGN_URL=...
```

---

## DB ERROR
```
STATUS: ❌ ERROR
ERROR_TYPE: DB_CONN_FAIL
REQUIRED_ACTION: RUN_COMMAND
COMMAND:
psql $env:DB_CONN -c "\\dt"
```

---

## MIGRATION ERROR
```
STATUS: ❌ ERROR
ERROR_TYPE: MIGRATION_FAIL
REQUIRED_ACTION: RUN_COMMAND
COMMAND:
npm run migrate:dry
```

---

## SCRIPT ERROR
```
STATUS: ❌ ERROR
ERROR_TYPE: SCRIPT_FAIL
REQUIRED_ACTION: RUN_COMMAND
COMMAND:
node scripts/query-trigger-registry.js
```

---

## DEP ERROR
```
STATUS: ❌ ERROR
ERROR_TYPE: DEP_MISSING
REQUIRED_ACTION: RUN_COMMAND
COMMAND:
npm install
```

---

## CI ERROR
```
STATUS: ❌ ERROR
ERROR_TYPE: CI_FAIL
REQUIRED_ACTION: PROVIDE_OUTPUT
NEED:
CI LOG
```

---

# 🔁 FORMAT PHỤC HỒI SAU KHI FIX

Sau khi bạn dán output, AI Agent phải trả:

```
ERROR_RESOLVED: true
STEP: <STEP_ID>
STATUS: ✅ RECOVERED
NEXT_COMMAND:
<command>
```

---

# 🧠 RECOVERY FLOW

```
ERROR → ERROR-FLOW
→ RUN COMMAND
→ PASTE OUTPUT
→ ANALYZE
→ FIX
→ RECOVER
→ AUTO-FLOW
```

---

# 🔐 ANTI-CHAOS RULES

AI Agent bị cấm:
- ❌ đoán lỗi
- ❌ sửa code khi chưa có output
- ❌ skip step
- ❌ nhảy phase
- ❌ set env giả
- ❌ fake DB
- ❌ bypass staging
- ❌ auto prod

---

# 🔑 MASTER COMMANDS

## Khi có lỗi:
```
ERROR-FLOW
```

## Khi đã chạy lệnh:
```
PASTE OUTPUT
```

## Khi tiếp tục hệ thống:
```
AUTO-FLOW automation_master_roadmap.mb
```

---

# 🧬 SYSTEM STATE MACHINE

```
RUN STEP
   ↓
ERROR?
   ↓
ERROR-FLOW
   ↓
COMMAND
   ↓
USER RUNS CMD
   ↓
PASTE OUTPUT
   ↓
AI ANALYZE
   ↓
RECOVER
   ↓
AUTO-FLOW
```

---

# 🧠 FILE ROLE

File này là:
- error protocol
- recovery protocol
- debug flow
- ai discipline system
- anti-chaos system
- production safety
- automation safety

---

# 🔒 KẾT HỢP HỆ THỐNG

Dùng cùng:
- automation_master_roadmap.mb
- production_master_blueprint.mb

👉 tạo thành **AI CONTROL PLANE**

---

# ✅ STATUS

ERROR FLOW SYSTEM: READY

