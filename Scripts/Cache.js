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

namespace Cache
{
	const imagesDir = FileSystem.getFolder(FileSystem.AppData).createDirectory("Images");
	
	reg cacheData = read();	
	reg totalToDownload;
	reg downloadCount;
	
	//! btnClearImages
	const btnClearImages = Content.getComponent("btnClearImages");
	btnClearImages.setControlCallback(onbtnClearImagesControl);
	
	inline function onbtnClearImagesControl(component, value)
	{
		if (!value)
			clearImages();
	}
	
	//! Functions
	inline function: Array read()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("Cache.json");

		if (f.isFile())
			return f.loadAsObject();
	
		f.writeObject([]);
	
		return [];
	}
	
	inline function write()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("Cache.json");
	
		if (!f.isFile())
			return;

		f.writeObject(cacheData);
	}

	inline function: Array getData()
	{
		return cacheData;
	}

	inline function autoSync()
	{
		if (!Account.isLoggedIn())
			return;

		local lastSync = UserSettings.getProperty("rhapsody", "lastSync");
		local now = Date.getSystemTimeMs();
		local MS_PER_WEEK = 604800000;

		if ((now - lastSync) < MS_PER_WEEK)
			return;
	
		sync();
	}

	inline function sync()
	{
		local token = Account.readToken();

		if (token == "" || !App.isOnline)
			return Engine.showMessageBox("Offline", "You need to be logged in and online to do this.", 0);

		local endpoint = App.apiPrefix + "get_users_products/";
		local headers = ["Authorization: Bearer " + token];

		Server.setBaseURL(App.baseUrl[App.mode]);
		Server.setHttpHeader(headers.join("\n"));

		Spinner.show("Syncing with Server");

		Server.callWithGET(endpoint, {}, function(status, response)
		{
			Spinner.hide();

			if (status == 200 && typeof(response) == "object" && response.length > 0)
				return handleSyncResponse(response);

			if (isDefined(response.message) && response.message.contains("You are not currently logged in"))
				Account.logout();

			if (isDefined(response.message))
				Engine.showMessageBox("Error", response.message, 3);
			else
				Engine.showMessageBox("Error", "The server reported an error, please try again later.", 3);
		});
	}

	inline function handleSyncResponse(response: Array)
	{
		cacheData = response;
		write();
		UserSettings.setProperty("rhapsody", "lastSync", Date.getSystemTimeMs());

		local cachedImages = getCachedImageNames();
		local imageUrls = getMissingImageUrls(response, cachedImages);	

		if (!cachedImages.length || imageUrls.length > 25)
			return downloadZippedImages();

		if (imageUrls.length > 0)
			return downloadIndividualImages(imageUrls);

		DownloadList.refresh();
	}
	
	inline function: Array getCachedImageNames()
	{
		local result = [];	
		local files = FileSystem.findFiles(imagesDir, "*.jpg", false);
	
		for (x in files)
			result.push(x.toString(x.NoExtension));
	
		return result;
	}
	
	inline function: Array getMissingImageUrls(catalogue: Array, cachedImages: Array)
	{
		local result = [];
	
		for (x in catalogue)
		{
			if (!isDefined(x.id) || cachedImages.contains(x.id))
				continue;
	
			if (isDefined(x.image))
				result.push({"id": x.id, "url": x.image.replace(".b-cdn.net", ".com")});
		}
	
		return result;
	}
	
	inline function downloadIndividualImages(urls: Array)
	{
		Server.cleanFinishedDownloads();
		Server.setBaseURL(App.baseUrl[App.mode].replace(".com/", ".b-cdn.net/"));

		totalToDownload = urls.length;
		downloadCount = 0;

		Spinner.show("Downloading Images");

		for (x in urls)
		{
			local url = x.url.replace(App.baseUrl[App.mode], "");
			local f = imagesDir.getChildFile(x.id + ".jpg");

			Server.downloadFile(url, {}, f, function()
			{
				if (!this.data.finished || !this.data.success)
					return;

				downloadCount++;

				if (downloadCount < totalToDownload)
					return;

				DownloadList.refresh();
				Spinner.hide();
			});
		}
	}

	inline function downloadZippedImages()
	{
		Server.cleanFinishedDownloads();
		Server.setBaseURL(App.baseUrl[App.mode].replace(".com/", ".b-cdn.net/"));

		local url = "wp-content/uploads/product_images.zip";
		local f = FileSystem.getFolder(FileSystem.Temp).getChildFile("product_images.zip");

		Spinner.show("Downloading Images");

		Server.downloadFile(url, {}, f, function()
		{
			if (!this.data.finished)
				return;

			if (this.data.success)
				return extractImageArchive(this.getDownloadedTarget());

			Spinner.hide();
		});
	}

	inline function extractImageArchive(archive: ScriptObject)
	{
		archive.extractZipFile(imagesDir, true, function(obj)
		{
			if (obj.Status != 2)
				return;

			var zipFile = FileSystem.fromAbsolutePath(obj.ZipFile);
			zipFile.deleteFileOrDirectory();

			Spinner.hide();
			DownloadList.refresh();
		});
	}
	
	inline function: object getImage(fileName: string)
	{
		return imagesDir.getChildFile(fileName);
	}

	inline function: number getImageCacheSize()
	{
		local result;

		for (x in FileSystem.findFiles(imagesDir, "*", false))
			result += x.getSize();

		return result;
	}

	inline function clearCache()
	{
		if (!cacheData.length)
			return;

		cacheData = [];
		write();
	}

	inline function clearImages()
	{
		for (x in FileSystem.findFiles(imagesDir, "*", false))
			x.deleteFileOrDirectory();

		Engine.showYesNoWindow("Images Cleared", "The images cache has been cleared. Do you want to resync now to download the latest images?", function(response)
		{
			if (!response)
				return DownloadList.refresh();

			sync();				
		});
	}

	//! Broadcasters
	Account.broadcasters.loggedIn.addListener({}, "Sync on login, clear on logout", function(state)
	{
		if (!state)
			return clearCache();

		if (!cacheData.length)
			sync();
		else
			autoSync();
	});
}
