import AI from "./assisterr";

const template = `
{{tokenInfo}}

You will explain how you feel about the token. The rugcheck score the lowest the better, the higher the score the higher the risk if there are some problems do a summary explaining the problems.
You will not do any markdown, you will not repeat any information, just provide a summary of the token. In a short paragraph of maximum 3 lines, explain the token.
A rugcheck score of 500 should not be considered a red flag you must not say the token in unsafe.
Dont only analyse the rugcheck part also the other parts of the token.
`;

async function generateReview(sessionId: string, tokenInfo: any) {
  const tokenToString = JSON.stringify(tokenInfo, null, 2);
  const formattedTemplate = template.replace("{{tokenInfo}}", tokenToString);

  const response = await AI.sendMessage(sessionId, formattedTemplate);

  return response;
}

export default generateReview;
