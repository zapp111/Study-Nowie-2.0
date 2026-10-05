export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-[var(--accent-soft)] via-[var(--bg)] to-[var(--bg)] px-4 py-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
