# Xiaowei (Elliott) Zhang — Personal Homepage

这是截至 **2026-10-21** 的完整、可编辑网站导出，包含目前确认的内容、设计、字体、彩色头像和交互。页面无需安装前端依赖或编译即可部署到 GitHub Pages；访客统计的可选服务器代码也已附上。

## 修改哪些文件

| 文件 | 用途 |
| --- | --- |
| `index.html` | 首页介绍、研究概述、板块标题、联系信息与页面结构 |
| `data.json` | 论文、ongoing projects、教育、课程、教学、奖项、talks、service |
| `style.css` | 字体、颜色、字号、留白、移动端布局和鼠标悬停效果 |
| `app.js` | 论文分类、自动计数、摘要展开、课程折叠、中英文题名切换等交互 |
| `visitors.js` / `visitor-client.js` / `visitor-data.js` | 世界地图、匿名浏览器去重与统计容错加载 |
| `site-settings.js` | 已启用的独立统计接口地址与同域快照路径 |
| `visitor-snapshot.json` | 真实访客总数与国家/地区汇总的发布快照 |
| `scripts/update-visitor-snapshot.py` | 发布时只读获取真实汇总；不新增访问记录 |
| `assets/` | 彩色头像、Inter 字体及其许可证、世界地图数据及来源 |
| `hosting/cloudflare/` | 可选的访客统计服务器、数据库建表文件和部署说明 |
| `scripts/prepare-site.py` | 将网页资源整理到 `dist/`，用于自动部署 |
| `google*.html` | Google Search Console 验证文件；发布时原样复制到网站根目录 |

Working papers 放在 `data.json` 的 `papers` 中，`type` 为 `working`；ongoing projects 放在 `ongoing_projects` 中。分类上的 `02+03` 会根据两组记录数量自动更新。课程和 ongoing projects 按数据中的顺序展示。

修改 `data.json` 时注意保留双引号、逗号和括号；JSON 不支持注释。可用 `python3 -m json.tool data.json > /dev/null` 检查格式。

## 本地预览

在这个文件夹内打开终端，运行：

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

浏览器打开 `http://127.0.0.1:8000/`。结束预览时按 `Ctrl+C`。

请通过这个本地地址预览，不要直接双击 HTML 文件；浏览器通常会阻止 `file://` 页面读取 JSON 和 JavaScript 模块。

## 上传到 GitHub Pages

将**这个文件夹里的内容**放入目标仓库根目录，让 `index.html` 与 `data.json` 直接位于仓库根目录。不要只把外层 `XiaoweiHomepage` 文件夹作为仓库里的一个子目录上传。

如果继续使用原来的主页地址，目标仓库应为 `elliott-xiaowei-zhang.github.io`。页面的分享地址 `og:url` 已按这个地址填写；更换仓库或域名时，修改 `index.html` 中的这一项。

可以选择以下任一种部署方式：

1. **直接部署文件：**在仓库的 Settings → Pages 中，选择 Deploy from a branch，再选择相应分支和 `/ (root)`。根目录已有 `.nojekyll`。
2. **GitHub Actions：**上传时同时包含隐藏的 `.github/workflows/pages.yml`，在 Settings → Pages 中将 Source 设为 GitHub Actions。工作流会在 `main` 或 `master` 分支更新时整理网页文件并部署，也可手动运行；还会每 5 分钟尝试刷新访客汇总并发布，不产生额外源码提交。

所有本地资源均已改为相对路径，因此也适用于 `https://用户名.github.io/仓库名/` 这种项目网站地址。

Google Search Console 的 HTML 验证文件直接保存在仓库根目录。发布脚本会自动包含根目录的 `google*.html`，保留原文件名和内容，无需逐个修改脚本。验证成功后也应保留这些文件。

## 访客地图的区别

GitHub Pages 和 Sites 版本共用 Supabase Free 统计 API：`https://ozaakbkoskdwpwumgaad.supabase.co/functions/v1/visitors`。该项目属于主页所有者的免费组织，无需银行卡、单独域名或 GitHub secrets。更新通过浏览器直接读取统计接口，不依赖 GitHub 定时发布。

- `site-settings.js` 的 `enabled: true` 和 `endpoint` 控制统计；常规 GitHub Pages 工作流会保留这项配置，不再关闭统计。
- 随机浏览器 ID 保存在主页自身的 localStorage，最长一年；刷新页面不会重复计数，不使用跨站 Cookie，不发送账户凭据。
- API 只返回总人数及国家/地区汇总；国家/地区由服务器边缘节点提供，不记录 IP 地址、精确坐标、浏览器指纹或访问者账户。
- Do Not Track / Global Privacy Control、可识别爬虫不计数；`localhost` 和 `127.0.0.1` 本地预览只读取线上总数，不污染正式计数。
- 2026-10-21 已迁移独立 Sites 统计服务的 19 条真实匿名记录，保留原标识和首次访问时间；迁移数据未放入 Git。早先关闭统计期间的访问无法补计。
- `hosting/supabase/` 保存当前数据库结构、函数源代码和部署说明。`hosting/visitor-service/` 为旧统计服务的源代码存档。
- Supabase Free 项目可能在一周无活动后暂停；超出免费额度会受限，不配置付费自动扩容。服务规则以 Supabase 控制台为准。
- 如将来改用自己的 Cloudflare 账号，可使用 [可选自托管说明](hosting/cloudflare/README.md)。该模式部署网页与 API 到同一 Worker，并使用自己的数据库。

### 统计接口连接失败时

页面会并行读取同域的 `visitor-snapshot.json` 和实时 API，优先显示已有真实汇总。实时 API 成功后自动更新；POST 或预检失败时还会尝试只读 GET。失败的实时请求不会清空已显示的数量。浏览器也会缓存最近一次成功取得的匿名汇总，且页面会标出非实时数据的真实更新时间。打开的可见页面每分钟重试一次，切回页面或网络恢复时也会重试；可用 Refresh 按钮立即检查。相同浏览器保持去重，失败的刷新保留已显示数据，不会伪造新的更新时间。Sites 版本也会读取 GitHub 上最新发布的公开快照，避免永久停留在打包时的快照；两份快照取有效且较新的数据。

GitHub Actions 每 5 分钟尝试从 API 读取汇总并重新发布快照。刷新失败时，脚本会保留源码和上次已发布快照中较新的有效数据，不会重置为零。发布只需要现有 Pages 权限，无需额外 secrets。GitHub 的定时工作流是尽力调度，可能延迟或跳过，不能保证每五分钟发布；公开仓库连续 60 天无活动时可能被自动停用，届时可在 Actions 中重新启用（[官方说明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)）。

快照用于实时接口临时不可达时展示上次汇总，不能代替新访问的计数。新接口保留该容错机制，网络请求超时放宽到 12 秒，以容纳跨境连接和函数冷启动。不会将其他网站的计数混入，也不会编造历史访问。

本地更新快照可运行 `python3 scripts/update-visitor-snapshot.py`；本地预览仍只读取统计，不计数。验证命令：

```sh
node --test tests/visitor-client.test.mjs tests/visitor-data.test.mjs
python3 -m unittest discover -s tests -p 'test_visitor_snapshot.py'
```

## 来源与部署参考

- 当前设计来自本次重新设计的网站；旧版源文件位于旁边的 `MyHomepage-old/`，没有修改或复用旧设计。
- `export-manifest.json` 记录当前导出的源码提交和导出日期。
- Inter 字体的许可证在 `assets/fonts/OFL.txt`；地图数据来源在 `assets/world-map-source.txt`。
- [GitHub Pages 官方工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Cloudflare 静态资源与 Worker 绑定说明](https://developers.cloudflare.com/workers/static-assets/binding/)
