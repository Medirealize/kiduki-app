import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { REFRAME_SYSTEM_PROMPT, buildReframePrompt } from "@/lib/prompts";
import type { ReframeResult } from "@/types";

export const runtime = "nodejs";

function parseReframeResponse(content: string): ReframeResult | null {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const refined = typeof parsed.refined_question === "string" ? parsed.refined_question.trim() : "";
    if (!refined) return null;
    return { refined_question: refined };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const apiKey =
    typeof process.env.OPENAI_API_KEY === "string"
      ? process.env.OPENAI_API_KEY.trim()
      : "";

  if (!apiKey) {
    return NextResponse.json(
      { error: "APIの設定がありません。" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const sum = typeof body?.sum === "string" ? body.sum.trim() : "";
    const original_input = typeof body?.original_input === "string" ? body.original_input.trim() : "";
    const selected_q1 = typeof body?.selected_q1 === "string" ? body.selected_q1.trim() : "";
    const selected_q2 = typeof body?.selected_q2 === "string" ? body.selected_q2.trim() : "";
    const selected_q3 = typeof body?.selected_q3 === "string" ? body.selected_q3.trim() : "";

    if (!sum || !selected_q1 || !selected_q2 || !selected_q3) {
      return NextResponse.json(
        { error: "要約と3つの選択結果が必要です。" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: REFRAME_SYSTEM_PROMPT },
        { role: "user", content: buildReframePrompt({ sum, original_input: original_input || undefined, selected_q1, selected_q2, selected_q3 }) },
      ],
      max_tokens: 400,
      temperature: 0.3,
    });

    const rawContent = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = parseReframeResponse(rawContent);

    if (!parsed) {
      return NextResponse.json(
        { error: "相談文の作成に失敗しました。もう一度お試しください。" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[reframe] error:", err);
    return NextResponse.json(
      { error: "通信エラーが発生しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
