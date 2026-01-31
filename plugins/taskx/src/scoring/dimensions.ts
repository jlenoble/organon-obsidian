import type { Friction, Gain, Pressure } from "./types";

export interface Dimensions {
	gain: Gain;
	pressure: Pressure;
	friction: Friction;
}

export function max(dims1: Dimensions, dims2: Dimensions): Dimensions {
	return {
		gain: Math.max(dims1.gain, dims2.gain) as Gain,
		pressure: Math.max(dims1.pressure, dims2.pressure) as Pressure,
		friction: Math.max(dims1.friction, dims2.friction) as Friction,
	};
}
