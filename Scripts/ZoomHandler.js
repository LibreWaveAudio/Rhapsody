/*
    Copyright 2024, 2025 David Healey

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

namespace ZoomHandler
{
	const MIN_ZOOM = 0.75;
	const MAX_ZOOM = 4.0;
	const ZOOM_STEP = 0.05;
	const interfaceSize = Content.getInterfaceSize();

	//! pnlZoom
	const pnlZoom = Content.addPanel("pnlZoom", 0, 0);
	pnlZoom.set("parentComponent", "pnlMain");
	pnlZoom.setPosition(interfaceSize[0] - 12, interfaceSize[1] - 12, 12, 12);
	pnlZoom.set("allowCallbacks", "All Callbacks");
	pnlZoom.setControlCallback(onpnlZoomControl);	

	inline function onpnlZoomControl(component, value)
	{
		Settings.setZoomLevel(value);
	}

	pnlZoom.setPaintRoutine(function(g)
	{
		g.setFont("phosphor", 12);
		g.setColour(this.get("textColour"));
		g.drawAlignedText("\ued3a", this.getLocalBounds(0), "centred");
	});

	pnlZoom.setMouseCallback(function(event)
	{
		this.data.hover = event.hover;
		
		if (event.mouseUp)
			return;
		
		if (event.clicked)
			this.data.zoomStart = Settings.getZoomLevel();
	
		if (!event.drag)
			return this.repaint();
	
		if (!this.data.allowDrag)
			return;

		var diagonal = Math.sqrt(interfaceSize[0] * interfaceSize[0] + interfaceSize[1] * interfaceSize[1]);
		var currentZoom = Settings.getZoomLevel();
		var dragPixel = 0;
		
		if (event.dragX > event.dragY)
			dragPixel = (event.dragX * currentZoom) / interfaceSize[0];
		else
			dragPixel = (event.dragY * currentZoom) / interfaceSize[1];
		
		var maxScaleFactor = Content.getScreenBounds(false)[3] / interfaceSize[1];
		var diagonalDrag = this.data.zoomStart + dragPixel;
		
		diagonalDrag += (ZOOM_STEP / 2);
		
		diagonalDrag = Math.min(diagonalDrag, maxScaleFactor);
		
		diagonalDrag -= Math.fmod(diagonalDrag, ZOOM_STEP);
		diagonalDrag = Math.range(diagonalDrag, MIN_ZOOM, MAX_ZOOM);
		
		var zoomToUse = diagonalDrag;

		if (currentZoom != zoomToUse)
		{
			this.setValue(zoomToUse);
			this.changed();
		}			
	});
	
	//! Functions
	inline function allowZoom(panel: ScriptObject, on: number)
	{
		panel.data.allowDrag = on;
		panel.setMouseCursor(on ? "BottomRightCornerResizeCursor" : "NormalCursor", Colours.white, [0, 0]);
		panel.repaint();
	}

	//! Calls
	allowZoom(pnlZoom, true);
	pnlZoom.setValue(Settings.getZoomLevel());
	pnlZoom.changed(); // This probably doesn't do anything
}