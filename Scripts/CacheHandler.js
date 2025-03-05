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

namespace CacheHandler
{
	reg cache = readCache();

	inline function: Array readCache()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("cache/cache.json");
	
		if (f.isFile())
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
	
	inline function: Array getCache()
	{
		return cache;
	}
	
	inline function: Array getCachedImageNames()
	{
		local result = [];	
		local files = FileSystem.findFiles(getCacheDirectory(), "*.jpg", false);
	
		for (x in files)
			result.push(x.toString(x.NoExtension));
	
		return result;
	}
	
	inline function: ScriptObject getCacheDirectory()
	{
		return FileSystem.getFolder(FileSystem.AppData).createDirectory("cache");
	}
	
	inline function: object getProjectByProductId(productId: number)
	{
		for (x in cache)
		{
			if (x.id == productId)
				return x;
		}
		
		return {};
	}
	
	inline function: object getProject(projectName: string)
	{
		for (x in cache)
		{
			if (x.projectName == projectName)
				return x;
		}
		
		return {};
	}
	
	inline function: object getObject(projectName: string, variantName: string)
	{	
		for (x in cache)
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
		local result = [];

		local obj = getProject(projectName);

		if (!isDefined(obj.variants))
			return result;

		for (x in obj.variants)
		{
			if (isDefined(x.hasLicense) && x.hasLicense)
				result.push(x);
		}

		return result;
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

	inline function: string getLatestVersion(projectName: string, variantName: string)
	{
		local obj = getObject(projectName, variantName);

		if (isDefined(obj.latestVersion))
			return obj.latestVersion;

		return "";
	}
}
