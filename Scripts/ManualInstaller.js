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

namespace ManualInstaller
{
	//! pnlManualInstaller
	const pnlManualInstaller = Content.getComponent("pnlManualInstaller");

	pnlManualInstaller.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.setColour(this.get("textColour"));
		g.setFont("semibold", 20);
		g.drawAlignedText(this.get("text"), a, "topLeft");
			
		g.setFont("regular", 16);
		g.drawAlignedText("Single Instrument: Drag and drop an .lwz file or click the Select File button.", Rect.removeFromTop(a, 50), "bottomLeft");
		g.drawAlignedText("Multiple Instruments: Click the Select Folder button to install all .lwz files in a folder.", Rect.removeFromTop(a, 25), "bottomLeft");
	});

	//! pnlDropZone
	const pnlDropZone = Content.getComponent("pnlDropZone");
	pnlDropZone.setFileDropCallback("All Callbacks", "*.lwz", onpnlDropZoneFileDrop);

	inline function onpnlDropZoneFileDrop(obj)
	{
		this.data.hover = obj.hover && !obj.drop;
		this.repaint();
		
		if (!obj.drop)
			return;

		local file = FileSystem.fromAbsolutePath(obj.fileName);
		Installer.install(file);
	}

	pnlDropZone.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);

		g.setColour(Colours.withAlpha(this.get("textColour"), 0.05));

		if (this.data.hover)
			g.fillRoundedRectangle(Rect.reduced(a, 2), this.get("borderRadius"));

		g.setColour(Colours.withAlpha(this.get("textColour"), 0.5 + 0.5 * this.data.hover));

		var p = Content.createPath();
		p.addRoundedRectangle(Rect.reduced(a, 2), this.get("borderRadius"));
		
		var stroke = {EndCapStyle: "rounded", JointStyle: "curved", Thickness: 1.0};
		var sp = p.createStrokedPath(stroke, [5, 10]);
		
		g.drawPath(sp, Rect.reduced(a, 2), stroke);

		g.setFont("phosphor", 48);
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.6 + 0.4 * this.data.hover));
		g.drawAlignedText("\uee54", Rect.removeFromTop(a, 90), "centred");

		g.setFont("regular", 18);
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.9));
		g.drawAlignedText("Drag & Drop an .lwz File", [a[0], 90, a[2], 25], "centred");
		g.drawAlignedText("Or", [a[0], 115, a[2], 25], "centred");		
	});
	
	//! btnSelectLwzFile
	const btnSelectLwzFile = Content.getComponent("btnSelectLwzFile");
	btnSelectLwzFile.setLocalLookAndFeel(LookAndFeel.textButton);
	btnSelectLwzFile.setControlCallback(onbtnSelectLwzFileControl);
	
	inline function onbtnSelectLwzFileControl(component, value)
	{
		if (!value)
			showFileBrowser();
	}
	
	//! btnSelectLwzDir
	const btnSelectLwzDir = Content.getComponent("btnSelectLwzDir");
	btnSelectLwzDir.setLocalLookAndFeel(LookAndFeel.textButton);
	btnSelectLwzDir.setControlCallback(onbtnSelectLwzDirControl);
	
	inline function onbtnSelectLwzDirControl(component, value)
	{
		if (!value)
			showDirectoryBrowser();
	}

	//! Functions
	inline function showFileBrowser()
	{
		FileSystem.browse(FileSystem.getFolder(FileSystem.Downloads), false, "*.lwz", function(file)
		{
			if (!file.isFile())
				return;
				
			Installer.install(file);
		});
	}

	inline function showDirectoryBrowser()
	{
		FileSystem.browseForDirectory(FileSystem.getFolder(FileSystem.Downloads), function(dir)
		{
			if (!dir.isDirectory())
				return;
				
			var files = FileSystem.findFiles(dir, "*.lwz", false);
			
			if (!files.length)
				return Engine.showMessageBox("No Files", "No lwz files were found in the selected folder.", 1);
				
			Installer.bulkInstall(dir);
		});
	}
}
