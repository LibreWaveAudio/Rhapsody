/*
    Copyright 2025 David Healey

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

namespace StatusBar
{
	//! pnlStatusBar
	const pnlStatusBar = Content.getComponent("pnlStatusBar");
		
	pnlStatusBar.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		var text = this.get("text") + ": ";

		if (isDefined(this.data.status) && this.data.status.contains("Cancelled"))
			text += "Finishing current file.";
		else
			text += this.data.status;

		if (this.data.speed != "")
			text += ", " + this.data.speed;

		g.fillAll(this.get("bgColour"));

		g.setColour(this.get("itemColour"));
		g.fillRoundedRectangle([a[2] / 2 - 200, a[3] / 2 - 2, 400, 4], 1);

		g.setColour(this.get("itemColour2"));
		g.fillRoundedRectangle([a[2] / 2 - 200, a[3] / 2 - 2, 400 * this.getValue(), 4], 1);

		g.setColour(this.get("textColour"));
		g.setFont("regular", 16);
		g.drawAlignedText(text, [a[0] + 10, a[1], 400, a[3]], "left");
	});

	//! Functions
	inline function hide()
	{
		pnlStatusBar.showControl(false);
	}

	inline function show()
	{
		pnlStatusBar.showControl(true);
	}

	//! Listeners
	App.broadcasters.downloading.addListener(pnlStatusBar, "Show the status bar during downloads/installs", function(state, progress)
	{
		this.showControl(state);

		if (typeof(progress) == "object")
		{
			this.setValue(progress.value);
			
			if (isDefined(progress.projectName) && progress.projectName != "")
				this.set("text", progress.projectName);

			this.data.status = progress.status;
			this.data.speed = progress.speed;			
		}

		this.repaint();
	});
}