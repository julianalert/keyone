export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
      <footer className="py-6 text-center">
        <p className="text-xs text-ink-subtle">© {new Date().getFullYear()} keyone · Pure pay-as-you-go</p>
      </footer>
    </div>
  )
}
