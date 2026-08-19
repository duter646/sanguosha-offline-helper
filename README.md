# 三国杀一将成名线下辅助

第一阶段为移动端优先的纯前端工具，当前聚焦涉及其他技能的特殊武将查询与后续技能抽取。

默认将池收录线下可用内容：经典、界限突破、SP、神、星及其他有实体牌对应的武将；排除在线原创、限时地主、自走棋专属和其他网络专属内容。每名武将会先经过来源标记确认后再进入默认全将池。

## 开发

```bash
npm install
npm run dev
```

批量读取官方武将详情页（需要网络）：

```bash
npm run data:import
```

导入器只生成官方页面索引和排除标记，不会覆盖已人工核对的技能库。

## 数据来源

技能文本和规则数据以三国杀官方武将网站为准：<https://x.sanguosha.com/hero/>

## 部署到 GitHub Pages

已配置 GitHub Actions 自动部署（`.github/workflows/deploy.yml`），推送代码到 `main` 分支后会自动构建并发布到 Pages。

1. 首次使用需在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
2. 推送代码到 `main` 分支，或到 **Actions** 页面手动运行 "Deploy to GitHub Pages"。
3. 部署完成后访问：<https://duter646.github.io/sanguosha-offline-helper/>

本地预览构建产物：

```bash
npm run build
npm run preview
```

> 构建产物使用相对路径（`base: './'`），站点部署在仓库子路径下也能正常加载。

## 当前状态

- 已建立 React + TypeScript + Vite 项目骨架
- 已录入 9 名特殊技能武将及官方来源链接
- 已完成首页、武将查询、详情查看和筛选界面
- 技能抽取页面已预留，后续接入独立规则引擎
