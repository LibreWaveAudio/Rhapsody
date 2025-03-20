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
	//! pnlProgress
	const pnlProgress = Content.getComponent("pnlProgress");
	pnlProgress.showControl(false);

	pnlProgress.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		LookAndFeel.fullPageBackground();		

		g.setColour(this.get("textColour"));
		g.setFont("bold", 30);
		g.drawAlignedText(this.get("text"), [a[0] + 25, a[1] + 25, a[2], a[3]], "topLeft");
	
		g.addNoise({alpha: 0.025, scaleFactor: 2.0, area: a, monochromatic: true});
	});
		
	//! pnlProgressBar
	const pnlProgressBar = Content.getComponent("pnlProgressBar");
	
	pnlProgressBar.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		var v = this.getValue();
		var radius = this.get("borderRadius");

		g.setColour(this.get("bgColour"));
		g.fillRoundedRectangle(Rect.withSizeKeepingCentre(a, a[2], 8), radius);

		var fillArea = Rect.withSizeKeepingCentre(a, a[2] - 2, 6);		

		g.setColour(this.get("itemColour"));
		g.fillRoundedRectangle([fillArea[0], fillArea[1], fillArea[2] * v, fillArea[3]], radius);

		g.setColour(this.get("textColour"));
		g.setFont("medium", 22);
		g.drawAlignedText(this.data.message + ": " + parseInt(v * 100) + "%", Rect.removeFromTop(a, 90), "left");

		g.setFont("regular", 20);
		g.drawAlignedText(this.get("text"), Rect.removeFromBottom(a, 90), "left");
	});

	//! btnProgressCancel
	const btnProgressCancel = Content.getComponent("btnProgressCancel");
	btnProgressCancel.setLocalLookAndFeel(LookAndFeel.iconButtonMomentary);

	//! Functions
	inline function setProgress(progress: object)
	{
		pnlProgress.showControl(true);
		pnlProgressBar.setValue(progress.value);
		pnlProgressBar.data.message = progress.message;
		pnlProgressBar.set("text", progress.text);
		pnlProgressBar.repaint();
	}
	
	inline function hide()
	{
		pnlProgress.showControl(false);
	}

	//! Broadcasters
	Downloader.broadcasters.isDownloading.addListener({}, "Show the progress bar during downloads", function(state, progress)
	{
		if (typeof(progress) != "object")
			return;

		if (state)
			setProgress(progress);
		else
			hide();
	});
}
