#!/usr/bin/env bash
# 用法: ./deploy/set-domain.sh noname.你的域名
set -euo pipefail
[ $# -eq 1 ] || { echo "用法: $0 <你的域名, 例如 noname.example.com>"; exit 1; }
DOMAIN="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 1) 把大厅地址写进客户端默认值，朋友打开就是填好的
python3 - "$ROOT" "$DOMAIN" <<'PY'
import io, re, sys
root, domain = sys.argv[1], sys.argv[2]
p = f"{root}/apps/core/noname/library/index.js"
s = io.open(p, encoding="utf-8").read()
new = f'\thallURL = "wss://{domain}/ws";'
s2, n = re.subn(r'^\thallURL = ".*";$', new, s, count=1, flags=re.M)
if n != 1:
    raise SystemExit(f"没找到 hallURL 那一行，请手动检查 {p}")
io.open(p, "w", encoding="utf-8").write(s2)
print(f"已设置 hallURL = wss://{domain}/ws")
PY

# 2) 更新 cloudflared 配置里的域名
sed -i "s/^\( *- hostname: \).*/\1$DOMAIN/" "$ROOT/deploy/cloudflared-noname.yml"
echo "已更新 deploy/cloudflared-noname.yml 的 hostname"

echo
echo "下一步: pnpm build   # hallURL 改动需要重新构建才会进 dist/"
