import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from './components/ui/sonner'
import { ExternalLinksProvider } from "./components/navigation/ExternalLinksProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <ExternalLinksProvider>
        <App />
        <Toaster />
      </ExternalLinksProvider>
    </AuthProvider>
  </BrowserRouter>
);
