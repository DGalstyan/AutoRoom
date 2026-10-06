import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { getServerMessages } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { messages } = await getServerMessages();
  return {
    title: messages.terms.meta.title,
    description: messages.terms.meta.description,
  };
}

export default async function UtermsPage() {
  const { messages } = await getServerMessages();
  return <LegalDocument content={messages.terms} />;
}
