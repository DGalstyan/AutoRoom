'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { NO_MESSENGERS, type MessengerLinks } from '@/lib/contacts';

const MessengersContext = createContext<MessengerLinks>(NO_MESSENGERS);

/**
 * The admin-managed, API-verified messenger deep links (`contacts.messengers`),
 * made available to client components such as the lead popups' "continue in
 * WhatsApp/Viber/Telegram" button. Without a provider (tests, unconfigured
 * site) every link is null and nothing renders.
 */
export function MessengersProvider({
  links,
  children,
}: {
  links: MessengerLinks;
  children: ReactNode;
}) {
  return <MessengersContext.Provider value={links}>{children}</MessengersContext.Provider>;
}

export function useMessengerLinks(): MessengerLinks {
  return useContext(MessengersContext);
}
