/** 従来の単一問い形式（後方互換） */
export interface GenerateResult {
  q1: string;
  q2: string;
  q3: string;
  sum: string;
}

/** 選択肢付き因数分解レスポンス（新仕様：問い＋A,B,C の3選択肢） */
export interface GenerateResultWithOptions {
  sum: string;
  q1_question?: string;
  q1_options: string[];
  q2_question?: string;
  q2_options: string[];
  q3_question?: string;
  q3_options: string[];
}

/** リフレームAPI リクエスト */
export interface ReframeRequest {
  sum: string;
  selected_q1: string;
  selected_q2: string;
  selected_q3: string;
}

/** リフレームAPI レスポンス */
export interface ReframeResult {
  refined_question: string;
}

/** 最終メモ用（選択結果＋リフレーム文） */
export interface FinalMemo {
  sum: string;
  refined_question: string;
  selected_q1: string;
  selected_q2: string;
  selected_q3: string;
}
