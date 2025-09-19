export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Ultimate XO",
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
    github: "https://github.com/OutOfSyntax/UltimateXO",
    discord: "https://discord.gg/qvcc5Z2Ksu",
    sponsor: "https://ko-fi.com/Q5Q81KWW0O",
  },
};
