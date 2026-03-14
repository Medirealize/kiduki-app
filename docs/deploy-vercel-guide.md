# KiDuKi を GitHub + Vercel で公開する手順

GitHub にリポジトリを作成し、Vercel でデプロイするまでの具体的な手順です。

---

## 前提

- GitHub アカウント
- Vercel アカウント（GitHub でサインアップ可）
- ローカルに Git が入っていること（`git --version` で確認）

---

## Step 1: ローカルで Git を初期化する

プロジェクトのルート（`preflection-app`）で以下を実行します。

```bash
cd /Users/medirealize/Desktop/preflection-app

# Git リポジトリとして初期化
git init

# 全ファイルをステージング
git add .

# 状態確認（.env.local と node_modules が含まれていないことを確認）
git status
```

**重要**: `.gitignore` により `.env.local` と `node_modules` はコミットされません。`git status` に `.env.local` が出てきたら、`git reset HEAD .env.local` で外してからコミットしてください。

```bash
# 初回コミット
git commit -m "Initial commit: KiDuKi MVP"
```

---

## Step 2: GitHub でリポジトリを作成する

1. **GitHub** にログインし、右上の **+** → **New repository** をクリック。
2. 以下を設定します。
   - **Repository name**: 例 `kiduki` または `preflection-app`
   - **Description**: 例 「診察前の思考整理アプリ KiDuKi」
   - **Public** を選択
   - **Add a README file** は不要（既にローカルにコードがあるため）
3. **Create repository** をクリック。
4. 作成後、表示される **「…or push an existing repository from the command line」** のコマンドをメモします。例：
   ```bash
   git remote add origin https://github.com/あなたのユーザー名/kiduki.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 3: リモートを追加してプッシュする

ターミナルで、Step 2 でメモした URL を使って実行します（`あなたのユーザー名` と `kiduki` は自分のリポジトリ名に合わせて変更）。

```bash
cd /Users/medirealize/Desktop/preflection-app

# リモートの追加（URL は GitHub の画面に表示されたものに置き換え）
git remote add origin https://github.com/あなたのユーザー名/kiduki.git

# ブランチ名を main に（既に main の場合はそのままでOK）
git branch -M main

# プッシュ
git push -u origin main
```

初回プッシュ時に GitHub のユーザー名・パスワード（または Personal Access Token）を聞かれた場合は入力します。  
**HTTPS でパスワードが使えない場合**は、GitHub の **Settings → Developer settings → Personal access tokens** でトークンを作成し、パスワードの代わりにそのトークンを使います。

---

## Step 4: Vercel でプロジェクトをインポートする

1. [vercel.com](https://vercel.com) にログインする。
2. ダッシュボードで **Add New…** → **Project** をクリック。
3. **Import Git Repository** で、先ほどプッシュした GitHub リポジトリ（例: `kiduki`）を選択する。
4. **Import** をクリックする。
5. **Configure Project** 画面では、次のようにします。
   - **Framework Preset**: Next.js（自動検出されているはず）
   - **Root Directory**: そのまま（`./`）
   - **Build Command**: `npm run build`（デフォルトのままでOK）
   - **Output Directory**: デフォルトのままでOK
6. この時点では **Deploy** は押さず、次の Step 5 で環境変数を設定してからデプロイします。

---

## Step 5: Vercel で OPENAI_API_KEY を設定する（重要）

API が動作するように、Vercel の「環境変数」に `OPENAI_API_KEY` を登録します。

### 5-1. 環境変数画面を開く

- **Configure Project** 画面の **Environment Variables** セクションを開く  
  または  
- プロジェクトをインポートした後、**Project Settings** → 左メニュー **Environment Variables** を開く

### 5-2. 変数を追加する

1. **Key** に次のように入力する（1文字も違わず）:
   ```
   OPENAI_API_KEY
   ```
2. **Value** に、ローカルの `.env.local` で使っている OpenAI API キー（`sk-...` で始まる文字列）を貼り付ける。
3. **Environment** で次の3つにチェックを入れる（推奨）:
   - **Production**
   - **Preview**
   - **Development**
4. **Save** をクリックする。

### 5-3. 設定後の注意

- **Value** は保存後に Vercel 上では再表示されません。紛失した場合は OpenAI のダッシュボードでキーを確認するか、新しいキーを発行して再設定します。
- 環境変数を追加・変更したあとは、**Redeploy**（再デプロイ）しないと反映されません。  
  **Deploy** または **Redeploy** を実行してください。

---

## Step 6: デプロイを実行する

1. 環境変数を保存したあと、**Deploy** をクリックする（初回インポート時）。
2. または、すでに1回デプロイ済みの場合は、**Deployments** タブで対象デプロイの **⋯** → **Redeploy** を選ぶ。
3. ビルドが完了すると、**Visit** または **https://あなたのプロジェクト名.vercel.app** でサイトを開けます。

---

## Step 7: 動作確認

1. デプロイ先の URL を開く。
2. テキストを入力して「整理する」を押す。
3. 選択肢が表示され、最後に「医師への伝え方メモ」とコピーができることを確認する。
4. エラーになる場合は、Vercel の **Deployments** → 該当デプロイ → **Building** または **Functions** のログでエラー内容を確認する。  
   - **API Key が無効** と出る場合は、Vercel の **Settings → Environment Variables** で `OPENAI_API_KEY` の Key 名と Value を再確認し、Redeploy する。

---

## まとめチェックリスト

- [ ] `.gitignore` で `.env.local` が除外されている
- [ ] `git init` → `git add .` → `git commit` まで実施
- [ ] GitHub でリポジトリ作成 → `git remote add origin` → `git push`
- [ ] Vercel で「Import」→ 対象リポジトリを選択
- [ ] **Environment Variables** に `OPENAI_API_KEY` を設定（Production / Preview / Development）
- [ ] Deploy（または Redeploy）して本番 URL で動作確認

---

## 今後の更新の流れ

コードを変更したあと、GitHub に反映して Vercel で自動デプロイする流れです。

```bash
git add .
git commit -m "説明メッセージ"
git push origin main
```

Vercel は `main` ブランチへのプッシュを検知して自動でビルド・デプロイします。環境変数を変えただけの場合は、Vercel ダッシュボードで **Redeploy** を実行してください。
