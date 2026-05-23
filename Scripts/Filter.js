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

		var labelArea = Rectangle(lblFilter.get("x") - 30, lblFilter.get("y"), lblFilter.get("width") + 30, lblFilter.get("height"));
		g.setColour(this.get("bgColour"));
		g.fillRoundedRectangle(labelArea, this.get("borderRadius"));

		g.setColour(Colours.withMultipliedBrightness(this.get("textColour"), 0.2));
		g.drawRoundedRectangle(labelArea.reduced(0.5), this.get("borderRadius"), 1);

		g.setColour(this.get("textColour"));
		g.setFont("phosphor", 16);
		g.drawAlignedText("\ue30c", [labelArea[0] + 10, labelArea[1] + labelArea[3] / 2 - 16 / 2, 16, 16], "left");
		
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.5));
		g.setFont(lblFilter.get("fontName"), lblFilter.get("fontSize"));

		if (lblFilter.get("text") == "")
			g.drawAlignedText("Search", labelArea.translated(35, 0), "left");
	});

	//! lblFilter
	const lblFilter = Content.getComponent("lblFilter");
	lblFilter.set("text", "");
	lblFilter.setControlCallback(onlblFilterControl);
	
	inline function onlblFilterControl(component, value)
	{
		bcFilterValue.value = value;
		pnlFilter.repaint();
	}
	
	inline function getValueBroadcaster()
	{
		return bcFilterValue;
	}
	
	// Broadcaster definition
	const bcFilterValue = Engine.createBroadcaster({id: "lblFilterValue", args: ["value"]});
}
