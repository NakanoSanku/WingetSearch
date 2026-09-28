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
- 生成可以直接粘贴到 PowerShell 执行的批量安装代码块。
- 在每张应用卡片中独立选择版本，默认使用 WinGet 最新版本。
- 通过结构化命令选项面板统一设置单个和批量命令的 WinGet 参数。
- 从安装清单生成推荐清单，填写标题、作者、简介和每个软件的可选推荐理由，导出 JSON 文件供社区分享。
- 导入推荐清单文件或粘贴 JSON，查看推荐理由、选择软件和版本，再加入安装清单。
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
winget install --id "Microsoft.VisualStudioCode" --exact --source winget --accept-package-agreements --accept-source-agreements
```

其中：

- `--id` 指定唯一的 WinGet Package ID。
- `--exact` 要求 Package ID 精确匹配，避免安装到相似名称的软件包。
- `--source winget` 明确使用官方 WinGet 软件源。

每张应用卡片的 `Version` 下拉框默认是 `Latest`，不会添加 `--version`。选择历史版本后，只为该应用追加对应的精确版本参数，例如：

```powershell
winget install --id "Microsoft.VisualStudioCode" --exact --source winget --version "1.2.3" --accept-package-agreements --accept-source-agreements
```

在搜索结果上方打开 `Command options` 面板，可以通过安装模式、下拉选项、开关和专用值输入框设置 `--scope`、`--architecture`、`--installer-type`、`--silent`、`--no-upgrade` 等参数。所有命令统一使用长参数格式，固定的 `--id`、`--exact` 和 `--source winget` 不会被覆盖。

### 批量安装应用

将需要的软件加入安装清单后，网站会生成可以直接粘贴到 PowerShell 执行的代码块，不需要保存成 `.ps1` 文件：

```powershell
@(
  [pscustomobject]@{ Id = 'Git.Git'; Version = '2.49.0' }
  [pscustomobject]@{ Id = 'Microsoft.VisualStudioCode'; Version = $null }
) | ForEach-Object {
  $wingetArgs = @('--id', $_.Id, '--exact', '--source', 'winget')
  if ($_.Version) { $wingetArgs += @('--version', $_.Version) }
  $wingetArgs += '--accept-package-agreements'
  $wingetArgs += '--accept-source-agreements'
  & winget install @wingetArgs
}
```

代码块会按安装清单顺序安装应用，每个应用可以使用独立版本。执行前仍建议确认 Package ID、版本和命令选项是否符合预期。

### 分享推荐清单

1. 搜索并将软件加入 `Install List`。
2. 在 `Community lists` 点击 `Create list`，或在安装清单中点击 `Create recommendation list`。
3. 填写清单标题；作者、简介和每个软件的推荐理由均可留空。可从推荐草稿中移除软件，不影响原安装清单。
4. 推荐版本默认是 `Latest available`，即使安装清单中已指定版本也不会自动沿用。如需固定版本，在编辑器中为对应软件单独选择。
5. 点击 `Preview list` 查看接收者视角，或点击 `Export JSON` 下载清单文件，并通过群聊、论坛等渠道分享。

首版通过文件分享，文件仅在浏览器中处理。关闭弹窗后可通过 `Reopen draft` 或 `Reopen imported list` 继续查看当前清单；草稿和安装选择只保留在当前页面会话中，刷新前请导出保存。

### 导入并选择性安装

1. 在 `Community lists` 点击 `Import list`，选择推荐 JSON 文件，也可以展开 `Or paste recommendation JSON` 粘贴内容。
2. 查看标题、作者、简介和各软件的推荐理由。导入后默认不勾选任何软件。
3. 逐项勾选，或使用 `Select available` 全选当前可以添加的软件。需要时调整安装版本。
4. 点击 `Add … to install list`，关闭推荐弹窗，在安装清单中检查并复制 PowerShell 命令，在本机执行。

导入后采用以下规则：

- 软件 ID 与当前索引匹配，名称以索引为准。索引未加载成功时可以阅读清单，需恢复索引后才能添加软件。
- 索引中找不到的软件保留展示并标注，不可勾选。
- 作者固定的版本若已不可用，必须明确选择 `Latest` 或其他可用版本后才能勾选，不自动替换。
- 已在安装清单中的软件标记为已添加，保留原来的版本和命令选项。
- 接收者对版本和勾选的修改只影响自己的安装选择；重新导出导入文件仍保留作者的原始推荐。
- 重复软件 ID 不区分大小写，保留第一条并展示提示。

### 推荐文件格式

示例文件：[开发工具入门清单](./examples/developer-tools.recommendations.json)。推荐文件使用本项目的版本化 JSON 格式，包含推荐理由等信息，与 WinGet CLI 的原生 `winget export` 文件不同。

```json
{
  "format": "winget-search-recommendations",
  "schemaVersion": 1,
  "title": "我的开发工具",
  "createdAt": "2026-09-28T00:00:00.000Z",
  "packages": [
    { "id": "Git.Git", "reason": "用于代码版本管理" },
    { "id": "Microsoft.VisualStudioCode" }
  ]
}
```

`title`、`createdAt` 和非空 `packages` 必填；`author`、`description` 以及条目的 `name`、`reason`、`version` 可选。省略 `version` 表示最新版。文件最多 1 MB、200 个条目；标题最多 120 字符、作者 100 字符、简介 2000 字符、单条理由 1000 字符。未知格式版本和格式错误会显示具体错误，不修改安装清单。推荐理由按纯文本展示，文件中的自定义命令、下载地址和安装参数不会参与命令生成。

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
| `Versions` | 可用版本列表，按最新到最旧排序 |
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

### 测试、类型检查和生产构建

```powershell
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

测试使用 Node.js 内置测试运行器，覆盖推荐文件往返、输入边界、重复处理、版本失效、选择性添加和 PowerShell 参数转义。

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
├─ components/               # 卡片、搜索框、安装清单和推荐清单组件
├─ examples/                 # 可直接导入的推荐清单示例
├─ public/                   # favicon 和 Web App Manifest
├─ services/
│  ├─ wingetService.ts       # 下载并转换 WinGet 索引
│  ├─ wingetCommand.ts       # PowerShell 命令生成
│  └─ recommendationService.ts # 推荐清单校验、序列化与软件匹配
├─ App.tsx                   # 搜索、排序、分页和清单状态
├─ index.tsx                 # React 入口
├─ types.ts                  # 公共类型
├─ CONTEXT.md                # 推荐与安装领域术语
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
