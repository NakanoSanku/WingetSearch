<div align="center">
  <img src="./public/favicon.svg" width="96" height="96" alt="Winget Search icon" />
  <h1>Winget Search</h1>
  <p>搜索 WinGet 软件包、整理安装清单，并生成可以直接执行的 PowerShell 安装命令。</p>
  <p>
    <a href="https://winget-search.vercel.app"><strong>在线使用</strong></a>
    ·
    <a href="https://github.com/NakanoSanku/winget-pkgs-index">数据索引</a>
  </p>
</div>

## 项目简介

Winget Search 是一个面向 Windows 用户的非官方 WinGet 软件目录和安装命令生成器。它将 WinGet 软件包索引转换为更直观的网页界面，用户无需反复在终端中执行搜索命令，即可查找应用、查看版本和项目主页，并组合批量安装清单。

网站本身不会远程安装软件。所有生成的命令都需要由用户复制到本地 PowerShell 中执行。

## 核心功能

- 按应用名称、Package ID、Moniker 和标签搜索 WinGet 软件包。
- 对搜索结果进行相关性排序，例如输入 `vscode` 会优先显示 Visual Studio Code。
- 展示应用名称、Package ID、版本号和应用图标。
- 在数据可用时提供 GitHub 项目或官方网站入口。
- 一键复制单个应用的精确安装命令。
- 将多个应用加入右侧悬浮安装清单。
- 生成一条单行 PowerShell 批量安装命令。
- 支持分页，并在翻页后自动返回搜索区域。
- 图标加载失败时自动隐藏，不显示无意义的占位图标。

## 使用方式

### 搜索应用

在搜索框中输入应用名称、ID、Moniker 或相关标签，例如：

```text
vscode
chrome
terminal
developer-tools
```

搜索排序大致遵循以下优先级：

1. 完全匹配 Package ID
2. 完全匹配 Moniker
3. 完全匹配应用名称
4. 前缀匹配
5. 名称、ID 或 Moniker 包含关键词
6. 标签包含关键词

### 安装单个应用

每张应用卡片都会提供可以直接复制的命令：

```powershell
winget install --id "Microsoft.VisualStudioCode" --exact -s winget
```

其中：

- `--id` 指定唯一的 WinGet Package ID。
- `--exact` 要求 Package ID 精确匹配，避免安装到相似名称的软件包。
- `-s winget` 明确使用官方 WinGet 软件源。

### 批量安装应用

将需要的软件加入安装清单后，网站会生成单行 PowerShell 命令：

```powershell
@("Microsoft.VisualStudioCode", "Git.Git", "Google.Chrome") | ForEach-Object { winget install --id $_ --exact -s winget --accept-package-agreements --accept-source-agreements }
```

这条命令会依次安装清单中的应用，并自动接受软件包与软件源协议。执行前仍建议确认每个 Package ID 是否符合预期。

## 数据来源

前端使用以下索引：

```text
https://raw.githubusercontent.com/NakanoSanku/winget-pkgs-index/main/index.v2.json
```

索引由 [NakanoSanku/winget-pkgs-index](https://github.com/NakanoSanku/winget-pkgs-index) 生成，并定时从微软 WinGet 数据源刷新。当前索引包含超过 1.3 万个软件包，主要字段包括：

| 字段 | 说明 |
|---|---|
| `Name` | 应用显示名称 |
| `PackageId` | WinGet 唯一软件包 ID |
| `Version` | 最新版本 |
| `Moniker` | 常用简称，例如 `vscode` |
| `Tags` | 搜索标签 |
| `IconUrl` | 应用图标地址 |
| `IconSource` | 图标来源类型 |
| `PackageUrl` | 应用项目或产品主页 |
| `PublisherUrl` | 发布者官方网站 |
| `LastUpdate` | 索引中的最后更新时间 |

图标优先使用 WinGet 合并清单中的官方图标；缺失时，再尝试 GitHub 头像或网站 favicon。项目链接和官网链接直接来自经过校验的 WinGet 合并清单，不会将安装包下载地址作为主页。

## 技术栈

| 技术 | 用途 |
|---|---|
| React 19 | 用户界面和交互状态 |
| TypeScript | 类型检查 |
| Vite 6 | 本地开发与生产构建 |
| Tailwind CSS | 页面样式 |
| Lucide React | 界面图标 |
| Vercel | 静态站点托管与生产部署 |

## 本地开发

### 环境要求

- [Node.js 24 LTS](https://nodejs.org/)
- [pnpm](https://pnpm.io/) 最新稳定版

Node.js 24 是撰写本文档时 Node.js 官方提供的最新 LTS 版本。

### 获取代码

```powershell
git clone https://github.com/NakanoSanku/WingetSearch.git
cd WingetSearch
```

### 安装依赖

```powershell
pnpm install
```

### 启动开发服务器

```powershell
pnpm dev
```

默认访问地址：

```text
http://localhost:3000
```

项目当前不需要 API Key、数据库或其他环境变量。

### 类型检查和生产构建

```powershell
pnpm exec tsc --noEmit
pnpm build
```

### 预览生产构建

```powershell
pnpm preview
```

## 部署到 Vercel

### 通过 Vercel 控制台

1. Fork 或导入本仓库。
2. 在 Vercel 中创建新项目并选择该仓库。
3. Framework Preset 选择或自动识别为 `Vite`。
4. Build Command 使用 `pnpm build`。
5. Output Directory 使用 `dist`。
6. 直接部署，无需配置环境变量。

### 通过 Vercel CLI

```powershell
pnpm dlx vercel@latest --prod
```

## 项目结构

```text
WingetSearch/
├─ components/               # 卡片、搜索框、分页和安装清单组件
├─ public/                   # favicon 和 Web App Manifest
├─ services/
│  └─ wingetService.ts       # 下载并转换 WinGet 索引
├─ App.tsx                   # 搜索、排序、分页和清单状态
├─ index.tsx                 # React 入口
├─ types.ts                  # 公共类型
├─ index.html                # 页面元数据与全局样式配置
└─ vite.config.ts            # Vite 配置
```

## 关联项目

- [NakanoSanku/WingetSearch](https://github.com/NakanoSanku/WingetSearch)：搜索与安装清单前端。
- [NakanoSanku/winget-pkgs-index](https://github.com/NakanoSanku/winget-pkgs-index)：应用名称、Moniker、图标和官网信息索引。
- [microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs)：微软维护的 WinGet Community Repository。

## 免责声明

本项目是非官方社区工具，与 Microsoft、WinGet 软件包发布者或索引中展示的应用厂商没有隶属关系。

安装软件前，请确认软件包 ID、发布者和来源。应用安装及其产生的系统更改由用户自行负责。
