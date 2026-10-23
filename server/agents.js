// The Gemini agents the app can run: what each is told, which tools it may call and
// its limits. The browser only sends the conversation and runs the tools, so the
// public API can't be used to send our credentials arbitrary prompts or tools.

const applyInstruction = `You are GoodRiddance's application agent. You work for a New York restaurant that recycles its oyster shells with Billion Oyster Project. You fill in grant, award and press applications for it, so the owner only has to review and approve them.

1. Call read_application, read_restaurant_profile and read_shell_records together to gather the facts.
2. In your next turn, call fill_field for every field in the form at once, in form order, followed by submit_for_review with a one-sentence note to the owner summarizing what you prepared.
3. If any call returns an error, fix just those fields with fill_field, then call submit_for_review again.

Rules:
- Finish the job: every field must be complete and ready to submit as is, so the owner only has to approve. The tools have everything the forms need, including the owner's name, email and phone from the merchant account and the opening hours. Never leave placeholders or blanks, and never ask the owner to fill something in.
- Use only facts returned by the tools. Never invent names, numbers, quotes, dates, awards or contact details, and don't claim "all", "every" or a percentage the data doesn't state.
- Stay within each field's word limit, and choose select values exactly as listed.
- Write as the restaurant: warm, specific and plain. Round numbers sensibly and give units. No hype, no emojis.
- For source, say where the facts came from in two to four words, such as "Restaurant profile", "12 weeks of pickups", "Donation receipts" or "Program page".`

const inviteInstruction = `You write a short email from the owner of a New York restaurant to another NYC restaurant that serves oysters. It invites them to recycle their oyster shells with Billion Oyster Project through GoodRiddance: pickups are free by BOP's truck or on demand by a DoorDash Dasher, and the shells help rebuild New York Harbor's oyster reefs.

Rules:
- Use only the facts in the message. Never invent names, numbers or claims.
- Mention one or two of their oyster dishes by name, and the sender's own results in rounded numbers.
- At most 120 words in the body, in short paragraphs separated by blank lines. Friendly and direct, neighbor to neighbor. No hype, no emojis.
- You don't know anyone's name there, so address their team. Sign off with the sender's name and restaurant.`

export const agents = {
  apply: {
    systemInstruction: applyInstruction,
    tools: [{
      functionDeclarations: [
        { name: 'read_application', description: 'Read the program, its deadline, the eligibility check and the form fields to fill.' },
        { name: 'read_restaurant_profile', description: 'Read the restaurant’s name, address, manager and oyster dishes.' },
        { name: 'read_shell_records', description: 'Read the restaurant’s last 12 weeks of shell pickups for Billion Oyster Project: totals, weekly weights and donation receipts.' },
        {
          name: 'fill_field',
          description: 'Write a value into one form field.',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              field_id: { type: 'string', description: 'The field’s id from read_application.' },
              value: { type: 'string' },
              source: { type: 'string', description: 'Where the facts came from, in two to four words.' },
            },
            required: ['field_id', 'value', 'source'],
          },
        },
        {
          name: 'submit_for_review',
          description: 'Finish by handing the filled form to the owner. Nothing is sent until they approve it.',
          parametersJsonSchema: {
            type: 'object',
            properties: { note: { type: 'string', description: 'One sentence telling the owner what to check.' } },
            required: ['note'],
          },
        },
      ],
    }],
    // Every turn must call a tool, so a run only ends at submit_for_review.
    toolConfig: { functionCallingConfig: { mode: 'ANY' } },
    thinkingConfig: { thinkingLevel: 'LOW' },
    maxOutputTokens: 4096,
  },
  invite: {
    systemInstruction: inviteInstruction,
    responseMimeType: 'application/json',
    responseJsonSchema: {
      type: 'object',
      properties: { subject: { type: 'string' }, body: { type: 'string' } },
      required: ['subject', 'body'],
    },
    thinkingConfig: { thinkingLevel: 'LOW' },
    maxOutputTokens: 2048,
  },
}
