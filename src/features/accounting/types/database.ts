export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Account Type (P/L Classification)
export interface AccountType {
  id: number;
  name: string;           // "売上", "経費"
  classification: 'income' | 'expense' | 'asset' | 'liability';
}

// Chart of Accounts (勘定科目)
export interface Account {
  id: string;
  code: string;           // "4101"
  name: string;           // "種苗費"
  name_simple: string;    // "種・苗" (Mom-friendly)
  account_type_id: number;
  is_default: boolean;
  business_ratio: number; // 0-100 (Default 100)
  display_order: number;
}

// Transaction Record (取引記録)
export interface Transaction {
  id: string;
  user_id: string;
  group_id: string | null;
  amount: number;
  account_id: string;
  description: string | null;
  date: string;
  image_url: string | null;
  ocr_text: string | null; // Added
  created_at: string;
}

// Transaction Comments (Family Chat)
export interface TransactionComment {
  id: string;
  transaction_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// Family Members
export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

// Wallets
export interface Wallet {
  id: string;
  member_id: string;
  name: string;
  wallet_type: 'cash' | 'bank';
  balance: number;
  display_order: number;
  updated_at: string;
  created_at: string;
}

// Monthly Notes
export interface MonthlyNote {
  id: string;
  user_id: string;
  group_id: string | null;
  month: string; // YYYY-MM-01 (Date)
  budget: number | null;
  note: string | null; // Content
  updated_at?: string;
  created_at: string;
}

// Family Groups
export interface FamilyGroup {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

// Family Group Members
export interface FamilyGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

// Fixed Assets
export interface FixedAsset {
  id: string;
  user_id: string;
  group_id: string | null;
  name: string;
  purchase_date: string;
  purchase_price: number;
  useful_life_years: number;
  residual_value: number;
  memo: string | null;
  created_at: string;
}

// Extended Transaction with Account info (for display)
export interface TransactionWithAccount extends Transaction {
  account: Account;
}

export interface Database {
  public: {
    Tables: {
      acc_account_types: {
        Row: AccountType;
        Insert: Omit<AccountType, 'id'>;
        Update: Partial<Omit<AccountType, 'id'>>;
        Relationships: [];
      };
      acc_accounts: {
        Row: Account;
        Insert: Omit<Account, 'id'>;
        Update: Partial<Omit<Account, 'id'>>;
        Relationships: [];
      };
      acc_transactions: {
        Row: Transaction;
        Insert: any; // Omit<Transaction, 'id' | 'created_at'>;
        Update: any; // Partial<Omit<Transaction, 'id' | 'created_at'>>;
        Relationships: [];
      };
      acc_family_members: {
        Row: FamilyMember;
        Insert: any;
        Update: any;
        Relationships: [];
      };
      acc_wallets: {
        Row: Wallet;
        Insert: any;
        Update: any;
        Relationships: [];
      };
      acc_monthly_notes: {
        Row: MonthlyNote;
        Insert: any;
        Update: any;
        Relationships: [];
      };
      acc_family_groups: {
        Row: FamilyGroup;
        Insert: any;
        Update: any;
        Relationships: [];
      };
      acc_family_group_members: {
        Row: FamilyGroupMember;
        Insert: any;
        Update: any;
        Relationships: [];
      };
      acc_transaction_comments: {
        Row: TransactionComment;
        Insert: any; 
        Update: any;
        Relationships: [];
      };
      acc_inventory_items: {
        Row: any; // Define later if strictly needed, but consistent w others
        Insert: any;
        Update: any;
        Relationships: [];
      };
      acc_fixed_assets: {
        Row: FixedAsset;
        Insert: any;
        Update: any;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
