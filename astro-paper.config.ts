import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
site: {
  url: "https://yusufyamak.com/",
  title: "Yusuf Yamak",
  description:
    "Embedded systems, secure software, computer architecture, and hardware security.",
  author: "Yusuf Yamak",
  profile: "https://github.com/yamak",
  ogImage: "default-og.jpg",
  lang: "en",
  timezone: "Europe/Istanbul",
  dir: "ltr",
},
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/satnaing/astro-paper/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github",   url: "https://github.com/yamak" },
    {
      name: "linkedin",
      url: "https://www.linkedin.com/in/yusuf-yamak-06b28582",
    },
    { name: "mail",     url: "mailto:yamakyusuf@gmail.com" },
  ],
});
