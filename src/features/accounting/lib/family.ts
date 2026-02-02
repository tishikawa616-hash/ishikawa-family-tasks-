import { createClient } from '@/lib/supabase/server';
import { FamilyGroup, FamilyGroupMember } from '@/features/accounting/types/database';

/**
 * Get the current user's active family group with members
 */
export async function getCurrentGroupWithMembers() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Find which group the user belongs to
  const { data: membership } = await supabase
    .from('acc_family_group_members')
    .select('group_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership) return null;

  // 2. Fetch group details
  const { data: group } = await supabase
    .from('acc_family_groups')
    .select('*')
    .eq('id', membership.group_id)
    .single();

  if (!group) return null;

  // 3. Fetch all members of this group
  const { data: members } = await supabase
    .from('acc_family_group_members')
    .select(`
      user_id,
      role,
      joined_at,
      user:auth_users (
         email,
         raw_user_meta_data
      )
    `) // auth_users might not be accessible directly depending on RLS, 
       // but strictly we might need a public profile table. 
       // For now, assuming we can get minimal info or we have a profile table.
       // Actually, we use acc_family_members for manual names, but for login users...
       // Let's assume we rely on what we can get.
    .eq('group_id', group.id);

   // Fallback: If we can't join auth_users, we might show just role.
   
   return {
     ...group,
     currentUserRole: membership.role,
     members: members || []
   };
}

export async function createFamilyGroup(groupName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Generate Invite Code (Simple 6 char)
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: group, error } = await supabase
    .from('acc_family_groups')
    .insert({
      name: groupName,
      owner_id: user.id,
      invite_code: inviteCode
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Add owner as member
  const { error: memberError } = await supabase
    .from('acc_family_group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'owner'
    });

  if (memberError) return { success: false, error: memberError.message };

  return { success: true, group };
}

export async function joinGroupByCode(code: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Find group
    const { data: group } = await supabase
        .from('acc_family_groups')
        .select('id')
        .eq('invite_code', code)
        .single();
    
    if (!group) return { success: false, error: "招待コードが無効です" };

    // Check if already member
    const { data: existing } = await supabase
        .from('acc_family_group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

    if (existing) return { success: false, error: "既に参加しています" };

    // Join
    const { error } = await supabase
        .from('acc_family_group_members')
        .insert({
            group_id: group.id,
            user_id: user.id,
            role: 'member'
        });

    if (error) return { success: false, error: error.message };

    return { success: true };
}

// Utility to check group access in Actions
export async function ensureUserHasGroup() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
        .from('acc_family_group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .single();
    
    return membership?.group_id || null;
}
