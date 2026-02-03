export const RELATIONS = {
	dependsOn: { emoji: "⛔" },
	partOf: { emoji: "🌿" },
} as const;

export type RelationKind = keyof typeof RELATIONS;
export type Emoji = (typeof RELATIONS)[RelationKind]["emoji"];

export interface Edge<Kind extends RelationKind> {
	kind: Kind;
	from: TaskXId;
	to: TaskXId;
}

export interface TaskRecord {
	id: TaskXId;
	markdown: TaskXMarkdown;
	path: TaskXPath;
}

export class RelationGraph<Kind extends RelationKind> {
	#outgoing = new Map<TaskXId, Map<Kind, Set<TaskXId>>>();
	#incoming = new Map<TaskXId, Map<Kind, Set<TaskXId>>>();

	constructor(public readonly kind: Kind) {}

	addNode(id: TaskXId): void {
		if (!this.#outgoing.has(id)) {
			this.#outgoing.set(id, new Map());
		}
		if (!this.#incoming.has(id)) {
			this.#incoming.set(id, new Map());
		}
	}

	addEdge(edge: Edge<Kind>): void {
		this.addNode(edge.from);
		this.addNode(edge.to);

		const outKinds = this.#outgoing.get(edge.from)!;
		const incKinds = this.#incoming.get(edge.to)!;

		if (!outKinds.has(edge.kind)) {
			outKinds.set(edge.kind, new Set());
		}
		if (!incKinds.has(edge.kind)) {
			incKinds.set(edge.kind, new Set());
		}

		outKinds.get(edge.kind)!.add(edge.to);
		incKinds.get(edge.kind)!.add(edge.from);
	}

	neighbors(id: TaskXId, kind: Kind, dir: "out" | "in" = "out"): TaskXId[] {
		const m = (dir === "out" ? this.#outgoing : this.#incoming).get(id);
		if (!m) {
			return [];
		}
		return [...(m.get(kind) ?? [])];
	}

	*walkDFS(start: TaskXId, kind: Kind, dir: "out" | "in" = "out"): Iterable<TaskXId> {
		const seen = new Set<TaskXId>();
		const stack = [start];
		while (stack.length) {
			const cur = stack.pop()!;
			if (seen.has(cur)) {
				continue;
			}
			seen.add(cur);
			yield cur;
			for (const n of this.neighbors(cur, kind, dir)) {
				stack.push(n);
			}
		}
	}
}

export interface RelationSpec<Kind extends RelationKind> {
	kind: Kind;
	emoji: (typeof RELATIONS)[Kind]["emoji"];
	// Extract one or more target IDs from a taskind line.
	// Return target IDs only; graph builder wires from -> target.
	extractTargets(task: TaskRecord): TaskXId[];
}

export type Graphs = {
	[K in RelationKind]: RelationGraph<K>;
};

export function buildRelationGraphs(
	taskRecords: Iterable<TaskRecord>,
	specs: [RelationSpec<"dependsOn">, RelationSpec<"partOf">],
): Graphs {
	// Create one graph per kind
	const graphs: Graphs = {
		dependsOn: new RelationGraph(specs[0].kind),
		partOf: new RelationGraph(specs[1].kind),
	};

	// Collect active ids
	const ids: Set<TaskXId> = new Set(Array.from(taskRecords).map(r => r.id));

	for (const record of taskRecords) {
		// Ensure node exists in every graph (optional, but convenient)
		for (const spec of specs) {
			graphs[spec.kind].addNode(record.id);
		}

		addEdges({ graphs, spec: specs[0], record, ids });
		addEdges({ graphs, spec: specs[1], record, ids });
	}

	return graphs;
}

function addEdges<Kind extends RelationKind>({
	graphs,
	spec,
	record,
	ids,
}: {
	graphs: Graphs;
	spec: RelationSpec<Kind>;
	record: TaskRecord;
	ids: Set<TaskXId>;
}): void {
	// Filter out obsolete ids
	const targets = spec.extractTargets(record).filter(id => ids.has(id));

	for (const to of targets) {
		graphs[spec.kind].addEdge({ kind: spec.kind, from: record.id, to });
	}
}
