// Author: Christoph Hart, David Healey
// License: CC0

namespace Rect
{
	// Returns a rectangle that is smaller than this one by a given amount.
	inline function reduced(area: Array, amount: number)
	{
		return [area[0] + amount, area[1] + amount, area[2] - 2 * amount, area[3] - 2 * amount];
	}
	
	// Creates a copy of another rectangle.	
	inline function copy(area: Array)
	{
		return [area[0], area[1], area[2], area[3]];
	}
	
	// Returns true if the point is inside the area.
	inline function contains(area: Array, point: Array)
	{
		return point[0] >= area[0] && point[0] < area[0] + area[2] && point[1] >= area[1] && point[1] < area[1] + area[3];
	}
	
	// Returns a rectangle with the same centre position as this one, but a new size.
	inline function withSizeKeepingCentre(area: Array, width: number, height: number)
	{
		return [area[0] + (area[2] - width) / 2, area[1] + (area[3] - height) / 2, width, height];
	}
	
	// Removes a strip from the left-hand edge of this rectangle.
	inline function removeFromLeft(area: Array, amount: number)
	{
		area[0] += amount;
		area[2] -= amount;
		return [area[0] - amount, area[1], amount, area[3]];
	}
	
	// Removes a strip from the right-hand edge of this rectangle.
	inline function removeFromRight(area: Array, amount: number)
	{
		area[2] -= amount;
		return [area[0] + area[2], area[1], amount, area[3]];
	}
	
	// Removes a strip from the top edge of this rectangle.
	inline function removeFromTop(area: Array, amount: number)
	{
		area[1] += amount;
		area[3] -= amount;
		return [area[0], area[1] - amount, area[2], amount];
	}
	
	// Removes a strip from the bottom edge of this rectangle.
	inline function removeFromBottom(area: Array, amount: number)
	{
		area[3] -= amount;
		return [area[0], area[1] + area[3], area[2], amount];
	}
	
	// Returns an area that has been scaled by the given factor.
	inline function scale(area: Array, scaleFactor: number)
	{
		local newArea = [];
		
		newArea.reserve(4);
		
		for (a in area)
			newArea.push(a * scaleFactor);

		return newArea;
	}

	inline function setCentre(area: Array, newCentreX: number, newCentreY: number)
	{
		return [area[0] + newCentreX - area[2] / 2, area[1] + newCentreY - area[3] / 2, area[2], area[3]];
	}
	
	// Returns a rectangle which is the same as this one moved by a given amount.	
	inline function translated(area: Array, xDelta: number, yDelta: number)
	{
		return [area[0] + xDelta, area[1] + yDelta, area[2], area[3]];
	}
	
	inline function withAspectRatioLike(area: Array, otherArea: Array)
	{
		local ar = otherArea[3] / otherArea[2];
		local w = area[2];
		local h = area[2] * ar;
		local x = area[0];
		local y = area[1] + Math.abs(h - ar[3]) / 2.0;
		
		if (ar > 1.0)
		{
			w = area[3] / ar;
			h = area[3];
			x = area[0] + Math.abs(w - ar[2]) / 2.0;
			y = area[1];
		}
		
		return [x, y, w, h];
	}
}