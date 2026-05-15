import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { VideoCallProvider } from './context/VideoCallContext.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <VideoCallProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </VideoCallProvider>
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
)
