/*
    Copyright 2021, 2022, 2023, 2024, 2025 David Healey

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

namespace ProgressBar
{
	//! pnlProgressBarContainer
	const pnlProgressBarContainer = Content.getComponent("pnlProgressBarContainer");
	
	pnlProgressBarContainer.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		LookAndFeel.fullPageBackground();
	});

	//! pnlProgressBar
	const pnlProgressBar = Content.getComponent("pnlProgressBar");

	pnlProgressBar.setPaintRoutine(function(g)
	{
		var a = [this.getWidth() / 2 - 300 / 2, this.getHeight() / 2 - 4 / 2, 300, 4];

		g.setColour(this.get("itemColour"));
		g.fillRoundedRectangle(a, 2);

		g.setColour(this.get("itemColour2"));
		g.fillRoundedRectangle([a[0], a[1], a[2] * this.getValue(), a[3]], 2);

		g.setFont("regular", 16);
		g.setColour(this.get("textColour"));
		
		if (isDefined(this.data.title))
			g.drawAlignedText(this.data.title, [a[0], a[1] - 26, a[2], 26], "left");

		g.setFont("regular", 14);
		g.drawAlignedText(this.get("text"), [a[0], a[1] + a[3] + 2, a[2], 26], "centred");
	});
	
	pnlProgressBar.setTimerCallback(function()
	{	
		this.setValue(Engine.getPreloadProgress());
   		this.set("text", Engine.getPreloadMessage());
   		this.repaint();    	
	});

	//! btnProgressCancel
	const btnProgressCancel = Content.getComponent("btnProgressCancel");
	const lafbtnProgressCancel = Content.createLocalLookAndFeel();
	btnProgressCancel.setLocalLookAndFeel(lafbtnProgressCancel);
	btnProgressCancel.setControlCallback(onbtnProgressCancelControl);
	
	inline function onbtnProgressCancelControl(component, value)
	{
		if (!value)
			return;
	}
	
	lafbtnProgressCancel.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;

		g.setColour(Colours.withMultipliedBrightness(obj.textColour, obj.over ? 1.0 - obj.value * 0.2 : 0.8)); 
		g.setFont("bold", 18);
		g.drawAlignedText(obj.text, a, "centred");
	});
	
	//! Functions
	inline function set(key: string, value: NotUndefined)
	{
		pnlProgressBar.data[key] = value;
	}
	
	inline function setMessage(msg: string)
	{
		pnlProgressBar.data.msg = msg;
		pnlProgressBar.set("text", msg);
	}
	
	inline function show()
	{
		pnlProgressBar.startTimer(50);
		pnlProgressBarContainer.showControl(true);
	}
	
	inline function hide()
	{
		pnlProgressBarContainer.showControl(false);
		btnProgressCancel.showControl(false);
		pnlProgressBar.stopTimer();
		pnlProgressBar.setValue(0);
		pnlProgressBar.set("text", "");
		pnlProgressBar.data.title = "";
	}

	inline function showCancelButton(shouldShow)
	{
		btnProgressCancel.showControl(shouldShow);
	}

	//! Calls
	hide();
}