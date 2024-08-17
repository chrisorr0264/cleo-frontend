--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3 (Debian 16.3-1.pgdg120+1)
-- Dumped by pg_dump version 16.3 (Ubuntu 16.3-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: tbl_face_locations; Type: TABLE; Schema: public; Owner: bazinga
--

CREATE TABLE public.tbl_face_locations (
    id integer NOT NULL,
    media_object_id integer,
    top integer,
    "right" integer,
    bottom integer,
    "left" integer,
    encoding bytea,
    created_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_invalid boolean DEFAULT false
);


ALTER TABLE public.tbl_face_locations OWNER TO bazinga;

--
-- Name: tbl_face_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: bazinga
--

CREATE SEQUENCE public.tbl_face_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_face_locations_id_seq OWNER TO bazinga;

--
-- Name: tbl_face_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bazinga
--

ALTER SEQUENCE public.tbl_face_locations_id_seq OWNED BY public.tbl_face_locations.id;


--
-- Name: tbl_face_matches; Type: TABLE; Schema: public; Owner: bazinga
--

CREATE TABLE public.tbl_face_matches (
    id integer NOT NULL,
    face_location_id integer,
    known_face_id integer,
    face_name character varying(255),
    is_invalid boolean DEFAULT false,
    created_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tbl_face_matches OWNER TO bazinga;

--
-- Name: tbl_face_matches_id_seq; Type: SEQUENCE; Schema: public; Owner: bazinga
--

CREATE SEQUENCE public.tbl_face_matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_face_matches_id_seq OWNER TO bazinga;

--
-- Name: tbl_face_matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bazinga
--

ALTER SEQUENCE public.tbl_face_matches_id_seq OWNED BY public.tbl_face_matches.id;


--
-- Name: tbl_identities; Type: TABLE; Schema: public; Owner: bazinga
--

CREATE TABLE public.tbl_identities (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tbl_identities OWNER TO bazinga;

--
-- Name: tbl_identities_id_seq; Type: SEQUENCE; Schema: public; Owner: bazinga
--

CREATE SEQUENCE public.tbl_identities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_identities_id_seq OWNER TO bazinga;

--
-- Name: tbl_identities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bazinga
--

ALTER SEQUENCE public.tbl_identities_id_seq OWNED BY public.tbl_identities.id;


--
-- Name: tbl_image_tensors; Type: TABLE; Schema: public; Owner: bazinga
--

CREATE TABLE public.tbl_image_tensors (
    id integer NOT NULL,
    filename text NOT NULL,
    tensor_shape text,
    tensor_pil bytea,
    hash_pil text,
    tensor_cv2 bytea,
    hash_cv2 text
);


ALTER TABLE public.tbl_image_tensors OWNER TO bazinga;

--
-- Name: tbl_image_tensors_id_seq; Type: SEQUENCE; Schema: public; Owner: bazinga
--

CREATE SEQUENCE public.tbl_image_tensors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_image_tensors_id_seq OWNER TO bazinga;

--
-- Name: tbl_image_tensors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bazinga
--

ALTER SEQUENCE public.tbl_image_tensors_id_seq OWNED BY public.tbl_image_tensors.id;


--
-- Name: tbl_known_faces; Type: TABLE; Schema: public; Owner: bazinga
--

CREATE TABLE public.tbl_known_faces (
    id integer NOT NULL,
    encoding bytea NOT NULL,
    identity_id integer
);


ALTER TABLE public.tbl_known_faces OWNER TO bazinga;

--
-- Name: tbl_known_faces_id_seq; Type: SEQUENCE; Schema: public; Owner: bazinga
--

CREATE SEQUENCE public.tbl_known_faces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_known_faces_id_seq OWNER TO bazinga;

--
-- Name: tbl_known_faces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bazinga
--

ALTER SEQUENCE public.tbl_known_faces_id_seq OWNED BY public.tbl_known_faces.id;


--
-- Name: tbl_media_metadata; Type: TABLE; Schema: public; Owner: bazinga
--

CREATE TABLE public.tbl_media_metadata (
    media_metadata_id integer NOT NULL,
    media_object_id integer NOT NULL,
    exif_tag character varying(60),
    exif_data character varying(255),
    created_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(30),
    created_ip character varying(20)
);


ALTER TABLE public.tbl_media_metadata OWNER TO bazinga;

--
-- Name: tbl_media_metadata_media_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: bazinga
--

CREATE SEQUENCE public.tbl_media_metadata_media_metadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_media_metadata_media_metadata_id_seq OWNER TO bazinga;

--
-- Name: tbl_media_metadata_media_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bazinga
--

ALTER SEQUENCE public.tbl_media_metadata_media_metadata_id_seq OWNED BY public.tbl_media_metadata.media_metadata_id;


--
-- Name: tbl_media_objects; Type: TABLE; Schema: public; Owner: bazinga
--

CREATE TABLE public.tbl_media_objects (
    media_object_id integer NOT NULL,
    orig_name character varying(120) NOT NULL,
    new_name character varying(30),
    new_path character varying(120),
    media_type character varying(20),
    media_create_date timestamp without time zone,
    location_class character varying(60),
    location_type character varying(60),
    location_name character varying(200),
    location_display_name character varying(200),
    location_city character varying(60),
    location_province character varying(60),
    location_country character varying(60),
    is_secret boolean DEFAULT false,
    created_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(120),
    created_ip character varying(20),
    is_active boolean DEFAULT true,
    image_tensor_id integer,
    movie_hash_id integer,
    latitude double precision,
    longitude double precision,
    width integer,
    height integer
);


ALTER TABLE public.tbl_media_objects OWNER TO bazinga;

--
-- Name: tbl_media_objects_media_object_id_seq; Type: SEQUENCE; Schema: public; Owner: bazinga
--

CREATE SEQUENCE public.tbl_media_objects_media_object_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_media_objects_media_object_id_seq OWNER TO bazinga;

--
-- Name: tbl_media_objects_media_object_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bazinga
--

ALTER SEQUENCE public.tbl_media_objects_media_object_id_seq OWNED BY public.tbl_media_objects.media_object_id;


--
-- Name: tbl_movie_hashes; Type: TABLE; Schema: public; Owner: bazinga
--

CREATE TABLE public.tbl_movie_hashes (
    id integer NOT NULL,
    filename text NOT NULL,
    media_hash text
);


ALTER TABLE public.tbl_movie_hashes OWNER TO bazinga;

--
-- Name: tbl_movie_hashes_id_seq; Type: SEQUENCE; Schema: public; Owner: bazinga
--

CREATE SEQUENCE public.tbl_movie_hashes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_movie_hashes_id_seq OWNER TO bazinga;

--
-- Name: tbl_movie_hashes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bazinga
--

ALTER SEQUENCE public.tbl_movie_hashes_id_seq OWNED BY public.tbl_movie_hashes.id;


--
-- Name: tbl_tags; Type: TABLE; Schema: public; Owner: bazinga
--

CREATE TABLE public.tbl_tags (
    tag_id integer NOT NULL,
    tag_name character varying(60) NOT NULL,
    tag_desc character varying(120),
    created_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(30),
    created_ip character varying(20)
);


ALTER TABLE public.tbl_tags OWNER TO bazinga;

--
-- Name: tbl_tags_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: bazinga
--

CREATE SEQUENCE public.tbl_tags_tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_tags_tag_id_seq OWNER TO bazinga;

--
-- Name: tbl_tags_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bazinga
--

ALTER SEQUENCE public.tbl_tags_tag_id_seq OWNED BY public.tbl_tags.tag_id;


--
-- Name: tbl_tags_to_media; Type: TABLE; Schema: public; Owner: bazinga
--

CREATE TABLE public.tbl_tags_to_media (
    tags_to_media_id integer NOT NULL,
    media_object_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.tbl_tags_to_media OWNER TO bazinga;

--
-- Name: tbl_tags_to_media_tags_to_media_id_seq; Type: SEQUENCE; Schema: public; Owner: bazinga
--

CREATE SEQUENCE public.tbl_tags_to_media_tags_to_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbl_tags_to_media_tags_to_media_id_seq OWNER TO bazinga;

--
-- Name: tbl_tags_to_media_tags_to_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: bazinga
--

ALTER SEQUENCE public.tbl_tags_to_media_tags_to_media_id_seq OWNED BY public.tbl_tags_to_media.tags_to_media_id;


--
-- Name: tbl_face_locations id; Type: DEFAULT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_face_locations ALTER COLUMN id SET DEFAULT nextval('public.tbl_face_locations_id_seq'::regclass);


--
-- Name: tbl_face_matches id; Type: DEFAULT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_face_matches ALTER COLUMN id SET DEFAULT nextval('public.tbl_face_matches_id_seq'::regclass);


--
-- Name: tbl_identities id; Type: DEFAULT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_identities ALTER COLUMN id SET DEFAULT nextval('public.tbl_identities_id_seq'::regclass);


--
-- Name: tbl_image_tensors id; Type: DEFAULT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_image_tensors ALTER COLUMN id SET DEFAULT nextval('public.tbl_image_tensors_id_seq'::regclass);


--
-- Name: tbl_known_faces id; Type: DEFAULT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_known_faces ALTER COLUMN id SET DEFAULT nextval('public.tbl_known_faces_id_seq'::regclass);


--
-- Name: tbl_media_metadata media_metadata_id; Type: DEFAULT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_media_metadata ALTER COLUMN media_metadata_id SET DEFAULT nextval('public.tbl_media_metadata_media_metadata_id_seq'::regclass);


--
-- Name: tbl_media_objects media_object_id; Type: DEFAULT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_media_objects ALTER COLUMN media_object_id SET DEFAULT nextval('public.tbl_media_objects_media_object_id_seq'::regclass);


--
-- Name: tbl_movie_hashes id; Type: DEFAULT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_movie_hashes ALTER COLUMN id SET DEFAULT nextval('public.tbl_movie_hashes_id_seq'::regclass);


--
-- Name: tbl_tags tag_id; Type: DEFAULT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_tags ALTER COLUMN tag_id SET DEFAULT nextval('public.tbl_tags_tag_id_seq'::regclass);


--
-- Name: tbl_tags_to_media tags_to_media_id; Type: DEFAULT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_tags_to_media ALTER COLUMN tags_to_media_id SET DEFAULT nextval('public.tbl_tags_to_media_tags_to_media_id_seq'::regclass);


--
-- Name: tbl_face_locations tbl_face_locations_media_object_id_top_right_bottom_left_key; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_face_locations
    ADD CONSTRAINT tbl_face_locations_media_object_id_top_right_bottom_left_key UNIQUE (media_object_id, top, "right", bottom, "left");


--
-- Name: tbl_face_locations tbl_face_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_face_locations
    ADD CONSTRAINT tbl_face_locations_pkey PRIMARY KEY (id);


--
-- Name: tbl_face_matches tbl_face_matches_face_location_id_known_face_id_key; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_face_matches
    ADD CONSTRAINT tbl_face_matches_face_location_id_known_face_id_key UNIQUE (face_location_id, known_face_id);


--
-- Name: tbl_face_matches tbl_face_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_face_matches
    ADD CONSTRAINT tbl_face_matches_pkey PRIMARY KEY (id);


--
-- Name: tbl_identities tbl_identities_name_key; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_identities
    ADD CONSTRAINT tbl_identities_name_key UNIQUE (name);


--
-- Name: tbl_identities tbl_identities_pkey; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_identities
    ADD CONSTRAINT tbl_identities_pkey PRIMARY KEY (id);


--
-- Name: tbl_image_tensors tbl_image_tensors_pkey; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_image_tensors
    ADD CONSTRAINT tbl_image_tensors_pkey PRIMARY KEY (id);


--
-- Name: tbl_known_faces tbl_known_faces_pkey; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_known_faces
    ADD CONSTRAINT tbl_known_faces_pkey PRIMARY KEY (id);


--
-- Name: tbl_media_metadata tbl_media_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_media_metadata
    ADD CONSTRAINT tbl_media_metadata_pkey PRIMARY KEY (media_metadata_id);


--
-- Name: tbl_media_objects tbl_media_objects_pkey; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_media_objects
    ADD CONSTRAINT tbl_media_objects_pkey PRIMARY KEY (media_object_id);


--
-- Name: tbl_movie_hashes tbl_movie_hashes_pkey; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_movie_hashes
    ADD CONSTRAINT tbl_movie_hashes_pkey PRIMARY KEY (id);


--
-- Name: tbl_tags tbl_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_tags
    ADD CONSTRAINT tbl_tags_pkey PRIMARY KEY (tag_id);


--
-- Name: tbl_tags tbl_tags_tag_name_key; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_tags
    ADD CONSTRAINT tbl_tags_tag_name_key UNIQUE (tag_name);


--
-- Name: tbl_tags_to_media tbl_tags_to_media_media_object_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_tags_to_media
    ADD CONSTRAINT tbl_tags_to_media_media_object_id_tag_id_key UNIQUE (media_object_id, tag_id);


--
-- Name: tbl_tags_to_media tbl_tags_to_media_pkey; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_tags_to_media
    ADD CONSTRAINT tbl_tags_to_media_pkey PRIMARY KEY (tags_to_media_id);


--
-- Name: tbl_known_faces unique_identity_encoding; Type: CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_known_faces
    ADD CONSTRAINT unique_identity_encoding UNIQUE (identity_id, encoding);


--
-- Name: idx_face_location_id; Type: INDEX; Schema: public; Owner: bazinga
--

CREATE INDEX idx_face_location_id ON public.tbl_face_matches USING btree (face_location_id);


--
-- Name: idx_known_face_id; Type: INDEX; Schema: public; Owner: bazinga
--

CREATE INDEX idx_known_face_id ON public.tbl_face_matches USING btree (known_face_id);


--
-- Name: idx_media_object_id; Type: INDEX; Schema: public; Owner: bazinga
--

CREATE INDEX idx_media_object_id ON public.tbl_face_locations USING btree (media_object_id);


--
-- Name: tbl_face_locations tbl_face_locations_media_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_face_locations
    ADD CONSTRAINT tbl_face_locations_media_object_id_fkey FOREIGN KEY (media_object_id) REFERENCES public.tbl_media_objects(media_object_id) ON DELETE CASCADE;


--
-- Name: tbl_face_matches tbl_face_matches_face_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_face_matches
    ADD CONSTRAINT tbl_face_matches_face_location_id_fkey FOREIGN KEY (face_location_id) REFERENCES public.tbl_face_locations(id) ON DELETE CASCADE;


--
-- Name: tbl_known_faces tbl_known_faces_identity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_known_faces
    ADD CONSTRAINT tbl_known_faces_identity_id_fkey FOREIGN KEY (identity_id) REFERENCES public.tbl_identities(id) ON DELETE CASCADE;


--
-- Name: tbl_media_metadata tbl_media_metadata_media_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_media_metadata
    ADD CONSTRAINT tbl_media_metadata_media_object_id_fkey FOREIGN KEY (media_object_id) REFERENCES public.tbl_media_objects(media_object_id) ON DELETE CASCADE;


--
-- Name: tbl_media_objects tbl_media_objects_image_tensor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_media_objects
    ADD CONSTRAINT tbl_media_objects_image_tensor_id_fkey FOREIGN KEY (image_tensor_id) REFERENCES public.tbl_image_tensors(id) ON DELETE SET NULL;


--
-- Name: tbl_media_objects tbl_media_objects_movie_hash_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_media_objects
    ADD CONSTRAINT tbl_media_objects_movie_hash_id_fkey FOREIGN KEY (movie_hash_id) REFERENCES public.tbl_movie_hashes(id) ON DELETE SET NULL;


--
-- Name: tbl_tags_to_media tbl_tags_to_media_media_object_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_tags_to_media
    ADD CONSTRAINT tbl_tags_to_media_media_object_id_fkey FOREIGN KEY (media_object_id) REFERENCES public.tbl_media_objects(media_object_id) ON DELETE CASCADE;


--
-- Name: tbl_tags_to_media tbl_tags_to_media_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: bazinga
--

ALTER TABLE ONLY public.tbl_tags_to_media
    ADD CONSTRAINT tbl_tags_to_media_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tbl_tags(tag_id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO mediauser;


--
-- Name: TABLE tbl_face_locations; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON TABLE public.tbl_face_locations TO mediauser;


--
-- Name: SEQUENCE tbl_face_locations_id_seq; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON SEQUENCE public.tbl_face_locations_id_seq TO mediauser;


--
-- Name: TABLE tbl_face_matches; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON TABLE public.tbl_face_matches TO mediauser;


--
-- Name: SEQUENCE tbl_face_matches_id_seq; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON SEQUENCE public.tbl_face_matches_id_seq TO mediauser;


--
-- Name: TABLE tbl_identities; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON TABLE public.tbl_identities TO mediauser;


--
-- Name: SEQUENCE tbl_identities_id_seq; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON SEQUENCE public.tbl_identities_id_seq TO mediauser;


--
-- Name: TABLE tbl_image_tensors; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON TABLE public.tbl_image_tensors TO mediauser;


--
-- Name: SEQUENCE tbl_image_tensors_id_seq; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON SEQUENCE public.tbl_image_tensors_id_seq TO mediauser;


--
-- Name: TABLE tbl_known_faces; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON TABLE public.tbl_known_faces TO mediauser;


--
-- Name: SEQUENCE tbl_known_faces_id_seq; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON SEQUENCE public.tbl_known_faces_id_seq TO mediauser;


--
-- Name: TABLE tbl_media_metadata; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON TABLE public.tbl_media_metadata TO mediauser;


--
-- Name: SEQUENCE tbl_media_metadata_media_metadata_id_seq; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON SEQUENCE public.tbl_media_metadata_media_metadata_id_seq TO mediauser;


--
-- Name: TABLE tbl_media_objects; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON TABLE public.tbl_media_objects TO mediauser;


--
-- Name: SEQUENCE tbl_media_objects_media_object_id_seq; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON SEQUENCE public.tbl_media_objects_media_object_id_seq TO mediauser;


--
-- Name: TABLE tbl_movie_hashes; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON TABLE public.tbl_movie_hashes TO mediauser;


--
-- Name: SEQUENCE tbl_movie_hashes_id_seq; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON SEQUENCE public.tbl_movie_hashes_id_seq TO mediauser;


--
-- Name: TABLE tbl_tags; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON TABLE public.tbl_tags TO mediauser;


--
-- Name: SEQUENCE tbl_tags_tag_id_seq; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON SEQUENCE public.tbl_tags_tag_id_seq TO mediauser;


--
-- Name: TABLE tbl_tags_to_media; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON TABLE public.tbl_tags_to_media TO mediauser;


--
-- Name: SEQUENCE tbl_tags_to_media_tags_to_media_id_seq; Type: ACL; Schema: public; Owner: bazinga
--

GRANT ALL ON SEQUENCE public.tbl_tags_to_media_tags_to_media_id_seq TO mediauser;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: bazinga
--

ALTER DEFAULT PRIVILEGES FOR ROLE bazinga IN SCHEMA public GRANT ALL ON SEQUENCES TO mediauser;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: bazinga
--

ALTER DEFAULT PRIVILEGES FOR ROLE bazinga IN SCHEMA public GRANT ALL ON TABLES TO mediauser;


--
-- PostgreSQL database dump complete
--

