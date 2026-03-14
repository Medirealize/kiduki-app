# KiDuKi ディレクトリ構造・ロードマップ

## 提案ディレクトリ構造

```
preflection-app/
├── .cursorrules
├── .env.local              # API Key 等（gitignore）
├── docs/
│   ├── prd.md
│   ├── structure-and-roadmap.md
│   └── prompts/            # システムプロンプト設計（後で追加）
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx        # トップ / 対話開始
│   │   ├── globals.css
│   │   └── api/
│   │       └── chat/       # または openai/ route
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/             # shadcn/ui
│   │   ├── conversation/   # Q1/Q2/Q3 表示・入力
│   │   ├── summary/        # SUM 表示・コピー
│   │   └── layout/         # ヘッダー・フッター等
│   ├── lib/
│   │   ├── openai.ts       # API クライアント
│   │   ├── prompts.ts      # Q1,Q2,Q3,SUM プロンプト
│   │   └── constants.ts    # 問い文・ステップ定義
│   └── types/
│       └── index.ts        # 対話・メモ型定義
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## 初期実装ロードマップ

1. **環境構築とディレクトリ構造の作成**
   - Next.js (App Router) + TypeScript + Tailwind + shadcn/ui のセットアップ
   - 上記ディレクトリの作成

2. **AIプロンプトエンジニアリング**
   - Q1, Q2, Q3, SUM を正確に出すシステムプロンプトの設計
   - `lib/prompts.ts` および `docs/prompts/` に格納

3. **高齢者でも使いやすいUIコンポーネントの作成**
   - フォントサイズ・余白・コントラストのデザイントークン
   - 対話ステップ表示・入力欄・ボタン（タップ領域 44px 以上）

4. **コピー機能（診察メモ生成）の実装**
   - SUM 生成 API 連携
   - 診察メモの表示とクリップボードコピー
