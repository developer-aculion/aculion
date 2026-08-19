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
    // 1. Check developer email bypass or admins table
    if (userEmail.toLowerCase() === 'developer@aculion.com') {
      return {
        role: 'Administrator',
        targetPath: '/media-profile',
        username: 'Aculion Developer Admin',
        accessDenied: false
      };
    }

    const { data: adminRecord } = await supabase
      .from('admins')
      .select('id, admin_name')
      .eq('id', userId)
      .maybeSingle();

    if (adminRecord && adminRecord.id) {
      return {
        role: 'Administrator',
        targetPath: '/media-profile',
        username: adminRecord.admin_name || defaultName,
        accessDenied: false
      };
    }

    // 2. Check billboard_owners table (id -> auth.users.id)
    const { data: bbRecord } = await supabase
      .from('billboard_owners')
      .select('id, owner_name')
      .eq('id', userId)
      .maybeSingle();

    if (bbRecord && bbRecord.id) {
      return {
        role: 'Media Owner (Billboard Operator)',
        targetPath: '/media-profile',
        username: bbRecord.owner_name || defaultName,
        accessDenied: false
      };
    }

    // 3. Check brand_partners table (id -> auth.users.id)
    const { data: brandRecord } = await supabase
      .from('brand_partners')
      .select('id, brand_user_name')
      .eq('id', userId)
      .maybeSingle();

    if (brandRecord && brandRecord.id) {
      return {
        role: 'Brand Advertiser',
        targetPath: '/demo-dashboard',
        username: brandRecord.brand_user_name || defaultName,
        accessDenied: false
      };
    }

    // 4. Fallback check for seeded/dev accounts using user metadata or local storage
    if (metadata.role) {
      const mappedRole = metadata.role === 'admin' || metadata.role === 'Administrator' ? 'Administrator' : metadata.role === 'brand' || metadata.role === 'Brand Advertiser' ? 'Brand Advertiser' : 'Media Owner (Billboard Operator)';
      const targetPath = mappedRole === 'Administrator' || mappedRole === 'Media Owner (Billboard Operator)' ? '/media-profile' : '/demo-dashboard';
      return {
        role: mappedRole,
        targetPath,
        username: metadata.fullName || metadata.name || defaultName,
        accessDenied: false
      };
    }

    // 5. User not found in any master table -> Deny Access
    return {
      role: null,
      targetPath: '/sign-in',
      username: defaultName,
      accessDenied: true,
      error: 'Access Denied: Your account is not registered in admins, billboard_owners, or brand_partners.'
    };
  } catch (err) {
    console.error('[resolveUserRoleFromSupabase] Error:', err);
    if (metadata.role) {
      const mappedRole = metadata.role === 'admin' || metadata.role === 'Administrator' ? 'Administrator' : metadata.role === 'brand' || metadata.role === 'Brand Advertiser' ? 'Brand Advertiser' : 'Media Owner (Billboard Operator)';
      const targetPath = mappedRole === 'Administrator' || mappedRole === 'Media Owner (Billboard Operator)' ? '/media-profile' : '/demo-dashboard';
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
