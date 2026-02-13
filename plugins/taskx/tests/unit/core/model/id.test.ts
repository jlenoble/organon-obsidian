/**
 * tests/unit/core/model/id.test.ts
 *
 * This is a minimal unit test that exercises our lowest-level “pure” helpers.
 * We start here because it proves the harness can import TypeScript modules from
 * src/ and run deterministically in the default node environment.
 *
 * Notes:
 * - We only assert runtime behavior (identity casts), not TypeScript branding.
 * - Branding correctness is enforced by the compiler, not by runtime checks.
 */

import { describe, expect, it } from "vitest";

import {
	asFixCandidateId,
	asFixId,
	asIssueId,
	asRecommendationId,
	asTaskId,
} from "@/core/model/id";

describe("core/model/id cast helpers", () => {
	it("returns the original string value at runtime", () => {
		expect(asTaskId("task:1")).toBe("task:1");
		expect(asIssueId("missing-duration:task:1")).toBe("missing-duration:task:1");
		expect(asFixId("fix:set-duration-15m")).toBe("fix:set-duration-15m");
		expect(asFixCandidateId("fixcand:missing-duration:task:1:fix:set-duration-15m")).toBe(
			"fixcand:missing-duration:task:1:fix:set-duration-15m",
		);
		expect(asRecommendationId("rec:do-now:shallow")).toBe("rec:do-now:shallow");
	});
});
