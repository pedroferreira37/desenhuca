export const ShapeKind = {
	Rectangle: 'rectangle',
	Ellipse: 'ellipse',
	Line: 'line'
} as const;

export const EW_RESIZE = 'ew-resize';
export const NS_RESIZE = 'ns-resize';
export const NESW_RESIZE = 'nesw-resize';
export const NWSE_RESIZE = 'nwse-resize';

export const EDGES_GLYPH = {
	west: EW_RESIZE,
	east: EW_RESIZE,
	north: NS_RESIZE,
	south: NS_RESIZE,
	['nor-east']: NWSE_RESIZE,
	['south-west']: NESW_RESIZE,
	['nor-west']: NESW_RESIZE,
	['south-east']: NWSE_RESIZE,
	none: 'default'
} as const;
