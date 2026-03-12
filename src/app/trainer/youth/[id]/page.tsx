import YouthDetailTabs from '@/components/admin/YouthDetailTabs';

interface Props {
  params: { id: string };
}

export default function TrainerYouthDetailPage({ params }: Props) {
  return <YouthDetailTabs userId={params.id} backHref="/trainer/youth" backLabel="Back to My Youth" />;
}
