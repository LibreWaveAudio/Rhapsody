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
	const downloadInstallStates = [0, 0];

	//! pnlProgress
	const pnlProgress = Content.getAllComponents("pnlProgress\\d");
	
	for (x in pnlProgress)
		x.showControl(false);

	pnlProgress[0].setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.fillAll(this.get("bgColour"));
		g.addNoise({alpha: 0.025, scaleFactor: 2.0, area: a, monochromatic: true});
	});

	pnlProgress[1].setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.drawDropShadow([a[0], a[1] + 15, a[2], a[3] - 25], Colours.withAlpha(Colours.black, 0.7), 20);

		g.setColour(this.get("bgColour"));
		g.fillRect([a[0], a[1], a[2], a[3] - 10]);

		g.addNoise({alpha: 0.025, scaleFactor: 2.0, area: a, monochromatic: true});
	});

	//! imgProgress
	const imgProgress = Content.getComponent("imgProgress");
		
	//! pnlProgressBar
	const pnlProgressBar = Content.getAllComponents("pnlProgressBar\\d");

	for (x in pnlProgressBar)
		x.setPaintRoutine(function(g) {drawProgressBar();});

	//! btnProgressCancel
	const btnProgressCancel = Content.getAllComponents("btnProgressCancel\\d");
	
	for (x in btnProgressCancel)
		x.setLocalLookAndFeel(LookAndFeel.iconButtonMomentary);

	//! Functions
	inline function drawProgressBar()
	{
		if (this.data.productName == "" || this.data.text == "")
			return;

		local a = this.getLocalBounds(0);
		local radius = this.get("borderRadius");
		local fillArea = [a[0], a[3] - 17, a[2], 4];

		g.setColour(this.get("bgColour"));
		g.fillRoundedRectangle(fillArea, radius);

		g.setColour(this.get("itemColour"));
		g.fillRoundedRectangle([fillArea[0], fillArea[1], fillArea[2] * this.getValue(), fillArea[3]], radius);

		g.setColour(this.get("textColour"));
		g.setFont("bold", 20);
		g.drawAlignedText(this.data.productName, [a[0], a[1] + 10, a[2], a[3]], "topLeft");

		g.setColour(this.get("textColour"));
		g.setFont("medium", 18);
		g.drawAlignedText(this.data.text, [a[0], a[1] + 34, a[2], a[3]], "topLeft");
	}
	
	inline function setProgress(progress: object)
	{
		for (x in pnlProgressBar)
		{
			x.setValue(progress.value);

			if (isDefined(progress.productName))
				x.data.productName = progress.productName;

			if (isDefined(progress.text))
				x.data.text = progress.text;

			x.repaint();
		}
	}
	
	inline function hide()
	{
		for (x in pnlProgress)
			x.showControl(false);
	}
	
	inline function setProductName(productName: string)
	{
		for (x in pnlProgressBar)
			x.data.productName = productName;
	}
	
	inline function setImage(imageFile: string)
	{
		imgProgress.setImageFile(imageFile, true);
	}

	//! Broadcasters
	Downloader.broadcasters.isDownloading.addComponentPropertyListener(["pnlProgress0", "pnlProgress1"], "visible", "Disable menu during downloads", function(index, state)
	{
		downloadInstallStates[0] = state;
		return downloadInstallStates.contains(true);
	});

	Installer.broadcasters.isInstalling.addComponentPropertyListener(["pnlProgress0", "pnlProgress1"], "visible", "Disable menu during install", function(index, state)
	{
		downloadInstallStates[1] = state;
		return downloadInstallStates.contains(true);
	});
}
