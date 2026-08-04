export function AuthDivider({ text = "Or continue with" }: { text?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  );
}
