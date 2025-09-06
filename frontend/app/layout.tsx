import type { Metadata } from 'next';
import { cormorantGaramond, lato } from './fonts';
import './globals.css';
import { createAdminClient } from '@/lib/supabase/admin';
import { cn } from '@/lib/utils';

// Fetch SEO data on the server
async function getSeoData() {
  // Check if we have a valid service role key (should be longer than 50 chars)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.length < 50) {
    console.warn('Skipping SEO data fetch - invalid or missing service role key');
    return null;
  }
  
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from('seo').select('*').single();
    return data;
  } catch (error) {
    console.error('Error fetching SEO data:', error);
    // Return null to use fallback metadata
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  let seo = null;
  
  try {
    seo = await getSeoData();
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    // Continue with fallback metadata
  }

  return {
    title: seo?.title || 'SoulPath - Wellness Platform',
    description: seo?.description || 'Strategic astrological counsel to navigate your life\'s most pivotal moments.',
    keywords: seo?.keywords || ['astrology', 'counseling', 'spiritual guidance'],
    openGraph: {
      title: seo?.ogTitle || seo?.title || 'SoulPath - Wellness Platform',
      description: seo?.ogDescription || seo?.description || 'Strategic astrological counsel to navigate your life\'s most pivotal moments.',
      images: seo?.ogImage ? [seo.ogImage] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.ogTitle || seo?.title || 'SoulPath - Wellness Platform',
      description: seo?.ogDescription || seo?.description || 'Strategic astrological counsel to navigate your life\'s most pivotal moments.',
      images: seo?.ogImage ? [seo.ogImage] : [],
    },
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${lato.variable}`}>
      <body className={cn(
        "antialiased",
        cormorantGaramond.variable,
        lato.variable
      )}>
        {children}
      </body>
    </html>
  );
}