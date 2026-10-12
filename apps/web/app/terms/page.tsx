import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { getServerMessages } from '@/lib/i18n';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return pageMetadata({
    title: messages.terms.meta.title,
    description: messages.terms.meta.description,
  });
}

export default async function UtermsPage() {
  const { messages } = await getServerMessages();
  return <LegalDocument content={messages.terms} />;
}
