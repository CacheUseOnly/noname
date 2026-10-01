#!/usr/bin/env bash
# 增量部署：编译 + 同步代码和素材到 dist/，站点全程可用（约 1 分钟）。
#
# 刻意不走 `pnpm build`：那个脚本开头是 rm -rf dist，会让线上站点空几分钟，
# 而且每次无条件重拷 1.2G 素材。这里全部用 rsync 增量覆盖。
#
# 素材一律同步，不做 --full 开关：实测没有改动时 audio 只要 2.6 秒、
# image+extension+docs 6.4 秒，而漏同步的代价是新素材线上 404，很难察觉。
set -uo pipefail
cd "$(dirname "$0")/.."

STEP="启动"
die(){ printf '\n\033[31m✗ 失败于：%s\033[0m\n' "$STEP" >&2; exit 1; }
trap die ERR
set -e

# ── 前置检查 ────────────────────────────────────────────
# 用 sudo 或 cron 跑会丢掉 nvm 注入的 PATH，pnpm/node 就找不到了。
# 这个脚本不需要 root，别加 sudo。
STEP="前置检查（pnpm / node / rsync 是否在 PATH 上）"
for bin in pnpm node rsync; do
    command -v "$bin" >/dev/null || {
        echo "找不到 $bin。" >&2
        [ "$(id -u)" = 0 ] && echo "你是以 root 运行的——本脚本不需要 sudo，去掉再试。" >&2
        echo "PATH=$PATH" >&2
        exit 1
    }
done
[ -f apps/core/package.json ] || { echo "不在仓库根目录？当前：$PWD" >&2; exit 1; }

[ "${1:-}" = "--full" ] && echo "（--full 已不需要，素材现在总是同步）"

STEP="pnpm lint"
echo "▶ $STEP"
pnpm lint

STEP="编译本体（pnpm -F noname... build）"
echo "▶ $STEP"
pnpm -F noname... build

STEP="同步代码到 dist/"
echo "▶ $STEP"
rsync -a apps/core/dist/ dist/

STEP="同步素材到 dist/"
echo "▶ $STEP"
rsync -a apps/core/audio/     dist/audio/
rsync -a apps/core/image/     dist/image/
rsync -a apps/core/extension/ dist/extension/
rsync -a docs/                dist/docs/
cp .nomedia LICENSE README.md dist/

# 自检失败不该吞掉，但后面的提示仍然要打出来
STEP="自检"
echo "▶ $STEP"
set +e
./deploy/check.sh
CHECK=$?
set -e
trap - ERR

cat <<'EOF'

────────────────────────────────────────────────────────
静态站不用重启：@fastify/static 每次请求都现读磁盘。

两种情况才要重启：
  改了 packages/fs      → sudo systemctl restart noname-web
  改了 packages/server  → pnpm -F @noname/server build && sudo systemctl restart noname-hall

朋友浏览器里的 .js 可能还是旧的（Cloudflare 把 browser TTL 改写成了 4 小时）：
  让他们 Ctrl+Shift+R，或在 Dashboard 把 Browser Cache TTL 设成
  Respect Existing Headers（源站发 max-age=0，改完即时生效）

新素材刚上线却还是 404？Cloudflare 会把 404 缓存约 3 分钟（cf-cache-status: HIT）。
等 3 分钟，或 Dashboard 里 purge 对应 URL。先确认源站没问题：
  curl -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8089/<路径>
────────────────────────────────────────────────────────
EOF

exit $CHECK
