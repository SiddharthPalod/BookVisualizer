import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BookVisualizer',
  description: 'An interactive 2.5D virtual bookshelf reading tracker with 3D book inspection and offline SQLite persistence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans select-none overflow-hidden">
        {children}
      </body>
    </html>
  );
}
