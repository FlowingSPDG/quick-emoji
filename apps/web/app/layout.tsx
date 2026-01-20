import type { Metadata } from "next";
import Link from "next/link";
import ErrorBoundary from "../components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "絵文字早押しクイズ",
  description: "絵文字を見て瞬時にその略称（shortcode）を入力する早押しゲーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ErrorBoundary>
          <nav className="navbar">
            <div className="nav-container">
              <Link href="/" className="nav-logo">
                絵文字早押しクイズ
              </Link>
              <div className="nav-links">
                <Link href="/settings">設定</Link>
                <Link href="/leaderboard">リーダーボード</Link>
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
