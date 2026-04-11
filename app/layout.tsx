import type {Metadata} from 'next';
import { ThemeProvider } from 'next-themes';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Clean Copied Text',
  description: 'Ttext sanitization tool',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
