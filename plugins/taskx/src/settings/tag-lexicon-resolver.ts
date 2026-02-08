import { defaultDimensions, type Dimensions } from "../scoring";
import type { MeaningId, MeaningSpec } from "./meaning";
import { type NormalizationOptions, normalize } from "./normalize-tag";
import { type TaskXPluginSettings } from "./settings";

export type Resolver = {
	byLocale: Map<Locale, Map<Tag, MeaningId>>;
	neutral: Map<Tag, MeaningId>;
	all: Map<Tag, MeaningId>;
	collisions: Array<{ tag: Tag; meanings: MeaningId[]; where: string }>;
};

export type ResolvePolicy = "locale+neutral" | "all" | "localeThenAll";

export function compileResolver(args: {
	specs: MeaningSpec[];
	normalizeTagsToLowercase: boolean;
	removeHyphensAndUnderscores: boolean;
}): Resolver {
	const opt: NormalizationOptions = {
		normalizeTagsToLowercase: args.normalizeTagsToLowercase,
		removeHyphensAndUnderscores: args.removeHyphensAndUnderscores,
	};

	const byLocale = new Map<Locale, Map<Tag, MeaningId>>();
	const neutral = new Map<Tag, MeaningId>();
	const all = new Map<Tag, MeaningId>();

	const collisions = new Map<string, Set<MeaningId>>();

	function add(map: Map<Tag, MeaningId>, where: string, raw: string, id: MeaningId): void {
		const n = normalize(raw, opt);
		if (!n) {
			return;
		}
		const existing = map.get(n);
		if (existing && existing !== id) {
			const key = `${where}::${n}`; // include context
			if (!collisions.has(key)) {
				collisions.set(key, new Set([existing]));
			}
			collisions.get(key)!.add(id);
			return; // don't overwrite
		}
		map.set(n, id);
	}

	for (const spec of args.specs) {
		// per-locale
		for (const [locRaw, lex] of Object.entries(spec.languages)) {
			const locale = locRaw as Locale;
			let locMap = byLocale.get(locale);
			if (!locMap) {
				locMap = new Map<Tag, MeaningId>();
				byLocale.set(locale, locMap);
			}

			add(locMap, `locale:${locale}`, lex.canonical, spec.id);
			add(all, "all", lex.canonical, spec.id);

			for (const a of lex.aliases) {
				add(locMap, `locale:${locale}`, a, spec.id);
				add(all, "all", a, spec.id);
			}
		}

		// neutral
		for (const a of spec.neutralAliases ?? []) {
			add(neutral, "neutral", a, spec.id);
			add(all, "all", a, spec.id);
		}
	}

	return {
		byLocale,
		neutral,
		all,
		collisions: [...collisions.entries()].map(([k, set]) => {
			const [, tag] = k.split("::");
			return { tag: tag as Tag, meanings: [...set], where: k.split("::")[0] };
		}),
	};
}

export function resolveMeaningId(
	args: {
		tag: string;
		resolver: Resolver;
	} & TaskXPluginSettings,
): MeaningId | null {
	const n = normalize(args.tag, args);
	if (!n) {
		return null;
	}

	const locMap = args.resolver.byLocale.get(args.locale);
	const locHit = locMap?.get(n) ?? null;
	if (args.resolvePolicy === "all") {
		return args.resolver.all.get(n) ?? null;
	}

	if (locHit) {
		return locHit;
	}

	const neutralHit = args.resolver.neutral.get(n) ?? null;
	if (neutralHit) {
		return neutralHit;
	}

	if (args.resolvePolicy === "localeThenAll") {
		return args.resolver.all.get(n) ?? null;
	}

	return null;
}

export function resolveSpec(
	args: {
		tag: string;
		resolver: Resolver;
	} & TaskXPluginSettings,
): MeaningSpec | null {
	const id = resolveMeaningId(args);

	if (!id) {
		console.warn(`Tag ${args.tag} is not yet handled`);
		return null;
	}

	return args.meaningSpecs.find(spec => spec.id === id) || null;
}

export function resolveDimensions(
	args: {
		tag: string;
		resolver: Resolver;
	} & TaskXPluginSettings,
): Dimensions {
	const spec = resolveSpec(args);
	return spec ? spec.dimensions : defaultDimensions();
}

export function resolveAuthority(
	args: {
		tag: string;
		resolver: Resolver;
	} & TaskXPluginSettings,
): boolean {
	const spec = resolveSpec(args);
	return spec?.isAuthority ?? false;
}
