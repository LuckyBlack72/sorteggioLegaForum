-- Schema --
CREATE SCHEMA legaforum;

-- sequence per id Sorteggio --
CREATE SEQUENCE legaforum.sorteggio_id_seq
    INCREMENT 1
    START 1000
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

-- tabella Sorteggio --
CREATE TABLE legaforum.sorteggio
(
    id bigint NOT NULL DEFAULT nextval('legaforum.sorteggio_id_seq'::regclass),
    allenatore character varying(255) COLLATE pg_catalog."default",
    fascia character varying(255) COLLATE pg_catalog."default",
    girone character varying(255) COLLATE pg_catalog."default",
    ods integer,
    ranking integer,
    serie character varying(255) COLLATE pg_catalog."default",
    squadra character varying(255) COLLATE pg_catalog."default",
    stagione integer,
    CONSTRAINT sorteggio_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

-- tabella password --
CREATE TABLE legaforum.password
(
    password character varying(50) COLLATE pg_catalog."default"
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;