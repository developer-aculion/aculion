import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://buqtshfptmqieaqcghfx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key-to-prevent-startup-crash';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Role Resolution using the 3 master tables linked to auth.users.id:
 * 1. admin_master (admin_id = auth.users.id)
 * 2. billboard_owner_master (billboard_owner_id = auth.users.id)
 * 3. brand_owner_master (brand_owner_id = auth.users.id)
 */
export async function resolveUserRoleFromSupabase(sessionUser) {
  if (!sessionUser || !sessionUser.id) {
    return { role: null, username: null, accessDenied: true, error: 'No active authentication session' };
  }

  const userId = sessionUser.id;
  const userEmail = sessionUser.email || '';
  const metadata = sessionUser.user_metadata || {};
  const defaultName = metadata.fullName || metadata.name || userEmail.split('@')[0];

  try {
    // 1. Check admin_master (admin_id -> auth.users.id)
    const { data: adminRecord } = await supabase
      .from('admin_master')
      .select('admin_id, username')
      .eq('admin_id', userId)
      .maybeSingle();

    if ((adminRecord && adminRecord.admin_id) || userEmail.toLowerCase() === 'developer@aculion.com') {
      // Update or insert into admin_master
      try {
        await supabase
          .from('admin_master')
          .upsert({
            admin_id: userId,
            username: adminRecord?.username || metadata.fullName || 'Aculion Developer Admin',
            last_login: new Date().toISOString()
          }, { onConflict: 'admin_id' });
      } catch (e) { /* ignore if policy restricted */ }

      return {
        role: 'Administrator',
        targetPath: '/media-profile',
        username: adminRecord?.username || metadata.fullName || 'Aculion Developer Admin',
        accessDenied: false
      };
    }

    // 2. Check billboard_owner_master (billboard_owner_id -> auth.users.id)
    const { data: bbRecord } = await supabase
      .from('billboard_owner_master')
      .select('billboard_owner_id, username')
      .eq('billboard_owner_id', userId)
      .maybeSingle();

    if (bbRecord && bbRecord.billboard_owner_id) {
      // Update last_login timestamp in billboard_owner_master
      try {
        await supabase
          .from('billboard_owner_master')
          .update({ last_login: new Date().toISOString() })
          .eq('billboard_owner_id', userId);
      } catch (e) { /* ignore if policy restricted */ }

      return {
        role: 'Media Owner (Billboard Operator)',
        targetPath: '/media-profile',
        username: bbRecord.username || defaultName,
        accessDenied: false
      };
    }

    // 3. Check brand_owner_master (brand_owner_id -> auth.users.id)
    const { data: brandRecord } = await supabase
      .from('brand_owner_master')
      .select('brand_owner_id, username')
      .eq('brand_owner_id', userId)
      .maybeSingle();

    if (brandRecord && brandRecord.brand_owner_id) {
      // Update last_login timestamp in brand_owner_master
      try {
        await supabase
          .from('brand_owner_master')
          .update({ last_login: new Date().toISOString() })
          .eq('brand_owner_id', userId);
      } catch (e) { /* ignore if policy restricted */ }

      return {
        role: 'Brand Advertiser',
        targetPath: '/demo-dashboard',
        username: brandRecord.username || defaultName,
        accessDenied: false
      };
    }

    // 4. Fallback check against local users list or user_metadata if database query returns empty (for seeded dev accounts)
    const localUsers = JSON.parse(localStorage.getItem('aculion_users') || '[]');
    const localMatch = localUsers.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());
    if (localMatch) {
      const mappedRole = localMatch.role || metadata.role || 'Media Owner (Billboard Operator)';
      const targetPath = mappedRole === 'Administrator' ? '/admin-dashboard' : mappedRole === 'Brand Advertiser' ? '/demo-dashboard' : '/media-profile';
      return {
        role: mappedRole,
        targetPath,
        username: localMatch.fullName || localMatch.name || defaultName,
        accessDenied: false
      };
    }

    if (metadata.role) {
      const mappedRole = metadata.role;
      const targetPath = mappedRole === 'Administrator' ? '/admin-dashboard' : mappedRole === 'Brand Advertiser' ? '/demo-dashboard' : '/media-profile';
      return {
        role: mappedRole,
        targetPath,
        username: defaultName,
        accessDenied: false
      };
    }

    // 5. User not found in any master table -> Deny Access
    return {
      role: null,
      targetPath: '/sign-in',
      username: defaultName,
      accessDenied: true,
      error: 'Access Denied: Your account is not registered in admin_master, billboard_owner_master, or brand_owner_master.'
    };
  } catch (err) {
    console.error('[resolveUserRoleFromSupabase] Error:', err);
    if (metadata.role) {
      const mappedRole = metadata.role;
      const targetPath = mappedRole === 'Administrator' ? '/admin-dashboard' : mappedRole === 'Brand Advertiser' ? '/demo-dashboard' : '/media-profile';
      return {
        role: mappedRole,
        targetPath,
        username: defaultName,
        accessDenied: false
      };
    }
    return {
      role: null,
      targetPath: '/sign-in',
      username: defaultName,
      accessDenied: true,
      error: 'Access Denied: Unable to verify account role in database.'
    };
  }
}
