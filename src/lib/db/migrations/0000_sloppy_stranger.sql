CREATE TABLE "accordi_bilaterali" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paese_iso" text NOT NULL,
	"data_inizio" date,
	"data_fine" date,
	"in_vigore" boolean DEFAULT true NOT NULL,
	"categorie" text[] DEFAULT '{}' NOT NULL,
	"condizione_temporale" text,
	"anni_dalla_residenza" integer,
	"richiede_esame_teoria" boolean DEFAULT false NOT NULL,
	"richiede_esame_pratica" boolean DEFAULT false NOT NULL,
	"reciproco" boolean DEFAULT true NOT NULL,
	"note" text,
	"riferimento_normativo" text,
	"versione_dataset" text NOT NULL,
	"fonte_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autoscuole" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"codice_fiscale" text,
	"indirizzo" text,
	"citta" text,
	"email" text NOT NULL,
	"telefono" text,
	"piano" text DEFAULT 'trial' NOT NULL,
	"piano_scadenza" timestamp with time zone,
	"attiva" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "autoscuole_codice_fiscale_unique" UNIQUE("codice_fiscale"),
	CONSTRAINT "autoscuole_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "documenti_pratica" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pratica_id" uuid NOT NULL,
	"autoscuola_id" uuid NOT NULL,
	"nome_originale" text NOT NULL,
	"tipo_documento" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"dimensione_bytes" integer,
	"caricato_da" text NOT NULL,
	"operatore_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documenti_richiesti_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zona" text,
	"paese_iso" text,
	"categoria" text,
	"tipologia_id" uuid NOT NULL,
	"obbligatorio" boolean DEFAULT true NOT NULL,
	"condizionale" text,
	"ordine" integer DEFAULT 0 NOT NULL,
	"versione_dataset" text NOT NULL,
	"attivo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fonti_normative" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL,
	"url_originale" text,
	"storage_key" text,
	"hash_contenuto" text,
	"data_acquisizione" timestamp with time zone DEFAULT now() NOT NULL,
	"versione" text NOT NULL,
	"estratto_json" jsonb,
	"diff_json" jsonb,
	"stato_review" text DEFAULT 'pending' NOT NULL,
	"note" text,
	"applicato_da" uuid,
	"applicato_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "note_pratica" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pratica_id" uuid NOT NULL,
	"operatore_id" uuid NOT NULL,
	"testo" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operatori" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"autoscuola_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"cognome" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"ruolo" text DEFAULT 'operatore' NOT NULL,
	"attivo" boolean DEFAULT true NOT NULL,
	"ultimo_accesso" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operatori_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "paesi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice_iso" text NOT NULL,
	"nome_it" text NOT NULL,
	"nome_en" text NOT NULL,
	"zona" text NOT NULL,
	"is_eu_eea" boolean DEFAULT false NOT NULL,
	"ha_accordo" boolean DEFAULT false NOT NULL,
	"accordo_id" uuid,
	"note" text,
	"versione_dataset" text NOT NULL,
	"fonte_id" uuid,
	"attivo" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paesi_codice_iso_unique" UNIQUE("codice_iso")
);
--> statement-breakpoint
CREATE TABLE "pratiche" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"autoscuola_id" uuid NOT NULL,
	"operatore_id" uuid,
	"telegram_token" text NOT NULL,
	"telegram_chat_id" text,
	"stato" text DEFAULT 'attesa_candidato' NOT NULL,
	"candidato_nome" text,
	"candidato_cognome" text,
	"candidato_nascita" date,
	"candidato_nazionalita" text,
	"candidato_lingua" text DEFAULT 'it',
	"paese_rilascio" text,
	"categoria_patente" text,
	"data_rilascio_patente" date,
	"data_scadenza_patente" date,
	"patente_valida" boolean,
	"numero_patente" text,
	"data_prima_residenza" date,
	"tipo_soggiorno" text,
	"scadenza_permesso" date,
	"classificazione" text,
	"classificazione_reasons" jsonb DEFAULT '[]'::jsonb,
	"documenti_richiesti_output" jsonb DEFAULT '[]'::jsonb,
	"info_mancanti" jsonb DEFAULT '[]'::jsonb,
	"classificazione_at" timestamp with time zone,
	"classificazione_versione" text,
	"note_operatore" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pratiche_telegram_token_unique" UNIQUE("telegram_token")
);
--> statement-breakpoint
CREATE TABLE "telegram_sessioni" (
	"chat_id" text PRIMARY KEY NOT NULL,
	"pratica_id" uuid,
	"stato_conv" text DEFAULT 'start' NOT NULL,
	"dati_raccolti" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"step_corrente" integer DEFAULT 0 NOT NULL,
	"lingua" text DEFAULT 'it' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tipologie_documento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice" text NOT NULL,
	"nome_it" text NOT NULL,
	"nome_en" text NOT NULL,
	"descrizione" text,
	"istruzioni_it" text,
	"istruzioni_en" text,
	"attivo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "tipologie_documento_codice_unique" UNIQUE("codice")
);
--> statement-breakpoint
ALTER TABLE "accordi_bilaterali" ADD CONSTRAINT "accordi_bilaterali_fonte_id_fonti_normative_id_fk" FOREIGN KEY ("fonte_id") REFERENCES "public"."fonti_normative"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documenti_pratica" ADD CONSTRAINT "documenti_pratica_pratica_id_pratiche_id_fk" FOREIGN KEY ("pratica_id") REFERENCES "public"."pratiche"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documenti_pratica" ADD CONSTRAINT "documenti_pratica_autoscuola_id_autoscuole_id_fk" FOREIGN KEY ("autoscuola_id") REFERENCES "public"."autoscuole"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documenti_pratica" ADD CONSTRAINT "documenti_pratica_operatore_id_operatori_id_fk" FOREIGN KEY ("operatore_id") REFERENCES "public"."operatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documenti_richiesti_config" ADD CONSTRAINT "documenti_richiesti_config_tipologia_id_tipologie_documento_id_fk" FOREIGN KEY ("tipologia_id") REFERENCES "public"."tipologie_documento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_pratica" ADD CONSTRAINT "note_pratica_pratica_id_pratiche_id_fk" FOREIGN KEY ("pratica_id") REFERENCES "public"."pratiche"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_pratica" ADD CONSTRAINT "note_pratica_operatore_id_operatori_id_fk" FOREIGN KEY ("operatore_id") REFERENCES "public"."operatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operatori" ADD CONSTRAINT "operatori_autoscuola_id_autoscuole_id_fk" FOREIGN KEY ("autoscuola_id") REFERENCES "public"."autoscuole"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paesi" ADD CONSTRAINT "paesi_fonte_id_fonti_normative_id_fk" FOREIGN KEY ("fonte_id") REFERENCES "public"."fonti_normative"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pratiche" ADD CONSTRAINT "pratiche_autoscuola_id_autoscuole_id_fk" FOREIGN KEY ("autoscuola_id") REFERENCES "public"."autoscuole"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pratiche" ADD CONSTRAINT "pratiche_operatore_id_operatori_id_fk" FOREIGN KEY ("operatore_id") REFERENCES "public"."operatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_sessioni" ADD CONSTRAINT "telegram_sessioni_pratica_id_pratiche_id_fk" FOREIGN KEY ("pratica_id") REFERENCES "public"."pratiche"("id") ON DELETE cascade ON UPDATE no action;