/*
    Copyright 2023, 2024, 2025 David Healey

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

namespace Filter
{
	//! pnlFilter
	const pnlFilter = Content.getComponent("pnlFilter");

	pnlFilter.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.setColour(this.get("bgColour"));
		g.fillRoundedRectangle(a, 2);

		g.setColour(this.get("textColour"));
		g.setFont("phosphor", 14);
		g.drawAlignedText("\ue30c", [a[0] + 10, a[1], a[3], a[3]], "left");
	});

	//! lblFilter
	const lblFilter = Content.getComponent("lblFilter");
	lblFilter.set("text", "");
	lblFilter.setControlCallback(onlblFilterControl);
	
	inline function onlblFilterControl(component, value)
	{
		bcFilterValue.value = value;
	}
	
	inline function getValueBroadcaster()
	{
		return bcFilterValue;
	}
	
	// Broadcaster definition
	const bcFilterValue = Engine.createBroadcaster({id: "lblFilterValue", args: ["value"]});
}
