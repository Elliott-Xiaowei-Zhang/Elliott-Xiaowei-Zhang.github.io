# 可选：保留真实访客统计

这里包含一个独立的 Cloudflare Worker 和 D1 统计后端，不依赖 Sites、Vinext 或原项目的部署工具。默认 GitHub Pages 版本已连接独立的 Sites 统计接口，无需执行本文件步骤。只有希望把网页和统计数据库迁移到自己的 Cloudflare 账号时，才使用下面的自托管方案。Worker 在同一域名下提供网页文件及 `/api/visitors`，使用主页自身 localStorage 中的随机浏览器 ID 去重，不依赖第三方 Cookie。

## 首次部署

以下命令均在 `XiaoweiHomepage` 根目录运行，需要 Node.js、Python 3 和自己的 Cloudflare 账号。`npx wrangler` 使用 Cloudflare 的官方命令行工具；如果提示安装，请确认包名为 `wrangler`。

```sh
npx wrangler login
npx wrangler d1 create xiaowei-homepage-visitors
```

把创建数据库时返回的真实 `database_id` 填入 `hosting/cloudflare/wrangler.json`，替换其中的全零占位 ID。请保留 `DB` 绑定名；如果修改 `database_name`，下方命令中的数据库名也需同步修改。

```sh
npx wrangler d1 migrations apply xiaowei-homepage-visitors --remote --config hosting/cloudflare/wrangler.json
python3 scripts/prepare-site.py --with-visitors
npx wrangler deploy --config hosting/cloudflare/wrangler.json
```

完成后使用 Cloudflare 返回的网站地址，或为该 Worker 配置自己的域名。根据实际地址修改根目录 `index.html` 的 `og:url` 后重新部署。

## 后续修改与预览

只需修改根目录的 `index.html`、`data.json`、`style.css` 等网页源文件，不要直接改生成的 `dist/`。

重新部署：

```sh
python3 scripts/prepare-site.py --with-visitors
npx wrangler deploy --config hosting/cloudflare/wrangler.json
```

本地预览带统计的版本：

```sh
python3 scripts/prepare-site.py --with-visitors
npx wrangler d1 migrations apply xiaowei-homepage-visitors --local --config hosting/cloudflare/wrangler.json
npx wrangler dev --config hosting/cloudflare/wrangler.json
```

本地和线上数据库相互独立，本地请求可能没有国家/地区信息。

## 统计口径

- 近似独立浏览器计数、匿名随机 ID、国家/地区汇总，不保存 IP、精确位置或账户信息。
- 读取 Do Not Track / Global Privacy Control；识别到的爬虫不计数；只允许已配置主页来源或同源计数请求，本地预览仅读取总数。
- 国家/地区由 Cloudflare 边缘节点提供，浏览器不能通过请求正文指定位置。
- 原 Sites 数据库的历史记录不包含在此文件夹中。新数据库从实际启用时开始计数，不能将原 Sites 的私有 API 直接用于 GitHub Pages。
- 默认 GitHub Pages 版本使用公开的独立接口和受限跨域策略，不发送跨站 Cookie。运行 `--with-visitors` 会改用这个自托管 Worker 的同源接口和数据库。

部署参数参考 [Cloudflare 官方文档](https://developers.cloudflare.com/workers/static-assets/binding/)。
