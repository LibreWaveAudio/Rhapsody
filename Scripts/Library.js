/*
    Copyright 2023, 2024, 2025 David Healey

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
	const catalogue = [];
	reg syncCooldown = 0;

	//! Functions
	inline function sync()
	{
		if (App.mode == "release" && Engine.getUptime() - syncCooldown < 15)
			return Engine.showMessageBox("Cool Down", "Please wait " + Math.round(15 - (Engine.getUptime() - syncCooldown)) + " seconds before syncing again.", 0);

		if (!Account.isLoggedIn())
			return Engine.showMessageBox("Login Required", "Please login to sync your account.", 0);

		if (!App.isOnline)
			return Engine.showMessageBox("Offline", "An internet connection is required.", 0);

		syncCooldown = Engine.getUptime();

		if (Content.isCtrlDown())
			CacheHandler.clearCache();

		updateCache();
	}

	inline function autoSync()
	{
		if (App.mode == "release" && Engine.getUptime() - syncCooldown < 15)
			return;	

		if (!Account.isLoggedIn())
			return;

		if (!App.isOnline)
			return;

		local lastSync = UserSettings.getProperty("rhapsody", "lastSync");
		local now = Date.getSystemTimeMs();

		if ((now - lastSync) / 86400000 > 1)
			updateCache();
		else
			updateCatalogue();
	}

	inline function updateCache()
	{
		local token = Account.readToken();
		
		if (!isDefined(token) || !App.isOnline)
			return;
			
		local endpoint = App.apiPrefix + "get_catalogue/";
		local headers = ["Authorization: Bearer " + token];
		local p = {};
		
		Server.setBaseURL(App.baseUrl[App.mode]);
		Server.setHttpHeader(headers.join("\n"));
		
		Spinner.show("Syncing with Server");
		
		Server.callWithGET(endpoint, p, function(status, response)
		{
			if (status == 200 && typeof response == "object" && response.length > 0)
			{
				handleSyncResponse(response);
			}				
			else
			{
				if (isDefined(response.message) && response.message.contains("You are not currently logged in"))
					Account.autoLogout();
					
				if (isDefined(response.message))
					Engine.showMessageBox("Error", response.message, 3);
				else
					Engine.showMessageBox("Error", "The server reported an error, please try again later or contact support.", 3);
			}

			Spinner.hide();
		});
	}
	
	inline function handleSyncResponse(response: Array)
	{
		CacheHandler.setCache(response);
		updateCatalogue();

		local cachedImages = CacheHandler.getCachedImageNames();
		local imageUrls = getMissingImageUrls(response, cachedImages);

		if (!cachedImages.length || imageUrls.length > 25)
			downloadZippedImages();
		else
			downloadIndividualImages(imageUrls);

		UserSettings.setProperty("rhapsody", "lastSync", Date.getSystemTimeMs());
	}

	inline function updateItem(projectName: string)
	{
		local data = getCatalogueItem(projectName, "");
		local manifestData = ManifestHandler.getObject(projectName, "");
		local cacheData = CacheHandler.getObject(projectName, "");
		local expansionData = Expansions.getData(projectName);
		local newData = deepMergeArrays([[manifestData], [cacheData], [expansionData]]);

		if (removeCatalogueItem(projectName))
			catalogue.push(newData);

		Grid.rebuildTile(projectName);
	}

	inline function: number removeCatalogueItem(projectName: string)
	{
		for (x in catalogue)
		{
			if (x.projectName.toLowerCase().replace(" ", "_") == projectName.toLowerCase().replace(" ", "_"))
				return catalogue.remove(x);
		}
		
		return false;
	}
	
	inline function: object getCatalogueItem(projectName: string, variantName: string)
	{
		local project = {};
		
		for (x in catalogue)
		{
			if (x.projectName == projectName)
				project = x;
		}
	
		if (!isDefined(project))
			return {};
	
		if (variantName == "")
			return project;
	
		if (!isDefined(project.variants))
			return {};
	
		for (x in project.variants)
		{	
			if (x.name == variantName)
				return x;
		}
	
		return {};
	}

	inline function updateCatalogue()
	{
		catalogue.clear();
		
		local manifest = ManifestHandler.getManifest().clone();
		local cache = CacheHandler.getCache().clone();
		local expansions = Expansions.getAllData();	

		local data = deepMergeArrays([manifest, cache, expansions]);

		for (x in data)
		{
			if (!isDefined(x.name))
				x.name = x.projectName;

			if (!isDefined(x.installedVersion) && !isDefined(x.url))
				continue;

			catalogue.push(x);

			if (!isDefined(x.variants))
			{
				x.isInstalled = x.installedVersion != "";

				if (isDefined(x.installedVersion) && isDefined(x.latestVersion))
					x.hasUpdate = ManifestHandler.versionCompare(x.latestVersion, x.installedVersion);

				continue;
			}

			for (v in x.variants)
			{
				if (!isDefined(v.name))
					continue;

				v.isInstalled = v.installedVersion != "" || x.installedVersion != "";	

				if (isDefined(v.installedVersion) && isDefined(v.latestVersion))
					v.hasUpdate = ManifestHandler.versionCompare(v.latestVersion, v.installedVersion);
			
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
		}

		Grid.update(catalogue);
	}

	inline function mergeArrayObjects(array1, array2, key)
	{
	    local result = [];
	    local indexMap = {};
	
		for (arr in [array1, array2])
		{
			for (obj in arr)
	        {
	            local id = obj[key];
	
	            if (!isDefined(indexMap[id]))
	            {
	                indexMap[id] = result.length;
	                result.push(obj);
	                continue;
	            }
	
				local existingObj = result[indexMap[id]];
	
				for (prop in obj)
					existingObj[prop] = obj[prop];
			}
		}
	
	    return result;
	}	
	
	inline function deepMergeArrays(arrays)
	{
		local result = [];
		local data = [];
	
		for (x in arrays)
			data.concat(x);

		local projects = {};
		
		for (x in data)
		{
			if (!isDefined(x.projectName))
				continue;

			local projectName = x.projectName.toLowerCase().replace(" ", "_");
			
			if (!isDefined(projectName))
				continue;
	
			if (!isDefined(projects[projectName]))
				projects[projectName] = {};
				
			for (key in x)
			{
				if (Array.isArray(x[key]))
				{
					if (!isDefined(projects[projectName][key]))
						projects[projectName][key] = [];
						
					if (key == "variants")
						projects[projectName][key] = mergeArrayObjects(x[key], projects[projectName][key], "name");
					
					if (["files", "tags"].contains(key))
						projects[projectName][key] = mergeArrays(x[key], projects[projectName][key]);
				}
				else
				{
					projects[projectName][key] = x[key];
				}
			}		    
		}
		
		for (x in projects)
		    result.push(projects[x]);
	
		return result;
	}
	
	inline function: Array mergeArrays(arr1: Array, arr2: Array)
	{
		local newArr = arr1.clone();
	
		for (x in arr2)
			newArr.pushIfNotAlreadyThere(x);
		
		return newArr;
	}

	inline function: Array getMissingImageUrls(data: Array, cachedImages: Array)
	{
		local result = [];

		for (x in data)
		{
			if (!isDefined(x.projectName) || cachedImages.contains(x.projectName))
				continue;

			if (isDefined(x.image))
				result.push({"projectName": x.projectName, "url": x.image.replace(".b-cdn.net", ".com")});
		}

		return result;
	}
	
	inline function downloadIndividualImages(urls: Array)
	{
		Server.cleanFinishedDownloads();
		Server.setBaseURL(App.baseUrl[App.mode].replace(".com/", ".b-cdn.net/"));

		for (x in urls)
		{
			local url = x.url.replace(App.baseUrl[App.mode], "");
			local f = CacheHandler.getCacheDirectory().getChildFile(x.projectName + ".jpg");

			Server.downloadFile(url, {}, f, function()
			{
				if (!this.data.finished || !this.data.success)
					return;

				var file = this.getDownloadedTarget();
				Grid.updateImage(file.toString(file.NoExtension));
			});
		}
	}

	inline function downloadZippedImages()
	{
		Server.cleanFinishedDownloads();
		Server.setBaseURL(App.baseUrl[App.mode].replace(".com/", ".b-cdn.net/"));

		local url = "wp-content/uploads/product_images.zip";
		local f = CacheHandler.getCacheDirectory().getChildFile("product_images.zip");

		Server.downloadFile(url, {}, f, function()
		{
			Spinner.show("Downloading Images");

			if (!this.data.finished)
				return;

			if (this.data.success)
				extractImageArchive(this.getDownloadedTarget());
		});
	}

	inline function extractImageArchive(archive: object)
	{
		archive.extractZipFile(CacheHandler.getCacheDirectory(), true, function[archive](obj)
		{
			if (obj.Status != 2)
				return;

			archive.deleteFileOrDirectory();
			updateCatalogue();
			Spinner.hide();
		});
	}

	inline function toggleFavourite(projectName: string)
	{
		local value = ManifestHandler.getData(projectName, "", "favourite");
		
		if (isDefined(value))
			value = !value;
		else
			value = 1;

		ManifestHandler.setData(projectName, "", "favourite", value);

		return value;
	}
	
	//! Broadcasters	
	App.broadcasters.isLoggedIn.addListener("Library login", "Respond to login changes", function(state)
	{
		if (state)
			return autoSync();

		CacheHandler.clearCache();
		updateCatalogue();
		Grid.update(catalogue);
	});
}
