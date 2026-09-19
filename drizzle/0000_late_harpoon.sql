CREATE TABLE `ledger_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`kind` text NOT NULL,
	`category` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`occurred_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`monthly_net_salary_cents` integer DEFAULT 1200000 NOT NULL,
	`salary_months` integer DEFAULT 12 NOT NULL,
	`work_days_per_month` integer DEFAULT 21 NOT NULL,
	`onsite_hours_per_day` integer DEFAULT 9 NOT NULL,
	`commute_minutes_per_day` integer DEFAULT 90 NOT NULL,
	`overtime_hours_per_month` integer DEFAULT 12 NOT NULL,
	`work_cost_cents_per_day` integer DEFAULT 3500 NOT NULL,
	`starting_savings_cents` integer DEFAULT 3000000 NOT NULL,
	`freedom_goal_cents` integer DEFAULT 20000000 NOT NULL,
	`safety_months` integer DEFAULT 6 NOT NULL,
	`raise_percent` integer DEFAULT 10 NOT NULL,
	`commute_reduction_minutes` integer DEFAULT 30 NOT NULL,
	`overtime_change_hours` integer DEFAULT -8 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
