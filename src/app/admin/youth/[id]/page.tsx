import YouthDetailTabs from '@/components/admin/YouthDetailTabs';

interface Props {
  params: { id: string };
}

export default function AdminYouthDetailPage({ params }: Props) {
  return <YouthDetailTabs userId={params.id} backHref="/admin/youth" backLabel="Back to Youth" />;
}
