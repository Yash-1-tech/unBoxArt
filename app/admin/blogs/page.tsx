import { redirect } from 'next/navigation';
import { getSession } from '../../../lib/getSession';
import { getAdminUser } from '../../../lib/adminAuth';
import AdminBlogs from '../../../components/admin/AdminBlogs';

export const dynamic = 'force-dynamic';

export default async function AdminBlogsPage() {
  const session = await getSession();

  if (!session.user) {
    redirect('/auth/signin');
  }

  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  return <AdminBlogs />;
}
