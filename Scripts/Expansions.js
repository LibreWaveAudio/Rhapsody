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
	reg isManualInstall;

	//! Expansion Handler
	const eh = Engine.createExpansionHandler();
	eh.setInstallFullDynamics(true);

	eh.setInstallCallback(function(obj)
	{
		broadcasters.installationProgress.sendAsyncMessage([
			obj.TotalProgress,
			eh.getMetaDataFromPackage(obj.SourceFile).Name,
			Engine.getPreloadMessage()
		]);

		if (obj.Status == 2 && isDefined(obj.Expansion))
		{
			var archive = obj.SourceFile;
			var name = obj.Expansion.getProperties().Name;

			refresh();
	    	broadcasters.isInstalling.state = false;

	    	if (!isManualInstall)
	    	{
		    	Engine.showMessageBox("Success", "Installation of " + name + " finished successfully.", 0);
		    	return deleteArchives(archive);
	    	}		    	

	    	Engine.showYesNoWindow("Installation Complete", "Do you want to delete the hr archive file?", function[archive](response)
	    	{
	    	    if (response)	    	    
	    	        deleteArchives(archive);
	    	});
		}
	});

	eh.setErrorFunction(function(message, isCritical)
	{
		Spinner.hide();
		Engine.showMessageBox("Error", message, 1);
	});

	inline function getList()
	{
		eh.refreshExpansions();
		return eh.getExpansionList();
	}

	inline function: string getImageForPackage(file: ScriptObject)
	{
		local e = eh.getExpansionForInstallPackage(file);
		
		if (isDefined(e))
			return getIcon(e);

		local imgDir = FileSystem.getFolder(FileSystem.AppData).getChildFile("Images");

		if (!imgDir.isDirectory())
			return "";

		local data = eh.getMetaDataFromPackage(file);
		local name = data.Name;
		local company = data.Company;
		local img = imgDir.getChildFile(company + "_" + name + ".jpg");

		if (!img.isFile())
			img = imgDir.getChildFile(name + ".jpg");

		if (!img.isFile())
			return "";

		return img.toString(img.FullPath);
	}

	inline function: string getIcon(expansion: ScriptObject)
	{
		return expansion.getWildcardReference("Icon.png");
	}
	
	inline function install(archive: ScriptObject, sampleFolder: ScriptObject, isManual: number)
	{
		isManualInstall = isManual;
		broadcasters.isInstalling.state = true;
				
		if (archive.toString(archive.Extension).contains(".hr"))
			return eh.installExpansionFromPackage(archive, sampleFolder);

		Engine.showMessageBox("Invalid Format", "Archive format was not recognised.", 0);
		broadcasters.isInstalling.state = false;
	}
	
	inline function: ScriptObject getSampleFolderForPackage(file: ScriptObject)
	{
		local e = eh.getExpansionForInstallPackage(file);

		if (isDefined(e))
			return e.getSampleFolder();

		return file.getNonExistentSibling();
	}
	
	inline function: ScriptObject getSampleFolder(company: string, name: string)
	{
		local e = getExpansion(company, name);

		if (isDefined(e))
			return e.getSampleFolder();

		return FileSystem.getFolder(FileSystem.AppData).getNonExistentSibling();
	}
	
	inline function: number setSampleFolder(company: string, name: string, newSampleFolder: ScriptObject)
	{
		local e = getExpansion(company, name);
	
		if (!isDefined(e))
			return false;
	
		return e.setSampleFolder(newSampleFolder)
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
	
	inline function uninstallContent(expansion: ScriptObject)
	{
		local sampleFolder = expansion.getSampleFolder();

		if (!sampleFolder.isDirectory())
			return;

		if (sampleFolder.getParentDirectory().getChildFile("project_info.xml").isFile())
			return;

		local sampleMaps = expansion.getSampleMapList();
		local files = FileSystem.findFiles(sampleFolder, "*.ch*", false);

		for (x in files)
		{
			if (sampleMaps.contains(x.toString(x.NoExtension)))
				x.deleteFileOrDirectory();
		}			

		files = FileSystem.findFiles(sampleFolder, "*", true);

		if (!files.length)
			sampleFolder.deleteFileOrDirectory();
	}

	inline function uninstallData(expansion: ScriptObject, removePresets: number)
	{
		local expansionRoot = expansion.getRootFolder();
		
		local files = FileSystem.findFiles(expansionRoot, "*", false);

		if (removePreset)
			return expansionRoot.deleteFileOrDirectory();

		for (x in files)
		{
			if (removePresets && x.toString(x.NoExtension) == "UserPresets")
				continue;

			x.deleteFileOrDirectory();
		}
	}

	inline function uninstallCleanUp(expansion: ScriptObject)
	{
		local expansionName = expansion.getProperties().Name;

		Engine.showMessageBox("Complete", expansionName + " has been uninstalled.", 0);

		expansion.unloadExpansion();
		refresh();
	}

	inline function getExpansion(company: string, name: string)
	{
		for (x in eh.getExpansionList())
		{
			local properties = x.getProperties();

			if (properties.Company.toLowerCase() == company.toLowerCase() && properties.Name.toLowerCase() == name.toLowerCase())
				return x;
		}

		return undefined;
	}
	
	inline function refresh()
	{
		eh.refreshExpansions();
	
		for (e in eh.getExpansionList())
		{
			e.setAllowDuplicateSamples(false);
			e.rebuildUserPresets();
		}
		
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
	
	inline function deleteArchives(hr1: ScriptObject)
	{
		if (!hr1.isFile())
			return;

		local files = FileSystem.findFiles(hr1.getParentDirectory(), hr1.toString(hr1.NoExtension) + "*.hr*", false);

		for (x in files)
			x.deleteFileOrDirectory();
	}

	inline function relocateSamples(expansion: ScriptObject, dir: ScriptObject)
	{
		local missingSamples = getMissingSamples(expansion, dir);

		if (missingSamples.length > 0)
		{			
			if (missingSamples.length > 5)
				return Engine.showMessageBox("Failed", "The selected folder is missing some samples.", 3);
			
			local list = missingSamples.join(".ch1  ");
			
			return Engine.showMessageBox("Failed", "The selected folder is missing some samples:  " + list + ".ch1", 3);
		}

		local company = expansion.getProperties().Company;
		local name = expansion.getProperties().Name;

		if (setSampleFolder(company, name, dir))
			Engine.showMessageBox("Success", "Sample folder relocated successfully. Please restart Rhapsody.", 0);
		else
			Engine.showMessageBox("Failed", "Failed to relocate the sample folder. Please try a different folder.", 0);

		refresh();
	}
		
	inline function setCurrent(company: string, name: string)
	{
		local e = getExpansion(company, name);
	
		if (!isDefined(e.getProperties()))
			return Engine.showMessageBox("Error", "The selected instrument could not be found.", 2);
		
		//if (!getMissingSamples(e, e.getSampleFolder()).length)
		//{
			if (Engine.isHISE())
				return Console.print(company + " : " + name);

			//Spinner.setText("Launching " + name);
			//Spinner.show();

			return eh.setCurrentExpansion(e);
		//}
	
		return Engine.showYesNoWindow("Missing Samples", "Some samples could not be found. Click OK to set the correct samples folder.", function[e](response)
		{
			if (response)
				edit(e);
		});
	}
	
	inline function: Array getMissingSamples(expansion: ScriptObject, dir: ScriptObject)
	{	
		local result = [];

		local sampleMaps = expansion.getSampleMapList();
		
		if (!sampleMaps.length)
			return result;

		local files = FileSystem.findFiles(dir, "*.ch*", false);

		local monoliths = [];

		for (x in files)
			monoliths.pushIfNotAlreadyThere(x.toString(x.NoExtension));

		for (x in sampleMaps)
		{
			if (!monoliths.contains(x))
				result.push(x);
		}

		return result;
	}
		
	inline function allowDuplicateSamples()
	{
		for (e in eh.getExpansionList())
			e.setAllowDuplicateSamples(false);
	}

	inline function: string isInstallable(company: string, name: string, latestVersion: string)
	{
		local expansion = getExpansion(company, name);
	
		if (!isDefined(expansion))
			return "install";

		if (versionCompare(latestVersion, expansion.getProperties().Version) == 1)
			return "update";
	
		return "";
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

	//! Broadcasters
	const broadcasters = {};
	broadcasters.installationProgress = Engine.createBroadcaster({id: "installationProgress", args: ["progress", "title", "message"]});
	broadcasters.isInstalling = Engine.createBroadcaster({id: "isInstalling", args: ["state"]});

	//! Function Calls
	allowDuplicateSamples();
}