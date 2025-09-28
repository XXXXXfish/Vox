# Vox 项目文档

## 项目简介
Vox 是一个基于 AI 的语音角色扮演平台，用户可以与虚拟角色进行语音互动。项目结合了语音识别 (ASR)、自然语言处理 (LLM) 和语音合成 (TTS) 技术，提供沉浸式的交互体验。

---

## 如何运行程序


-----

## 启动项目总结：环境配置与运行指南

### 1\. 软件和环境准备（本地环境）

| 软件/环境 | 说明 | 下载/配置 |
| :--- | :--- | :--- |
| **Go 语言** | 核心开发环境，版本 $\ge 1.18$。 | 官网下载安装，配置环境变量。 |
| **Node.js** | 核心开发环境，版本 $\ge 16.x$。 | 官网下载安装。 |
| **PostgreSQL** | 项目使用 PostgreSQL 作为关系型数据库。 | 官网或使用 Docker 下载安装。 |
| **数据库管理工具** | 可选，但强烈推荐，用于查看数据和调试。 | 推荐 **DBeaver** 或 **pgAdmin**。 |
-----

### 2\. 云服务密钥配置

你需要获取并配置项目的关键凭证。请在项目根目录创建或修改 **`.env`** 文件，填入以下所有配置项。

#### `.env` 文件示例

```dotenv
# --- 核心环境配置 ---
SERVER_PORT=8080
JWT_SECRET=super-secure-jwt-secret-key-that-should-be-long-and-random
# 数据库连接：请替换为你的 PostgreSQL 连接信息
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=vox_backend_db

# --- 七牛云 AI (LLM/ASR/TTS) 配置 ---
# LLM/TTS/ASR 统一鉴权密钥 (sk- 开头)
QINIU_LLM_KEY="你的七牛云 AI API KEY" 
# Qiniu AI 接口的 Base URL (通常固定)
QINIU_OPENAI_BASE_URL="https://openai.qiniu.com/v1"

# --- 七牛云对象存储 (Kodo) 配置 ---
# Kodo 存储密钥
QINIU_KODO_ACCESS_KEY="igjtA6_tXQ0DVY26ke7Uze2DdFXvwJSyVK3gECJq"
QINIU_KODO_SECRET_KEY="xfD7T9W2FBl1Gud-fE7W2Pk3z1CPpt9MMTFOVrSy"
# 存储空间名称 (Bucket Name)
QINIU_KODO_BUCKET_NAME="vox"
# 存储空间的公网访问域名
QINIU_KODO_DOMAIN="t397zbzw3.hd-bkt.clouddn.com"
```

-----

### 3\. 数据库和数据初始化

在启动服务之前，你需要确保数据库已经就绪。

1.  **启动 PostgreSQL 服务**：确保 PostgreSQL 实例正在运行。
2.  **创建数据库**：使用你的数据库管理工具（或命令行），创建一个新的数据库，名称与 `.env` 中的 `DB_NAME` 匹配（例如 `vox_backend_db`）。
3.  **服务启动**：当运行 `go run main.go` 时，`main.go` 中的 `AutoMigrate` 会自动创建 `users`, `characters`, `chat_records` 等表结构，并执行初始化角色数据。

-----

### 4\. 后端的启动

完成上述配置后，你就可以启动后端服务了。

#### 步骤 1：下载依赖

在项目根目录执行：

```bash
cd .\backend\
go mod tidy
```

#### 步骤 2：启动服务

```bash
go run main.go
```

如果一切配置正确，你将看到类似 **`Server is running on :8080`** 的输出。


### 5\. 前端的启动

完成上述配置后，你就可以启动前端服务了。

#### 步骤 1：下载依赖

在项目根目录执行：

```bash
cd .\frontend\
```

```bash
npm install
```

#### 步骤 2：启动服务

在项目根目录执行：

```bash
npm run dev
```

如果一切配置正确，你将看到类似 **`Server is running on :3000`** 的输出。




### 1. 环境要求
- **操作系统**: Windows / macOS / Linux
- **开发语言**: Go (后端), TypeScript + React (前端)
- **依赖工具**:
  - Node.js (>= 16.x)
  - pnpm (>= 7.x)
  - Go (>= 1.18)
  - 数据库: 

### 2. 配置环境变量
在项目根目录下创建 `.env` 文件，配置以下内容：

```
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=vox

# 七牛云配置
QINIU_OPENAI_BASE_URL=https://openai.qiniu.com/v1
QINIU_LLM_KEY=your_qiniu_key

# JWT 配置
JWT_SECRET=your_jwt_secret
```

### 3. 启动后端服务
```bash
cd backend
# 安装依赖
go mod tidy
# 运行服务
go run main.go
```

### 4. 启动前端服务
```bash
cd frontend
# 安装依赖
pnpm install
# 运行服务
pnpm dev
```

### 5. 访问应用
在浏览器中打开 `http://localhost:5173`。

---

## 架构设计

### 系统架构
Vox 项目采用前后端分离架构，主要模块包括：

1. **前端模块**
   - 使用 React + TypeScript 构建，提供用户界面和交互逻辑。
   - 使用 TailwindCSS 进行样式管理。

2. **后端模块**
   - 使用 Go 语言开发，提供 API 服务。
   - 集成了语音识别 (ASR)、自然语言处理 (LLM) 和语音合成 (TTS) 服务。

3. **数据库模块**
   - 使用 MySQL 存储用户、角色和聊天记录。

4. **第三方服务**
   - 七牛云 API：用于语音合成和语音识别。

### 模块规格

#### 1. 前端模块
- **主要功能**:
  - 用户注册与登录
  - 角色选择与创建
  - 聊天界面与语音互动
- **技术栈**:
  - React + TypeScript
  - TailwindCSS
  - Vite 构建工具

#### 2. 后端模块
- **主要功能**:
  - 用户认证 (JWT)
  - 角色管理 (CRUD)
  - 聊天记录存储与查询
  - 调用第三方服务 (ASR, LLM, TTS)
- **技术栈**:
  - Go + Gin 框架
  - GORM (ORM 框架)

#### 3. 数据库模块
- **表结构**:
  - `users` 表：存储用户信息
  - `characters` 表：存储角色信息，包括音色 ID
  - `chat_records` 表：存储用户与角色的聊天记录

#### 4. 第三方服务
- **七牛云 API**:
  - `/voice/asr`：语音转文本
  - `/voice/tts`：文本转语音
  - `/voice/list`：获取可用音色列表

### 分工

| 模块         | 负责人       | 主要任务                                   |
|--------------|--------------|------------------------------------------|
| 前端开发     | Alice        | 实现用户界面、角色管理、聊天功能         |
| 后端开发     | Bob          | 实现 API 接口、用户认证、角色与聊天管理  |
| 数据库设计   | Charlie      | 设计表结构，优化查询性能                 |
| 第三方集成   | Diana        | 集成七牛云 API，处理 ASR/TTS 请求        |

---

## 项目重难点

### 1. **语音识别 (ASR)**
- **挑战**: 处理不同音频格式，确保高准确率。
- **解决方案**: 使用七牛云的 ASR 服务，支持多种音频格式。

### 2. **自然语言处理 (LLM)**
- **挑战**: 构造上下文一致的对话，避免生成无关内容。
- **解决方案**: 使用角色的系统提示词 (System Prompt) 和历史记录构造上下文。

### 3. **语音合成 (TTS)**
- **挑战**: 确保生成的语音自然流畅，支持多种音色。
- **解决方案**: 使用七牛云的 TTS 服务，支持自定义音色。

### 4. **用户体验优化**
- **挑战**: 确保界面响应迅速，语音交互流畅。
- **解决方案**: 前端使用 React 的状态管理和异步请求优化。

### 5. **安全性**
- **挑战**: 防止用户数据泄露，确保 API 安全。
- **解决方案**: 使用 JWT 进行用户认证，所有敏感数据加密存储。

---

## 未来计划
- 支持更多语言的语音识别与合成。
- 增加角色的个性化配置选项。
- 优化聊天记录的存储与查询性能。

---

感谢您对 Vox 项目的关注！