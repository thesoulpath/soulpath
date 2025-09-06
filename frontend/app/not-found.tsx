import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#191970] to-[#0A0A23] text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#FFD700] mb-4">404</h1>
        <h2 className="text-2xl mb-4">Page Not Found</h2>
        <p className="text-[#C0C0C0] mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#FFD700] text-[#0A0A23] px-6 py-3 rounded-lg font-semibold hover:bg-[#FFD700]/90 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
