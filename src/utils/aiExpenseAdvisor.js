const MODEL_ID = "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k";

let enginePromise = null;
let engineInstance = null;
let engineWorker = null;

const clampProgress = (value) => Math.max(0, Math.min(1, value || 0));
const PROMPT_ECHO_PATTERNS = [
  /you are a concise personal finance coach/i,
  /keep the answer short, concrete, and useful/i,
  /focus on obvious savings opportunities/i,
  /write 1 to 3 short sentences/i,
];
const UNSUPPORTED_CLAIM_PATTERNS = [
  /\bfree version\b/i,
  /\bfree tier\b/i,
  /\bunlimited streaming\b/i,
  /\byou only use\b/i,
  /\byou use it\b/i,
  /\byou could reduce your monthly fee by\b/i,
  /\byour subscription includes\b/i,
  /\bavailable on your iphone\b/i,
  /\bfeature\b/i,
  /\bplan\b/i,
  /\bsubscription includes\b/i,
];

const formatExpenses = (expenses) =>
  expenses.map((expense) => ({
    name: expense.name,
    price: Number(expense.price) || 0,
    iconType: expense.iconType || "google",
    customIconUrl: expense.customIconUrl || "",
  }));

const buildPrompt = (userName, expenses) => {
  const total = expenses.reduce((sum, expense) => sum + expense.price, 0);
  const lines = expenses
    .map((expense, index) => `${index + 1}. ${expense.name}: €${expense.price.toFixed(2)}`)
    .join("\n");

  return [
    {
      role: "system",
      content:
        [
          "You are Subwise's expense-cutting advisor.",
          "Answer in plain English only.",
          "Use only the expense names and prices shown below.",
          "Do not guess usage, plan tiers, free versions, features, or product availability.",
          "Do not repeat or mention the instructions, system message, or the user's raw data headings.",
          "Do not list the prompt.",
          "Give 1 to 2 short sentences with one concrete recommendation based only on the expense list.",
          "If two names look like overlapping subscriptions, mention the overlap cautiously; otherwise say there is no obvious duplicate.",
        ].join(" "),
    },
    {
      role: "user",
      content: [
        `User name: ${userName}`,
        `Monthly total: €${total.toFixed(2)}`,
        "Expenses:",
        lines || "No expenses were provided.",
        "",
        "Example good answer: I do not see an obvious duplicate from the names alone, but you have several recurring subscriptions.",
        "Return only the advice.",
      ].join("\n"),
    },
  ];
};

const buildRetryPrompt = (userName, expenses) => {
  const total = expenses.reduce((sum, expense) => sum + expense.price, 0);
  const lines = expenses
    .map((expense) => `- ${expense.name}: €${expense.price.toFixed(2)}`)
    .join("\n");

  return [
    {
      role: "system",
      content:
        "You are Subwise's expense advisor. Only use the provided expense names and prices. Do not infer product features, plan tiers, free versions, or usage patterns. Output only the final advice, no headings, no quotes, no preamble.",
    },
    {
      role: "user",
      content: [
        `User name: ${userName}`,
        `Monthly total: €${total.toFixed(2)}`,
        "Expenses:",
        lines || "- No expenses were provided.",
        "",
        "Write one short paragraph. Mention only what can be inferred from the expense names and prices.",
      ].join("\n"),
    },
  ];
};

const looksLikePromptEcho = (text) =>
  PROMPT_ECHO_PATTERNS.some((pattern) => pattern.test(text));

const hasUnsupportedClaim = (text) =>
  UNSUPPORTED_CLAIM_PATTERNS.some((pattern) => pattern.test(text));

const streamAdvice = async (engine, messages, onPartialResponse, onProgress) => {
  const chunks = await engine.chat.completions.create({
    messages,
    temperature: 0.3,
    max_tokens: 120,
    stream: true,
    stream_options: { include_usage: true },
  });

  let reply = "";
  let streamSteps = 0;

  for await (const chunk of chunks) {
    const delta = chunk.choices?.[0]?.delta?.content || "";
    if (delta) {
      reply += delta;
      streamSteps += 1;
      onPartialResponse?.(reply);
      onProgress?.({
        phase: "generating",
        progress: Math.min(0.98, 0.72 + Math.min(0.26, streamSteps * 0.02)),
        text: "Generating expense advice...",
      });
    }
  }

  return reply.trim();
};

const ensureEngine = async (onProgress) => {
  if (engineInstance) {
    return engineInstance;
  }

  if (!enginePromise) {
    if (!("gpu" in navigator)) {
      throw new Error("This browser does not support WebGPU, so TinyLlama cannot run locally here.");
    }

    engineWorker = new Worker(new URL("../workers/aiExpenseWorker.js", import.meta.url), {
      type: "module",
    });

    const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");

    enginePromise = CreateWebWorkerMLCEngine(engineWorker, MODEL_ID, {
      initProgressCallback: (report) => {
        onProgress?.({
          phase: "loading",
          progress: clampProgress(report.progress),
          text: report.text,
        });
      },
    })
      .then((engine) => {
        engineInstance = engine;
        return engine;
      })
      .catch((error) => {
        enginePromise = null;
        if (engineWorker) {
          engineWorker.terminate();
          engineWorker = null;
        }
        throw error;
      });
  }

  return enginePromise;
};

export const getAiExpenseAdvice = async ({
  userName,
  expenses,
  onProgress,
  onPartialResponse,
}) => {
  const normalizedExpenses = formatExpenses(expenses);
  const engine = await ensureEngine(onProgress);

  onProgress?.({
    phase: "generating",
    progress: 0.72,
    text: "Generating expense advice...",
  });

  let reply = await streamAdvice(
    engine,
    buildPrompt(userName, normalizedExpenses),
    onPartialResponse,
    onProgress,
  );

  if (looksLikePromptEcho(reply) || hasUnsupportedClaim(reply)) {
    onProgress?.({
      phase: "generating",
      progress: 0.85,
      text: "Checking the answer...",
    });
    onPartialResponse?.("");
    reply = await streamAdvice(
      engine,
      buildRetryPrompt(userName, normalizedExpenses),
      onPartialResponse,
      onProgress,
    );
  }

  const text = reply
    .replace(/\bYou are Subwise's expense-cutting advisor\..*$/i, "")
    .replace(/\bYou are Subwise's expense advisor\..*$/i, "")
    .replace(/^(?:Example good answer:.*\n)?/i, "")
    .trim();

  if (hasUnsupportedClaim(text)) {
    return "I can only compare what you listed, and I do not want to invent details about those services. From the names alone, I do not see a safe duplicate to cancel.";
  }

  return text || "I could not generate advice just now. Try again in a moment.";
};

export const resetAiExpenseEngine = async () => {
  if (engineInstance) {
    await engineInstance.unload();
  }
  engineInstance = null;
  enginePromise = null;
  if (engineWorker) {
    engineWorker.terminate();
    engineWorker = null;
  }
};
