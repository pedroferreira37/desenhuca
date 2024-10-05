export const ShapeKind = {
	Rectangle: 'rectangle',
	Ellipse: 'ellipse',
	Line: 'line'
} as const;

export const EW_RESIZE = 'ew-resize';
export const NS_RESIZE = 'ns-resize';
export const NESW_RESIZE = 'nesw-resize';
export const NWSE_RESIZE = 'nwse-resize';

export const LEFT = 'left' as const;
export const RIGHT = 'right' as const;
export const TOP = 'top' as const;
export const BOTTOM = 'bottom' as const;
export const TOP_LEFT = 'top_left' as const;
export const TOP_RIGHT = 'top_right' as const;
export const BOTTOM_LEFT = 'bottom_left' as const;
export const BOTTOM_RIGHT = 'bottom_right' as const;

export const INTERSECTION_SIDE = {
	[LEFT]: EW_RESIZE,
	[RIGHT]: EW_RESIZE,
	[TOP]: NS_RESIZE,
	[BOTTOM]: NS_RESIZE,
	[TOP_LEFT]: NWSE_RESIZE,
	[BOTTOM_RIGHT]: NWSE_RESIZE,
	[TOP_RIGHT]: NESW_RESIZE,
	[BOTTOM_LEFT]: NWSE_RESIZE
} as const;
