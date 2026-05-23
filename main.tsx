@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

@layer base {
  body {
    @apply bg-[#0a0a0b] text-zinc-100 font-sans;
  }
}

.perspective-1000 {
  perspective: 1000px;
}

.terminal-glow {
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
}
