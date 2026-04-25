import { Link } from "react-router-dom";

import { DiscordIcon, GithubIcon, CoffeeIcon, Logo } from "@/components/icons";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="relative z-10 mt-auto w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="border-t border-slate-200/50 pt-8 pb-6 dark:border-white/5">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link
                className="inline-flex items-center gap-2 text-xl font-bold tracking-tight"
                to="/"
              >
                <Logo className="text-slate-900 dark:text-white" size={28} />
                <span>
                  <span className="text-slate-900 dark:text-white">
                    Ultimate
                  </span>
                  <span className="text-blue-500">XO</span>
                </span>
              </Link>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                The ultimate tic-tac-toe experience. Play online, locally, or
                against AI.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Game
              </h3>
              <ul className="space-y-2">
                {siteConfig.navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="text-sm text-slate-500 transition-colors hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400"
                      to={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Community
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400"
                    rel="noopener noreferrer"
                    target="_blank"
                    to={siteConfig.links.discord}
                  >
                    <DiscordIcon size={14} />
                    Discord
                  </Link>
                </li>
                <li>
                  <Link
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400"
                    rel="noopener noreferrer"
                    target="_blank"
                    to={siteConfig.links.github}
                  >
                    <GithubIcon size={14} />
                    GitHub
                  </Link>
                </li>
                <li>
                  <Link
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400"
                    rel="noopener noreferrer"
                    target="_blank"
                    to={siteConfig.links.sponsor}
                  >
                    <CoffeeIcon size={14} />
                    Support Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Credits */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                Built By
              </h3>
              <Link
                className="text-sm text-slate-500 transition-colors hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400"
                rel="noopener noreferrer"
                target="_blank"
                to="https://opensyntax.dev"
              >
                Open Syntax
              </Link>
              <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                Open source & free to play.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-200/50 pt-6 sm:flex-row dark:border-white/5">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              &copy; {new Date().getFullYear()} UltimateXO. All rights reserved.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Nine boards. One champion.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
