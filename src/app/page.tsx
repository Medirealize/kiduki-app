import InputScreen from "@/components/InputScreen";

/**
 * KiDuKi メイン画面（実装設計書・アルゴリズム設計 完全準拠）
 * ユニバーサルデザイン: 40〜70代向け・高コントラスト・清潔感のあるブルー基調
 */
export default function Home() {
  return (
    <div
      className="min-h-screen bg-[var(--color-kiduki-surface)] text-[var(--color-kiduki-ink)]"
      role="main"
      aria-label="診察室のおとも 診察前の思考整理"
    >
      <InputScreen />
    </div>
  );
}
