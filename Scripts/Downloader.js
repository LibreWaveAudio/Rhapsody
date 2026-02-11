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
	reg product;
	reg abort = false;

	const downloads = [];
	const downloadedFiles = [];
		
	//! progressTimer
	const progressTimer = Engine.createTimerObject();

	progressTimer.setTimerCallback(function()
	{
		updateProgress();
	});

	//! Functions
	inline function downloadProduct(item: object)
	{
		product = item;

		local headers = ["Authorization: Bearer " + Account.readToken()];
		local endpoint =  App.apiPrefix + "get_downloads/";
		local version = 0;
		local p = {product_id: item.id, user_version: 0};

		Server.setHttpHeader(headers.join("\n"));
		Server.setBaseURL(App.baseUrl[App.mode]);

		Spinner.setText("Fetching Downloads");
		
		local img = Cache.getImage(item.id + ".jpg");		
		ProgressBar.setImage(img.isFile() ? img.toString(img.FullPath) : "");
		
		Server.callWithGET(endpoint, p, function(status, response)
		{
			var errorMsg = "";

			if (status == 0)
				errorMsg = "Unable to connect to the server. Please try again later.";

			if (errorMsg == "" && status != Server.StatusOK)
				errorMsg = isDefined(response.message) ? response.message : "A server error occurred. Please try again later.";

			if (errorMsg == "" && (!isDefined(response[0]) || !response[0]))
				errorMsg = isDefined(response.message) ? response.message : "An undefined server error occurred. Please try again later.";

			if (errorMsg != "")
				return Engine.showMessageBox("Server Error: " + status, errorMsg, 1);

			downloadFiles(response);
		});
	}

	inline function downloadFiles(files: Array)
	{
		downloads.clear();
		downloadedFiles.clear();
		product.totalSize = 0;
		abort = false;

		for (x in files)
			product.totalSize += x.file_size;

		product.downloadFolder = getDownloadsDirectory(product.id, product.totalSize);	

		if (!product.downloadFolder.isDirectory() || product.totalSize <= 0)
			return abortDownloads();

		Server.setHttpHeader("");
		Server.setBaseURL(App.baseUrl[App.mode]);
		Server.cleanFinishedDownloads();

		broadcasters.isDownloading.state = true;

		for (x in files)
		{
			local f = product.downloadFolder.getChildFile(x.filename);
			local url = x.download_url.replace(App.baseUrl[App.mode]);

			if (f.isFile())
				continue;

			downloads.push(Server.downloadFile(url, {}, f, downloadCallback));
		}

		if (!downloads.length)
		{
			if (files.length > 0)
				Expansions.install(product.downloadFolder.getChildFile(files[0].filename), product.sampleFolder, false);

			return broadcasters.isDownloading.state = false;
		}

		progressTimer.startTimer(100);
	}

	inline function downloadCallback()
	{
		if (abort == true)
			this.abort();

		if (!this.data.finished)
			return;

		downloadedFiles.push(this.getDownloadedTarget());

		if (downloadedFiles.length < downloads.length)
			return;

		progressTimer.stopTimer();
		Server.cleanFinishedDownloads();
		broadcasters.isDownloading.state = false;		

		if (this.data.success && !abort)
			return Expansions.install(this.getDownloadedTarget(), product.sampleFolder, false);

		if (!abort)
			Engine.showMessageBox("Download Failed", "One or more downloads failed. If you’re using a VPN, try disabling it. Also, ensure Rhapsody is allowed through your system firewall.", 0);
	}

	inline function: ScriptObject getDownloadsDirectory(productId: number, bytesRequired: number)
	{
		local result = FileSystem.getFolder(FileSystem.Temp).createDirectory("rhapsody");
		local errorMsg = "";

		if (!result.hasWriteAccess())
			errorMsg = "Rhapsody is unable to write to the download location.";

		if (errorMsg == "" && result.getBytesFreeOnVolume() < bytesRequired)
			errorMsg = "There is not enough space in the download location: " + result.toString(result.FullPath) + ". You need at least " + FileSystem.descriptionOfSizeInBytes(bytesRequired) + ".";

		if (errorMsg != "")
		{
			Engine.showMessageBox("Download Issue", errorMsg, 1);
			result = FileSystem.getFolder(FileSystem.AppData).getNonExistentSibling();
		}

		return result;
	}
	
	inline function updateProgress()
	{
		local progress = 0;
		local bytesDownloaded = 0;
		local speed = 0;

		for (x in downloads)
		{
			bytesDownloaded += x.getNumBytesDownloaded();
			speed += x.getDownloadSpeed();
		}

		progress = bytesDownloaded / product.totalSize;

		local timeRemaining = getFormattedTimeRemaining(product.totalSize, bytesDownloaded, speed);
		local progressAsText = FileSystem.descriptionOfSizeInBytes(bytesDownloaded) + " / " + FileSystem.descriptionOfSizeInBytes(product.totalSize);
		local speedAsText = FileSystem.descriptionOfSizeInBytes(speed) + "/s";
		
		broadcasters.downloadProgress.sendAsyncMessage([
			progress,
			product.name,
			"Downloading: " + progressAsText + ", " + speedAsText + " | " + timeRemaining
		]);
		
		if (progress >= 1.0)
			progressTimer.stopTimer();
	}

	inline function: string getFormattedTimeRemaining(totalBytes: number, bytesDownloaded: number, speed: number)
	{
		local seconds = (totalBytes - bytesDownloaded) / speed;

		if (seconds == "inf")
			return "";

		local value = seconds;

		if (seconds > 3600)
			value = seconds / 3600;
		else if (seconds >= 60)
			value = seconds / 60;

		local text;

		if (seconds < 60)
			text = "second";
		else if (seconds >= 3600)
			text = "hour";
		else
			text = "minute";		

		text += value != 1 ? "s" : "";
		
		local valueAsText = seconds > 3600 ? Engine.doubleToString(value, 1) : Math.round(value);

		return valueAsText + " " + text + " remaining.";
	}

	inline function abortDownloads()
	{	
		for (x in downloads)
			x.abort();

		abort = true;

		progressTimer.stopTimer();
		broadcasters.isDownloading.state = false;
	}
	
	//! Broadcasters
	const broadcasters = {};

	broadcasters.downloadProgress = Engine.createBroadcaster({id: "downloadProgress", args: ["progress", "title", "message"]});
	broadcasters.isDownloading = Engine.createBroadcaster({id: "downloadState", args: ["state"]});
	
	//! Function Calls
	Server.setNumAllowedDownloads(3);
	Server.cleanFinishedDownloads();
}
