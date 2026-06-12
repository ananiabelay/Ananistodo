// app/page.tsx
'use client'

import { use, startTransition, useOptimistic, useState, useEffect } from 'react'
import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  LogOut, 
  User, 
  Sparkles, 
  ListTodo, 
  Archive, 
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { getTasks, insertTask, toggleTask, handleLogIn, handleSignUp, logout } from './actions'

interface Task {
  id: number
  title: string
  completed: boolean
  user_id?: string
}

// Stable browser client singleton instance
const supabaseBrowserInstance = createServerClient(
  "https://fcecfxctbpsdafgavlwy.supabase.co",
  "sb_publishable_EnuBeuP4zzunCJ-5ce5cuQ_XfdPnV95",
  { cookies: { getAll() { return [] } } }
)

export default function AnaniasTodoDashboard({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; 'auth-error'?: string; auth?: string }>
}) {
  const params = use(searchParams)
  const currentView = params.view || 'active'
  const errorMessage = params['auth-error']
  // 🎯 YOUR INSIGHT: Catch the authorization success redirect token instantly
  const isAuthSuccess = params.auth === 'success'
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientTasks, setClientTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function loadSessionAndData() {
      setLoading(true)
      
      const [userResponse, fetchedTasks] = await Promise.all([
        supabaseBrowserInstance.auth.getUser(),
        getTasks(currentView)
      ])
      
      setUser(userResponse.data.user)
      setClientTasks(fetchedTasks as Task[])
      setLoading(false)
    }
    
    loadSessionAndData()
  }, [currentView])
  
  // Optimistic UI engine
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    clientTasks,
    (state, update: { type: 'toggle' | 'add'; id?: number; title?: string }) => {
      if (update.type === 'toggle') {
        return state.filter(t => t.id !== update.id)
      }
      if (update.type === 'add' && update.title) {
        return [{ id: Math.random(), title: update.title, completed: false }, ...state]
      }
      return state
    }
  )

  // --- COMPONENT HANDLERS ---
  async function handleAddForm(formData: FormData) {
    const title = formData.get('taskText') as string
    if (!title.trim()) return
    
    setIsSubmitting(true)
    startTransition(() => {
      setOptimisticTasks({ type: 'add', title })
    })
    
    await insertTask(formData)
    setIsSubmitting(false)
    
    const updated = await getTasks(currentView)
    setClientTasks(updated as Task[])
  }

  async function handleToggleClick(id: number, completed: boolean) {
    startTransition(() => {
      setOptimisticTasks({ type: 'toggle', id })
    })
    await toggleTask(id, completed)
    
    const updated = await getTasks(currentView)
    setClientTasks(updated as Task[])
  }

  // --- RENDERING LAYER LOGIC GATES ---

  // 1. If loading but the address bar says we successfully logged in, 
  // bypass the login screen and show a gorgeous frosted loading spin spinner.
  if (loading && isAuthSuccess) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
          <p className="text-zinc-400 text-sm font-medium animate-pulse">Unlocking Anania's Workspace...</p>
        </div>
      </div>
    )
  }

  // 2. Fallback loader for regular tab-switching actions
  if (loading && user) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  // 3. SCREEN 1: MODISH DARK LOGIN GATE 
  // If there's no verified user memory state AND we aren't in the middle of a success transition redirect
  if (!user && !isAuthSuccess) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 selection:bg-indigo-500 selection:text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_50%)]" />
        
        <div className="relative w-full max-w-md bg-[#121214] border border-zinc-800 rounded-2xl p-8 shadow-2xl transition-all duration-500 hover:border-zinc-700">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              Anania's Todo
            </h1>
            <p className="text-sm text-zinc-400 mt-2">Enter details to unlock your secure workspace</p>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-4 bg-red-950/40 border border-red-900/50 text-red-400 text-sm rounded-xl mb-6 animate-shake">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{decodeURIComponent(errorMessage)}</span>
            </div>
          )}

          <form className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                name="email" 
                placeholder="name@domain.com" 
                required 
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3.5 outline-none text-base transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                name="password" 
                placeholder="••••••••" 
                required 
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3.5 outline-none text-base transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder:text-zinc-600"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                formAction={handleLogIn} 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-indigo-500/10"
              >
                Log In
              </button>
              <button 
                formAction={handleSignUp} 
                type="submit" 
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform active:scale-[0.98]"
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>

        {/* GitHub Portfolio Link (Using native inline SVG vector to avoid dependency conflicts) */}
        <a 
          href="https://github.com/ananiabelay/Ananistodo" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="relative z-10 mt-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-300 shadow-sm"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.22.069-.214.069-.214 1.005.07 1.536 1.034 1.536 1.034.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          <span>View code on GitHub</span>
        </a>
      </div>
    )
  }

  // --- SCREEN 2: BREATHTAKING PREMIUM TRACKER DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 p-4 sm:p-8 relative selection:bg-emerald-500 selection:text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.05),transparent_50%)] pointer-events-none" />

      <div className="max-w-xl mx-auto mt-6 sm:mt-12 relative z-10 flex flex-col">
        
        <header className="flex justify-between items-center bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl px-5 py-3 mb-8 shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-zinc-900 font-bold text-sm shadow-md">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-zinc-300 truncate">{user?.email || "Anania's Account"}</span>
          </div>
          <form action={logout}>
            <button 
              type="submit" 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit
            </button>
          </form>
        </header>

        <div className="mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 flex items-center gap-2">
            Anania's Todo <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Sleek, fluid, real-time database task workspace.</p>
        </div>
        
        <nav className="flex gap-2 p-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl mb-8 shadow-inner">
          <Link 
            // If auth=success is present, keep it in the URL when clicking tabs!
            href={`/?view=active${isAuthSuccess ? '&auth=success' : ''}`} 
            className={`flex items-center justify-center gap-2 flex-1 text-sm font-bold py-3 px-4 rounded-lg transition-all duration-300 ${
              currentView === 'active' 
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/50' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            Active Rows
          </Link>
          
          <Link 
            // Keep the auth=success tag alive here too!
            href={`/?view=completed${isAuthSuccess ? '&auth=success' : ''}`} 
            className={`flex items-center justify-center gap-2 flex-1 text-sm font-bold py-3 px-4 rounded-lg transition-all duration-300 ${
              currentView === 'completed' 
                ? 'bg-zinc-800 text-white shadow-md border border-zinc-700/50' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <Archive className="w-4 h-4" />
            Completed
          </Link>
        </nav>

        {currentView === 'active' && (
          <form 
            action={handleAddForm} 
            className="flex gap-2 bg-zinc-900/50 p-2 border border-zinc-800/80 rounded-2xl mb-8 shadow-2xl focus-within:border-emerald-500/40 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all duration-300"
          >
            <input 
              type="text" 
              name="taskText" 
              placeholder="What are we accomplishing, Anania?" 
              required 
              disabled={isSubmitting}
              className="flex-1 bg-transparent text-white border-none outline-none pl-3 text-base placeholder:text-zinc-500 disabled:opacity-50" 
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-zinc-950 font-extrabold px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all duration-300 active:scale-95 shadow-lg shadow-emerald-500/10 group"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
              ) : (
                <>
                  <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                  Add Row
                </>
              )}
            </button>
          </form>
        )}

        <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-2 shadow-2xl">
          <ul className="space-y-1">
            {optimisticTasks.length === 0 && (
              <div className="py-12 text-center text-zinc-500 text-sm font-medium border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
                🚀 Clear horizon. No active logs listed.
              </div>
            )}
            
            {optimisticTasks.map((task) => (
              <li 
                key={task.id} 
                className="group flex items-center justify-between p-4 bg-[#111113]/70 hover:bg-[#161619] border border-zinc-900 hover:border-zinc-800/80 rounded-xl transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleClick(task.id, task.completed)}
                    type="button"
                    className="text-zinc-500 hover:text-emerald-400 transition-colors duration-200 flex-shrink-0 relative focus:outline-none"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 transform scale-110 transition-transform duration-300" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-all duration-200 transform group-hover:scale-105" />
                    )}
                  </button>

                  <span className={`text-base font-medium transition-all duration-500 truncate select-none ${
                    task.completed 
                      ? 'line-through text-zinc-600 decoration-zinc-700 italic' 
                      : 'text-zinc-200'
                  }`}>
                    {task.title}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* GitHub Portfolio Footer (Using native inline SVG vector to avoid dependency conflicts) */}
        <div className="w-full flex justify-center mt-12 mb-6">
          <a 
            href="https://github.com/ananiabelay/Ananistodo" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-300 shadow-sm"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.22.069-.214.069-.214 1.005.07 1.536 1.034 1.536 1.034.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span>View code on GitHub</span>
          </a>
        </div>
        
      </div>
    </div>
  )
}