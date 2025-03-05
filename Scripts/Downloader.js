/*
    Copyright 2022, 2023, 2025 David Healey

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

namespace Downloader
{
	const queue = [];
	const downloads = [];

	reg tempDir = FileSystem.getFolder(FileSystem.Temp).createDirectory("Libre Wave");
	reg downloadCount;

	Server.setNumAllowedDownloads(3);

	const progressTimer = Engine.createTimerObject();

	progressTimer.setTimerCallback(function()
	{
		updateProgress();
	});

	//! Functions
	inline function preflight(productData: object)
	{		
		if (!productData.hasLicense && productData.regularPrice != "0")
			return;
		
		if (!isDefined(productData.variants))
			return addToQueue(productData);

		local licensedVariants = CacheHandler.getLicensedVariants(productData.projectName);

		if (!licensedVariants.length)
			return;

		if (licensedVariants.length == 1)
		{
			productData.productIds = [];

			for (x in licensedVariants)
				productData.productIds.push(x.id);

			return addToQueue(productData);
		}

		Variations.show(productData.projectName, true, {buttonText: "Select", message: "Select components to install.", productId: productData.id, data: {productData: productData}}, function(variants, data)
		{
			data.productData.productIds = [];

			for (x in variants)
				data.productData.productIds.push(x.id);				

			Downloader.addToQueue(data.productData);
		});
	}
	
	inline function downloadProduct(data: object)
	{
		data.abort = false;
		downloads.clear();
		downloadCount = 0;

		Server.setHttpHeader("");
		Server.setBaseURL(App.baseUrl[App.mode]);
		Server.cleanFinishedDownloads();

		data.tempDir = tempDir.createDirectory(data.projectName);

		for (x in data.files)
		{
			local f = data.tempDir.getChildFile(x.filename);
			local url = x.download_url.replace(App.baseUrl[App.mode]);

			downloads.push(Server.downloadFile(url, {}, f, downloadCallback));
		}

		progressTimer.startTimer(100);
		App.broadcasters.downloading.attachToOtherBroadcaster(data.bcDownloading, {}, true, {id: data.id});
	}

	inline function downloadCallback()
	{
		if (!this.data.finished)
			return;

		downloadCount++;

		if (this.data.success)
		{
			if (downloadCount != downloads.length)
				return;

			progressTimer.stopTimer();

			Installer.install(queue[0].tempDir, queue[0].bcDownloading, function()
			{
				cleanUp();
			});
			
			return;
		}

		if (!this.data.aborted && isDefined(queue[0]))
			queue[0].downloadFailed = true;

		if (downloadCount >= downloads.length)
			cleanUp();
	}

	inline function updateProgress()
	{	
		local data = queue[0];
		local bytesDownloaded = 0;
		local speed = 0;
		
		for (x in downloads)
		{
			bytesDownloaded += x.getNumBytesDownloaded();			
			speed += x.getDownloadSpeed();
		}
		
		if (isDefined(data.bcDownloading.progress))
		{
			data.bcDownloading.progress = {
				projectName: data.projectName,			
				value: bytesDownloaded / data.fileSize,
				status: "Downloading",
				speed: FileSystem.descriptionOfSizeInBytes(speed) + "/s"
			};
		}
		
		if (bytesDownloaded >= data.fileSize)
			progressTimer.stopTimer();
	}
	
	inline function addToQueue(data: object)
	{
		local headers = ["Authorization: Bearer " + Account.readToken()];
		local endpoint =  App.apiPrefix + "get_downloads/";
		local version = isDefined(data.installedVersion) ? data.installedVersion : 0;
		local p = {};

		if (!isDefined(data.productIds))
		{
			p.product_id = data.id;
			p.user_version = version;
		}
		else
		{
			for (i = 0; i < data.productIds.length; i++)
			{
				p["product_id[" + i + "]"] = data.productIds[i];
			}
			
			p.user_version = 0;
		}

		Server.setHttpHeader(headers.join("\n"));
		Server.setBaseURL(App.baseUrl[App.mode]);

		Spinner.show("Verifying License");

		Server.callWithGET(endpoint, p, function[data](status, response)
		{
			Spinner.hide();

			if (status == 0)
				return Engine.showMessageBox("Server Error: " + status, "The server is currently offline. Please try again later.", 1);

			if (status != 200 && isDefined(response.message))
				return Engine.showMessageBox("Server Error: " + status, response.message, 1);
				
			if (status != 200)
				return Engine.showMessageBox("Server Error: " + status, "A server error occurred. Please try again later.", 1);
				
			if (!isDefined(response[0]) || !response[0])
				return Engine.showMessageBox("Verification Required", response.message, 1);

			data.bcDownloading.sendAsyncMessage([true, {projectName: data.projectName, value: 0, status: "Waiting to Start", speed: ""}]);
			data.files = response;
			data.fileSize = getTotalFileSize(data.files);
			queue.push(data);

			if (queue.length == 1)
				downloadProduct(data);
		});
	}

	inline function removeFromQueue(data)
	{
		if (!queue.contains(data))
			return;

		data.bcDownloading.sendAsyncMessage([false, -1]);
		data.files = undefined;

		if (!isDefined(data.installedVersion))
			data.sampleDir = undefined;

		App.broadcasters.downloading.removeListener({id: data.id});
		data.bcDownloading.removeSource(App.broadcasters.downloading);

		queue.remove(data);
	}

	inline function: number getTotalFileSize(files: Array)
	{
		local result = -1;

		for (x in files)
			result += x.file_size;
			
		return result;
	}

	inline function cleanUp()
	{
		local data = queue[0];

		progressTimer.stopTimer();

		if (isDefined(data.tempDir) && data.tempDir.isDirectory())
			data.tempDir.deleteFileOrDirectory();

		if (!data.abort)
		{
			data.installedVersion = Expansions.getVersion(data.projectName);
			data.hasUpdate = false;		
		}

		if (isDefined(data.downloadFailed) && data.downloadFailed == true)
		{
			Engine.showMessageBox("Download Failed", data.name + " failed to download. If the problem persists, please contact support.", 1);
			data.downloadFailed = false;
		}

		removeFromQueue(data);

		Grid.rebuildTile(data.projectName);

		if (queue.length > 0)
			return downloadProduct(queue[0]);

		Server.cleanFinishedDownloads();
		clearTempFolder();
	}

	inline function clearTempFolder()
	{
		if (isDefined(tempDir) && tempDir.isDirectory())
			tempDir.deleteFileOrDirectory();

		tempDir = FileSystem.getFolder(FileSystem.Temp).createDirectory("Libre Wave");
	}

	inline function abortDownloads(data)
	{
		if (data.id != queue[0].id)
			return removeFromQueue(data);

		for (x in downloads)
			x.abort();
			
		queue[0].abort = true;
	}
}
