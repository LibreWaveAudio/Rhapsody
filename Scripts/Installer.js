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

namespace Installer
{
	reg extractionCount;
	reg numArchives;
	reg abort;

	inline function manualInstall()
	{
		local lastLwzPath = UserSettings.getProperty("rhapsody", "lastLwzPath");
		local startFolder = FileSystem.getFolder(FileSystem.Downloads);

		if (isDefined(lastLwzPath) && lastLwzPath != "")
			startFolder = FileSystem.fromAbsolutePath(lastLwzPath);

		FilePicker.show({
			startFolder: startFolder,
			mode: 0,
			filter: "*.lwz",
			title: "Install from File",
			message: "Please select one of the .lwz files you downloaded.",
			buttonText: "Next",
			hideOnSubmit: false,
			}, selectArchiveCallback);
	}

	inline function selectArchiveCallback(file: object, data: object)
	{
		local filename = file.toString(file.Filename);
		local productName = getProductNameFromFilename(filename);

		if (productName == "")
			return;

		Progress.set("title", "Installing " + productName);
		UserSettings.setProperty("rhapsody", "lastLwzPath", file.getParentDirectory().toString(file.FullPath));
	
		local archives = getArchivesForProduct(file.getParentDirectory(), productName);
		local tempDir = FileSystem.getFolder(FileSystem.Temp).createDirectory("Libre Wave").createDirectory(productName);
		local e = Expansions.getExpansion(productName);

		if (isDefined(e) && isDefined(getSamplesDirectory(productName)))
			extractArchives(archives, tempDir);
		else
			askForSampleDirectory(archives, productName, tempDir);
	}

	inline function askForSampleDirectory(archives: Array, productName: string, tempDir: object)
	{
		local defaultSamplePath = UserSettings.getProperty("rhapsody", "defaultSamplePath");
		local startFolder = FileSystem.getFolder(FileSystem.Desktop);

		if (isDefined(defaultSamplePath) && defaultSamplePath != "")
			startFolder = FileSystem.fromAbsolutePath(defaultSamplePath);

		FilePicker.show({
			startFolder: startFolder,
			mode: 1,
			filter: "",
			title: "Install from File",
			message: "Choose a location to install the samples.",
			buttonText: "Install",
			data: {"archives": archives, "productName": productName, "tempDir": tempDir}
		}, askForSampleDirectoryCallback);
	}

	inline function askForSampleDirectoryCallback(dir: object, data: object)
	{
		local sampleDir = dir;

		if (!sampleDir.hasWriteAccess())
			return Engine.showMessageBox("Unwritable Directory", "You do not have permission to write to the selected location. Please choose a different one.", 1);
		
		if (sampleDir.toString(sampleDir.NoExtension) != data.productName)
			sampleDir = sampleDir.createDirectory(data.productName);

		if (isDefined(sampleDir) && sampleDir.isDirectory())	
			UserSettings.setProperty("rhapsody", "defaultSamplePath", sampleDir.getParentDirectory().toString(sampleDir.FullPath));
		
		updateLinkFile(data.productName, sampleDir);			
		extractArchives(data.archives, data.tempDir);
	}

	inline function extractArchives(archives: Array, directory: object)
	{
		abort = false;
		numArchives = archives.length;
		extractionCount = 0;

		FilePicker.hide();

		Engine.sortWithFunction(archives, sortFiles);

		for (x in archives)
		{
			if (abort)
				return;

			extractArchive(x, directory);
		}
	}

	inline function extractArchive(file: object, directory: object)
	{
		if (!file.isFile())
			return;

		file.extractZipFile(directory, true, function(obj)
		{		
			obj.Cancel = (obj.Error != "" || abort);

			if (obj.Cancel)
				Engine.setPreloadMessage("Cancelled: Finishing Current File.");
			else
				Engine.setPreloadMessage("Extracting Archive " + (extractionCount + 1) + " of " + numArchives + ".");

			if (obj.Status != 2)
				return;

			extractionCount++;

			if (extractionCount < numArchives)
				return;
			
			var tempDir = FileSystem.fromAbsolutePath(obj.Target);
			
			if (obj.Cancel)
				tempDir.deleteFileOrDirectory();
			else			
				moveFiles(tempDir);
		});
	}
		
	inline function moveFiles(directory: object)
	{
		if (!directory.isDirectory())
			return;

		local reportError = false;
		local productName = directory.toString(directory.NoExtension);
		local files = FileSystem.findFiles(directory, "*", false);
		local dataDir = getExpansionDirectory(productName);
		local samplesDir = getSamplesDirectory(productName);

		if (isDefined(dataDir) && !dataDir.hasWriteAccess())
			return Engine.showMessageBox("Installation Failed", "The target folder " + dataDir.toString(dataDir.FullPath) + " cannot be written to.", 1);

		if (isDefined(samplesDir) && !samplesDir.hasWriteAccess())
			return Engine.showMessageBox("Installation Failed", "The target folder " + samplesDir.toString(samplesDir.FullPath) + " cannot be written to.", 1);

		for (x in files)
		{
			local filename = x.toString(x.Filename);
			local ext = x.toString(x.Extension);
			local success = false;
			local targetDir;

			if (ext.contains(".ch") || ["audio", "wav", "midi", "loop", "video"].contains(filename.toLowerCase()))
				targetDir = samplesDir;
			else
				targetDir = dataDir;

			if (!isDefined(targetDir))
				continue;

			if (x.isDirectory())
				success = x.copyDirectory(targetDir.createDirectory(filename));
			else
				success = x.copy(targetDir.getChildFile(filename));

			if (success)
				x.deleteFileOrDirectory();
			else
				reportError = true;
		}

		directory.deleteFileOrDirectory();

		if (reportError)
			return Engine.showMessageBox("Installation Complete", "The installation finished but not all files could be copied. Please contact support.", 1);
	}
	
	inline function: Array getArchivesForProduct(directory: object, productName: string)
	{
		local formattedName = productName.toLowerCase().replace(" ", "_");
		return FileSystem.findFiles(directory, formattedName + "*.lwz", false);
	}

	inline function getSamplesDirectory(productName: string)
	{
		local linkFile = getLinkFile(productName);
		local path = linkFile.loadAsString();
		
		if (isDefined(path) && path != "")
			return FileSystem.fromAbsolutePath(path);

		return;
	}

	inline function getExpansionDirectory(productName: string)
	{
		local appData = FileSystem.getFolder(FileSystem.AppData);
		return appData.createDirectory("Expansions").createDirectory(productName);
	}

	inline function: string getProductNameFromFilename(filename: string)
	{
		local matches = Engine.getRegexMatches(filename, ".+data|.+samples");

		if (isDefined(matches))
			return matches[0].replace("_data").replace("_samples").replace("_", " ").trim().capitalize();

		return "";
	}

	inline function getLinkFile(productName: string)
	{
		local linkFile;
		local expDir = getExpansionDirectory(productName);

		switch (Engine.getOS())
		{
			case "OSX": linkFile = "LinkOSX"; break;
			case "LINUX": linkFile = "LinkLinux"; break;
			case "WIN": linkFile = "LinkWindows"; break;
		}

		return expDir.createDirectory("Samples").getChildFile(linkFile);
	}
	
	inline function updateLinkFile(productName: string, target: object)
	{
		local f = getLinkFile(productName);
		
		if (isDefined(f) && isDefined(target) && target.isDirectory())
			f.writeString(target.toString(f.FullPath));
	}
	
	inline function: number sortFiles(a: object, b: object)
	{
		if (a.toString(a.Filename) < b.toString(b.Filename))
			return -1;
		else
			return a.toString(a.Filename) > b.toString(b.Filename);
	}
	
	//! Broadcasters
	const bcAbortButtonValue = Engine.createBroadcaster({"id": "bcAbortButtonValue", "args": ["component", "value"]});
	bcAbortButtonValue.attachToComponentValue("btnProgressCancel", "");

	bcAbortButtonValue.addListener(0, "Cancel installation when abort button pressed.", function(component, value)
	{
		if (!value)
			return;

		Engine.showYesNoWindow("Confirm", "Are you sure you want to cancel the installation?", function(response)
		{
			if (!response)
				return;

			abort = true;
		});
	});	
}
