/*
    Copyright 2026 David Healey

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

namespace LegacyInstaller
{
	const appData = FileSystem.getFolder(FileSystem.AppData);
	
	reg abort;
	reg extractionCount;
	reg numZips;

	inline function install(archive: ScriptObject)
	{
		local filename = archive.toString(archive.Filename);

		if (filename.contains("_plugin_"))
			return Engine.showMessageBox("Invalid Archive", "Rhapsody only supports instruments, not plugins.", 0);

		local expansionName = getExpansionNameFromFilename(filename);

		if (expansionName == "")
			return Engine.showMessageBox("Invalid Archive", "Unable to determine product name.", 0);

		local archives = getArchivesForExpansion(archive.getParentDirectory(), expansionName);

		promptForSampleFolder(archives);
	}	

	inline function promptForSampleFolder(archives: Array)
	{		
		local startFolder;
		local lastFolder = UserSettings.getProperty("rhapsody", "lastSampleFolder");		

		if (isDefined(lastFolder))
			startFolder = FileSystem.fromAbsolutePath(lastFolder);

		if (!isDefined(startFolder) || !startFolder.isDirectory())
			startFolder = FileSystem.getFolder(FileSystem.UserHome);

		FilePicker.show({
			startFolder: startFolder,
			mode: 1,
			filter: "",
			title: "Install",
			message: "Choose a folder to install the samples to.",
			buttonText: "Install",
			forWriting: true,
			bytesRequired: getBytesForArchives(archives),
			data: {archives: archives}
		}, function(dir, data)
		{
			promptForSampleFolderCallback(data.archives, dir);
		});
	}
	
	inline function promptForSampleFolderCallback(archives: Array, sampleFolder: ScriptObject)
	{
		local filename = archives[0].toString(archives[0].Filename);
		local expansionName = getExpansionNameFromFilename(filename);
		local dir = Expansions.getExpansionNamedSubFolder(expansionName, sampleFolder);

		if (!dir.hasWriteAccess() || !dir.isDirectory())
			return Engine.showMessageBox("Unwritable Directory", "Rhapsody is unable to write to the selected folder.", 1);
			
		UserSettings.setProperty("rhapsody", "lastSampleFolder", dir.getParentDirectory().toString(dir.FullPath));

		unpackArchives(archives, dir, expansionName);
		createLinkFile(expansionName, dir);
	}

	inline function unpackArchives(archives: Array, sampleFolder: ScriptObject, expansionName: string)
	{
		abort = false;
		extractionCount = 0;
		numZips = archives.length;

		local dataFolder = getExpansionDataDirectory(expansionName);
		
		Engine.sortWithFunction(archives, sortFiles);
	
		for (x in archives)
		{
			local filename = x.toString(x.Filename);				
			local targetDir;

			if (filename.contains("_data_"))
				targetDir = dataFolder;				
			else if (filename.contains("_samples_"))
				targetDir = sampleFolder;

			if (abort)
				return;

			x.extractZipFile(targetDir, true, function(obj)
			{
				extractionCallback(obj);
			});
		}		
	}
	
	inline function extractionCallback(obj: JSON)
	{
		obj.Cancel = (obj.Error != "" || abort);
				
		Expansions.broadcasters.installationProgress.sendAsyncMessage([
			obj.Progress,
			obj.CurrentFile,
			"Installing: " + (extractionCount + 1) + "/" + numZips
		]);
				
		if (obj.Status != 2)
			return;
		
		extractionCount++;

		if (extractionCount < numZips)
			return;

		Expansions.refresh();
	}

	inline function sortFiles(a, b)
	{
		if (a.toString(a.Filename) < b.toString(b.Filename))
			return -1;
		else
			return a.toString(a.Filename) > b.toString(b.Filename);
	}

	inline function: number getBytesForArchives(archives: Array)
	{
		local result;
		
		for (x in archives)
			result += archives[i].getSize();

		return result;
	}

	inline function: Array getArchivesForExpansion(dir: ScriptObject, expansionName: string)
	{
		local formattedName = expansionName.toLowerCase().replace(" ", "_");
		local result = FileSystem.findFiles(dir, formattedName + "*.lwz", false);
		return result;
	}

	inline function: string getExpansionNameFromFilename(filename: string)
	{
		local matches = Engine.getRegexMatches(filename, ".+data|.+samples");
	
		if (isDefined(matches))
			return matches[0].replace("_data").replace("_samples").replace("_", " ").trim().capitalize();

		return "";
	}	

	inline function: string getVersionFromFilename(filename: string)
	{
		local version = Engine.getRegexMatches(filename, "\\d_\\d_\\d")[0];

		if (isDefined(version))
			return version.replace("_", ".");

		return "";
	}

	inline function createLinkFile(expansionName: string, sampleFolder: ScriptObject)
	{
		local linkFile;

		switch (Engine.getOS())
		{
			case "OSX": linkFile = "LinkOSX"; break;
			case "LINUX": linkFile = "LinkLinux"; break;
			case "WIN": linkFile = "LinkWindows"; break;
		}

		local f = getRhapsodyExpansionsDirectory().createDirectory(expansionName).createDirectory("Samples").getChildFile(linkFile);

		if (isDefined(f) && isDefined(sampleFolder) && sampleFolder.isDirectory())
			f.writeString(sampleFolder.toString(f.FullPath));
	}

	inline function: ScriptObject getExpansionDataDirectory(expansionName: string)
	{
		return getRhapsodyExpansionsDirectory().createDirectory(expansionName);
	}	

	inline function: ScriptObject getRhapsodyExpansionsDirectory()
	{
		return appData.createDirectory("Expansions");
	}	
}
