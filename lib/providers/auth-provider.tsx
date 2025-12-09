'use client';

// Better Auth handles sessions internally via cookies
// No provider wrapper needed - just export a passthrough component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}