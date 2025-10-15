import { Link } from "react-router-dom";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/navbar";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { DiscordIcon, GithubIcon } from "@/components/icons";

export const Navbar = () => {
  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="max-w-fit gap-3">
          <p className="font-bold text-inherit">UltimateXO</p>
        </NavbarBrand>
        <div className="ml-2 hidden justify-start gap-4 sm:flex">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:font-medium data-[active=true]:text-primary",
                )}
                color="foreground"
                to={item.href}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      {/* right navbar links */}
      <NavbarContent
        className="hidden basis-1/5 sm:flex sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden gap-2 sm:flex">
          <Link title="Discord" to={siteConfig.links.discord}>
            <DiscordIcon className="text-default-500" />
          </Link>
          <Link title="GitHub" to={siteConfig.links.github}>
            <GithubIcon className="text-default-500" />
          </Link>
          <Link title="Ko-Fi" to={siteConfig.links.sponsor}>
            <img
              alt="Ko-Fi"
              className="h-6 grayscale transition hover:grayscale-0"
              src="https://storage.ko-fi.com/cdn/brandasset/v2/kofi_symbol.png?_gl=1*ysruwk*_gcl_au*MTc1OTkyNjA1MC4xNzU3MjkxNTM0*_ga*OTIwMzY1Mzk4LjE3NTcyOTE1Mzc.*_ga_M13FZ7VQ2C*czE3NTc2MzU2NzAkbzMkZzEkdDE3NTc2MzU5MTckajYwJGwwJGgw"
            />
          </Link>
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="basis-1 pl-4 sm:hidden" justify="end">
        <Link to={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link color="foreground" to={item.href}>
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
