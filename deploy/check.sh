#!/usr/bin/env bash
# 部署后自检
DOMAIN=noname.cacheuseonly.fun
FAILED=0
pass(){ printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail(){ printf '  \033[31m✗\033[0m %s\n' "$1"; FAILED=1; }

echo "本机监听（两个都应是 127.0.0.1）"
ss -tlnp 2>/dev/null | grep -E '8082|8089' || fail "服务没起来"

echo
echo "写接口必须全部 403"
for r in "/createDir?dir=pwned" "/removeDir?dir=noname" "/removeFile?fileName=index.html"; do
  c=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:8089$r")
  [ "$c" = 403 ] && pass "$r → 403" || fail "$r → $c （应为403！）"
done
c=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'content-type: application/json' \
    -d '{"path":"pwned.txt","data":[65]}' http://127.0.0.1:8089/writeFile)
[ "$c" = 403 ] && pass "POST /writeFile → 403" || fail "POST /writeFile → $c （应为403！）"

echo
echo "读接口应正常"
c=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8089/index.html)
[ "$c" = 200 ] && pass "/index.html → 200" || fail "/index.html → $c"

echo
echo "公网（隧道刚重启时可能要等几秒，自动重试）"
for i in 1 2 3 4 5; do
  c=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' "https://$DOMAIN/index.html")
  [ "$c" = 200 ] && break
  sleep 3
done
[ "$c" = 200 ] && pass "https://$DOMAIN → 200" || fail "https://$DOMAIN → $c"

# 必须强制 http1.1：curl 对 https 默认走 HTTP/2，而 HTTP/2 没有 Upgrade 头机制，
# ws 库会回 426 Upgrade Required —— 那是协议问题，不是隧道问题
c=$(curl -s --http1.1 --max-time 10 -o /dev/null -w '%{http_code}' \
    -H "Connection: Upgrade" -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    "https://$DOMAIN/ws")
[ "$c" = 101 ] && pass "wss://$DOMAIN/ws → 101 Switching Protocols" || fail "wss://$DOMAIN/ws → $c （应为101）"

echo
echo "dist 里的大厅地址"
grep -ro 'wss://[a-z0-9./-]*' dist/noname/library/index.js 2>/dev/null | head -1 || fail "没找到，是不是忘了 pnpm build？"

echo
if [ $FAILED = 0 ]; then
  printf '\033[32m全部通过\033[0m\n'
else
  printf '\033[31m有检查未通过（见上面的 ✗）\033[0m\n'
fi
exit $FAILED
