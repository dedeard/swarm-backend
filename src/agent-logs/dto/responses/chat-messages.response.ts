export class ChatMessage {
  message: string;
  role: string;
  created_at: Date;
}

export class PaginatedMessagesResponse {
  messages: ChatMessage[];
  pagination: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
  };
}
