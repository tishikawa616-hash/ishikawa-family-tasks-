'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentGroupWithMembers, joinGroupByCode, createFamilyGroup } from '@/features/accounting/lib/family';
import FamilySettingsClient from './FamilySettingsClient';

export default async function FamilySettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/accounting/login');
  }

  // 1. Get current group
  const currentGroup = await getCurrentGroupWithMembers();

  // Define Server Actions here to pass to Client Component 
  // (Alternatively pass them directly if they are robust stand-alone actions)
  
  async function joinGroupAction(code: string) {
      'use server';
      return await joinGroupByCode(code);
  }

  async function createGroupAction(name: string) {
      'use server';
      return await createFamilyGroup(name);
  }

  return (
    <main className="min-h-screen bg-[#F8F7F2] p-6 pb-24">
        <FamilySettingsClient 
            initialGroup={currentGroup} 
            userInfo={{ id: user.id, email: user.email || '' }}
            onJoinGroup={joinGroupAction}
            onCreateGroup={createGroupAction}
        />
    </main>
  );
}
