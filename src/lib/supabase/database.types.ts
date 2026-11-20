export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AlbumType = "FULL" | "MINI" | "EP";
type RowStatus = "ACTIVE" | "PENDING" | "HIDDEN" | "DELETED";
// lives만 취소된 공연(CANCELED)을 허용한다 — 20261114000000_add_live_canceled_status.sql
type LiveStatus = RowStatus | "CANCELED";
type LiveType = "FESTIVAL" | "CONCERT" | "EVENT";

export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          aliases: string[];
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
          aliases?: string[];
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
          aliases?: string[];
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
          aliases: string[];
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
          aliases?: string[];
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
          aliases?: string[];
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
          aliases: string[];
          id: string;
          slug: string | null;
          tour_id: string | null;
          title: string;
          title_ko: string | null;
          title_en: string | null;
          type: LiveType;
          start_date: string;
          end_date: string | null;
          live_date: string | null;
          /** 날짜로 안 정해지는 공연일만 직접 지정하는 투어 세트리스트 판 */
          setlist_version_id: string | null;
          country: string;
          region: string;
          live_venue: string;
          venue_url: string | null;
          poster_image_url: string | null;
          icon_image_url: string | null;
          additional_image_urls: string[] | null;
          official_url: string | null;
          metadata: Json | null;
          status: LiveStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          aliases?: string[];
          id?: string;
          slug?: string | null;
          tour_id?: string | null;
          title: string;
          title_ko?: string | null;
          title_en?: string | null;
          type: LiveType;
          start_date: string;
          end_date?: string | null;
          live_date?: string | null;
          setlist_version_id?: string | null;
          country: string;
          region: string;
          live_venue: string;
          venue_url?: string | null;
          poster_image_url?: string | null;
          icon_image_url?: string | null;
          additional_image_urls?: string[] | null;
          official_url?: string | null;
          metadata?: Json | null;
          status?: LiveStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          aliases?: string[];
          id?: string;
          slug?: string | null;
          tour_id?: string | null;
          title?: string;
          title_ko?: string | null;
          title_en?: string | null;
          type?: LiveType;
          start_date?: string;
          end_date?: string | null;
          live_date?: string | null;
          setlist_version_id?: string | null;
          country?: string;
          region?: string;
          live_venue?: string;
          venue_url?: string | null;
          poster_image_url?: string | null;
          icon_image_url?: string | null;
          additional_image_urls?: string[] | null;
          official_url?: string | null;
          metadata?: Json | null;
          status?: LiveStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tours: {
        Row: {
          aliases: string[];
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
          aliases?: string[];
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
          aliases?: string[];
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
          id: string;
          live_id: string | null;
          tour_id: string | null;
          song_id: string | null;
          track_number: number;
          is_encore: boolean;
          note: Json | null;
          updated_at: string;
          day_number: number | null;
          show_number: number | null;
          /** 투어 공통 행의 판(tour_setlist_versions) — 투어 공통 행은 반드시 판에 속한다 */
          version_id: string | null;
          /** 공연일 행에서만 — true면 판의 이 곡을 그날 세트리스트에서 뺀다 */
          omitted: boolean;
        };
        Insert: {
          id?: string;
          live_id?: string | null;
          tour_id?: string | null;
          song_id?: string | null;
          track_number: number;
          is_encore?: boolean;
          note?: Json | null;
          updated_at?: string;
          day_number?: number | null;
          show_number?: number | null;
          version_id?: string | null;
          omitted?: boolean;
        };
        Update: {
          id?: string;
          live_id?: string | null;
          tour_id?: string | null;
          song_id?: string | null;
          track_number?: number;
          is_encore?: boolean;
          note?: Json | null;
          updated_at?: string;
          day_number?: number | null;
          show_number?: number | null;
          version_id?: string | null;
          omitted?: boolean;
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
            foreignKeyName: "setlists_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
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
      /** 투어 세트리스트 판 — starts_on부터 다음 판 전날까지의 공연일에 적용 */
      tour_setlist_versions: {
        Row: {
          id: string;
          tour_id: string;
          starts_on: string;
          label: string | null;
          /** 선택곡 없는 고정 세트리스트 — 공연일 행이 없어도 세트리스트를 안다 */
          fixed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tour_id: string;
          starts_on: string;
          label?: string | null;
          fixed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tour_id?: string;
          starts_on?: string;
          label?: string | null;
          fixed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tour_setlist_versions_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
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
