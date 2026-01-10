'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Search, Lock, Unlock, Snowflake, Flame, Loader2 } from 'lucide-react';
import { useGraphStore, filterNodes } from '@/store/useGraphStore';
import { useAuthStore } from '@/store/useAuthStore';
import { GraphCanvas } from '@/components/graph/GraphCanvas';
import { NodeEditor } from '@/components/editor/NodeEditor';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { UserMenu } from '@/components/auth/UserMenu';
import { api } from '@/lib/api';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuthStore();
  
  const {
    currentProject,
    setCurrentProject,
    nodes,
    setNodes,
    setLinks,
    searchQuery,
    setSearchQuery,
    graphSettings,
    setGraphSettings,
    addNode,
    isLoading,
    setLoading,
  } = useGraphStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push('/');
    }
  }, [isMounted, isAuthenticated, router]);

  useEffect(() => {
    const loadProjectData = async () => {
      setLoading(true);
      setError(null);

      try {
        const project = await api.projects.getById(id);
        setCurrentProject(project);

        const projectNodes = await api.nodes.getByProject(id);
        setNodes(projectNodes);

        const allLinks = await api.links.getAll();
        const nodeIds = new Set(projectNodes.map(n => n.id));
        const projectLinks = allLinks.filter(
          l => nodeIds.has(l.sourceId) || nodeIds.has(l.targetId)
        );
        setLinks(projectLinks);
      } catch (err) {
        console.log('Demo mode: Using local data (API unavailable)');
        if (!currentProject) {
          setCurrentProject({
            id,
            name: 'Demo Project',
            description: 'This is a demo project (backend unavailable)',
            color: '#8B5CF6',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        setNodes([]);
        setLinks([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      loadProjectData();
    }
  }, [id, isAuthenticated, currentProject, setCurrentProject, setNodes, setLinks, setLoading]);

  const handleCreateNode = async () => {
    if (!currentProject) return;

    const demoNode = {
      id: crypto.randomUUID(),
      title: 'New Node',
      content: '',
      projectId: id,
      groupId: Math.floor(Math.random() * 8),
      userId: user?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      const newNode = await api.nodes.create({
        title: 'New Node',
        content: '',
        projectId: id,
        groupId: demoNode.groupId,
        userId: user?.id,
      });
      addNode(newNode);
    } catch (err) {
      console.log('Demo mode: Creating local node (API unavailable)');
      addNode(demoNode);
    } finally {
      setLoading(false);
    }
  };

  const filteredNodes = filterNodes(nodes, searchQuery);

  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950">
      <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Projects</span>
          </button>
          
          <div className="h-6 w-px bg-zinc-800" />
          
          <div className="flex items-center gap-2">
            {currentProject?.color && (
              <div 
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: currentProject.color }}
              />
            )}
            <div>
              <h1 className="text-sm font-semibold text-white">{currentProject?.name || 'Project'}</h1>
              <p className="text-[10px] text-zinc-500">{filteredNodes.length} nodes</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              className="w-full rounded-lg bg-zinc-800/50 py-1.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none ring-1 ring-zinc-700 transition-all focus:ring-violet-500"
            />
          </div>

          <button
            onClick={handleCreateNode}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Node
          </button>

          <div className="h-6 w-px bg-zinc-800" />
          
          <UserMenu />
        </div>
      </header>

      {error && (
        <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-xl bg-zinc-900/90 p-2 backdrop-blur-sm border border-zinc-800">
          <div className="flex items-center gap-2 px-2">
            <button
              onClick={() => setGraphSettings({ freezeOthersOnDrag: !graphSettings.freezeOthersOnDrag })}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                graphSettings.freezeOthersOnDrag
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="When enabled, other nodes stay in place when you drag one node"
            >
              {graphSettings.freezeOthersOnDrag ? (
                <Snowflake className="h-3.5 w-3.5" />
              ) : (
                <Flame className="h-3.5 w-3.5" />
              )}
              <span>Freeze Others</span>
            </button>
          </div>

          <div className="h-6 w-px bg-zinc-700" />

          <div className="flex items-center gap-2 px-2">
            <button
              onClick={() => setGraphSettings({ lockAllMovement: !graphSettings.lockAllMovement })}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                graphSettings.lockAllMovement
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="When enabled, all nodes are locked and cannot be moved"
            >
              {graphSettings.lockAllMovement ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
              <span>Lock All</span>
            </button>
          </div>
        </div>

        {isLoading && nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              <span className="text-sm text-zinc-400">Loading graph...</span>
            </div>
          </div>
        ) : (
          <GraphCanvas />
        )}
      </div>

      <NodeEditor />
      <CommandPalette />
    </div>
  );
}
