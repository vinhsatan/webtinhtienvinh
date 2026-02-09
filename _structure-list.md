# Danh sách plugin, migration, route, middleware

## Plugins
- addRenderIds.ts
- aliases.ts
- console-to-parent.ts
- layouts.ts
- loadFontsFromTailwindSource.ts
- nextPublicProcessEnv.ts
- restart.ts
- restartEnvFileChange.ts

## Migrations
- 20260201_01_create_auth_tables.sql
- 20260201_02_create_main_tables.sql
- 20260201_03_create_templates_table.sql
- 20260201_04_add_missing_columns.sql
- 20260202_add_cost_to_transactions.sql
- 20260203_remove_duplicate_products.sql
- 20260207_fix_transactions_schema.sql

## Route (src/app/api/)
- auth/
- categories/
- customers/
- orders/
- products/
- templates/
- transactions/
- utils/
- vitest.config.ts
- wallets/

## Middleware (__create/)
- adapter.ts
- admin-routes.ts
- auth-routes.ts
- get-html-for-error-page.ts
- index.ts
- is-auth-action.ts
- jwt-middleware.ts
- route-builder.ts
- session-auth-middleware.ts
- vault-secrets.ts
- websocket-server.ts

---

Tiếp theo sẽ kiểm tra và đề xuất xóa các plugin, migration, route, middleware dư thừa hoặc trùng chức năng.