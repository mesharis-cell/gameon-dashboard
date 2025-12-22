/**
 * Print Layout - Minimal layout for PDF generation
 * No sidebar, no breadcrumb, no dashboard chrome
 */

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
