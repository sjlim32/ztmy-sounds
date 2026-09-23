export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AlbumType = "FULL" | "MINI" | "EP";
type RowStatus = "ACTIVE" | "PENDING" | "HIDDEN" | "DELETED";
type LiveType = "FESTIVAL" | "CONCERT" | "EVENT";

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
          original_song_id: string | null;
          version_name: string | null;
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
          original_song_id?: string | null;
          version_name?: string | null;
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
          original_song_id?: string | null;
          version_name?: string | null;
          metadata?: Json | null;
          status?: RowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "songs_original_song_id_fkey";
            columns: ["original_song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
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
      lives: {
        Row: {
          id: string;
          slug: string;
          tour_id: string | null;
          title: string;
          title_ko: string;
          title_en: string;
          type: LiveType;
          start_date: string;
          end_date: string | null;
          live_date: string;
          country: string;
          region: string;
          live_venue: string;
          venue_url: string | null;
          poster_image_url: string | null;
          icon_image_url: string | null;
          additional_image_urls: string[] | null;
          official_url: string | null;
          metadata: Json | null;
          status: RowStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          tour_id?: string | null;
          title: string;
          title_ko: string;
          title_en: string;
          type: LiveType;
          start_date: string;
          end_date?: string | null;
          live_date: string;
          country: string;
          region: string;
          live_venue: string;
          venue_url?: string | null;
          poster_image_url?: string | null;
          icon_image_url?: string | null;
          additional_image_urls?: string[] | null;
          official_url?: string | null;
          metadata?: Json | null;
          status?: RowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          tour_id?: string | null;
          title?: string;
          title_ko?: string;
          title_en?: string;
          type?: LiveType;
          start_date?: string;
          end_date?: string | null;
          live_date?: string;
          country?: string;
          region?: string;
          live_venue?: string;
          venue_url?: string | null;
          poster_image_url?: string | null;
          icon_image_url?: string | null;
          additional_image_urls?: string[] | null;
          official_url?: string | null;
          metadata?: Json | null;
          status?: RowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tours: {
        Row: {
          id: string;
          slug: string;
          title: string;
          title_ko: string;
          title_en: string;
          start_date: string;
          end_date: string | null;
          poster_image_url: string | null;
          additional_image_urls: string[] | null;
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
          start_date: string;
          end_date?: string | null;
          poster_image_url?: string | null;
          additional_image_urls?: string[] | null;
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
          start_date?: string;
          end_date?: string | null;
          poster_image_url?: string | null;
          additional_image_urls?: string[] | null;
          metadata?: Json | null;
          status?: RowStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      setlists: {
        Row: {
          live_id: string;
          song_id: string;
          track_number: number;
          is_encore: boolean;
          note: Json | null;
          updated_at: string;
        };
        Insert: {
          live_id: string;
          song_id: string;
          track_number: number;
          is_encore?: boolean;
          note?: Json | null;
          updated_at?: string;
        };
        Update: {
          live_id?: string;
          song_id?: string;
          track_number?: number;
          is_encore?: boolean;
          note?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "setlists_live_id_fkey";
            columns: ["live_id"];
            isOneToOne: false;
            referencedRelation: "lives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "setlists_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
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
