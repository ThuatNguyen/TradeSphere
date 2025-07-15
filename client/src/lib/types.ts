export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface SearchResult {
  id: number;
  accusedName: string;
  phoneNumber: string;
  accountNumber?: string;
  bank?: string;
  amount: number;
  createdAt: string;
}

export interface ReportFormData {
  accusedName: string;
  phoneNumber: string;
  accountNumber?: string;
  bank?: string;
  amount: number;
  description: string;
  isAnonymous: boolean;
  reporterName?: string;
  reporterPhone?: string;
}
