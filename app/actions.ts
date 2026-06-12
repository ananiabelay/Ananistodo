// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Secure server-side Supabase connection generator
async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    "https://fcecfxctbpsdafgavlwy.supabase.co",
    "sb_publishable_EnuBeuP4zzunCJ-5ce5cuQ_XfdPnV95",
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

// --- AUTHENTICATION OPERATIONS ---

export async function handleLogIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return

  const supabase = await getSupabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/?auth-error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/?auth=success')
}

export async function handleSignUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return

  const supabase = await getSupabaseServer()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/?auth-error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/?auth=success')
}

export async function logout() {
  const supabase = await getSupabaseServer()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

// --- DATABASE OPERATIONS ---

export async function getTasks(view: string) {
  const supabase = await getSupabaseServer()
  
  // Verify user session safely on the server layer first
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const isCompletedView = view === 'completed'

  const { data, error } = await supabase
    .from('todos') // Replace 'todos' with your exact table name if different
    .select('*')
    .eq('user_id', user.id)
    .eq('completed', isCompletedView)
    .order('id', { ascending: false })

  if (error) {
    console.error("Error fetching tasks:", error.message)
    return []
  }

  return data || []
}

export async function insertTask(formData: FormData) {
  const title = formData.get('taskText') as string
  if (!title || !title.trim()) return

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('todos')
    .insert([
      { 
        title: title.trim(), 
        completed: false, 
        user_id: user.id 
      }
    ])

  if (error) {
    console.error("Error inserting task:", error.message)
  }

  revalidatePath('/', 'layout')
}

export async function toggleTask(id: number, completed: boolean) {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('todos')
    .update({ completed: !completed })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error("Error toggling task:", error.message)
  }

  revalidatePath('/', 'layout')
}