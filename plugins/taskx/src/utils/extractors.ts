// Extract the 🆔 value from a task’s text
export function extractId(task: Task): string | null {
	const text = task.originalMarkdown ?? "";
	const m = text.match(/🆔\s*([A-Za-z0-9_-]+)/);
	return m ? m[1] : null;
}

// Extract the parent reference from 🌿
export function extractParentId(task: Task): string | null {
	const text = task.description ?? task.originalMarkdown ?? "";
	const m = text.match(/🌿\s*([A-Za-z0-9_-]+)/);
	return m ? m[1] : null;
}
