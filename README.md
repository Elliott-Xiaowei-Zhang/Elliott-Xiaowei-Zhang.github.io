# Xiaowei (Elliott) Zhang — Personal Homepage

这是截至 **2026-10-18** 的完整、可编辑网站导出，包含目前确认的内容、设计、字体、彩色头像和交互。页面无需安装前端依赖或编译即可部署到 GitHub Pages；访客统计的可选服务器代码也已附上。

## 修改哪些文件

| 文件 | 用途 |
| --- | --- |
| `index.html` | 首页介绍、研究概述、板块标题、联系信息与页面结构 |
| `data.json` | 论文、ongoing projects、教育、课程、教学、奖项、talks、service |
| `style.css` | 字体、颜色、字号、留白、移动端布局和鼠标悬停效果 |
| `app.js` | 论文分类、自动计数、摘要展开、课程折叠、中英文题名切换等交互 |
| `visitors.js` | 世界地图与访客统计展示 |
| `site-settings.js` | 是否启用真实访客统计；静态版本默认关闭 |
| `assets/` | 彩色头像、Inter 字体及其许可证、世界地图数据及来源 |
| `hosting/cloudflare/` | 可选的访客统计服务器、数据库建表文件和部署说明 |
| `scripts/prepare-site.py` | 将网页资源整理到 `dist/`，用于自动部署 |

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
2. **GitHub Actions：**上传时同时包含隐藏的 `.github/workflows/pages.yml`，在 Settings → Pages 中将 Source 设为 GitHub Actions。工作流会在 `main` 或 `master` 分支更新时整理网页文件并部署，也可手动运行。

所有本地资源均已改为相对路径，因此也适用于 `https://用户名.github.io/仓库名/` 这种项目网站地址。

## 访客地图的区别

地图图形已包含在本文件夹中。**GitHub Pages 只能托管静态文件，不能运行原网站的访客统计 API 或 D1 数据库。**因此，静态导出的访客数量显示为 `—`，不会显示虚构数据，也不会请求当前 Sites 的私有 API。原先 Sites 网站的统计和线上内容不受本次导出影响。

如需真实人数和国家/地区统计，请按照 [Cloudflare 部署说明](hosting/cloudflare/README.md) 部署附带的服务器版本。该方案将同一套网页与统计 API 部署到同一个 Cloudflare Worker，并使用自己的 D1 数据库。现有 Sites 的历史访问数据不包含在导出中；新数据库从启用时开始计数。

本次只生成本地文件，尚未向你的 GitHub 仓库提交、推送或发布。

## 来源与部署参考

- 当前设计来自本次重新设计的网站；`MyHomepage/` 没有被修改，旧设计代码没有被复制。
- `export-manifest.json` 记录当前导出的源码提交和导出日期。
- Inter 字体的许可证在 `assets/fonts/OFL.txt`；地图数据来源在 `assets/world-map-source.txt`。
- [GitHub Pages 官方工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Cloudflare 静态资源与 Worker 绑定说明](https://developers.cloudflare.com/workers/static-assets/binding/)
