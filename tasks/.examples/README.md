# Task Queue Examples

Thư mục này chứa các file mẫu để tham khảo format.

## Cấu trúc task thực tế

Một task thực tế trong `tasks/` sẽ có dạng:

```
tasks/
├── them-dashboard-api/           # task-id (kebab-case)
│   ├── plan.md                   # [Lead] Plan + subtask breakdown
│   ├── context.md                # [Lead] Shared context (optional)
│   ├── 01-create-endpoint/       # subtask (zero-padded number + name)
│   │   ├── task.md               # [Lead] Worker instruction
│   │   ├── result.md             # [Worker] Result (generated)
│   │   └── blocked.md            # [Worker] Blocked (generated if needed)
│   └── 02-add-tests/
│       ├── task.md
│       ├── result.md
│       └── blocked.md
```

Xem các file `.md` trong thư mục này để biết format chi tiết.
