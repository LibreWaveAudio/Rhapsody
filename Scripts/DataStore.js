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


namespace DataStore
{
	reg data = [];
	reg manifest = readManifest();
	reg cache = readCache();
	
	inline function: Array getData()
	{
		return data;
	}
	
	inline function: Array readManifest()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("manifest.json");
	
		if (f.isFile())
			return f.loadAsObject();
	
		f.writeObject([]);
		
		return [];
	}
	
	inline function writeManifest()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("manifest.json");
		
		if (!f.isFile())
			return;
			
		f.writeObject(manifest);
	}
	
	inline function: Array readCache()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("cache/cache.json");
	
		if (isDefined(f) && f.isFile())
			return f.loadAsObject();
	
		f.writeObject([]);
		
		return [];
	}
	
	inline function writeCache()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("cache/cache.json");
		
		if (!f.isFile())
			return;
			
		f.writeObject(cache);
	}

	inline function setCache(data: Array)
	{
		cache = data;
		writeCache();
	}

	inline function clearCache()
	{
		Server.cleanFinishedDownloads();

		local dir = FileSystem.getFolder(FileSystem.AppData).createDirectory("cache");

		if (!dir.isDirectory())
			return;

		for (x in FileSystem.findFiles(dir, "*", false))
			x.deleteFileOrDirectory();

		UserSettings.setProperty("rhapsody", "lastSync", 0);
	}

	inline function: object getObject(projectName: string, variantName: string, fromCache: number)
	{
		local source = fromCache == 1 ? cache : manifest;

		for (x in source)
		{
			if (projectName != x.projectName)
				continue;

			if (variantName == "")
				return x;

			for (v in x.variants)
			{
				if (v.name == variantName)
					return v;
			}
		}

		return {};
	}
	
	inline function: Array getLicensedVariants(projectName: string)
	{
		
	}
	
	inline function: Array getInstallableVariants(projectName: string)
	{
		
	}

	inline function: string getCurrentVersion(projectName: string, variantName: string)
	{
		local obj = getObject(projectName, variantName, false);

		if (isDefined(obj.version))
			return obj.version;

		if (variantName == "")
			return Expansions.getInstalledVersion(projectName);
		
		return "";	
	}
	
	inline function: string getLatestVersion(projectName: string, variantName: string)
	{
		local obj = getObject(projectName, variantName, true);
		
		if (isDefined(obj.latestVersion))
			return obj.latestVersion;

		return "";
	}
	
	inline function: number isUpdatable(projectName: string, variantName: string)
	{
		local project = getObject(projectName, "", false);

		if (!isDefined(project.variants))
		{
			local installedVersion = getVersion(projectName, "");
			return versionCompare(latestVersion, installedVersion);
		}		

		for (x in project.variants)
		{
			local installedVersion = getVersion(projectName, x.name);
			
			if (versionCompare(latestVersion, installedVersion))
				return true;
		}

		return false;
	}
	
	inline function: Array mergeArrays(arr1: Array, arr2: Array)
	{
		local newArr = arr1.clone();

		for (x in arr2)
			newArr.pushIfNotAlreadyThere(x);
		
		return newArr;
	}

	inline function: number isObject(obj)
	{
		return isDefined(obj) && !Array.isArray(obj) && typeof(obj) == "object";
	}
Console.clear();



	/*inline function update()
	{
		return getCombinedCacheAndManifestData();
		/*for (x in cache.clone())
		{
			if (!isDefined(x.projectName) || isDefined(x.hidden))
				continue;

			if (!isDefined(x.tags) || x.tags == "")
				x.tags = ["licensed"];

			local expansionData = Expansions.getData(x.projectName);

			for (d in expansionData)
			{
				if (d == "tags")
					x.tags = mergeArrays(x.tags, expansionData[d]);
				else
					x[d] = expansionData[d];
			}

			data.push(x);

			if (!isDefined(x.variants))
			{
				x.isInstalled = getCurrentVersion(x.projectName, "") != "";
				x.hasUpdate = ManifestHandler.isUpdatable(x.projectName, "", x.latestVersion);
				continue;
			}

			for (v in x.variants)
			{
				if (!isDefined(v.name))
					continue;
		
				v.isInstalled = getCurrentVersion(x.projectName, v.name) != "";
				v.hasUpdate = ManifestHandler.isUpdatable(x.projectName, v.name, v.latestVersion);
		
				if (v.hasUpdate)
					x.hasUpdate = true;
		
				if (v.isInstalled)
					x.isInstalled = true;
			}

			if (!x.hasUpdate)
			{
				local manifestData = ManifestHandler.getProject(x.projectName);
				x.hasUpdate = isDefined(manifestData.variants) ? (manifestData.variants.length < CacheHandler.getLicensedVariants(x.projectName).length) : false;
			}
		}*/
		
	//	Console.print(trace(data));
//	}
}