import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import 'antd/dist/reset.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm, // 使用浅色主题算法
        token: {
          colorPrimary: '#8b5cf6', // 主色调 (紫色)
          borderRadius: 8,
        },
      }}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ConfigProvider>
  </React.StrictMode>,
)
