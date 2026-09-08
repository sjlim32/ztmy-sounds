export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          id: string;
          title: string;
          title_ko: string | null;
          cover_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          title_ko?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          title_ko?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      albums: {
        Row: {
          id: string;
          title: string;
          title_ko: string | null;
          album_type: "full" | "mini" | "ep" | null;
          album_number: number | null;
          release_date: string;
          cover_image_url: string | null;
          book_image_urls: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          title_ko?: string | null;
          album_type?: "full" | "mini" | "ep" | null;
          album_number?: number | null;
          release_date: string;
          cover_image_url?: string | null;
          book_image_urls?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          title_ko?: string | null;
          album_type?: "full" | "mini" | "ep" | null;
          album_number?: number | null;
          release_date?: string;
          cover_image_url?: string | null;
          book_image_urls?: string[] | null;
          created_at?: string;
        };
        Relationships: [];
      };
      song_albums: {
        Row: {
          song_id: string;
          album_id: string;
        };
        Insert: {
          song_id: string;
          album_id: string;
        };
        Update: {
          song_id?: string;
          album_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "song_albums_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "song_albums_album_id_fkey";
            columns: ["album_id"];
            isOneToOne: false;
            referencedRelation: "albums";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
