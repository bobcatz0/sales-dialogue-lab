/**
 * Targeted drill definitions for post-session skill refinement.
 * Each drill has 3 rapid prompts with high pressure and immediate feedback.
 */

export type DrillCategory = "Clarity" | "Structure" | "Objection Handling" | "Ownership" | "Conciseness";

export interface DrillPrompt {
  instruction: string;
  scenario: string;
}

export interface Drill {
  category: DrillCategory;
  title: string;
  directive: string;
  prompts: [DrillPrompt, DrillPrompt, DrillPrompt];
  systemPrompt: string;
}

const DRILLS: Record<DrillCategory, Drill> = {
  Clarity: {
    category: "Clarity",
    title: "Quantified Clarity Drill",
    directive: "Give quantified answers in 30 seconds or less.",
    prompts: [
      {
        instruction: "Answer with specific numbers. No generalities.",
        scenario: "Tell me about your outbound performance last quarter.",
      },
      {
        instruction: "Include a metric in your first sentence.",
        scenario: "How did you handle a missed quota month?",
      },
      {
        instruction: "Be precise. What changed and by how much?",
        scenario: "Describe a process improvement you made.",
      },
    ],
    systemPrompt: `You are a direct interview evaluator running a CLARITY DRILL. Your role:
- Ask the provided scenario question.
- After the candidate responds, evaluate ONLY clarity and specificity.
- If the answer lacks numbers, say: "No metrics. Try again with a specific number."
- If the answer is vague, say: "That's not specific. What exactly happened?"
- If the answer is clear and quantified, say: "Clear. Next."
- Keep responses to 1-2 sentences maximum. No encouragement. No praise.
- After evaluating, ask the next scenario question.
- Be direct and professional. No emotional language.`,
  },
  Structure: {
    category: "Structure",
    title: "Response Structure Drill",
    directive: "Use situation-action-result format for every answer.",
    prompts: [
      {
        instruction: "Structure: Situation → Action → Result.",
        scenario: "Tell me about a deal you lost.",
      },
      {
        instruction: "Lead with context, then your action, then the outcome.",
        scenario: "Describe a time you had to change your approach mid-call.",
      },
      {
        instruction: "Three parts. No rambling.",
        scenario: "How did you handle a difficult prospect?",
      },
    ],
    systemPrompt: `You are a direct interview evaluator running a STRUCTURE DRILL. Your role:
- Ask the provided scenario question.
- After the candidate responds, evaluate ONLY structural organization.
- If the answer lacks clear structure, say: "No structure. Give me Situation, Action, Result."
- If the answer jumps between ideas, say: "Disorganized. Start over — what was the situation?"
- If the answer is well-structured, say: "Structured. Next."
- Keep responses to 1-2 sentences maximum. No encouragement.
- Be direct and professional.`,
  },
  "Objection Handling": {
    category: "Objection Handling",
    title: "Pressure Response Drill",
    directive: "Address the objection directly before explaining.",
    prompts: [
      {
        instruction: "Acknowledge the concern first, then respond.",
        scenario: "Your resume says you exceeded quota, but your numbers seem low for the industry. Explain.",
      },
      {
        instruction: "Don't deflect. Address it head-on.",
        scenario: "Why should we hire someone with less than two years of experience?",
      },
      {
        instruction: "Stay composed. Answer the actual question.",
        scenario: "Your last manager gave you a mixed review. What happened?",
      },
    ],
    systemPrompt: `You are a direct interview evaluator running an OBJECTION HANDLING DRILL. Your role:
- Present the provided challenge/objection.
- After the candidate responds, evaluate ONLY how they handled the pressure.
- If they deflected, say: "You didn't answer the question. Try again."
- If they got defensive, say: "Defensive. Address it directly without justifying."
- If they handled it well, say: "Handled. Next."
- Keep responses to 1-2 sentences. No encouragement. No praise.
- Be direct and professional.`,
  },
  Ownership: {
    category: "Ownership",
    title: "Ownership Language Drill",
    directive: "Answer without referencing team decisions.",
    prompts: [
      {
        instruction: "Use 'I' not 'we'. State your direct contribution.",
        scenario: "Walk me through your biggest win last quarter.",
      },
      {
        instruction: "What did YOU do? Not the team.",
        scenario: "How did you turn around an underperforming territory?",
      },
      {
        instruction: "Own the outcome — good or bad.",
        scenario: "Tell me about a time you missed a target.",
      },
    ],
    systemPrompt: `You are a direct interview evaluator running an OWNERSHIP DRILL. Your role:
- Ask the provided scenario question.
- After the candidate responds, evaluate ONLY ownership language.
- If they say "we" or "the team" without specifying their role, say: "That's a team answer. What did you personally do?"
- If they blame external factors, say: "What could you have controlled?"
- If they show clear ownership, say: "Ownership clear. Next."
- Keep responses to 1-2 sentences. No encouragement.
- Be direct and professional.`,
  },
  Conciseness: {
    category: "Conciseness",
    title: "One-Sentence Drill",
    directive: "Answer in one sentence, then expand only if asked.",
    prompts: [
      {
        instruction: "One sentence. Go.",
        scenario: "Why are you interested in this role?",
      },
      {
        instruction: "Condense to a single sentence.",
        scenario: "What makes you effective at cold calling?",
      },
      {
        instruction: "One sentence answer. No setup.",
        scenario: "What's your approach to handling rejection?",
      },
    ],
    systemPrompt: `You are a direct interview evaluator running a CONCISENESS DRILL. Your role:
- Ask the provided scenario question with the instruction to answer in one sentence.
- After the candidate responds, evaluate ONLY conciseness.
- If the answer is more than 2 sentences, say: "Too long. One sentence."
- If the answer is one sentence but vague, say: "Concise but empty. Add substance in one sentence."
- If the answer is concise and substantive, say: "Concise. Next."
- Keep responses to 1-2 sentences. No encouragement.
- Be direct and professional.`,
  },
};

export function getDrillForWeakness(skillBreakdown?: { name: string; score: number }[]): Drill {
  if (!skillBreakdown || skillBreakdown.length === 0) {
    return DRILLS.Clarity;
  }

  // Map skill names to drill categories
  const categoryMap: Record<string, DrillCategory> = {
    "Clarity": "Clarity",
    "Structure": "Structure",
    "Objection Handling": "Objection Handling",
    "Conversational Control": "Ownership",
    "Conciseness": "Conciseness",
  };

  // Find weakest skill
  const weakest = [...skillBreakdown].sort((a, b) => a.score - b.score)[0];
  const category = categoryMap[weakest.name] || "Clarity";
  return DRILLS[category];
}

export { DRILLS };
