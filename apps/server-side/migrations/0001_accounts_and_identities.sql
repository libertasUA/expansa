CREATE TABLE "platform"."accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."identities" (
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"secret" text,
	"account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identities_provider_external_id_pk" PRIMARY KEY("provider","external_id")
);
--> statement-breakpoint
ALTER TABLE "platform"."identities" ADD CONSTRAINT "identities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "platform"."accounts"("id") ON DELETE cascade ON UPDATE no action;