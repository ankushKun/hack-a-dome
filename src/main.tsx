import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./auth";
import Scene from "./scene";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { baseSepolia } from "viem/chains";
// Simply place this at the top of your application's entry point to have the components working out of the box.
import '@coinbase/onchainkit/styles.css';
import { Toaster } from 'react-hot-toast';
import HuddleContextProvider from './utils/huddlecontext';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster />
    <HuddleContextProvider>
      <OnchainKitProvider apiKey="1mgDEk4iV5TOEEPwvTEB96K8P07GYCBa" chain={baseSepolia}>
        <BrowserRouter basename='/hack-a-dome/'>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/scene" element={<Scene />} />
          </Routes>
        </BrowserRouter>
      </OnchainKitProvider>
    </HuddleContextProvider>
  </StrictMode>,
)
