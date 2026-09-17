import "@/styles/globals.css";
import MainLayout from "@/layouts/MainLayout";
import { createTheme, MantineProvider } from "@mantine/core";
import type { AppProps } from "next/app";
import { Barlow_Condensed, Inter } from "next/font/google";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const theme = createTheme({
  primaryColor: "green",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
  headings: { fontFamily: "var(--font-barlow), system-ui, sans-serif" },
  defaultRadius: "md",
  colors: {
    dark: ["#e8efec", "#b8c4bf", "#8a9a93", "#5c6b65", "#2a3833", "#1f2d28", "#141f1b", "#0f1714", "#0a110e", "#070b0a"],
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme="dark">
      <Head>
        <title>FutsalFC</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {/* Expose fonts on :root so Mantine portals (dropdowns) pick them up too */}
      <style jsx global>{`
        :root {
          --font-inter: ${inter.style.fontFamily};
          --font-barlow: ${barlow.style.fontFamily};
        }
      `}</style>
      <MainLayout>
        <Component {...pageProps} />
      </MainLayout>
    </MantineProvider>
  );
}
