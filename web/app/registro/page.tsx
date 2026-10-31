import RegistroForm from './RegistroForm';
import type { UserRole } from '@/lib/types';

export const revalidate = 0;

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; role?: string }>;
}) {
  const params = await searchParams;
  const urlRole = params?.rol || params?.role;
  const initialRole: UserRole =
    urlRole === 'vendedor' || urlRole === 'seller' ? 'seller' : 'traveler';

  return <RegistroForm initialRole={initialRole} />;
}
