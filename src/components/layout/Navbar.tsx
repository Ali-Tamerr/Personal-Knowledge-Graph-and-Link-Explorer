'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Image, Save, LayoutGrid } from 'lucide-react';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAuthStore } from '@/store/useAuthStore';

interface NavbarProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
  children?: React.ReactNode;
}

export function Navbar({ showSearch = true, onSearchClick, children }: NavbarProps) {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full border-[0.2px] border-white" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900">
              <span className="text-xl font-bold text-white">N</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Nexus</h1>
            <p className="text-[10px] text-zinc-500">Knowledge Graph Explorer</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {children}

        {isAuthenticated && user && showSearch && (
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="ml-2 hidden rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400 sm:inline">⌘K</kbd>
          </button>
        )}

        {isAuthenticated && user && <UserMenu />}
      </div>
    </header>
  );
}

interface ProjectNavbarProps {
  projectName?: string;
  projectColor?: string;
  nodeCount?: number;
  children?: React.ReactNode;
}

export function ProjectNavbar({ projectName, projectColor, nodeCount = 0, children }: ProjectNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4">
      <div className="flex items-center gap-4">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 hover:bg-zinc-800/50 transition-colors"
          >
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-full border-[0.2px] border-white/20" />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900">
                <span className="text-sm font-bold text-white">N</span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl p-1.5 z-50 flex flex-col gap-1">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
              >
                <Image className="w-4 h-4" />
                <span>Change wallpaper</span>
              </button>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
              >
                <Save className="w-4 h-4" />
                <span>Save as</span>
              </button>

              <div className="my-1 border-t border-zinc-800" />

              <Link
                href="/"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Projects</span>
              </Link>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-zinc-800" />

        <div className="flex items-center gap-2">
          {projectColor && (
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: projectColor }}
            />
          )}
          <div>
            <h1 className="text-sm font-semibold text-white">{projectName || 'Project'}</h1>
            <p className="text-[10px] text-zinc-500">{nodeCount} nodes</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {children}
        <UserMenu />
      </div>
    </header>
  );
}

interface AuthNavProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function AuthNav({ onLogin, onSignup }: AuthNavProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onLogin}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        Sign in
      </button>
      <button
        onClick={onSignup}
        className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#265fbd]"
      >
        Get Started
      </button>
    </div>
  );
}
