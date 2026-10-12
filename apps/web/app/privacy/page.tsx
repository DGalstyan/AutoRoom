import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { getServerMessages } from '@/lib/i18n';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return pageMetadata({
    title: messages.privacy.meta.title,
    description: messages.privacy.meta.description,
  });
}

export default async function UprivacyPage() {
  const { messages } = await getServerMessages();
  return <LegalDocument content={messages.privacy} />;
}
