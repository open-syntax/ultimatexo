export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Ultimate TTT",
  description: "Ultimate Tic Tac Toe Game.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Rooms",
      href: "/rooms",
    },
    {
      label: "Instructions",
      href: "/instructions",
    },
  ],
  navMenuItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Rooms",
      href: "/rooms",
    },
    {
      label: "Instructions",
      href: "/instructions",
    },
  ],
  links: {
    github: "https://github.com/project-chatty/tic-tac-toe/",
    // discord: "https://discord.gg/",
    // sponsor: "https://patreon.com/",
  },
};
