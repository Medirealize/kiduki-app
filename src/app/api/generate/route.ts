import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  SYSTEM_PROMPT_OPTIONS,
  buildUserPromptOptions,
} from "@/lib/prompts";
import type { GenerateResultWithOptions } from "@/types";

export const runtime = "nodejs";

/**
 * AIのJSONレスポンスから sum / q1_options / q2_options / q3_options を抽出する
 */
function parseOptionsResponse(content: string): GenerateResultWithOptions | null {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const sum = typeof parsed.sum === "string" ? parsed.sum.trim() : "";
    const q1Question = typeof parsed.q1_question === "string" ? parsed.q1_question.trim() : "";
    const q2Question = typeof parsed.q2_question === "string" ? parsed.q2_question.trim() : "";
    const q3Question = typeof parsed.q3_question === "string" ? parsed.q3_question.trim() : "";
    const q1 = Array.isArray(parsed.q1_options)
      ? (parsed.q1_options as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 3)
      : [];
    const q2 = Array.isArray(parsed.q2_options)
      ? (parsed.q2_options as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 3)
      : [];
    const q3 = Array.isArray(parsed.q3_options)
      ? (parsed.q3_options as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 3)
      : [];
    if (!sum || q1.length < 3 || q2.length < 3 || q3.length < 3) return null;
    return {
      sum,
      q1_question: q1Question || undefined,
      q1_options: q1,
      q2_question: q2Question || undefined,
      q2_options: q2,
      q3_question: q3Question || undefined,
      q3_options: q3,
    };
  } catch {
    return null;
  }
}

function mapOpenAIError(err: unknown): { status: number; message: string } {
  const obj = err as Record<string, unknown> | undefined;
  const status = typeof obj?.status === "number" ? obj.status : 500;
  const message =
    (typeof obj?.message === "string" && obj.message) ||
    (obj?.error && typeof (obj.error as { message?: string }).message === "string"
      ? (obj.error as { message: string }).message
      : null) ||
    (err instanceof Error ? err.message : String(err));
  if (status === 401)
    return { status: 401, message: "APIキーが無効です。.env.local の OPENAI_API_KEY を確認してください。" };
  if (status === 429)
    return { status: 429, message: "リクエストが多すぎます。しばらく待ってからお試しください。" };
  if (status === 500 || status === 502 || status === 503)
    return { status, message: "OpenAI のサーバーでエラーが発生しました。しばらくしてからお試しください。" };
  if (status >= 400 && status < 500)
    return { status, message: message || "リクエストに問題があります。入力内容を確認してください。" };
  return { status: 500, message: message || "通信エラーが発生しました。もう一度お試しください。" };
}

export async function POST(request: NextRequest) {
  const logPrefix = "[generate]";
  const apiKey =
    typeof process.env.OPENAI_API_KEY === "string"
      ? process.env.OPENAI_API_KEY.trim()
      : "";

  console.log("API Key exists:", !!apiKey);

  if (!apiKey) {
    return NextResponse.json(
      { error: "APIの設定がありません。.env.local に OPENAI_API_KEY を設定し、サーバーを再起動してください。", code: "MISSING_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json({ error: "入力内容がありません。" }, { status: 400 });
    }
    if (text.length < 5) {
      return NextResponse.json({ error: "もう少し具体的に書いてください" }, { status: 400 });
    }
    if (text.length > 300) {
      return NextResponse.json({ error: "入力が長すぎます。短くまとめてください" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT_OPTIONS },
        { role: "user", content: buildUserPromptOptions(text) },
      ],
      max_tokens: 800,
      temperature: 0.4,
    });

    const rawContent = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!rawContent) {
      return NextResponse.json({ error: "AIからの応答が空でした。もう一度お試しください。" }, { status: 502 });
    }

    const parsed = parseOptionsResponse(rawContent);
    if (!parsed) {
      console.error(`${logPrefix} Failed to parse options JSON. Raw (first 500):`, rawContent.slice(0, 500));
      return NextResponse.json({ error: "うまく整理できませんでした。もう一度お試しください。" }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(`${logPrefix} error:`, err);
    const { status, message } = mapOpenAIError(err);
    return NextResponse.json(
      { error: message, code: status === 401 ? "UNAUTHORIZED" : status === 429 ? "RATE_LIMIT" : "API_ERROR" },
      { status }
    );
  }
}
