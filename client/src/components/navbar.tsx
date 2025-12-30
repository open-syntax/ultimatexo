import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  DiscordIcon,
  GithubIcon,
  CoffeeIcon,
  SettingsIcon,
} from "@/components/icons";

// Tooltip wrapper component
const IconWithTooltip = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => (
  <div className="group relative">
    {children}
    <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
      {label}
      <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800 dark:bg-slate-700" />
    </span>
  </div>
);

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  // Common icon button styles
  const iconButtonStyles =
    "flex h-10 w-10 items-center justify-center rounded-lg border transition-all duration-300 " +
    "border-slate-200 bg-white text-slate-500 hover:border-blue-500/30 hover:bg-slate-100 hover:text-slate-700 " +
    "dark:border-white/5 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white";

  const mobileIconButtonStyles =
    "flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-300 " +
    "border-slate-200 bg-white text-slate-500 " +
    "dark:border-white/5 dark:bg-slate-800/60 dark:text-slate-400";

  return (
    <header className="relative z-10 flex w-full items-center justify-between p-4 md:p-6">
      {/* Logo */}
      <div className="flex items-center">
        <Link
          className="group text-xl font-bold tracking-tight md:text-2xl"
          to="/"
        >
          <span className="text-slate-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-100">
            Ultimate
          </span>
          <span className="text-glow text-blue-500">XO</span>
        </Link>
      </div>

      {/* Center Navigation Pills - Desktop */}
      <nav className="hidden rounded-lg border border-slate-200 bg-white/90 p-1 shadow-lg backdrop-blur-sm md:flex dark:border-white/5 dark:bg-slate-900/90">
        {siteConfig.navItems.map((item) => (
          <Link
            key={item.href}
            className={`rounded-md px-5 py-1.5 text-sm font-medium transition-all ${
              isActiveRoute(item.href)
                ? "border border-slate-200 bg-slate-100 text-slate-900 shadow-inner dark:border-white/5 dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
            to={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right Side Icons - Desktop */}
      <div className="hidden items-center gap-2 md:flex">
        <IconWithTooltip label="Discord">
          <Link
            className={iconButtonStyles}
            to={siteConfig.links.discord}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
          >
            <DiscordIcon size={20} />
          </Link>
        </IconWithTooltip>

        <IconWithTooltip label="GitHub">
          <Link
            className={iconButtonStyles}
            to={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <GithubIcon size={20} />
          </Link>
        </IconWithTooltip>

        <IconWithTooltip label="Buy us a coffee">
          <Link
            className={iconButtonStyles}
            to={siteConfig.links.sponsor}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy us a coffee"
          >
            <CoffeeIcon size={20} />
          </Link>
        </IconWithTooltip>

        <IconWithTooltip label="Settings">
          <button className={iconButtonStyles} aria-label="Settings">
            <SettingsIcon size={20} />
          </button>
        </IconWithTooltip>

        <ThemeSwitch />
      </div>

      {/* Mobile Menu Toggle & Icons */}
      <div className="flex items-center gap-2 md:hidden">
        <Link
          className={mobileIconButtonStyles}
          to={siteConfig.links.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <GithubIcon size={18} />
        </Link>
        <ThemeSwitch />
        <button
          className={mobileIconButtonStyles}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full right-0 left-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-sm md:hidden dark:border-white/5 dark:bg-slate-900/95">
          <nav className="flex flex-col gap-2 p-4">
            {siteConfig.navMenuItems.map((item) => (
              <Link
                key={item.href}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActiveRoute(item.href)
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                }`}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-slate-200 pt-2 dark:border-white/5">
              <Link
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-slate-500 hover:text-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-white"
                to={siteConfig.links.discord}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
              >
                <DiscordIcon size={18} />
                <span className="text-sm">Discord</span>
              </Link>
              <Link
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-slate-500 hover:text-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-white"
                to={siteConfig.links.sponsor}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
              >
                <CoffeeIcon size={18} />
                <span className="text-sm">Support</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
