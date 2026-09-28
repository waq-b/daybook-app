// Generated from the live Supabase schema with the Supabase connector
// (generate_typescript_types). Regenerate after a migration. The helper types
// at the bottom are trimmed to the public schema; the Database type is as generated.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      checkins: {
        Row: {
          archived_at: string | null;
          at: string;
          closing: string | null;
          created_at: string;
          flagged: boolean;
          id: string;
          intensity: number | null;
          practice_id: string;
          updated_at: string;
          user_id: string;
          words: string[];
          writing: string | null;
        };
        Insert: {
          archived_at?: string | null;
          at?: string;
          closing?: string | null;
          created_at?: string;
          flagged?: boolean;
          id?: string;
          intensity?: number | null;
          practice_id: string;
          updated_at?: string;
          user_id?: string;
          words?: string[];
          writing?: string | null;
        };
        Update: {
          archived_at?: string | null;
          at?: string;
          closing?: string | null;
          created_at?: string;
          flagged?: boolean;
          id?: string;
          intensity?: number | null;
          practice_id?: string;
          updated_at?: string;
          user_id?: string;
          words?: string[];
          writing?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "checkins_practice_id_user_id_fkey";
            columns: ["practice_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "practices";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      gratitude_entries: {
        Row: {
          archived_at: string | null;
          at: string;
          because: string;
          created_at: string;
          flagged: boolean;
          id: string;
          practice_id: string;
          seed_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          at?: string;
          because: string;
          created_at?: string;
          flagged?: boolean;
          id?: string;
          practice_id: string;
          seed_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          archived_at?: string | null;
          at?: string;
          because?: string;
          created_at?: string;
          flagged?: boolean;
          id?: string;
          practice_id?: string;
          seed_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gratitude_entries_practice_id_user_id_fkey";
            columns: ["practice_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "practices";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "gratitude_entries_seed_id_user_id_fkey";
            columns: ["seed_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "seeds";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      misses: {
        Row: {
          archived_at: string | null;
          created_at: string;
          flagged: boolean;
          id: string;
          next_go: Database["public"]["Enums"]["next_go"] | null;
          note: string | null;
          planned_on: string;
          reasons: string[];
          task_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          flagged?: boolean;
          id?: string;
          next_go?: Database["public"]["Enums"]["next_go"] | null;
          note?: string | null;
          planned_on: string;
          reasons?: string[];
          task_id: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          flagged?: boolean;
          id?: string;
          next_go?: Database["public"]["Enums"]["next_go"] | null;
          note?: string | null;
          planned_on?: string;
          reasons?: string[];
          task_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "misses_task_id_user_id_fkey";
            columns: ["task_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      practices: {
        Row: {
          archived_at: string | null;
          created_at: string;
          id: string;
          name: string;
          session_id: string | null;
          settings: Json;
          type: Database["public"]["Enums"]["practice_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          session_id?: string | null;
          settings?: Json;
          type: Database["public"]["Enums"]["practice_type"];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          session_id?: string | null;
          settings?: Json;
          type?: Database["public"]["Enums"]["practice_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "practices_session_id_user_id_fkey";
            columns: ["session_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          archived_at: string | null;
          created_at: string;
          endpoint: string;
          id: string;
          keys: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          endpoint: string;
          id?: string;
          keys: Json;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          endpoint?: string;
          id?: string;
          keys?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          archived_at: string | null;
          created_at: string;
          days: number[];
          enabled: boolean;
          id: string;
          paused_until: string | null;
          practice_id: string;
          times: string[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          days?: number[];
          enabled?: boolean;
          id?: string;
          paused_until?: string | null;
          practice_id: string;
          times?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          days?: number[];
          enabled?: boolean;
          id?: string;
          paused_until?: string | null;
          practice_id?: string;
          times?: string[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_practice_id_user_id_fkey";
            columns: ["practice_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "practices";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      reps: {
        Row: {
          actual: number;
          archived_at: string | null;
          at: string;
          coping: string[];
          created_at: string;
          flagged: boolean;
          id: string;
          left_early: boolean;
          note: string | null;
          prediction: string | null;
          prediction_likelihood: Database["public"]["Enums"]["prediction_likelihood"] | null;
          prediction_outcome: Database["public"]["Enums"]["prediction_outcome"] | null;
          remaining: number;
          task_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          actual: number;
          archived_at?: string | null;
          at?: string;
          coping?: string[];
          created_at?: string;
          flagged?: boolean;
          id?: string;
          left_early?: boolean;
          note?: string | null;
          prediction?: string | null;
          prediction_likelihood?: Database["public"]["Enums"]["prediction_likelihood"] | null;
          prediction_outcome?: Database["public"]["Enums"]["prediction_outcome"] | null;
          remaining: number;
          task_id: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          actual?: number | null;
          archived_at?: string | null;
          at?: string;
          coping?: string[];
          created_at?: string;
          flagged?: boolean;
          id?: string;
          left_early?: boolean;
          note?: string | null;
          prediction?: string | null;
          prediction_likelihood?: Database["public"]["Enums"]["prediction_likelihood"] | null;
          prediction_outcome?: Database["public"]["Enums"]["prediction_outcome"] | null;
          remaining?: number | null;
          task_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reps_task_id_user_id_fkey";
            columns: ["task_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      seeds: {
        Row: {
          archived_at: string | null;
          created_at: string;
          id: string;
          practice_id: string;
          text: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          practice_id: string;
          text: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          practice_id?: string;
          text?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seeds_practice_id_user_id_fkey";
            columns: ["practice_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "practices";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      sessions: {
        Row: {
          anything_else: string | null;
          assigned_note: string | null;
          archived_at: string | null;
          at: string;
          created_at: string;
          done_at: string | null;
          id: string;
          notes: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          anything_else?: string | null;
          assigned_note?: string | null;
          archived_at?: string | null;
          at: string;
          created_at?: string;
          done_at?: string | null;
          id?: string;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          anything_else?: string | null;
          assigned_note?: string | null;
          archived_at?: string | null;
          at?: string;
          created_at?: string;
          done_at?: string | null;
          id?: string;
          notes?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          archived_at: string | null;
          comments: string | null;
          completed_at: string | null;
          created_at: string;
          id: string;
          name: string;
          next_prediction: string | null;
          next_prediction_likelihood: Database["public"]["Enums"]["prediction_likelihood"] | null;
          notes: string | null;
          practice_id: string;
          predicted: number;
          repeating: boolean;
          reps_per_week: number | null;
          target_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          comments?: string | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          next_prediction?: string | null;
          next_prediction_likelihood?: Database["public"]["Enums"]["prediction_likelihood"] | null;
          notes?: string | null;
          practice_id: string;
          predicted: number;
          repeating?: boolean;
          reps_per_week?: number | null;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          archived_at?: string | null;
          comments?: string | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          next_prediction?: string | null;
          next_prediction_likelihood?: Database["public"]["Enums"]["prediction_likelihood"] | null;
          notes?: string | null;
          practice_id?: string;
          predicted?: number;
          repeating?: boolean;
          reps_per_week?: number | null;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_practice_id_user_id_fkey";
            columns: ["practice_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "practices";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_everything: { Args: { confirm: string }; Returns: undefined };
      export_everything: { Args: never; Returns: Json };
    };
    Enums: {
      next_go: "tomorrow" | "a_day" | "leave";
      practice_type: "hierarchy" | "feelings" | "gratitude";
      prediction_likelihood: "not_very" | "fairly" | "very";
      prediction_outcome: "no" | "a_bit" | "yes";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][EnumName];

export const Constants = {
  public: {
    Enums: {
      next_go: ["tomorrow", "a_day", "leave"],
      practice_type: ["hierarchy", "feelings", "gratitude"],
      prediction_likelihood: ["not_very", "fairly", "very"],
      prediction_outcome: ["no", "a_bit", "yes"],
    },
  },
} as const;
