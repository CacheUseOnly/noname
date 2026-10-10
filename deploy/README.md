# 无名杀网页端托管 — noname.cacheuseonly.fun

## 架构

```
                Cloudflare (HTTPS + 缓存)
                        │
                cloudflared tunnel
                        │
       ┌────────────────┴────────────────┐
   path ^/ws$                          其余
       │                                 │
127.0.0.1:8082                    127.0.0.1:8089
@noname/server                      @noname/fs
(联机大厅 WS 中继)                 (只读托管 dist/)
```

两个服务都只监听 127.0.0.1，外网唯一入口是隧道。

## 一次性部署

### 1. 构建

```bash
pnpm build && pnpm -F @noname/server build
```

改过 `hallURL`（apps/core/noname/library/index.js）之后必须重新 `pnpm build`，否则 dist 里还是旧地址。

### 2. 起服务

```bash
sudo cp deploy/noname-web.service deploy/noname-hall.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now noname-web noname-hall
```

确认（两行都应该是 127.0.0.1）：

```bash
ss -tlnp | grep -E '8082|8089'
journalctl -u noname-web -u noname-hall -n 20 --no-pager
```

### 3. 建隧道

```bash
cloudflared tunnel login          # 浏览器里授权 cacheuseonly.fun
cloudflared tunnel create noname  # 记下输出的 UUID
```

建好 CNAME（自动，不用去 Dashboard）：

```bash
cloudflared tunnel route dns noname noname.cacheuseonly.fun
```

这台机器上已经有一个 token 模式的远程托管隧道（`cloudflared.service`，tunnel `c506645d`），
所以 **`noname` 用独立的第二个实例**，两者互不影响。不要 `cloudflared service uninstall`。

两个关键点：

1. 配置放在 `/etc/cloudflared/noname.yml`，**不能叫 config.yml** —— 那是 cloudflared 的默认
   配置路径，已有的 token 模式服务重启时会把它读进去，导致隧道 ID 冲突。
2. 服务以 root 运行，所以凭据也要复制到 `/etc/cloudflared/`。

```bash
UUID=cbc4c68d-83ba-44b2-a150-accc16bc0be6
sudo rm -f /etc/cloudflared/config.yml          # 别留在默认路径上
sudo cp deploy/cloudflared-noname.yml      /etc/cloudflared/noname.yml
sudo cp deploy/cloudflared-noname.service  /etc/systemd/system/
sudo cp ~/.cloudflared/$UUID.json          /etc/cloudflared/
sudo chmod 600 /etc/cloudflared/$UUID.json
sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared-noname
```

配置有两份，ingress 内容必须同步，差别只在 `credentials-file` 路径：

| 配置 | 位置 | 用途 |
|---|---|---|
| 用户版 | `~/.cloudflared/config.yml` | `cloudflared tunnel run noname` 手动调试 |
| 服务版 | `/etc/cloudflared/noname.yml` | `cloudflared-noname.service` |

改完先校验再重启（`--config` 必须放在 `tunnel` 子命令**前面**）：

```bash
cloudflared --config ~/.cloudflared/config.yml tunnel ingress validate
cloudflared --config ~/.cloudflared/config.yml tunnel ingress rule https://noname.cacheuseonly.fun/ws
```

### 4. Dashboard（可选，但建议）

实测 Cloudflare 对 `.js` `.jpg` `.mp3` `.woff2` 这些默认可缓存扩展名**已经在边缘存了副本**，
但因为源站发的是 `cache-control: public, max-age=0`，每次请求仍然要回源做一次校验
（`cf-cache-status: REVALIDATED`）。省了流量，没省掉往这台机器的往返。

dist 里有 14000+ 个素材文件，把这个往返去掉值得。Caching → Cache Rules 新建：

- 表达式：`(http.request.uri.path matches "\\.(png|jpg|jpeg|webp|gif|mp3|ogg|wav|woff2|ttf|otf)$")`
- Cache eligibility: Eligible for cache
- **Edge TTL: Override origin → 1 month**（关键，就是它把 REVALIDATED 变成 HIT）
- Browser TTL: Override origin → 1 month

素材按文件名寻址、基本不变，所以重新 build 后也不需要 Purge。

验证生效：同一个图片连请求两次，`cf-cache-status` 应该从 `REVALIDATED` 变成 `HIT`。

```bash
curl -sI https://noname.cacheuseonly.fun/image/character/ahuinan.jpg | grep -i cf-cache-status
```

## 验证

```bash
./deploy/check.sh
```

## 朋友怎么玩

1. 用 Chrome / Edge / Safari 打开 https://noname.cacheuseonly.fun （**Firefox 不支持**）
2. 首次加载要等一会儿，之后走缓存
3. 开始游戏 → 联机 → 地址已预填好 → 点「连接」
4. 一人建房，其余人在房间列表点进去

**房主关标签页房间就没了** —— 游戏逻辑跑在房主浏览器里，服务器只是中继。

## 日常开发

### 快速迭代（改代码时用这个）

```bash
sudo systemctl stop noname-web     # 必须先停，dev 服务器也要占 8089
pnpm dev                            # vite 在 8081，热更新，不用 build
```

**必须先停 `noname-web`**：`pnpm dev` 会起一个 `@noname/fs`，默认端口同样是 8089。
不停的话那个进程起不来，而 vite 的 proxy 还是会把 `/readFile` 打到线上那个只读服务上
——文件根指向 `dist/` 而不是 `apps/core/`，表现就是"改了代码没反应"。

调完恢复：

```bash
sudo systemctl start noname-web
```

### 检查能不能编译

| 命令 | 耗时 | 查什么 |
|---|---|---|
| `pnpm lint` | ~8s | eslint，CI 的 lint-check 跑的就是这个 |
| `pnpm -F noname... build` | ~13s | 真正的编译，语法/import 错误都会暴露 |
| `pnpm build` | ~4min | 完整包。**只在要换素材时用**，见下 |

本仓库没有独立的 typecheck，CI 也只跑 lint 和 build。前两条跑通基本就没问题。

## 部署

```bash
./deploy/deploy.sh
```

代码和素材一律同步，没有 `--full` 开关：实测没有改动时 audio 只要 2.6 秒、
image+extension+docs 6.4 秒，而漏同步素材的代价是新文件线上 404，很难察觉。

**不要用 `pnpm build` 部署。** 它开头是 `rm -rf dist`，会把线上站点删掉三四分钟；
那 4 分钟里有 95% 是在重拷根本没变的 1.2G 素材（纯代码编译只要 13 秒）。
`deploy.sh` 用 rsync 增量覆盖，站点全程可用。

部署后：

- **静态站不用重启** —— `@fastify/static` 每次请求现读磁盘
- 改了 `packages/fs` → `sudo systemctl restart noname-web`
- 改了 `packages/server` → `pnpm -F @noname/server build && sudo systemctl restart noname-hall`
- 朋友浏览器里的 `.js` 可能还是旧的（Cloudflare 把 browser TTL 改写成 4 小时），
  让他们 `Ctrl+Shift+R`；嫌麻烦就把 Dashboard → Caching → Browser Cache TTL
  设成 **Respect Existing Headers**，源站发 `max-age=0`，改完即时生效
- **新素材刚上线还是 404？** Cloudflare 会把 404 缓存约 3 分钟。如果在文件存在前
  请求过它（比如你先点了语音再部署），就会命中这个负缓存（`cf-cache-status: HIT`）。
  等 3 分钟或 purge 对应 URL。先确认源站没问题：
  `curl -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8089/<路径>`

## 临时下线

```bash
sudo systemctl stop noname-web noname-hall cloudflared-noname
```

## 本仓库相对上游的改动

| 文件 | 改动 |
|---|---|
| `packages/fs/src/index.ts` | 加 `--readonly`（禁用 4 个无鉴权写接口）；修复目录沙箱的同前缀逃逸 |
| `packages/server/src/{types,cli}.ts`, `src/server/createServer.ts` | 加 `--host`，允许只监听本机 |
| `apps/core/noname/library/index.js` | `hallURL` 预填大厅地址；联机国战建房默认值改为怀旧牌堆、启用手气卡、关闭替换君主，并新增“副将变更方式”选项（默认随机式）；去掉网页版读不到剪贴板时的“输入邀请链接”询问弹窗 |
| `apps/core/mode/connect.js` | 同上，去掉进入联机地址前的“输入邀请链接”询问弹窗 |
| `apps/core/noname/ui/create/menu/pages/characterPackMenu.js` | 联机建房选中国战后，“武将”页新增“国战武将”页：分类开关、点击单个武将开关、“全部开启 / 全部关闭 / 仅国战标准”按钮；首次使用默认套用“仅国战标准”预设（预设清单在文件内 `GUOZHAN_STANDARD_PRESET`） |
| `apps/core/mode/guozhan/src/patch/player.js` | 联机国战的变更副将读取房间的“副将变更方式”设置（发现式 / 随机式），此前联机时写死为发现式 |
| `apps/core/mode/guozhan/src/patch/content.js` | 联机国战选将池遵守房间的武将禁用设置，并排除十常侍变身后的衍生武将；可选武将过少（每人不足 5 个候选）时忽略禁用设置并提示房主，避免房间卡死 |
| `apps/core/mode/guozhan/src/character/yingbian.js` | 「文德武备」晋势力武将的版本改为读取时才按房间设置决定，修复房主与访客看到不同版本 |

前两项向后兼容（不传新参数时行为与上游一致）。后面几项会改变联机界面和联机国战的行为（默认值、选将池、弹窗），不是向后兼容的。`git pull` 遇到冲突时优先保留这些改动。
