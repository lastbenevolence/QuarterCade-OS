import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useSystemStats } from "../hooks/useSystemStats";
import { Gamepad2, Home, Library, Settings, Monitor, Zap, Tv, Rocket, Globe, Swords } from "lucide-react";

export default function Layout({ children, currentPageName }:{children:React.ReactNode; currentPageName?:string}) {
  const location = useLocation();
  const stats = useSystemStats();

  const navigationItems = [
    { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Home },
    { title: "Game Library", url: createPageUrl("Library"), icon: Library },
    { title: "Big Picture", url: createPageUrl("BigPicture"), icon: Monitor, description: "Steam Focused Mode" },
    { title: "Heroic Launcher", url: createPageUrl("HeroicLauncher"), icon: Swords, description: "Epic & GOG Games" },
    { title: "Retro Mode", url: createPageUrl("RetroMode"), icon: Tv, description: "Classic Emulation" },
    { title: "Lutris", url: createPageUrl("Lutris"), icon: Rocket, description: "Custom Installations" },
    { title: "Browser", url: createPageUrl("Browser"), icon: Globe, description: "Web Browsing" },
    { title: "Settings", url: createPageUrl("Settings"), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white overflow-hidden">
      <style>{`
        :root { --gaming-cyan:#00d4ff; --gaming-purple:#8b5cf6; --gaming-orange:#ff6b35; --focus-glow:0 0 20px var(--gaming-cyan); }
        .gaming-focus:focus-visible { outline:none; box-shadow:var(--focus-glow); transform:scale(1.05); }
        .gaming-glow { box-shadow:0 0 30px rgba(0,212,255,0.3); }
        .gaming-card { background:linear-gradient(135deg, rgba(0,212,255,0.1), rgba(139,92,246,0.1)); border:1px solid rgba(0,212,255,0.2); backdrop-filter:blur(10px); }
        .gaming-nav-item { transition:all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .gaming-nav-item:hover, .gaming-nav-item:focus { background:linear-gradient(135deg, var(--gaming-cyan), var(--gaming-purple)); transform:translateX(8px); box-shadow:var(--focus-glow); }
      `}</style>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-500 rounded-full opacity-5 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500 rounded-full opacity-5 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="flex min-h-screen relative z-10">
        <nav className="w-72 bg-black/40 backdrop-blur-xl border-r border-cyan-500/20 p-6 flex flex-col">
          <div className="mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center gaming-glow">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  QuarterCade OS
                </h1>
                <p className="text-sm text-gray-400">v2024.1</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`gaming-nav-item gaming-focus flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-medium ${
                    location.pathname === item.url
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-l-4 border-cyan-400'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <item.icon className="w-6 h-6 flex-shrink-0" />
                  <div className="flex-grow">
                    <span>{item.title}</span>
                    {item.description && <p className="text-xs text-gray-500 -mt-1">{item.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="gaming-card rounded-xl p-4 mt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-400">SYSTEM STATUS</span>
              <Zap className="w-4 h-4 text-green-400" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">CPU</span>
                <span className="text-green-400">{stats ? `${stats.cpu}%` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">GPU</span>
                <span className="text-cyan-400">{stats?.gpu ?? "—"}{stats?.gpu != null ? "%" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">RAM</span>
                <span className="text-purple-400">{stats ? `${stats.ram.usedGiB} / ${stats.ram.totalGiB} GB` : "—"}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">Controller optimized • Press ⓘ for help</p>
          </div>
        </nav>

        <main className="flex-1 relative">
          {children}
        </main>
      </div>
    </div>
  );
}