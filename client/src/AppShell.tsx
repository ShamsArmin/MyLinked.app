export default function AppShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      {children}
    </div>
  );
}
