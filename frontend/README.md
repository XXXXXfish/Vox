# AI 角色扮演语音通话 - 前端项目

这是一个基于 React + Vite 的 AI 角色扮演语音通话前端项目，支持实时双向语音通话功能。

## 功能特性

- 🎭 **角色选择**: 支持多种 AI 角色，每个角色都有独特的头像和描述
- 📞 **实时语音通话**: 支持与 AI 角色进行实时双向语音对话
- 🎤 **语音控制**: 支持静音、音量调节等通话控制功能
- 🔄 **WebSocket 连接**: 基于 WebSocket 的实时音频流传输
- 📱 **响应式设计**: 支持桌面端和移动端
- ⚡ **实时状态**: 通话状态、连接状态、通话时长等实时反馈
- 🎚️ **通话质量**: 实时通话质量指示器

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **HTTP 客户端**: Axios
- **音频处理**: Web Audio API + MediaStream API
- **实时通信**: WebSocket + 音频流传输

## 项目结构

```
src/
├── components/          # React 组件
│   ├── RoleSelector.tsx        # 角色选择组件
│   ├── VoiceCallInterface.tsx  # 语音通话界面组件
│   ├── CallStatus.tsx          # 通话状态组件
│   ├── LoadingSpinner.tsx      # 加载动画组件
│   └── ErrorBoundary.tsx       # 错误边界组件
├── hooks/              # 自定义 Hooks
│   ├── useAudioRecorder.ts  # 音频流管理 Hook
│   ├── useAudioOutput.ts    # 音频输出 Hook
│   ├── useWebSocket.ts      # WebSocket 连接 Hook
│   ├── useVoiceCall.ts      # 语音通话逻辑 Hook
│   └── useRoles.ts          # 角色管理 Hook
├── services/           # API 服务
│   └── api.ts             # API 接口封装
├── types/              # TypeScript 类型定义
│   └── index.ts
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 全局样式
```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制环境变量示例文件：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置后端 API 地址：

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. 启动开发服务器

```bash
npm run dev
```

项目将在 `http://localhost:3000` 启动。

### 4. 构建生产版本

```bash
npm run build
```

构建文件将输出到 `dist/` 目录。

## API 接口

项目需要后端提供以下接口：

### 角色管理

- `GET /api/v1/roles` - 获取角色列表
- `GET /api/v1/roles/{role_id}` - 获取角色详情

### 语音通话功能

- `WebSocket /ws/voice-call/{role_id}` - 建立语音通话连接
- `GET /api/v1//{role_id}` - 获取对话历史

详细的接口文档请参考项目需求文档。

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 注意事项

1. **麦克风权限**: 首次使用时需要用户授权麦克风访问权限
2. **WebSocket 连接**: 需要后端支持 WebSocket 连接以建立实时语音通话
3. **网络环境**: 需要稳定的网络连接以支持实时音频流传输
4. **HTTPS**: 生产环境建议使用 HTTPS 以确保音频功能正常工作
5. **浏览器兼容性**: 需要支持 Web Audio API 和 WebSocket 的现代浏览器

## 开发指南

### 添加新组件

1. 在 `src/components/` 目录下创建组件文件
2. 使用 TypeScript 和函数式组件
3. 遵循现有的样式和命名规范

### 添加新 Hook

1. 在 `src/hooks/` 目录下创建 Hook 文件
2. 使用 `use` 前缀命名
3. 返回对象包含相关的状态和方法

### 样式规范

- 使用 Tailwind CSS 类名
- 自定义样式放在 `src/index.css` 中
- 遵循响应式设计原则

## 故障排除

### 常见问题

1. **通话无法启动**: 检查浏览器麦克风权限设置和 WebSocket 连接
2. **音频传输失败**: 检查网络连接和 WebSocket 服务状态
3. **API 请求失败**: 检查后端服务是否正常运行
4. **通话质量差**: 检查网络带宽和音频编码设置

### 调试模式

在浏览器开发者工具中查看控制台日志，项目包含详细的调试信息。

## 许可证

MIT License
