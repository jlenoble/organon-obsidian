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

	/**
	 * Walk the graph in post-order (leaf-first): a node is yielded only after
	 * all of its reachable neighbors in the chosen direction have been yielded.
	 *
	 * For partOf:
	 * - edges are child -> parent
	 * - to visit children first, use dir = "in" (incoming edges are children)
	 */
	*walkPostOrder(start: TaskXId, kind: Kind, dir: "out" | "in" = "out"): Iterable<TaskXId> {
		const visited = new Set<TaskXId>();
		const inStack = new Set<TaskXId>(); // cycle detection

		// Stack of frames: (node, expanded?)
		// expanded=false means "first time we see it"; then we push children and come back expanded=true.
		const stack: Array<{ id: TaskXId; expanded: boolean }> = [{ id: start, expanded: false }];

		while (stack.length) {
			const frame = stack.pop()!;
			const id = frame.id;

			if (frame.expanded) {
				// All descendants have been processed
				inStack.delete(id);
				visited.add(id);
				yield id;
				continue;
			}

			if (visited.has(id)) {
				continue;
			}
			if (inStack.has(id)) {
				// Cycle detected. We throw because "partOf" or "dependsOn" cycles are data corruption.
				throw new Error(
					`Cycle detected while walking post-order from ${String(start)} at ${String(id)}`,
				);
			}

			inStack.add(id);

			// Schedule post-visit
			stack.push({ id, expanded: true });

			// Schedule children (or predecessors) to be processed first
			const neigh = this.neighbors(id, kind, dir);
			for (const n of neigh) {
				if (!visited.has(n)) {
					stack.push({ id: n, expanded: false });
				}
			}
		}
	}

	*walkPostOrderAll(kind: Kind, dir: "out" | "in" = "out"): Iterable<TaskXId> {
		// Collect all node IDs known to this graph
		const all = new Set<TaskXId>();
		for (const id of this.#outgoing.keys()) {
			all.add(id);
		}
		for (const id of this.#incoming.keys()) {
			all.add(id);
		}

		// Start a post-order walk from each node not yet visited.
		// We reuse the same algorithm but share `visited` across starts.
		const visited = new Set<TaskXId>();
		const inStack = new Set<TaskXId>();

		for (const start of all) {
			if (visited.has(start)) {
				continue;
			}

			const stack: Array<{ id: TaskXId; expanded: boolean }> = [{ id: start, expanded: false }];

			while (stack.length) {
				const frame = stack.pop()!;
				const id = frame.id;

				if (frame.expanded) {
					inStack.delete(id);
					visited.add(id);
					yield id;
					continue;
				}

				if (visited.has(id)) {
					continue;
				}
				if (inStack.has(id)) {
					throw new Error(`Cycle detected while walking post-order at ${String(id)}`);
				}

				inStack.add(id);
				stack.push({ id, expanded: true });

				for (const n of this.neighbors(id, kind, dir)) {
					if (!visited.has(n)) {
						stack.push({ id: n, expanded: false });
					}
				}
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
