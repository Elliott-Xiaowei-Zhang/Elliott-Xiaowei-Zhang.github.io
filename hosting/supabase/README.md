# Supabase Free 访客统计

项目：`xiaowei-homepage-visitors`（`ozaakbkoskdwpwumgaad`），属于 `Elliott-Xiaowei-Zhang's Org`，区域 Tokyo。创建时工具确认组织为 Free，报价为 **$0/月**，没有提供银行卡或开启付费试用。

当前接口：`https://ozaakbkoskdwpwumgaad.supabase.co/functions/v1/visitors`

## 数据和访问范围

- 2026-10-21 从旧独立 Sites 统计服务迁移了 19 条真实匿名记录，保留 UUID 和首次访问时间。数据未放入 Git，不将旧总数与新总数相加。重复迁移同一 UUID 不会增加总数。
- 本应用只保存随机浏览器 UUID、国家／地区代码和首次访问时间。Supabase 未向函数传递 `cf-ipcountry`，因此按其文档所述，在内存中用网关 `X-Forwarded-For` 地址查询随函数打包的离线国家／地区数据库；没有外部 IP 定位请求，不保存或公开原始 IP。提供方自身的基础设施日志不属于本应用数据库。
- 数据表开启 RLS，无匿名／登录用户权限；三个数据库函数为 `SECURITY INVOKER`，只向服务器 `service_role` 开放。没有数据库密钥进入网页。
- Edge Function 的 `verify_jwt = false` 用于已获授权的公开匿名统计。公开 GET 只返回总人数和地区汇总。POST 要求主页 Origin、明确的 `X-Visitor-Intent: count`、JSON 和 UUIDv4。Origin 检查用于约束浏览器跨站请求，不能代替防恶意伪造措施。
- Do Not Track／Global Privacy Control 和可识别爬虫只读不计数；本地预览只读。未知地区保留为 `ZZ`，以后可以补全而不重复计数。已知地区不会因刷新被覆盖。
- 地区展示保持 Mainland China、Taiwan, China、Hong Kong, China、Macau, China。

## 源码和部署

- `migrations/202610210001_visitors.sql`：已应用的表结构、权限和数据库函数。
- `functions/visitors/index.ts`：Deno 入口，自动读取平台服务器环境变量中的密钥。
- `functions/visitors/handler.mjs`：接口校验、去重调用和聚合输出。
- `functions/visitors/country.mjs`：离线解析国家／地区，不发起网络请求。
- `functions/visitors/country-data.mjs`：公开的 `sapics/user-country` IPv4／IPv6 数据集（2026-10-20），PDDL 许可，Brotli + base64 打包；不包含访客数据。来源与校验值见文件头及 `scripts/prepare-country-db.py`。
- `functions/visitors/deno.json`：固定 `mmdb-lib@3.0.3` 依赖。Node 检查使用同版本及已提交锁文件。
- `config.toml`：公开函数配置。

重新部署时通过主页所有者已连接的 Supabase 工具发布 `functions/visitors/` 中的全部文件；不能把服务器密钥复制到前端。网页接口地址在根目录 `site-settings.js`，Sites 副本在 `xiaowei-swiss-homepage/public/site-settings.js`。两端需同步发布，并更新 `visitors.js` 的导入版本及 HTML 的脚本版本。

离线数据库来源：[sapics/ip-location-db](https://github.com/sapics/ip-location-db)，[PDDL 许可](https://opendatacommons.org/licenses/pddl/1-0/)。更新时先核对上游文件和 SHA-256，将准备脚本的固定版本／校验值更新后，运行 `python3 hosting/supabase/scripts/prepare-country-db.py`，再检查、重新部署函数。下载数据库不含任何访客请求或标识。

## 运行和验证

页面加载时直接请求实时接口，可见页面每分钟读取一次；切回窗口、网络恢复和 Refresh 按钮也可触发。GitHub 定时任务仅提供备用静态快照，不是统计同步的前提。跨境请求超时为 12 秒，超时仍保留已有汇总。

大陆连通性测试记录（2026-10-21）：电信和联通成功；北京联通、移动的 GET 均为 200、浏览器 POST 预检均为 204 且 CORS 正确，耗时约 0.5–2.2 秒；探针未提供北京电信样本。南宁、台山移动探针出现 `ECONNRESET`，不能宣称所有大陆线路均可用。网络探针 GET 不计入访客，不能替代真实浏览器计数验证。

```sh
node --test hosting/supabase/tests/visitors.test.mjs
node --test tests/visitor-client.test.mjs tests/visitor-data.test.mjs
python3 -m unittest discover -s tests -p 'test_visitor_snapshot.py'
```

8 项接口检查、11 项客户端检查及 2 项快照检查已通过。云端权限查询确认匿名用户不能读取原始行或调用数据库函数。Advisors 仅提示 RLS 未设置策略，这是服务器独占表有意采用的默认拒绝设计。

[Supabase Free](https://supabase.com/pricing) 有免费额度，可能在一周无活动后暂停；超过额度会受限。没有配置付费扩容。alwaysdata 因注册要求银行卡而排除，相关准备代码已删除。
