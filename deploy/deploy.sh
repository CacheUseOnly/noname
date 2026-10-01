#!/usr/bin/env bash
# 增量部署。默认只重建并同步代码（约 25 秒）；加 --full 连素材一起同步。
#
# 刻意不走 `pnpm build`：那个脚本开头是 rm -rf dist，会让线上站点空几分钟，
# 而且每次都重拷 1.2G 的 audio/image。这里用 rsync 增量覆盖，站点全程可用。
set -euo pipefail
cd "$(dirname "$0")/.."

FULL=0
[ "${1:-}" = "--full" ] && FULL=1

echo "▶ lint"
pnpm lint

echo "▶ 编译本体（含 @noname/fs、@noname/jit 等依赖）"
pnpm -F noname... build

echo "▶ 同步代码到 dist/"
rsync -a apps/core/dist/ dist/

if [ $FULL = 1 ]; then
    echo "▶ 同步素材（新增武将图/语音时才需要）"
    rsync -a apps/core/audio/     dist/audio/
    rsync -a apps/core/image/     dist/image/
    rsync -a apps/core/extension/ dist/extension/
    rsync -a docs/                dist/docs/
    cp .nomedia LICENSE README.md dist/
fi

echo "▶ 自检"
./deploy/check.sh

cat <<'EOF'

────────────────────────────────────────────────────────
静态站不用重启：@fastify/static 每次请求都现读磁盘。

两种情况才要重启：
  改了 packages/fs      → sudo systemctl restart noname-web
  改了 packages/server  → pnpm -F @noname/server build && sudo systemctl restart noname-hall

朋友浏览器里的 .js 可能还是旧的（Cloudflare 把 browser TTL 改写成了 4 小时）：
  让他们 Ctrl+Shift+R，或在 Dashboard 把 Browser Cache TTL 设成
  Respect Existing Headers（源站发 max-age=0，改完即时生效）
────────────────────────────────────────────────────────
EOF
