import axios, { Axios } from "axios";

const instance = axios.create({
  baseURL: "https://api.assisterr.ai/api/v1/slm/elyrai",
  headers: {
    "Content-Type": "application/json",
    "X-Api-Key": process.env.ASSISTERR_API_KEY,
  },
});

export default class AI {
  private static axios: Axios = instance;

  static async createChat(): Promise<string> {
    const { data } = await this.axios.post("/session/create");
    return data;
  }

  static async sendMessage(
    sessionId: string,
    query: string
  ): Promise<{
    message: string;
    message_at: string;
    is_user: boolean;
  }> {
    const { data } = await this.axios.post(`/session/${sessionId}/chat`, {
      query,
    });

    return data;
  }

  static async getHistory(sessionId: string): Promise<
    {
      _id: string;
      slm_agent_id: string;
      uid: string;
      is_user: boolean;
      slm_session_id: string;
      ident: string;
      source: string;
      query: string;
      created_at: string;
    }[]
  > {
    const { data } = await this.axios.get(`/session/${sessionId}/history`);
    return data;
  }
}
