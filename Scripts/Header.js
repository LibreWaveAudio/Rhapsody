/*
    Copyright 2026 David Healey

    This file is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This file is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with This file. If not, see <http://www.gnu.org/licenses/>.
*/

namespace Header
{
	//! pnlHeader
	const pnlHeader = Content.getComponent("pnlHeader");

	pnlHeader.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.fillAll(this.get("bgColour"));

		g.setColour(this.get("textColour"));
		g.fillPath(Paths.rhapsodyLogo, [a[0] + 25, a[1] + 34, 141, 24]);

		g.addNoise({alpha: 0.025, scaleFactor: 1.5, area: a.toArray(), monochromatic: true});
	});
	
	pnlHeader.setMouseCallback(function(event)
	{
		if (event.doubleClick && event.x < 200)
			Settings.setZoomLevel(1.0);
	});
}
