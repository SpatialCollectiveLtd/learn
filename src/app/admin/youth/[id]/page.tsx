import YouthDetailTabs from '@/components/admin/YouthDetailTabs';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminYouthDetailPage({ params }: Props) {
  const { id } = await params;
  return <YouthDetailTabs userId={id} backHref="/admin/youth" backLabel="Back to Youth" />;
}
