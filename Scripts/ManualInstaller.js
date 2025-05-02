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
	//! pnlManualInstallerContainer
	const pnlManualInstallerContainer = Content.getComponent("pnlManualInstallerContainer");
	pnlManualInstallerContainer.showControl(false);

	pnlManualInstallerContainer.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		LookAndFeel.fullPageBackground();
	});

	//! Functions
	inline function showFileBrowser()
	{
		FilePicker.show({
			startFolder: FileSystem.getFolder(FileSystem.Downloads),
			mode: 0,
			filter: "*.lwz",
			title: "Install from File",
			message: "Select a LWZ file to install.",
			buttonText: "Ok",
			hideOnSubmit: true,
		}, function(file)
		{
			show();
			Installer.install(file);
		});
	}

	inline function showDirectoryBrowser()
	{
		FilePicker.show({
			startFolder: FileSystem.getFolder(FileSystem.Downloads),
			mode: 1,
			filter: "",
			title: "Batch Install",
			message: "Select a folder containing LWZ files for one or more instruments.",
			buttonText: "Ok",
			hideOnSubmit: true,
		}, function(dir)
		{
			var files = FileSystem.findFiles(dir, "*.lwz", false);
			
			if (!files.length)
				return Engine.showMessageBox("No Files", "No lwz files were found in the selected folder.", 1);

			show();
			Installer.bulkInstall(dir);
		});
	}
	
	inline function show()
	{
		pnlManualInstallerContainer.showControl(true);
	}
	
	inline function hide()
	{
		pnlManualInstallerContainer.showControl(false);
	}
	
	//! Broadcasters
	const bcMenuValue = Engine.createBroadcaster({id: "bcManualInstallerMenuValue", args: ["component", "value"]});
	bcMenuValue.attachToComponentValue("cmbMenu", "");

	bcMenuValue.addListener(0, "React to menu selection", function(component, value)
	{
		if (component.getItemText().toLowerCase() == "install instrument from lwz file")
			return showFileBrowser();

		if (component.getItemText().toLowerCase() == "install instruments from folder")
			return showDirectoryBrowser();
	});

	//! bcProgressVisiblity
	const bcProgressVisibility = Engine.createBroadcaster({id: "bcProgressVisibility", args: ["component", "isVisible"]});
	bcProgressVisibility.attachToComponentVisibility(["pnlProgress0"], "");

	bcProgressVisibility.addListener(0, "Hide the manual installer page when the progress bar is hidden", function(component, isVisible)
	{
		if (!isVisible)
			hide();
	});
}
