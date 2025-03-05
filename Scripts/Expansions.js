/*
    Copyright 2022, 2023, 2024, 2025 David Healey

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

namespace Expansions
{
	const appData = FileSystem.getFolder(FileSystem.AppData);
	const expHandler = Engine.createExpansionHandler();

	inline function: ScriptObject getRhapsodyExpansionsDirectory()
	{
		local dir = appData.getParentDirectory().createDirectory("Rhapsody").createDirectory("Expansions");

		if (dir.isDirectory())
			return dir;
			
		return {};
	}

	inline function getDataDirectory(projectName: string)
	{
		return getRhapsodyExpansionsDirectory().createDirectory(projectName);
	}
	
	inline function getPresetsDirectory(projectName: string)
	{
		local dataDir = getDataDirectory(projectName);
		return dataDir.createDirectory("UserPresets");
	}
	
	inline function getSamplesDirectory(expName)
	{
		local dataDir = getRhapsodyExpansionsDirectory().createDirectory(expName).createDirectory("Samples");
		
		if (!isDefined(dataDir) || !dataDir.isDirectory())
			return;
		
		local linkFile = dataDir.getChildFile(getLinkFileName());

		if (!isDefined(linkFile) || !linkFile.isFile())
			return;
			
		local result = FileSystem.fromAbsolutePath(linkFile.loadAsString());
		
		if (!isDefined(result) || !result.isDirectory())
			return;
			
		return result;
	}

	inline function refresh()
	{
		expHandler.refreshExpansions();

		for (e in expHandler.getExpansionList())
		{
			e.setAllowDuplicateSamples(false);
			e.rebuildUserPresets();
		}
	}
prefixRootFolders();
	inline function prefixRootFolders()
	{
		expHandler.refreshExpansions();

		for (e in expHandler.getExpansionList())
		{
			local rootFolder = e.getRootFolder();
			local companyName = e.getProperties().Company.toLowerCase().replace(" ");
			local projectName = e.getProperties().ProjectName.toLowerCase().replace(" ");
			local dirName = rootFolder.toString(rootFolder.NoExtension).toLowerCase().replace(" ", "_");
			local targetDir = getRhapsodyExpansionsDirectory().createDirectory(companyName + "_" + projectName);

			if (rootFolder.isSameFileAs(targetDir))
				continue;

			for (x in FileSystem.findFiles(rootFolder, "*", false))
			{
				local filename = x.toString(x.Filename);

				if (x.isDirectory())
					x.copyDirectory(targetDir.createDirectory(filename));
				else
					x.copy(targetDir.getChildFile(filename));
			}

			rootFolder.deleteFileOrDirectory();			
			expHandler.refreshExpansions();
		}
	}

	inline function getList()
	{
		expHandler.refreshExpansions();
		return expHandler.getExpansionList();
	}

	inline function: object parseData(expansion: ScriptObject)
	{
		local props = expansion.getProperties();
		
		local result = {
			"projectName": props.ProjectName,
			"tags": props.Tags == "" ? [] : props.Tags.split(", "),
			"company": props.Company,
			"sampleDir": expansion.getSampleFolder(),
			"installedVersion": props.Version,
			"uuid": props.UUID
		};
		
		result.tags.push("installed");
		
		return result;
	}

	inline function: object getData(projectName: string)
	{
		local e = expHandler.getExpansion(projectName);
		
		if (isDefined(e))
			return parseData(e);

		return {};
	}

	inline function: Array getAllData()
	{
		local result = [];
		
		expHandler.refreshExpansions();

		for (e in expHandler.getExpansionList())
			result.push(parseData(e));			
	
		return result;
	}

	inline function: string getVersion(projectName: string)
	{
		local e = expHandler.getExpansion(projectName);

		if (!isDefined(e))
			return "";
			
		return e.getProperties().Version;
	}
	
	inline function uninstall(projectName: string)
	{
		local e = expHandler.getExpansion(projectName);

		if (!isDefined(e))
		{
			ManifestHandler.removeEntry(projectName, "");
			Library.updateCatalogue();
			return Engine.showMessageBox("Complete", "The library has been uninstalled.", 0);
		}

		Engine.showYesNoWindow("Uninstall", "Are you sure you want to remove " + projectName + "?", function[e](response1)
		{
			if (!response1)
				return;

			Engine.showYesNoWindow("Uninstall Presets", "Do you want to remove your custom presets?", function[e](response2)
			{
				uninstallData(e, response2);
				uninstallSamples(e);
				uninstallCleanUp(e);
			});
		});
	}

	inline function uninstallData(expansion: ScriptObject, removePresets: number)
	{
		local rootFolder = expansion.getRootFolder();
		local dirName = rootFolder.toString(rootFolder.NoExtension);
		local name = expansion.getProperties().Name.toLowerCase().replace(" ", "_");

		if (!isDefined(rootFolder) || !rootFolder.isDirectory() || !dirName.contains(name))
			return;

		if (removePresets)
			return rootFolder.deleteFileOrDirectory();

		local files = FileSystem.findFiles(rootFolder, "*", false);
		
		for (x in files)
		{
			local filename = x.toString(x.Filename);
			
			if (["UserPresets", "User Presets"].contains(filename))
				continue;

			x.deleteFileOrDirectory();
		}
	}
	
	inline function uninstallSamples(expansion: ScriptObject)
	{
		local sampleDir = expansion.getSampleFolder();
		local name = expansion.getProperties().Name.toLowerCase();
		
		if (!isDefined(sampleDir) || !sampleDir.isDirectory() || sampleDir.toString(sampleDir.NoExtension).toLowerCase() != name)
			return;
	
		local files = FileSystem.findFiles(sampleDir, "*", false);
		
		for (x in files)
		{
			local extension = x.toString(x.Extension).toLowerCase();
			
			if (!extension.contains(".ch") && extension != ".wav") continue;
	
			x.deleteFileOrDirectory();
		}
		
		files = FileSystem.findFiles(sampleDir, "*", false);
	
		if (!files.length)
			sampleDir.deleteFileOrDirectory();
	}
	
	inline function uninstallCleanUp(expansion: ScriptObject)
	{
		expansion.unloadExpansion();
		expHandler.refreshExpansions();
		ManifestHandler.removeEntry(expansion.getProperties().Name, "");
		Library.updateCatalogue();
	}

	inline function edit(projectName: string)
	{
		local e = expHandler.getExpansion(projectName);

		if (!isDefined(e))
			return Engine.showMessageBox("Failed", "The library was not found on your system.", 3);

		local name = e.getProperties().Name;
		local sampleDir = e.getSampleFolder();

		if (!isDefined(sampleDir) || !sampleDir.isDirectory())
			sampleDir = FileSystem.getFolder(FileSystem.Desktop);

		FilePicker.show({
			startFolder: sampleDir,
			mode: 1,
			filter: "",
			title: "Locate Samples",
			icon: ["hdd", 60, 42],
			message: "Select the folder containing the .ch sample files for " + name,
			buttonText: "Ok",
			hideOnSubmit: true,
			data: {projectName: name}
			}, function(dir, data) {
				relocateSamples(data.projectName, dir);
			});
	}

	inline function relocateSamples(projectName: string, dir: ScriptObject)
	{
		local files = FileSystem.findFiles(dir, "*.ch*", false);
		
		if (!files.length)
			return Engine.showMessageBox("Failed", "The selected folder does not contain all the samples.", 3);

		Installer.updateLinkFile(projectName, dir);

		Engine.showMessageBox("Success", "The sample folder was relocated. Please restart Rhapsody.", 0);

		expHandler.refreshExpansions();
	}	

	inline function getImagePath(projectName: string, imgName)
	{
		local e = expHandler.getExpansion(projectName);

		if (isDefined(e))
		{
			if (imgName == "Icon")
				return e.getWildcardReference(imgName + ".png");

			if (imgName == "thumbnail")
			{
				local rootDir = e.getRootFolder();
				local f = rootDir.getChildFile(imgName + ".png");

				if (isDefined(f) && f.isFile())
					return f.toString(f.FullPath);
			}
		}

		return undefined;
	}

	inline function sortFiles(a, b)
	{
		if (a.toString(a.Filename) < b.toString(b.Filename))
			return -1;
		else
			return a.toString(a.Filename) > b.toString(b.Filename);
	}

	inline function getExpansion(projectName: string)
	{
		return expHandler.getExpansion(projectName);
	}

	inline function setCurrent(company: string, projectName: string)
	{
		local expansion;

		for (e in expHandler.getExpansionList())
		{
			local data = parseData(e);

			if (data.company == company && data.projectName == projectName)
				expansion = e;
		}

		if (!isDefined(expansion))
			return Engine.showMessageBox("Error", "The selected instrument could not be found.", 2);

		if (validateSamplesDirectory(expansion))
		{
			if (Engine.isHISE())
				return Console.print(company + " : " + projectName);
	
			expHandler.setCurrentExpansion(expansion);
		}
		
		return Engine.showYesNoWindow("Missing Samples", "Some samples could not be found. Click Ok to relocate the samples folder.", function[projectName](response)
		{
			if (response)
				edit(projectName);
		});
	}
	
	inline function: number validateSamplesDirectory(expansion: ScriptObject)
	{
		local linkFile = expansion.getRootFolder().getChildFile("Samples").getChildFile(getLinkFileName());

		if (!linkFile.isFile())
			return false;

		local sampleDir = FileSystem.fromAbsolutePath(linkFile.loadAsString());

		if (!sampleDir.isDirectory())
			return false;
			
		if (!expansion.getSampleMapList().length)
			return true;

		local ch = FileSystem.findFiles(sampleDir, "*.ch*", false);

		if (!ch.length)
			return false;

		return true;
	}

	inline function getLinkFileName()
	{	
		switch (Engine.getOS())
		{
			case "OSX": return "LinkOSX";
			case "LINUX": return "LinkLinux";
			case "WIN": return "LinkWindows";
		}
	}
	
	inline function allowDuplicateSamples()
	{
		for (e in expHandler.getExpansionList())
			e.setAllowDuplicateSamples(false);
	}
	
	//! Calls
	allowDuplicateSamples();
}