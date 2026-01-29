import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { tv } from "tailwind-variants";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  DiscordIcon,
  GithubIcon,
  CoffeeIcon,
  SettingsIcon,
} from "@/components/icons";
import { TooltipIcon } from "@/components/ui/tooltip-icon";

const navbarStyles = tv({
  slots: {
    base: "relative z-10 flex w-full items-center justify-between p-4 md:p-6",
    logoLink: "group text-xl font-bold tracking-tight md:text-2xl",
    logoText:
      "text-slate-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-100",
    nav: "hidden rounded-lg border border-slate-200 bg-white/90 p-1 shadow-lg backdrop-blur-sm md:flex dark:border-white/5 dark:bg-slate-900/90",
    navLink: "rounded-md px-5 py-1.5 text-sm font-medium transition-all",
    iconButton:
      "flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-300 hover:border-blue-500/30 hover:bg-slate-100 hover:text-slate-700 dark:border-white/5 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white",
    mobileIconButton:
      "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all duration-300 dark:border-white/5 dark:bg-slate-800/60 dark:text-slate-400",
    mobileMenu:
      "absolute top-full right-0 left-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-sm md:hidden dark:border-white/5 dark:bg-slate-900/95",
    mobileNavLink: "rounded-lg px-4 py-3 text-sm font-medium transition-all",
    mobileSocialLink:
      "flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-slate-500 hover:text-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-white",
  },
  variants: {
    isActive: {
      true: {
        navLink:
          "border border-slate-200 bg-slate-100 text-slate-900 shadow-inner dark:border-white/5 dark:bg-slate-800 dark:text-white",
        mobileNavLink:
          "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white",
      },
      false: {
        navLink:
          "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white",
        mobileNavLink:
          "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white",
      },
    },
  },
});

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const {
    base,
    logoLink,
    logoText,
    nav,
    navLink,
    iconButton,
    mobileIconButton,
    mobileMenu,
    mobileNavLink,
    mobileSocialLink,
  } = navbarStyles();

  return (
    <header className={base()}>
      {/* Logo */}
      <div className="flex items-center">
        <Link className={logoLink()} to="/">
          <span className={logoText()}>Ultimate</span>
          <span className="text-glow text-blue-500">XO</span>
        </Link>
      </div>

      {/* Center Navigation Pills - Desktop */}
      <nav className={nav()}>
        {siteConfig.navItems.map((item) => (
          <Link
            key={item.href}
            className={navLink({ isActive: isActiveRoute(item.href) })}
            to={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right Side Icons - Desktop */}
      <div className="hidden items-center gap-2 md:flex">
        <TooltipIcon label="Discord">
          <Link
            aria-label="Discord"
            className={iconButton()}
            rel="noopener noreferrer"
            target="_blank"
            to={siteConfig.links.discord}
          >
            <DiscordIcon size={20} />
          </Link>
        </TooltipIcon>

        <TooltipIcon label="GitHub">
          <Link
            aria-label="GitHub"
            className={iconButton()}
            rel="noopener noreferrer"
            target="_blank"
            to={siteConfig.links.github}
          >
            <GithubIcon size={20} />
          </Link>
        </TooltipIcon>

        <TooltipIcon label="Buy us a coffee">
          <Link
            aria-label="Buy us a coffee"
            className={iconButton()}
            rel="noopener noreferrer"
            target="_blank"
            to={siteConfig.links.sponsor}
          >
            <CoffeeIcon size={20} />
          </Link>
        </TooltipIcon>

        <TooltipIcon label="Settings">
          <button aria-label="Settings" className={iconButton()}>
            <SettingsIcon size={20} />
          </button>
        </TooltipIcon>

        <ThemeSwitch />
      </div>

      {/* Mobile Menu Toggle & Icons */}
      <div className="flex items-center gap-2 md:hidden">
        <Link
          aria-label="GitHub"
          className={mobileIconButton()}
          rel="noopener noreferrer"
          target="_blank"
          to={siteConfig.links.github}
        >
          <GithubIcon size={18} />
        </Link>
        <ThemeSwitch />
        <button
          aria-expanded={isMenuOpen}
          aria-label="Toggle menu"
          className={mobileIconButton()}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
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
                d="M4 6h16M4 12h16M4 18h16"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={mobileMenu()}>
          <nav className="flex flex-col gap-2 p-4">
            {siteConfig.navMenuItems.map((item) => (
              <Link
                key={item.href}
                className={mobileNavLink({
                  isActive: isActiveRoute(item.href),
                })}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-slate-200 pt-2 dark:border-white/5">
              <Link
                className={mobileSocialLink()}
                rel="noopener noreferrer"
                target="_blank"
                to={siteConfig.links.discord}
                onClick={() => setIsMenuOpen(false)}
              >
                <DiscordIcon size={18} />
                <span className="text-sm">Discord</span>
              </Link>
              <Link
                className={mobileSocialLink()}
                rel="noopener noreferrer"
                target="_blank"
                to={siteConfig.links.sponsor}
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
