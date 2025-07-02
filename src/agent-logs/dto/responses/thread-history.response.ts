export class ThreadHistoryResponse {
  threads: {
    agent_log_id: string;
    thread_title: string;
    created_at: Date;
  }[];
  total_records: number;
}
