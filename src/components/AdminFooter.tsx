"use client";

import Link from 'next/link';

const AdminFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-4 border-t bg-muted/30">
      <div className="container px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          {/* Copyright */}
          <span suppressHydrationWarning>© {currentYear} Sonho Real Netimóveis</span>
          
          {/* Links */}
          <div className="flex items-center gap-4">
            <Link 
              href="/politica-privacidade" 
              className="hover:text-foreground transition-colors"
            >
              Privacidade
            </Link>
            <Link 
              href="/termos-uso" 
              className="hover:text-foreground transition-colors"
            >
              Termos
            </Link>
          </div>
          
          {/* BindValue Credit */}
          <a
            href="https://bindvalue.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <span>Desenvolvido com</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
              ❤️
            </span>
            <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
              BindValue.dev
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default AdminFooter;
