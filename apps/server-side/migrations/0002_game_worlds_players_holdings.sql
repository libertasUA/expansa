CREATE SCHEMA "game";
--> statement-breakpoint
CREATE TABLE "game"."holdings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"world_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"checkpoint_at" timestamp with time zone NOT NULL,
	"quantities" jsonb NOT NULL,
	CONSTRAINT "holdings_world_id_player_id_kind_unique" UNIQUE("world_id","player_id","kind")
);
--> statement-breakpoint
CREATE TABLE "game"."players" (
	"id" uuid PRIMARY KEY NOT NULL,
	"world_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_world_id_account_id_unique" UNIQUE("world_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "game"."synthesis_orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"holding_id" uuid NOT NULL,
	"fuel" integer NOT NULL,
	"ordered_at" timestamp with time zone NOT NULL,
	"completes_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game"."worlds" (
	"id" uuid PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "game"."holdings" ADD CONSTRAINT "holdings_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."holdings" ADD CONSTRAINT "holdings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "game"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."players" ADD CONSTRAINT "players_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "game"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."players" ADD CONSTRAINT "players_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "platform"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game"."synthesis_orders" ADD CONSTRAINT "synthesis_orders_holding_id_holdings_id_fk" FOREIGN KEY ("holding_id") REFERENCES "game"."holdings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "synthesis_orders_completes_at_idx" ON "game"."synthesis_orders" USING btree ("completes_at");--> statement-breakpoint
CREATE INDEX "synthesis_orders_holding_idx" ON "game"."synthesis_orders" USING btree ("holding_id");--> statement-breakpoint
-- Hand-written, below the generated statements: drizzle-kit emits schema, and a
-- world is data. It lives in this file rather than its own because it is the
-- reason the table is not empty on a fresh database — the server refuses to serve
-- an ark without a live world, and a first run should not need a second command.
--
-- The id is fixed rather than generated, so every developer's database names the
-- same world and a dump from one machine restores onto another.
INSERT INTO "game"."worlds" ("id") VALUES ('00000000-0000-4000-8000-000000000001');