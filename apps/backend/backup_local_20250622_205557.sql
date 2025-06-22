--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 15.13 (Debian 15.13-1.pgdg120+1)

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

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgres
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: postgres
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE drizzle.__drizzle_migrations_id_seq OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: postgres
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actions (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    challenge_id integer NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    points_value integer DEFAULT 10 NOT NULL
);


ALTER TABLE public.actions OWNER TO postgres;

--
-- Name: actions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.actions_id_seq OWNER TO postgres;

--
-- Name: actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actions_id_seq OWNED BY public.actions.id;


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaigns (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.campaigns OWNER TO postgres;

--
-- Name: campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.campaigns_id_seq OWNER TO postgres;

--
-- Name: campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.campaigns_id_seq OWNED BY public.campaigns.id;


--
-- Name: challenges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.challenges (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    date date NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.challenges OWNER TO postgres;

--
-- Name: challenges_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.challenges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.challenges_id_seq OWNER TO postgres;

--
-- Name: challenges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.challenges_id_seq OWNED BY public.challenges.id;


--
-- Name: user_actions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_actions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action_id integer NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    completed_at timestamp without time zone,
    proof_url character varying(500),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    challenge_id integer NOT NULL
);


ALTER TABLE public.user_actions OWNER TO postgres;

--
-- Name: user_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_actions_id_seq OWNER TO postgres;

--
-- Name: user_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_actions_id_seq OWNED BY public.user_actions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'fbo'::character varying NOT NULL,
    manager_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: actions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions ALTER COLUMN id SET DEFAULT nextval('public.actions_id_seq'::regclass);


--
-- Name: campaigns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns ALTER COLUMN id SET DEFAULT nextval('public.campaigns_id_seq'::regclass);


--
-- Name: challenges id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.challenges ALTER COLUMN id SET DEFAULT nextval('public.challenges_id_seq'::regclass);


--
-- Name: user_actions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_actions ALTER COLUMN id SET DEFAULT nextval('public.user_actions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
2	5993a237375f2e2ed97258903f63f9ae0f23207d1390ce6b3487cbf6c2ea7f01	1750527229439
\.


--
-- Data for Name: actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actions (id, title, description, type, created_at, updated_at, challenge_id, "order", points_value) FROM stdin;
10	Appel prospection client	Contacter 3 prospects qualifiés pour présenter nos produits Aloe Vera	vente	2025-06-22 08:31:21.591696	2025-06-22 08:31:21.591696	1	1	10
11	Partage réseau social	Publier un témoignage client sur Instagram avec hashtags #ForeverLiving #AloeVera	reseaux_sociaux	2025-06-22 08:31:21.593102	2025-06-22 08:31:21.593102	1	2	10
12	Invitation événement	Inviter 2 personnes à la prochaine présentation produit	recrutement	2025-06-22 08:31:21.594415	2025-06-22 08:31:21.594415	1	3	10
13	test	test	vente	2025-06-22 11:23:48.522114	2025-06-22 11:23:48.522114	7	1	10
14	test	test	vente	2025-06-22 11:48:58.013263	2025-06-22 11:48:58.013263	8	1	50
15	test	test	recrutement	2025-06-22 11:48:58.024889	2025-06-22 11:48:58.024889	8	2	50
19	test	test	vente	2025-06-22 11:56:21.002161	2025-06-22 11:56:21.002161	9	1	50
20	test	test	recrutement	2025-06-22 11:56:21.008139	2025-06-22 11:56:21.008139	9	2	50
21	test	test	reseaux_sociaux	2025-06-22 11:56:21.020513	2025-06-22 11:56:21.020513	9	3	75
22	test	test	vente	2025-06-22 18:27:21.998347	2025-06-22 18:27:21.998347	10	1	50
24	test	test	vente	2025-06-22 18:50:05.187117	2025-06-22 18:50:05.187117	11	1	50
25	test	test	vente	2025-06-22 18:50:05.196032	2025-06-22 18:50:05.196032	11	2	50
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campaigns (id, name, description, start_date, end_date, status, created_by, created_at, updated_at) FROM stdin;
1	Les défis de l'été de la Happy Team	Campagne de défis pour booster l'activité pendant l'été 2025	2025-07-07	2025-08-31	active	25	2025-06-22 08:31:21.588885	2025-06-22 08:31:21.588885
6	Défis de l'été 2025	Une campagne pour vous booster cet été. 	2025-07-07	2025-08-31	draft	25	2025-06-22 10:05:06.570315	2025-06-22 10:05:06.570315
7	test	test	2025-06-23	2025-06-29	draft	25	2025-06-22 18:27:05.985749	2025-06-22 18:27:05.985749
\.


--
-- Data for Name: challenges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.challenges (id, campaign_id, date, title, description, created_at, updated_at) FROM stdin;
1	1	2025-06-22	Défi du 2025-06-22	Trois actions pour booster votre activité aujourd'hui	2025-06-22 08:31:21.590235	2025-06-22 08:31:21.590235
2	6	2025-07-07	Prospection	Parler à 3 personnes de l'opportunité	2025-06-22 10:14:49.008726	2025-06-22 10:14:49.008726
3	6	2025-07-09	test	test	2025-06-22 10:40:57.495911	2025-06-22 10:40:57.495911
4	6	2025-07-10	top	test	2025-06-22 10:41:05.808956	2025-06-22 10:41:05.808956
5	6	2025-07-11	test	test	2025-06-22 11:18:43.016656	2025-06-22 11:18:43.016656
6	6	2025-07-12	test	test	2025-06-22 11:22:22.813684	2025-06-22 11:22:22.813684
7	6	2025-07-13	test	test	2025-06-22 11:23:48.503209	2025-06-22 11:23:48.503209
8	6	2025-07-14	test	test	2025-06-22 11:48:57.99184	2025-06-22 11:48:57.99184
9	6	2025-07-16	test	test modifié	2025-06-22 11:56:07.56704	2025-06-22 11:56:20.932
10	7	2025-06-23	test	test	2025-06-22 18:27:21.977732	2025-06-22 18:27:21.977732
11	7	2025-06-24	test	test	2025-06-22 18:49:55.052825	2025-06-22 18:50:05.152
\.


--
-- Data for Name: user_actions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_actions (id, user_id, action_id, completed, completed_at, proof_url, created_at, updated_at, challenge_id) FROM stdin;
19	29	10	f	\N	\N	2025-06-22 08:31:21.595789	2025-06-22 08:31:21.595789	1
20	29	11	f	\N	\N	2025-06-22 08:31:21.595789	2025-06-22 08:31:21.595789	1
21	29	12	f	\N	\N	2025-06-22 08:31:21.595789	2025-06-22 08:31:21.595789	1
22	30	10	f	\N	\N	2025-06-22 08:31:21.595789	2025-06-22 08:31:21.595789	1
23	30	11	f	\N	\N	2025-06-22 08:31:21.595789	2025-06-22 08:31:21.595789	1
24	30	12	f	\N	\N	2025-06-22 08:31:21.595789	2025-06-22 08:31:21.595789	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, created_at, updated_at, password, role, manager_id) FROM stdin;
25	Aurélia	aurelia@htf.com	2025-06-22 08:31:21.57543	2025-06-22 08:31:21.57543	$2a$10$OEZWJVry57qla49AGHQjlOr9/BSA2bttfG7JGRWMoZ4lWQ1MvTI/.	marraine	\N
26	Jéromine	jeromine@htf.com	2025-06-22 08:31:21.581172	2025-06-22 08:31:21.581172	$2a$10$OEZWJVry57qla49AGHQjlOr9/BSA2bttfG7JGRWMoZ4lWQ1MvTI/.	manager	\N
27	Gaëlle	gaelle@htf.com	2025-06-22 08:31:21.58292	2025-06-22 08:31:21.58292	$2a$10$OEZWJVry57qla49AGHQjlOr9/BSA2bttfG7JGRWMoZ4lWQ1MvTI/.	manager	\N
28	Audrey	audrey@htf.com	2025-06-22 08:31:21.584367	2025-06-22 08:31:21.584367	$2a$10$OEZWJVry57qla49AGHQjlOr9/BSA2bttfG7JGRWMoZ4lWQ1MvTI/.	manager	\N
29	Marie Dupont	marie@htf.com	2025-06-22 08:31:21.585592	2025-06-22 08:31:21.585592	$2a$10$OEZWJVry57qla49AGHQjlOr9/BSA2bttfG7JGRWMoZ4lWQ1MvTI/.	fbo	26
30	Pierre Martin	pierre@htf.com	2025-06-22 08:31:21.586799	2025-06-22 08:31:21.586799	$2a$10$OEZWJVry57qla49AGHQjlOr9/BSA2bttfG7JGRWMoZ4lWQ1MvTI/.	fbo	26
31	Sophie Bernard	sophie@htf.com	2025-06-22 08:31:21.587762	2025-06-22 08:31:21.587762	$2a$10$OEZWJVry57qla49AGHQjlOr9/BSA2bttfG7JGRWMoZ4lWQ1MvTI/.	fbo	27
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 2, true);


--
-- Name: actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actions_id_seq', 25, true);


--
-- Name: campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.campaigns_id_seq', 7, true);


--
-- Name: challenges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.challenges_id_seq', 11, true);


--
-- Name: user_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_actions_id_seq', 24, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 31, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: actions actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: challenges challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_pkey PRIMARY KEY (id);


--
-- Name: user_actions user_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_actions
    ADD CONSTRAINT user_actions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: actions actions_challenge_id_challenges_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_challenge_id_challenges_id_fk FOREIGN KEY (challenge_id) REFERENCES public.challenges(id);


--
-- Name: campaigns campaigns_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: challenges challenges_campaign_id_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.challenges
    ADD CONSTRAINT challenges_campaign_id_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: user_actions user_actions_action_id_actions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_actions
    ADD CONSTRAINT user_actions_action_id_actions_id_fk FOREIGN KEY (action_id) REFERENCES public.actions(id);


--
-- Name: user_actions user_actions_challenge_id_challenges_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_actions
    ADD CONSTRAINT user_actions_challenge_id_challenges_id_fk FOREIGN KEY (challenge_id) REFERENCES public.challenges(id);


--
-- Name: user_actions user_actions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_actions
    ADD CONSTRAINT user_actions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_manager_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_manager_id_users_id_fk FOREIGN KEY (manager_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

