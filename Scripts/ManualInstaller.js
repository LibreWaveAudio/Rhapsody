/*
    Copyright 2025, 2026 David Healey

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
	//! btnManualInstall
	const btnManualInstall = Content.getComponent("btnManualInstall");
	btnManualInstall.setLocalLookAndFeel(LookAndFeel.iconButtonMomentary);
	btnManualInstall.setControlCallback(onbtnManualInstallControl);
	
	inline function onbtnManualInstallControl(component, value)
	{
		if (!value)
			promptForArchive();
	}

	//! Functions
	inline function promptForArchive()
	{
		FilePicker.show({
			startFolder: FileSystem.getFolder(FileSystem.Downloads),
			mode: 0,
			filter: "*.hr1",
			title: "Install from File",
			message: "Select a .hr1 file to install.",
			buttonText: "Ok",
			hideOnSubmit: false,
		}, function(file, data)
		{
			promptForSampleFolder(file);
		});
	}

	inline function promptForSampleFolder(archive: ScriptObject)
	{
		if (Expansions.isNewerVersionInstalled(archive))
			return Engine.showMessageBox("Version", "A newer version is already installed. Please uninstall it before continuing.", 0);

		local sampleFolder = Expansions.getSampleFolderForPackage(archive);

		if (sampleFolder.isDirectory())
		{
			FilePicker.hide();
			return Expansions.install(archive, sampleFolder);
		}

		FilePicker.show({
			startFolder: FileSystem.getFolder(FileSystem.UserHome),
			mode: 1,
			filter: "",
			title: "Install from File",
			message: "Choose a folder to install the samples to.",
			buttonText: "Install",
			forWriting: true,
			bytesRequired: archive.getSize(),
			data: {archive: archive}
		}, function(dir, data)
		{
			Expansions.install(data.archive, dir);
		});
	}
	
	//! Broadcasters
	
	//! bcbtnManualInstallVisibility
	const var bcbtnManualInstallVisibility = Engine.createBroadcaster({id: "bcbtnManualInstallVisibility", args: ["component", "isVisible"]});
	bcbtnManualInstallVisibility.attachToComponentVisibility(["pnlProductGridContainer"], "");
	
	bcbtnManualInstallVisibility.addComponentPropertyListener(["btnManualInstall"], ["visible"], "Only show manual install button when library is visible", function(index, component, isVisible)
	{
		return isVisible;
	});
	
}
