import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hibiscus TV",
  robots: { index: false, follow: false },
};

export default function TvLayout({ children }: { children: React.ReactNode }) {
  return children;
}
