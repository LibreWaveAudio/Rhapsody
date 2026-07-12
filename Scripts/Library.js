/*
    Copyright 2023, 2024 David Healey

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

namespace Library
{
	const appData = FileSystem.getFolder(FileSystem.AppData);

	reg cache = appData.createDirectory("cache");
	
	//! btnAdd
	const btnAdd = Content.getComponent("btnAdd");
	btnAdd.setControlCallback(onbtnAddControl);
	
	inline function onbtnAddControl(component, value)
	{
		if (!value)
			Installer.install();
	}
		
	const lafbtnAdd = Content.createLocalLookAndFeel();
	btnAdd.setLocalLookAndFeel(lafbtnAdd);
	
	lafbtnAdd.registerFunction("drawToggleButton", function(g, obj)
	{
		var a = obj.area;

		g.setColour(Colours.withAlpha(obj.itemColour1, obj.over ? 1.0 - 0.2 * obj.down : 0.9));
		g.fillPath(Paths.icons.add, [a[0], a[3] / 2 - 12 / 2, 12, 12]);
		
		g.setFont("regular", 18);
		g.drawAlignedText(obj.text, a, "right");
	});

	// Functions
	inline function getCombinedCacheAndManifestData()
	{
		local manifest = loadManifest();
		local f = cache.getChildFile("cache.json");
		local result = [];

		if (isDefined(f) && f.isFile())
			result = f.loadEncryptedObject(App.systemId);

		if (!isDefined(manifest))
			return result;
			
		for (projectName in manifest)
		{
			local item;
		
			for (x in result)
			{
				if (x.projectName == projectName)
				{
					item = x;
					break;
				}					
			}
		
			if (!isDefined(item) && isDefined(manifest[projectName].format))
			{
				item = {"projectName": projectName, "name": projectName, "source": "offline"};
				result.push(item);
			}
		
			if (!isDefined(item))
				continue;
			
			for (key in manifest[projectName])
				item[key] = manifest[projectName][key];
				
			if (isDefined(item.installedVersion) && item.latestVersion > item.installedVersion)
				item.hasUpdate = true;
		}
		
		return result;
	}

	inline function updateCatalogue()
	{
		local items = [];
		local localData = getCombinedCacheAndManifestData();
		local installedExpansions = Expansions.getInstalledExpansionsData();

		for (expName in installedExpansions)
			items.push(installedExpansions[expName]);

		if (!localData.length)
			return Grid.update(items);

		for (x in localData)
		{
			if (!isDefined(x.format) || !isDefined(x.projectName) || isDefined(x.hidden)) continue;

			if (!isDefined(x.tags) || x.tags == "")
				x.tags = [];

			x.tags.push("licensed");

			if (!isDefined(installedExpansions[x.projectName]))
			{
				items.push(x);
				continue;
			}

			local e = installedExpansions[x.projectName];
			local index = items.indexOf(e);
			local item = items[index];

			for (property in x)
			{
				if (property == "tags")
				{
					mergeTags(item, x);
					continue;
				}

				item[property] = x[property];
			}

			if (item.latestVersion > item.installedVersion)
				item.hasUpdate = true;
		}

		Grid.update(items);
	}

	inline function mergeTags(obj1, obj2)	
	{
		if (!isDefined(obj2["tags"]) || !Array.isArray(obj2["tags"]))
			return;	

		if (!isDefined(obj1["tags"]))
			return obj1["tags"] = obj2["tags"];

		for (t in obj2["tags"])
			obj1["tags"].pushIfNotAlreadyThere(t);
	}

	inline function clearCache()
	{
		if (isDefined(cache) && cache.isDirectory())
			cache.deleteFileOrDirectory();

		cache = appData.createDirectory("cache");
	}

	inline function toggleFavourite(projectName)
	{
		local value = getManifestValue(projectName, "favourite");
		
		if (isDefined(value))
			value = !value;
		else
			value = 1;	

		setManifestValue(projectName, "favourite", value);

		return value;
	}

	inline function getManifestValue(projectName, key)
	{
		local obj = loadManifest();
				
		return obj[projectName][key];
	}

	inline function setManifestValue(projectName, key, value)
	{
		local obj = loadManifest();
		local f = appData.getChildFile("manifest.json");

		if (!isDefined(obj[projectName]))
			obj[projectName] = {};
			
		obj[projectName][key] = value;

		f.writeObject(obj);
	}

	inline function removeManifestEntry(projectName)
	{
		local obj = loadManifest();
		local f = appData.getChildFile("manifest.json");
		local newObj = {};
		
		for (x in obj)
		{
			if (x == projectName)
				continue;
				
			newObj[x] = obj[x];
		}

		f.writeObject(newObj);
	}

	inline function loadManifest()
	{
		local f = appData.getChildFile("manifest.json");
		local obj = {};
		
		if (isDefined(f) && f.isFile())
			obj = f.loadAsObject();
			
		return obj;
	}
	
	// Calls
	updateCatalogue();
}