import ClientLayout from './ClientLayout';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use client-side authentication instead of server-side
  return <ClientLayout>{children}</ClientLayout>;
}
