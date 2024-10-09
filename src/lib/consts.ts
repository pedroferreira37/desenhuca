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
	left: EW_RESIZE,
	right: EW_RESIZE,
	top: NS_RESIZE,
	bottom: NS_RESIZE,
	nor_west: NWSE_RESIZE,
	south_west: NESW_RESIZE,
	nor_east: NESW_RESIZE,
	south_east: NWSE_RESIZE,
	none: 'default'
} as const;
