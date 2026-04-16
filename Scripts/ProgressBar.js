/*
    Copyright 2021, 2022, 2023, 2024, 2025, 2026 David Healey

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
	//! pnlProgressContainer
	const pnlProgressContainer = Content.getComponent("pnlProgressContainer");
	pnlProgressContainer.showControl(false);
	
	pnlProgressContainer.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		g.fillAll(this.get("bgColour"));
		
		var imgArea = Rectangle(imgProgress.get("x"), imgProgress.get("y"), imgProgress.get("width"), imgProgress.get("height"));
		
		g.setColour(this.get("itemColour"));
		g.fillRoundedRectangle(imgArea.expanded(7), 5);		
	});
	
	pnlProgressContainer.setLoadingCallback(function(isPreloading)
	{
		this.showControl(isPreloading);
	});

	//! imgProgress
	const imgProgress = Content.getComponent("imgProgress");
		
	//! pnlProgressBar
	const pnlProgressBar = Content.getComponent("pnlProgressBar");
	pnlProgressBar.setPaintRoutine(function(g) {drawProgressBar();});

	//! btnProgressCancel
	const btnProgressCancel = Content.getComponent("btnProgressCancel");
	btnProgressCancel.setLocalLookAndFeel(LookAndFeel.iconButtonMomentary);
	btnProgressCancel.setControlCallback(onbtnProgressCancelControl);
	
	inline function onbtnProgressCancelControl(component, value)
	{
		if (value)
			return;

		Engine.showYesNoWindow("Cancel", "Do you want to cancel this download?", function(response)
		{
			if (response)
				Downloader.abortDownloads();
		});
	}	

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
		g.drawAlignedText(this.data.text, [a[0], a[1] + 40, a[2], a[3]], "topLeft");
	}

	inline function setProgress(value: number, data: object)
	{
		pnlProgressBar.setValue(value);
		
		for (x in data)
			pnlProgressBar.data[x] = data[x];
		
		pnlProgressBar.repaint();
	}
		
	inline function setImage(imagePath: string)
	{
		if (imagePath == "")
			imgProgress.setImageFile("{PROJECT_FOLDER}Icon.png", true);
		else
			imgProgress.setImageFile(imagePath, true);
	}

	//! Broadcasters		
	Expansions.broadcasters.installationProgress.addListener(0, "Update the progress bar", function(progress, title, message)
	{
		setProgress(progress, {productName: title, text: message});
	});
	
	//! Functions Calls
	setImage("");
}
