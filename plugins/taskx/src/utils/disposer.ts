export type TaskXDisposable = { dispose(): void };

export class TaskXDisposer implements TaskXDisposable {
	private disposers: Array<() => void> = [];

	add(fn: () => void): void {
		this.disposers.push(fn);
	}

	dispose(): void {
		for (let i = this.disposers.length - 1; i >= 0; i--) {
			try {
				this.disposers[i]();
			} catch {}
		}
		this.disposers = [];
	}
}
