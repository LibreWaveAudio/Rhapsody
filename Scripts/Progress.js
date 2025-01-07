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

namespace Progress
{
	// pnlProgressContainer
	const pnlProgressContainer = Content.getComponent("pnlProgressContainer");
	
	pnlProgressContainer.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		LookAndFeel.fullPageBackground();
	});

	// pnlProgress
	const pnlProgress = Content.getComponent("pnlProgress");

	pnlProgress.setPaintRoutine(function(g)
	{
       	if (isDefined(this.data.mode) && this.data.mode)
       		drawBar();
       	else
       		drawSpinner();       		
	});

	pnlProgress.setLoadingCallback(function(isPreloading)
	{
		if (isPreloading)
			show(1);
		else
			hide();
	});
	
	pnlProgress.setTimerCallback(function()
	{
    	this.setValue(Engine.getPreloadProgress());
    	this.set("text", Engine.getPreloadMessage());
    	this.repaint();
	});
	
	inline function drawSpinner()
	{
		local a = [this.getWidth() / 2 - 50, this.getHeight() / 2 - 50, 100, 100];

		g.fillAll(Colours.withAlpha(Colours.black, 0.5));

		for (i = 0; i < 10; i++)
		{
			this.getValue() == i ? g.setColour(Colours.white) : g.setColour(Colours.grey);
			
			local x = this.getWidth() / 2 - 0;
			local y1 = a[1] + 20;
			local y2 = this.getHeight() / 2 - 70;        
			
			g.drawLine(x, x, y1, y2, 4);
			
			g.rotate(Math.toRadians(360 / 10), [this.getWidth() / 2, this.getHeight() / 2]);
		}

		g.setColour(Colours.withAlpha(Colours.white, 1 / 10 * this.getValue()));

		if (this.data.msg == "")
			return;

		g.setFont("medium", 26);
		g.drawAlignedText(this.data.msg, [0, a[1] + a[3] + 50, this.getWidth(), 30], "centred");
	}
	
	inline function drawBar()
	{
		local a = [this.getWidth() / 2 - 300 / 2, this.getHeight() / 2 - 4 / 2, 300, 4];

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
	}

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
	
	// Functions
	inline function set(key: string, value: NotUndefined)
	{
		pnlProgress.data[key] = value;
	}
	
	inline function setMessage(msg: string)
	{
		pnlProgress.data.msg = msg;
		pnlProgress.set("text", msg);
	}
	
	inline function show(mode: number)
	{
		pnlProgress.startTimer(50);
		pnlProgress.data.mode = mode;
		pnlProgressContainer.showControl(true);
	}
	
	inline function hide()
	{
		pnlProgress.setValue(0);
		pnlProgress.stopTimer();
		pnlProgress.set("text", "");
		pnlProgress.data.title = "";
		pnlProgressContainer.showControl(false);
		//btnProgressCancel.showControl(false);
	}

	inline function showCancelButton(shouldShow)
	{
		btnProgressCancel.showControl(shouldShow);
	}

	inline function: number isVisible()
	{
		return pnlProgress.get("visible");
	}

	// Calls
	//hide();
}