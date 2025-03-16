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

namespace Spinner
{
	//! pnlSpinnerContainer
	const pnlSpinnerContainer = Content.getComponent("pnlSpinnerContainer");
	pnlSpinnerContainer.showControl(false);
	
	pnlSpinnerContainer.setPaintRoutine(function(g)
	{
		g.fillAll(Colours.withAlpha(this.get("bgColour"), 0.9));			
	});

	//! pnlSpinner
	const pnlSpinner = Content.getComponent("pnlSpinner");

	pnlSpinner.setPaintRoutine(function(g)
	{
		var a = [this.getWidth() / 2 - 40, this.getHeight() / 2 - 60, 80, 80];

		for (i = 0; i < 10; i++)
		{
			this.getValue() == i ? g.setColour(Colours.white) : g.setColour(Colours.grey);
			
			var x = this.getWidth() / 2;
			var y1 = a[1] - 40;
			var y2 = this.getHeight() / 2 - 80;
			
			g.drawLine(x, x, y1, y2, 4);
			
			g.rotate(Math.toRadians(360 / 10), [this.getWidth() / 2, this.getHeight() / 2]);
		}

		g.setColour(Colours.withAlpha(Colours.white, 1 / 10 * this.getValue()));

		g.setFont("medium", 28);
		g.drawAlignedText(this.get("text"), [0, a[1] + a[3] + 125, this.getWidth(), 26], "centred");
	});

	pnlSpinner.setTimerCallback(function()
	{
		var v = (this.getValue() + 1) % 10;

    	this.setValue(v);
    	this.repaint();
	});

	//! Functions
	inline function setOption(key: string, value: NotUndefined)
	{
		pnlSpinner.data[key] = value;
	}
	
	inline function show(text: string)
	{
		pnlSpinner.set("text", text);
		pnlSpinner.startTimer(150);
		pnlSpinnerContainer.showControl(true);
		Synth.startTimer(150 / 1000);
	}

	inline function hide()
	{
		pnlSpinnerContainer.showControl(false);
		pnlSpinner.stopTimer();
		pnlSpinner.setValue(0);
		pnlSpinner.set("text", "");
		pnlSpinner.data.title = "";
	}
}