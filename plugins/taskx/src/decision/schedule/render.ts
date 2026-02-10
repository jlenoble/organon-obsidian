import type { DataviewInlineApi } from "obsidian-dataview";

import { computeSchedulingHint } from "./decision-scheduling-hints";
import { fmt } from "./helpers";
import type { DaySchedule } from "./schedule-types";

export function renderDaySchedule(dv: DataviewInlineApi, schedule: DaySchedule): void {
	if (schedule.diagnostics.length) {
		dv.paragraph(schedule.diagnostics.map(x => `- ${x}`).join("\n"));
	}

	const rows: Array<[string, string, string]> = [];

	for (const it of schedule.items) {
		if (it.kind === "block") {
			const b = it.block;
			rows.push([`${fmt(b.start)}–${fmt(b.end)}`, `**${b.label ?? b.kind}**`, ""]);
			continue;
		}

		const hint = computeSchedulingHint(it.task);
		const meta = `(${hint.urgency}/${hint.value}/${hint.friction})`;
		rows.push([
			`${fmt(it.start)}–${fmt(it.end)}`,
			`${meta} ${it.task.taskx.markdown}`,
			hint.reasons.slice(0, 2).join(" · "),
		]);
	}

	dv.table(["Time", "Plan", "Why"], rows);
}
