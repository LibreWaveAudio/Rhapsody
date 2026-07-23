/*
    Copyright 2022, 2023, 2024, 2025, 2026 David Healey

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
	const list = [];

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

			obj.Expansion.rebuildUserPresets();
			removeFromCache(obj.Expansion);
			refresh();

	    	Engine.showYesNoWindow("Installation Complete", "Do you want to delete the hr file?", function[archive](response)
	    	{
	    	    if (response)	    	    
	    	        deleteArchives(archive);
	    	});
		}

		if (obj.Status == 3)
			Engine.showMessageBox("Cancelled", "The installation was cancelled", 0);
	});

	eh.setErrorFunction(function(message, isCritical)
	{
		broadcasters.isLoadingExpansion.sendSyncMessage(["", false]);
		Engine.showMessageBox("Error", message, 1);
	});

	inline function rebuildList()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("Cache.json");
		local cache = f.isFile() ? f.loadAsObject() : [];

		list.clear();

		eh.refreshExpansions();

		for (e in eh.getExpansionList())
		{
			local props = e.getProperties();

			local data = {
				name: props.Name,
				uuid: props.UUID,
				company: props.Company,
				companyUrl: props.CompanyURL,
				version: props.Version,
				tags: props.Tags,
				description: props.Description,
				icon: e.getWildcardReference("Icon.png")
			};

			local hasUpdate;

			for (k in cache)
			{
				if (data.uuid != "" && k.uuid == data.uuid)
					hasUpdate = isDefined(k.hasUpdate) && k.hasUpdate;
				else if (k.company == data.company && k.name.toLowerCase() == data.name.toLowerCase())
					hasUpdate = isDefined(k.hasUpdate) && k.hasUpdate;

				if (isDefined(hasUpdate))
					break;
			}

			data.hasUpdate = isDefined(hasUpdate) && hasUpdate;

			list.push(data);
		}
	}

	inline function getList()
	{
		return list;
	}

	inline function install(archive: ScriptObject, sampleFolder: ScriptObject)
	{
		local ext = archive.toString(archive.Extension);

		if (!ext.contains(".hr"))
			return Engine.showMessageBox("Invalid Format", "Archive format was not recognised.", 0);

		local data = eh.getMetaDataFromPackage(archive);
		local dir = getExpansionNamedSubFolder(data.Name, sampleFolder);	

		if (!dir.isDirectory())
			return;

		UserSettings.setProperty("rhapsody", "lastSampleFolder", dir.getParentDirectory().toString(dir.FullPath));

		return eh.installExpansionFromPackage(archive, dir);		
	}

	inline function: ScriptObject getExpansionNamedSubFolder(name: string, dir: ScriptObject)
	{
		local folderName = dir.toString(dir.NoExtension).toLowerCase().replace(" ").replace("_").replace("-");

		if (folderName != name.toLowerCase().replace(" ").replace("_").replace("-"))
			return dir.createDirectory(name);

		return dir;
	}

	inline function: ScriptObject getSampleFolderForPackage(archive: ScriptObject)
	{
		local e = eh.getExpansionForInstallPackage(archive);

		if (isDefined(e))
			return e.getSampleFolder();

		return archive.getNonExistentSibling();
	}
	
	inline function: number isNewerVersionInstalled(archive: ScriptObject)
	{
		local e = eh.getExpansionForInstallPackage(archive);
		
		if (!isDefined(e))
			return false;

		local data = eh.getMetaDataFromPackage(archive);
		return compareVersion(e.getProperties().Version, data.Version) == 1;
	}
	
	inline function uninstall(uuid: string, company: string, name: string)
	{
		local expansion = getExpansion(uuid, company, name);

		Engine.showYesNoWindow("Uninstall", "Are you sure you want to remove " + name + "?", function[expansion, name](response1)
		{
			if (!response1)
				return;

			Engine.showYesNoWindow("Remove Presets", "Do you want to remove your custom presets?", function[expansion, name](response2)
			{
				removeFromCache(expansion);

				if (eh.removeExpansion(expansion, response2))
					Engine.showMessageBox("Complete", name + " has been uninstalled.", 0);
				else
					Engine.showMessageBox("Failed", "The uninstallation did not complete successfully.", 3);

				refresh();
			});
		});
	}

	inline function getExpansion(uuid: string, company: string, name: string)
	{
		for (x in eh.getExpansionList())
		{
			local props = x.getProperties();
			
			if (uuid != "" && props.UUID == uuid)
				return x;

			if (props.Company == company && props.Name.toLowerCase() == name.toLowerCase())
				return x;
		}

		return undefined;
	}
	
	inline function refresh()
	{
		rebuildList();
		allowDuplicateSamples();
		ProductGrid.refresh();
	}

	inline function edit(uuid: string, company: string, name: string)
	{
		local expansion = getExpansion(uuid, company, name);
		local sampleDir = expansion.getSampleFolder();

		if (!sampleDir.isDirectory())
			sampleDir = FileSystem.getFolder(FileSystem.UserHome);

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
		if (dir.isSameFileAs(expansion.getSampleFolder()))
			return Engine.showMessageBox("Success", "Sample folder relocated successfully. Please restart Rhapsody.", 0);	

		if (expansion.setSampleFolder(dir))
			Engine.showMessageBox("Success", "Sample folder relocated successfully. Please restart Rhapsody.", 0);
		else
			Engine.showMessageBox("Failed", "Failed to relocate the sample folder. Please try a different folder.", 0);

		eh.refreshExpansions();
	}
	
	inline function deleteArchives(hr1: ScriptObject)
	{
		if (!hr1.isFile())
			return;
	
		local files = FileSystem.findFiles(hr1.getParentDirectory(), hr1.toString(hr1.NoExtension) + "*.hr*", false);
	
		for (x in files)
			x.deleteFileOrDirectory();
	}

	inline function setCurrent(uuid: string, company: string, name: string)
	{
		local e = getExpansion(uuid, company, name);

		if (!isDefined(e))
			return Engine.showMessageBox("Error", "The selected instrument could not be found.", 2);

		if (Engine.isHISE())
			return Console.print(e.getProperties().Name);

		broadcasters.isLoadingExpansion.sendSyncMessage([name, true]);
		return eh.setCurrentExpansion(e);
	}
		
	inline function allowDuplicateSamples()
	{
		for (e in eh.getExpansionList())
			e.setAllowDuplicateSamples(false);
	}
	
	inline function abortInstallation()
	{
		eh.cancelInstallation();
	}
				
	inline function removeFromCache(expansion: ScriptObject)
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("Cache.json");		
		local obj = f.isFile() ? f.loadAsObject() : [];

		if (!Array.isArray(obj) || !obj.length)
			return;

		local props = expansion.getProperties();
		local entry;

		for (x in obj)
		{
			if (x.uuid != "" && x.uuid == props.UUID)
				entry = x;
			else if (x.company == props.Company && x.name.toLowerCase() == props.Name.toLowerCase())
				entry = x;

			if (isDefined(entry))
				break;
		}

		if (!isDefined(entry))
			return;

		obj.remove(entry);
		f.writeObject(obj);
	}
	
	inline function: number compareVersion(a: string, b: string)
	{
		local aParts = a.split(".");
		local bParts = b.split(".");

		for (i = 0; i < 3; i++)
		{
			local diff = parseInt(aParts[i]) - parseInt(bParts[i]);
			
			if (diff != 0)
				return diff > 0 ? 1 : -1;
		}

		return 0;
	}

	inline function listExpansions()
	{
		eh.refreshExpansions();

		for (e in eh.getExpansionList())
			Console.print(trace(e.getProperties()));
	}

	//! Broadcasters
	const broadcasters = {};
	broadcasters.installationProgress = Engine.createBroadcaster({id: "installationProgress", args: ["progress", "title", "message"]});
	broadcasters.isLoadingExpansion = Engine.createBroadcaster({id: "isLoadingExpansion", args: ["title", "isLoading"]});

	//! Function Calls
	allowDuplicateSamples();
	rebuildList();
}
