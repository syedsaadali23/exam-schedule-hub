import { Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="print-hidden border-t border-border bg-card/50 py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-sm text-muted-foreground">
        <p>Built by <span className="font-medium text-foreground">Syed Saad Ali</span></p>
        <div className="flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/syed-saad-ali-216094282/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-1.5 transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="https://www.instagram.com/saadcaughtlackin/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md p-1.5 transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Instagram className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
