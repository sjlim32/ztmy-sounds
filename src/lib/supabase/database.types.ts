export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AlbumType = "FULL" | "MINI" | "EP";
type RowStatus = "ACTIVE" | "PENDING" | "HIDDEN" | "DELETED";

export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          id: string;
          slug: string;
          title: string;
          title_ko: string;
          title_en: string;
          release_date: string;
          cover_image_url: string | null;
          music_video_url: string | null;
          streaming_urls: Json | null;
          arranger: string[] | null;
          movie_director: string[] | null;
          metadata: Json | null;
          status: RowStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          title_ko: string;
          title_en: string;
          release_date: string;
          cover_image_url?: string | null;
          music_video_url?: string | null;
          streaming_urls?: Json | null;
          arranger?: string[] | null;
          movie_director?: string[] | null;
          metadata?: Json | null;
          status?: RowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          title_ko?: string;
          title_en?: string;
          release_date?: string;
          cover_image_url?: string | null;
          music_video_url?: string | null;
          streaming_urls?: Json | null;
          arranger?: string[] | null;
          movie_director?: string[] | null;
          metadata?: Json | null;
          status?: RowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      albums: {
        Row: {
          id: string;
          slug: string;
          title: string;
          title_ko: string;
          title_en: string;
          album_type: AlbumType;
          album_number: number;
          release_date: string;
          cover_image_url: string | null;
          book_image_urls: string[] | null;
          metadata: Json | null;
          status: RowStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          title_ko: string;
          title_en: string;
          album_type: AlbumType;
          album_number: number;
          release_date: string;
          cover_image_url?: string | null;
          book_image_urls?: string[] | null;
          metadata?: Json | null;
          status?: RowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          title_ko?: string;
          title_en?: string;
          album_type?: AlbumType;
          album_number?: number;
          release_date?: string;
          cover_image_url?: string | null;
          book_image_urls?: string[] | null;
          metadata?: Json | null;
          status?: RowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      song_albums: {
        Row: {
          song_id: string;
          album_id: string;
          track_number: number;
          disc_number: number;
          is_title_track: boolean;
          updated_at: string;
        };
        Insert: {
          song_id: string;
          album_id: string;
          track_number: number;
          disc_number?: number;
          is_title_track?: boolean;
          updated_at?: string;
        };
        Update: {
          song_id?: string;
          album_id?: string;
          track_number?: number;
          disc_number?: number;
          is_title_track?: boolean;
          updated_at?: string;
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
