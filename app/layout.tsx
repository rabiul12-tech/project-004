import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'PEOPLIX HR — Better People Operations',
  description:
    'Complete browser-local Human Resources Management System covering Employee 360 profiles, attendance tracking, leave workflows, payroll simulation with PDF payslips, recruitment pipeline, performance management, and org charts.',
  openGraph: {
    title: 'PEOPLIX HR — Better People Operations',
    description:
      'Complete browser-local Human Resources Management System covering Employee 360 profiles, attendance tracking, leave workflows, payroll simulation with PDF payslips, recruitment pipeline, performance management, and org charts.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PEOPLIX HR — Better People Operations',
    description:
      'Complete browser-local Human Resources Management System covering Employee 360 profiles, attendance tracking, leave workflows, payroll simulation with PDF payslips, recruitment pipeline, performance management, and org charts.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
