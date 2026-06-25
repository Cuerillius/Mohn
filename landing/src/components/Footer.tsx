import GithubIcon from "@/components/GithubIcon";
import { GITHUB } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <img src="/mohn.svg" alt="Mohn" className="size-6" />
          <span className="font-semibold text-base text-foreground">Mohn</span>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} Mohn</p>
        <div className="flex items-center gap-6 text-sm">
          <a href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </a>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <GithubIcon className="size-4" /> GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
