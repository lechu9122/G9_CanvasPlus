import { supabase } from '../auth/supabaseClient.js';

export async function getTodos() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { data: null, error: userError || new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function createTodo({ title, description, due_date, class: className }) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { data: null, error: userError || new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          user_id: user.id,
          title,
          description: description || null,
          due_date: due_date || null,
          class: className || null,
          done: false,
        }
      ])
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function updateTodo(id, updates) {
  try {
    const { data, error } = await supabase
      .from('todos')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function deleteTodo(id) {
  try {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    return { data: { id }, error };
  } catch (err) {
    return { data: null, error: err };
  }
}