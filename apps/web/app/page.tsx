import Link from "next/link";

export default function HomePage() {
  return (
    <div className="card" style={{ textAlign: "center", maxWidth: "600px", margin: "4rem auto" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        絵文字早押しクイズ
      </h1>
      <p style={{ fontSize: "1.25rem", marginBottom: "2rem", color: "var(--secondary-color)" }}>
        絵文字を見て瞬時にその略称（shortcode）を入力する早押しゲーム
      </p>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/settings" className="btn btn-primary" style={{ fontSize: "1.25rem", padding: "1rem 2rem" }}>
          ゲーム開始
        </Link>
        <Link href="/leaderboard" className="btn btn-secondary" style={{ fontSize: "1.25rem", padding: "1rem 2rem" }}>
          リーダーボード
        </Link>
      </div>
    </div>
  );
}
