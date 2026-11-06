import { redirect } from 'next/navigation';

import { getSession } from '@/lib/getSession';
import { getAdminUser } from '@/lib/adminAuth';
import AdminOverview from '@/components/admin/AdminOverview';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getSession();

  if (!session.user) {
    redirect('/auth/signin');
  }

  // Recheck the current database role before rendering.
  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  return <AdminOverview adminName={admin.name} />;
}