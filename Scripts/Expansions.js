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
	const eh = Engine.createExpansionHandler();
	reg installedData = getInstalledProductData();

	inline function: ScriptObject getRhapsodyExpansionsDirectory()
	{
		local appData = FileSystem.getFolder(FileSystem.AppData);
		return appData.getParentDirectory().createDirectory("Rhapsody").createDirectory("Expansions");
	}

	inline function: object getDataDirectory(company: string, name: string)
	{
		local expansionsDirectory = getRhapsodyExpansionsDirectory();
		local directoryName = (company.replace("_") + "_" + name.replace("_")).replace(" ").toLowerCase();
		return expansionsDirectory.createDirectory(directoryName);
	}

	inline function getPresetsDirectory(company: string, name: string)
	{
		local dataDir = getDataDirectory(company, name);
		return dataDir.createDirectory("UserPresets");
	}

	inline function: object getSamplesDirectory(company: string, name: string, createIfMissing: number)
	{
		local result;
		local dir = getDataDirectory(company, name).createDirectory("Samples");
		local linkFile = dir.getChildFile(getLinkFileName());

		if (linkFile.isFile())
			result = FileSystem.fromAbsolutePath(linkFile.loadAsString());

		if (isDefined(result) && result.isDirectory())
			return result;

		if (!createIfMissing)
			return {};

		local defaultDirectory = UserSettings.getDirectory("contentPath").createDirectory(company).createDirectory(name);

		updateLinkFile(company, name, defaultDirectory);

		return defaultDirectory;
	}
	
	inline function: number updateLinkFile(company: string, name: string, target: ScriptObject)
	{
		local dir = getDataDirectory(company, name).createDirectory("Samples");
		local linkFile = dir.getChildFile(getLinkFileName());
		return linkFile.writeString(target.toString(target.FullPath));
	}

	inline function getInstalledProductData()
	{
		local result = [];
		local expDir = getRhapsodyExpansionsDirectory();
		local files = FileSystem.findFiles(expDir, "*.hxi", true);

		for (x in files)
			result.push(getPropertiesFromHxi(x));

		return result;
	}

	inline function: object getPropertiesFromHxi(hxiFile: ScriptObject)
	{
		if (hxiFile.toString(hxiFile.Extension) != ".hxi")
			return {};

		if (hxiFile.toString(hxiFile.Filename) == "info.hxi")
			return eh.getPropertiesFromHxi(hxiFile);

		local infoHxi = hxiFile.getParentDirectory().getChildFile("info.hxi");

		if (!infoHxi.isFile())
			return {};

		local expansionData = eh.getPropertiesFromHxi(infoHxi);
		local obj = hxiFile.loadAsObject();

		obj.Company = expansionData.Company;

		if (isDefined(obj.ExpansionName))
			obj.Name = obj.ExpansionName + " - " + obj.Name;

		if (!isDefined(obj.Version))
			obj.Version = expansionData.Version;

		return obj;
	}

	inline function refresh()
	{
		eh.refreshExpansions();

		for (e in eh.getExpansionList())
		{
			e.setAllowDuplicateSamples(false);
			e.rebuildUserPresets();
		}

		installedData = getInstalledProductData();
	}

	inline function: string isInstallable(company: string, name: string, latestVersion: string)
	{
		for (x in installedData)
		{
			if (x.Company.toLowerCase() != company.toLowerCase() || x.Name != name)
				continue;

			if (versionCompare(latestVersion, x.Version) == 1)
				return "update";

			return "";
		}

		return "install";
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

	inline function: number versionCompare(version1: string, version2: string)
	{
		if (version1 == version2)
		     return 0;
	
		if (version1 != "" && version2 == "")
			return 1;
	
		if (version1 == "" && version2 != "")
			return -1;
	
		local separator = version1.contains("_") ? "_" : ".";
		local v1 = version1.split(separator).map(function(x) { return parseInt(x); });
		local v2 = version2.split(separator).map(function(x) { return parseInt(x); });
	
		for (i = 0; i < 3; i++)
		{
			if (v1[i] != v2[i])
				return v1[i] > v2[i] ? 1 : -1;
		}
	
		return 0;
	}

	inline function getList()
	{
		eh.refreshExpansions();
		return eh.getExpansionList();
	}

	inline function prefixRootFolders()
	{
		eh.refreshExpansions();

		for (e in eh.getExpansionList())
		{
			local rootFolder = e.getRootFolder();
			local company = e.getProperties().Company.toLowerCase().replace(" ");
			local name = e.getProperties().Name.toLowerCase().replace(" ");
			local dirName = rootFolder.toString(rootFolder.NoExtension).toLowerCase().replace(" ", "_");
			local targetDir = getRhapsodyExpansionsDirectory().createDirectory(company + "_" + name);

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
		}

		refresh();
	}
	
	inline function uninstall(expansion: ScriptObject)
	{
		local name = expansion.getProperties().Name;

		Engine.showYesNoWindow("Uninstall", "Are you sure you want to remove " + name + "?", function[expansion](response1)
		{
			if (!response1)
				return;

			Engine.showYesNoWindow("Remove Presets", "Do you want to remove your custom presets?", function[expansion](response2)
			{
				uninstallContent(expansion);
				uninstallData(expansion, response2);
				uninstallCleanUp(expansion);
			});
		});
	}

	inline function uninstallData(expansion: ScriptObject, removePresets: number)
	{
		local company = expansion.getProperties().Company;
		local name = expansion.getProperties().Name;		
		local dir = getDataDirectory(company, name);

		if (removePresets)
			return dir.deleteFileOrDirectory();

		local files = FileSystem.findFiles(dir, "*", false);
		
		for (x in files)
		{
			local filename = x.toString(x.Filename);
			
			if (x.isDirectory() && filename.contains("Presets"))
				continue;

			x.deleteFileOrDirectory();
		}
	}

	inline function uninstallContent(expansion: ScriptObject)
	{
		local company = expansion.getProperties().Company;
		local name = expansion.getProperties().Name;		
		local dir = getSamplesDirectory(company, name, false);

		if (!isDefined(dir.Filename))
			return;
			
		if (dir.toString(dir.FullPath).toLowerCase().contains("hise/samples"))
			return;

		local installedFilenames = Manifest.getFilenames(company, name);
		local files = FileSystem.findFiles(dir, "*.ch*, *.wav, *midi*, *loop*, *video*, *document*", false);

		for (x in files)
		{
			if (!installedFilenames.length || installedFilenames.contains(x.toString(x.Filename)))
				x.deleteFileOrDirectory();
		}

		files = FileSystem.findFiles(dir, "*", true);

		if (!files.length)
			dir.deleteFileOrDirectory();
	}

	inline function uninstallCleanUp(expansion: ScriptObject)
	{
		expansion.unloadExpansion();
		refresh();

		local company = expansion.getProperties().Company;
		local name = expansion.getProperties().Name;

		Manifest.removeProduct(company, name);

		ProductGrid.refresh();
		DownloadList.refresh();
	}

	inline function edit(expansion: ScriptObject)
	{
		local name = expansion.getProperties().Name;
		local sampleDir = expansion.getSampleFolder();

		if (!sampleDir.isDirectory())
			sampleDir = FileSystem.getFolder(FileSystem.Documents);

		FilePicker.show({
			startFolder: sampleDir,
			mode: 1,
			filter: "",
			title: "Locate Samples",
			message: "Select the folder containing the .ch sample files for " + name,
			buttonText: "Ok",
			hideOnSubmit: true,
			data: expansion,
			}, function(dir, data) {
				relocateSamples(data, dir);
			});
	}

	inline function relocateSamples(expansion: ScriptObject, dir: ScriptObject)
	{
		local files = FileSystem.findFiles(dir, "*.ch*, *.wav", false);

		if (!files.length)
			return Engine.showMessageBox("Failed", "The selected folder is missing some samples.", 3);

		local company = expansion.getProperties().Company;
		local name = expansion.getProperties().Name;
		local dirToUse = dir;

		if (!dir.toString(dir.Filename).toLowerCase().replace(" ").contains(name.toLowerCase().replace(" ")))
		{
			dirToUse = dir.createDirectory(name);

			for (x in files)
				x.move(dirToUse.getChildFile(x.toString(x.Filename)));
		}

		if (updateLinkFile(company, name, dirToUse))
			Engine.showMessageBox("Success", "Sample folder relocated successfully. Please restart Rhapsody.", 0);
		else
			Engine.showMessageBox("Failed", "Failed to relocate the sample folder. Please try a different folder.", 0);

		refresh();
	}	

	inline function: string getIcon(expansion: ScriptObject)
	{
		return expansion.getWildcardReference("Icon.png");
	}

	inline function: object getExpansion(company: string, name: string)
	{		
		for (x in eh.getExpansionList())
		{
			local properties = x.getProperties();
		
			if (properties.Company == company && properties.Name == name)
				return x;
		}
		
		return {};
	}

	inline function setCurrent(company: string, name: string)
	{
		local e = getExpansion(company, name);

		if (!isDefined(e.getProperties()))
			return Engine.showMessageBox("Error", "The selected instrument could not be found.", 2);

		if (validateSamplesDirectory(e))
		{
			if (Engine.isHISE())
				return Console.print(company + " : " + name);

			return eh.setCurrentExpansion(e);
		}

		return Engine.showYesNoWindow("Missing Samples", "Some samples could not be found. Click OK to set the correct samples folder.", function[e](response)
		{
			if (response)
				edit(e);
		});
	}

	inline function: number validateSamplesDirectory(expansion: ScriptObject)
	{
		local sampleMaps = expansion.getSampleMapList();
	
		if (!sampleMaps.length && !Engine.isHISE())
			return true;

		local company = expansion.getProperties().Company;
		local name = expansion.getProperties().Name;
		local sampleDir = getSamplesDirectory(company, name, false);

		if (!isDefined(sampleDir.Filename))
			return false;

		local monoliths = FileSystem.findFiles(sampleDir, "*.ch*", false);

		if (!monoliths.length)
			return false;

		return true;
	}

	inline function allowDuplicateSamples()
	{
		for (e in eh.getExpansionList())
			e.setAllowDuplicateSamples(false);
	}

	//! Calls
	allowDuplicateSamples();
}