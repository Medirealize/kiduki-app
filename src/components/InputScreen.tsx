"use client";

import { useState, useRef, useEffect } from "react";
import type { GenerateResultWithOptions, FinalMemo } from "@/types";

const PLACEHOLDER =
  "例：最近体調が不安です\n薬の副作用が心配です\n先生に聞きにくいことがあります";

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/** 設計書 459-464 準拠：診察用メモのクリップボード形式 */
function formatFinalMemo(memo: FinalMemo): string {
  return `【診察用メモ：KiDuKi】

■ 先生に伝えたいこと（要約）
${memo.sum}

■ 具体的な相談内容
${memo.refined_question}

■ 整理したプロセスの記録
- 状況：${memo.selected_q1}
- 一番の懸念：${memo.selected_q2}
- 診察での意図：${memo.selected_q3}`;
}

const TOAST_COPY_MESSAGE = "コピーしました。診察室で先生に見せてください。";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0: 入力画面, 1: 生成中, 2: 問い1選択, 3: 問い2選択, 4: 問い3選択, 5: リフレーム中, 6: 最終メモ

export default function InputScreen() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [generateResult, setGenerateResult] = useState<GenerateResultWithOptions | null>(null);
  const [selectedQ1, setSelectedQ1] = useState("");
  const [selectedQ2, setSelectedQ2] = useState("");
  const [selectedQ3, setSelectedQ3] = useState("");
  const [refinedQuestion, setRefinedQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [originalInput, setOriginalInput] = useState("");
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (step >= 2 && step <= 6 && mainRef.current) {
      mainRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [step]);

  function getErrorMessage(status: number, serverMessage?: string | null): string {
    if (serverMessage?.trim()) return serverMessage;
    if (status === 400) return "入力内容に問題があります。もう一度確認してください。";
    if (status === 401) return "APIキーが無効です。設定を確認してください。";
    if (status === 429) return "リクエストが多すぎます。しばらく待ってからお試しください。";
    if (status >= 500) return "サーバーでエラーが発生しました。しばらくしてからお試しください。";
    return "通信エラーが発生しました。もう一度お試しください。";
  }

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text) return;
    if (text.length < 5) {
      setError("もう少し具体的に書いてください");
      return;
    }
    if (text.length > 300) {
      setError("入力が長すぎます。短くまとめてください");
      return;
    }
    setError(null);
    setGenerateResult(null);
    setSelectedQ1("");
    setSelectedQ2("");
    setSelectedQ3("");
    setRefinedQuestion("");
    setOriginalInput(text);
    setStep(1);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(getErrorMessage(res.status, data?.error));
        setStep(0);
        return;
      }
      if (!data.sum || !Array.isArray(data.q1_options) || !Array.isArray(data.q2_options) || !Array.isArray(data.q3_options)) {
        setError("うまく整理できませんでした。もう一度お試しください。");
        setStep(0);
        return;
      }
      setGenerateResult({
        sum: data.sum,
        q1_question: data.q1_question,
        q1_options: data.q1_options,
        q2_question: data.q2_question,
        q2_options: data.q2_options,
        q3_question: data.q3_question,
        q3_options: data.q3_options,
      });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラーが発生しました。もう一度お試しください。");
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQ1 = (option: string) => {
    setSelectedQ1(option);
    setStep(3);
  };

  const handleSelectQ2 = (option: string) => {
    setSelectedQ2(option);
    setStep(4);
  };

  const doReframe = async (q3Choice: string) => {
    if (!generateResult || !selectedQ1 || !selectedQ2) return;
    setSelectedQ3(q3Choice);
    setStep(5);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reframe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sum: generateResult.sum,
          original_input: originalInput,
          selected_q1: selectedQ1,
          selected_q2: selectedQ2,
          selected_q3: q3Choice,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(getErrorMessage(res.status, data?.error));
        setStep(4);
        return;
      }
      setRefinedQuestion(data.refined_question ?? "");
      setStep(6);
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラーが発生しました。");
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQ3Click = (option: string) => {
    doReframe(option);
  };

  const handleCopy = async () => {
    const memo: FinalMemo = {
      sum: generateResult!.sum,
      refined_question: refinedQuestion,
      selected_q1: selectedQ1,
      selected_q2: selectedQ2,
      selected_q3: selectedQ3,
    };
    const text = formatFinalMemo(memo);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 3000);
    } catch {
      setError("コピーに失敗しました。");
    }
  };

  const handleRetry = () => {
    setStep(0);
    setGenerateResult(null);
    setSelectedQ1("");
    setSelectedQ2("");
    setSelectedQ3("");
    setRefinedQuestion("");
    setError(null);
  };

  const goBack = () => {
    if (step === 2) handleRetry();
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-kiduki-surface)] relative">
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-4 right-4 max-w-xl mx-auto z-50 px-5 py-4 rounded-xl bg-[var(--color-kiduki-ink)] text-white text-[1.125rem] font-medium shadow-lg text-center"
        >
          {TOAST_COPY_MESSAGE}
        </div>
      )}

      <header className="pt-8 pb-4 px-4 text-center flex-shrink-0">
        <p className="text-kiduki-blue font-semibold text-[1.25rem] tracking-wide">KiDuKi</p>
        <h1 className="mt-2 text-[1.5rem] font-semibold text-kiduki-ink">診察前の思考整理</h1>
        {(step === 2 || step === 3 || step === 4) && (
          <p className="mt-2 text-kiduki-ink-muted text-[1rem]">
            {step === 2 && "問い 1／3"}
            {step === 3 && "問い 2／3"}
            {step === 4 && "問い 3／3"}
          </p>
        )}
      </header>

      <main ref={mainRef} className="flex-1 px-4 flex flex-col max-w-xl mx-auto w-full pb-10">
        {/* 入力画面 */}
        {step === 0 && (
          <>
            <p className="text-kiduki-ink mb-3 text-[1.125rem] sm:text-[1.25rem] leading-relaxed font-medium">
              診察で気になっていることを、少しだけ書いてください。
            </p>
            <p className="text-kiduki-ink-muted text-[1rem] sm:text-[1.125rem] mb-2">
              推奨：15〜120文字（最低5文字、最大300文字）
            </p>
            <textarea
              className="textarea-kiduki w-full resize-y text-[1.125rem] min-h-[10rem]"
              placeholder={PLACEHOLDER}
              rows={5}
              aria-label="気になっていること"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            {error && (
              <p className="mt-3 text-red-600 text-[1rem]" role="alert">
                {error}
              </p>
            )}
            <div className="mt-8">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-kiduki w-full min-h-[3.25rem] text-[1.125rem] sm:text-[1.25rem] bg-[var(--color-kiduki-blue)] text-white rounded-xl shadow-md hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-kiduki-blue)] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                aria-label={loading ? "整理中" : "AIで整理する"}
              >
                {loading ? (
                  <>
                    <SpinnerIcon />
                    <span>整理中...</span>
                  </>
                ) : (
                  "整理する"
                )}
              </button>
            </div>
          </>
        )}

        {/* 生成中 */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <SpinnerIcon />
            <p className="mt-4 text-kiduki-ink text-[1.125rem]">選択肢を用意しています...</p>
          </div>
        )}

        {/* 1画面1ステップ：問い1 選択 */}
        {step === 2 && generateResult && (
          <div className="flex flex-col flex-1">
            <div className="rounded-xl bg-[var(--color-kiduki-blue-muted)] border-2 border-[var(--color-kiduki-blue-light)] p-5 mb-6">
              <p className="text-base font-semibold text-kiduki-blue mb-2">要約</p>
              <p className="text-kiduki-ink text-[1.125rem] leading-relaxed">{generateResult.sum}</p>
            </div>
            <p className="text-kiduki-ink font-semibold text-[1.125rem] sm:text-[1.25rem] mb-5 leading-relaxed">
              {generateResult.q1_question || "状況について、あてはまるものを1つ選んでください"}
            </p>
            <div className="space-y-4">
              {generateResult.q1_options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectQ1(opt)}
                  className="w-full min-h-[4rem] px-6 py-5 text-left text-[1.125rem] sm:text-[1.25rem] rounded-xl bg-white border-2 border-gray-300 text-kiduki-ink hover:border-[var(--color-kiduki-blue)] hover:bg-[var(--color-kiduki-blue-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-kiduki-blue)] focus:ring-offset-2 transition-colors"
                >
                  <span className="font-bold text-kiduki-blue mr-2">{["A", "B", "C"][i]}.</span>
                  <span className="leading-relaxed">{opt}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={goBack}
              className="mt-6 text-kiduki-ink-muted text-[1rem] underline"
            >
              最初からやり直す
            </button>
          </div>
        )}

        {/* 問い2 選択 */}
        {step === 3 && generateResult && (
          <div className="flex flex-col flex-1">
            <p className="text-kiduki-ink font-semibold text-[1.125rem] sm:text-[1.25rem] mb-5 leading-relaxed">
              {generateResult.q2_question || "気になっている点について、あてはまるものを1つ選んでください"}
            </p>
            <div className="space-y-4">
              {generateResult.q2_options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectQ2(opt)}
                  className="w-full min-h-[4rem] px-6 py-5 text-left text-[1.125rem] sm:text-[1.25rem] rounded-xl bg-white border-2 border-gray-300 text-kiduki-ink hover:border-[var(--color-kiduki-blue)] hover:bg-[var(--color-kiduki-blue-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-kiduki-blue)] focus:ring-offset-2 transition-colors"
                >
                  <span className="font-bold text-kiduki-blue mr-2">{["A", "B", "C"][i]}.</span>
                  <span className="leading-relaxed">{opt}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={goBack}
              className="mt-6 text-kiduki-ink-muted text-[1rem] underline"
            >
              前の問いに戻る
            </button>
          </div>
        )}

        {/* 問い3 選択 */}
        {step === 4 && generateResult && (
          <div className="flex flex-col flex-1">
            <p className="text-kiduki-ink font-semibold text-[1.125rem] sm:text-[1.25rem] mb-5 leading-relaxed">
              {generateResult.q3_question || "診察で確認したいことについて、あてはまるものを1つ選んでください"}
            </p>
            <div className="space-y-4">
              {generateResult.q3_options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectQ3Click(opt)}
                  disabled={loading}
                  className="w-full min-h-[4rem] px-6 py-5 text-left text-[1.125rem] sm:text-[1.25rem] rounded-xl bg-white border-2 border-gray-300 text-kiduki-ink hover:border-[var(--color-kiduki-blue)] hover:bg-[var(--color-kiduki-blue-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-kiduki-blue)] focus:ring-offset-2 transition-colors disabled:opacity-70"
                >
                  <span className="font-bold text-kiduki-blue mr-2">{["A", "B", "C"][i]}.</span>
                  <span className="leading-relaxed">{opt}</span>
                </button>
              ))}
            </div>
            {error && <p className="mt-3 text-red-600 text-[1rem]" role="alert">{error}</p>}
            <button
              type="button"
              onClick={goBack}
              className="mt-6 text-kiduki-ink-muted text-[1rem] underline"
            >
              前の問いに戻る
            </button>
          </div>
        )}

        {/* リフレーム中 */}
        {step === 5 && (
          <div className="flex flex-col items-center justify-center flex-1 py-12">
            <SpinnerIcon />
            <p className="mt-4 text-kiduki-ink text-[1.125rem]">伝え方メモを作成しています...</p>
          </div>
        )}

        {/* 最終：医師への伝え方メモ（再構成された質問文をメインに表示） */}
        {step === 6 && (
          <>
            <p className="text-kiduki-ink-muted text-[1rem] mb-4">医師にそのまま見せられる診察メモができました。</p>
            {/* メイン：洗練された診察用質問文（最終的な医師への質問文） */}
            <div className="rounded-xl bg-[var(--color-kiduki-blue)] text-white p-6 mb-5 shadow-md">
              <p className="text-base font-semibold mb-2 opacity-95">■ 具体的な相談内容</p>
              <p className="text-[1.25rem] leading-relaxed font-medium">{refinedQuestion}</p>
            </div>
            <div className="rounded-xl bg-[var(--color-kiduki-blue-muted)] border-2 border-[var(--color-kiduki-blue-light)] p-5 mb-5">
              <p className="text-base font-semibold text-kiduki-blue mb-2">■ 先生に伝えたいこと（要約）</p>
              <p className="text-kiduki-ink text-[1.125rem] leading-relaxed">{generateResult?.sum}</p>
            </div>
            <div className="rounded-xl bg-white border-2 border-gray-200 p-5 mb-6">
              <p className="text-base font-semibold text-kiduki-ink-muted mb-2">■ 整理したプロセスの記録</p>
              <ul className="text-kiduki-ink text-[1.125rem] space-y-2">
                <li><span className="font-medium text-kiduki-ink-muted">状況：</span>{selectedQ1}</li>
                <li><span className="font-medium text-kiduki-ink-muted">一番の懸念：</span>{selectedQ2}</li>
                <li><span className="font-medium text-kiduki-ink-muted">診察での意図：</span>{selectedQ3}</li>
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={handleCopy}
                className="btn-kiduki w-full min-h-[3.25rem] text-[1.125rem] bg-[var(--color-kiduki-blue)] text-white rounded-xl shadow-md hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--color-kiduki-blue)] focus:ring-offset-2 flex items-center justify-center gap-2"
                aria-label="診察メモをコピー"
              >
                <CopyIcon />
                <span>{copied ? "コピーしました" : "診察メモをコピー"}</span>
              </button>
              <button
                type="button"
                onClick={handleRetry}
                className="btn-kiduki w-full min-h-[3rem] text-[1.125rem] bg-white text-kiduki-ink border-2 border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                aria-label="もう一度やり直す"
              >
                もう一度やり直す
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
