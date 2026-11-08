
import { redirect } from 'next/navigation';

import { getSession } from '../../../../../lib/getSession';
import { getAdminUser } from '../../../../../lib/adminAuth';
import AdminBlogEditor from '../../../../../components/admin/AdminBlogEditor';

export const dynamic = 'force-dynamic';

interface EditBlogPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBlogPage({
  params,
}: EditBlogPageProps) {
  const session = await getSession();

  if (!session.user) {
    redirect('/auth/signin');
  }

  const admin = await getAdminUser();

  if (!admin) {
    redirect('/dashboard');
  }

  const { id } = await params;

  return <AdminBlogEditor postId={id} />;
}
