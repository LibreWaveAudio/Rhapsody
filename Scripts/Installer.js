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
	reg postInstallCallback;
	reg progressBroadcaster;

	inline function manualInstall()
	{
		local lastLwzPath = UserSettings.getProperty("rhapsody", "lastLwzPath");
		local lastFolder;
		local startFolder = FileSystem.getFolder(FileSystem.Downloads);

		if (isDefined(lastLwzPath) && lastLwzPath != "")
			lastFolder = FileSystem.fromAbsolutePath(lastLwzPath);
			
		if (isDefined(lastFolder) && lastFolder.isDirectory())
			startFolder = lastFolder;

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
		local projectName = getProjectNameFromFilename(filename);

		if (projectName == "")
			return;

		UserSettings.setProperty("rhapsody", "lastLwzPath", file.getParentDirectory().toString(file.FullPath));

		ProgressBar.set("title", "Installing " + projectName);
		ProgressBar.showCancelButton(true);
	
		local archives = getArchivesForProduct(file.getParentDirectory(), projectName);
		local tempDir = FileSystem.getFolder(FileSystem.Temp).createDirectory("Libre Wave").createDirectory(projectName);
		local e = Expansions.getExpansion(projectName);

		if (isDefined(e) && isDefined(getSamplesDirectory(projectName)))
			return extractArchives(archives, tempDir);

		local customData = {"archives": archives, "projectName": projectName, "tempDir": tempDir};

		askForSampleDirectory(customData, function(dir, obj)
		{
			extractArchives(obj.archives, obj.tempDir);
		});
	}

	inline function askForSampleDirectory(obj: object, callback: Function)
	{
		local defaultSamplePath = UserSettings.getProperty("rhapsody", "defaultSamplePath");
		local defaultFolder;
		local startFolder = FileSystem.getFolder(FileSystem.Desktop);

		if (isDefined(defaultSamplePath) && defaultSamplePath != "")
			defaultFolder = FileSystem.fromAbsolutePath(defaultSamplePath);

		if (isDefined(defaultFolder) && defaultFolder.isDirectory())
			startFolder = defaultFolder;

		FilePicker.show({
			startFolder: startFolder,
			mode: 1,
			filter: "",
			title: "Install Samples",
			message: "Choose a location to install the samples.",
			buttonText: "Install",
			data: obj,
		}, function[callback](dir, data) {

			var sampleDir = dir;

			if (!sampleDir.hasWriteAccess())
				return Engine.showMessageBox("Unwritable Directory", "You do not have permission to write to the selected location. Please choose a different one.", 1);
				
			if (!sampleDir.isOnHardDisk())
				return Engine.showMessageBox("Invalid Directory", "Please use a local folder.", 1);
			
			if (sampleDir.toString(sampleDir.NoExtension) != data.projectName)
				sampleDir = sampleDir.createDirectory(data.projectName);

			if (isDefined(sampleDir) && sampleDir.isDirectory())	
				UserSettings.setProperty("rhapsody", "defaultSamplePath", sampleDir.getParentDirectory().toString(sampleDir.FullPath));
			
			updateLinkFile(data.projectName, sampleDir);
			
			if (isDefined(callback))
				callback(sampleDir, data);
		});
	}

	inline function install(archivesDirectory: object, broadcaster: Function, callback: Function)
	{
		local archives = FileSystem.findFiles(archivesDirectory, "*.lwz", false);
		
		if (!archives.length)
			return;

		progressBroadcaster = broadcaster;
		postInstallCallback = callback;		
		extractArchives(archives, archivesDirectory);
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
				return cleanUp();

			updateManifest(x);
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

			updateProgress();

			if (obj.Status != 2)
				return;			

			extractionCount++;

			if (extractionCount < numArchives)
				return;

			ProgressBar.hide();

			var tempDir = FileSystem.fromAbsolutePath(obj.Target);

			if (obj.Cancel)
			{
				tempDir.deleteFileOrDirectory();
				cleanUp();
			}				
			else
			{
				moveFiles(tempDir);
			}				
		});
	}

	inline function: ScriptObject getHoldingDirectory()
	{
		local expansionsFolder = Expansions.getRhapsodyExpansionsDirectory();

		if (!expansionsFolder.keys().length)
			return {};

		local dir = expansionsFolder.createFolder("holding");

		if (dir.isDirectory())
			return dir;

		return {};
	}

	inline function moveFiles(directory: ScriptObject)
	{
		if (!directory.isDirectory())
			return;

		local reportError = false;
		local projectName = directory.toString(directory.NoExtension);
		local files = FileSystem.findFiles(directory, "*", false);
		local dataDir = getHoldingDirectory();
		local samplesDir = getSamplesDirectory(projectName);

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

			if ([".lwz"].contains(ext))
				continue;

			if (ext.contains(".ch") || ["audio", "wav", "midi", "loop", "video"].contains(filename.toLowerCase()))
				targetDir = samplesDir;
			else
				targetDir = dataDir;

			if (!isDefined(targetDir))
				continue;

			if (isDefined(progressBroadcaster))
				progressBroadcaster.progress = {value: 1.1, status: "Installing"};

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
				
		cleanUp();

		if (reportError)
			return Engine.showMessageBox("Installation Complete", "The installation finished but not all files could be copied. Please try again or contact support.", 1);
	}
		
	inline function updateProgress()
	{
		local statusMessage;
	
		if (!isDefined(progressBroadcaster))
		{
			ProgressBar.show();

			if (obj.Cancel)
				statusMessage = "Cancelled: Finishing Current File";
			else
				statusMessage = "Extracting Archive " + (extractionCount + 1) + " of " + numArchives;
				
			Engine.setPreloadMessage(statusMessage);
		}
		else
		{
			if (obj.Cancel)
				statusMessage = "Cancelled";
			else
				statusMessage = "Extracting " + (extractionCount + 1) + " of " + numArchives;

			progressBroadcaster.progress = {projectName: "", value: Engine.getPreloadProgress(), status: statusMessage, speed: ""};
		}
	}

	inline function cleanUp()
	{
		Expansions.refresh();
		Expansions.prefixRootFolders();
		Library.updateCatalogue();

		if (!isDefined(postInstallCallback))
			return;

		postInstallCallback();
		postInstallCallback = undefined;
		progressBroadcaster = undefined;
	}
	
	inline function: Array getArchivesForProduct(directory: object, projectName: string)
	{
		local formattedName = projectName.toLowerCase().replace(" ", "_");
		return FileSystem.findFiles(directory, formattedName + "*.lwz", false);
	}

	inline function getSamplesDirectory(projectName: string)
	{
		local linkFile = getLinkFile(projectName);
		local path = linkFile.loadAsString();
		local result;
		
		if (isDefined(path) && path != "")
			result = FileSystem.fromAbsolutePath(path);

		if (isDefined(result) && result.isDirectory())
			return result;

		return;
	}

	inline function getExpansionDirectory(projectName: string)
	{
		local appData = FileSystem.getFolder(FileSystem.AppData);
		return appData.createDirectory("Expansions").createDirectory(projectName);
	}

	inline function updateManifest(zipFile: ScriptObject)
	{
		local filename = zipFile.toString(zipFile.NoExtension);
		local projectName = getProjectNameFromFilename(filename);

		if (projectName == "")
			return;

		local zippedItems = zipFile.getZippedItemList();
		
		if (!zippedItems.length)
			return;

		local variantName = getVariantNameFromFilename(filename);
		local versionNumber = getVersionFromFilename(filename);

		ManifestHandler.updateFiles(projectName, variantName, zippedItems);
		ManifestHandler.setVersion(projectName, variantName, versionNumber, true);
	}
	
	inline function: string getVersionFromFilename(filename: string)
	{
		local version = Engine.getRegexMatches(filename, "\\d_\\d_\\d")[0];
			
		if (isDefined(version))
			return version.replace("_", ".");

		return "";		
	}
				
	inline function: string getVariantNameFromFilename(filename: string)
	{
		local matches = Engine.getRegexMatches(filename, "\\d+_\\d+_\\d+_(.*)");
				
		if (matches.length < 2)
			return "";

		return matches[1];
	}

	inline function: string getProjectNameFromFilename(filename: string)
	{
		local matches = Engine.getRegexMatches(filename, ".+data|.+samples");

		if (isDefined(matches))
			return matches[0].replace("_data").replace("_samples").replace("_", " ").trim().capitalize();

		return "";
	}

	inline function getLinkFile(projectName: string)
	{
		local linkFile;
		local expDir = getExpansionDirectory(projectName);

		switch (Engine.getOS())
		{
			case "OSX": linkFile = "LinkOSX"; break;
			case "LINUX": linkFile = "LinkLinux"; break;
			case "WIN": linkFile = "LinkWindows"; break;
		}

		return expDir.createDirectory("Samples").getChildFile(linkFile);
	}
	
	inline function updateLinkFile(projectName: string, target: object)
	{
		local f = getLinkFile(projectName);
		
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
	
	inline function abortInstallation()
	{
		abort = true;
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

			abortInstallation();
		});
	});	
}
