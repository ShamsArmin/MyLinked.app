export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto p-4">{children}</div>
    </div>
  );
}
