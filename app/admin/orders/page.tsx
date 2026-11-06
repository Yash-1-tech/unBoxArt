
import { redirect } from 'next/navigation';

import { getSession } from '../../../lib/getSession';
import { getAdminUser } from '../../../lib/adminAuth';
import AdminOrders from '../../../components/admin/AdminOrders';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const session = await getSession();

  if (!session.user) {
    redirect('/auth/signin');
  }

  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  return <AdminOrders />;
}
