import { Setting } from "obsidian";

export interface ToggleButtonOptions {
	containerEl: HTMLElement;
	name: string;
	description: string;
	initValue: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onChange: (value: boolean) => any;
}

export function toggleButton({
	containerEl,
	onChange,
	initValue,
	name,
	description,
}: ToggleButtonOptions): Setting {
	return new Setting(containerEl)
		.setName(name)
		.setDesc(description)
		.addToggle(t => t.setValue(initValue).onChange(onChange));
}
