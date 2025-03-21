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
	reg downloadCount;
	reg totalSize;
	reg abort = false;
	reg downloadsDirectory;

	const downloads = [];
	const productNames = [];
	const progressTimer = Engine.createTimerObject();

	progressTimer.setTimerCallback(function()
	{
		updateProgress();
	});

	Server.setNumAllowedDownloads(3);

	//! Functions
	inline function addDownloads(productIds: Array)
	{
		local headers = ["Authorization: Bearer " + Account.readToken()];
		local endpoint =  App.apiPrefix + "get_downloads/";
		local version = 0;
		local p = {user_version: 0};

		for (i = 0; i < productIds.length; i++)
			p["product_id[" + i + "]"] = productIds[i];

		Server.setHttpHeader(headers.join("\n"));
		Server.setBaseURL(App.baseUrl[App.mode]);

		Spinner.show("Fetching Downloads");
		
		deleteDownloadedArchives();

		Server.callWithGET(endpoint, p, function(status, response)
		{
			Spinner.hide();

			if (status == 0)
				return Engine.showMessageBox("Server Error: " + status, "Unable to connect to the server. Please check your internet connection and try again. If the problem persists, try again later.", 1);

			if (status != 200 && isDefined(response.message))
				return Engine.showMessageBox("Server Error: " + status, response.message, 1);

			if (status != 200)
				return Engine.showMessageBox("Server Error: " + status, "A server error occurred. Please try again later.", 1);

			if (!isDefined(response[0]) || !response[0])
				return Engine.showMessageBox("Verification Required", response.message, 1);

			downloadFiles(response);
		});
	}

	inline function downloadFiles(files: Array)
	{
		downloads.clear();
		downloadCount = 0;
		totalSize = 0;
		abort = false;

		for (x in files)
			totalSize += x.file_size;

		downloadsDirectory = getDownloadsDirectory(totalSize);

		if (!isDefined(downloadsDirectory.Filename) || totalSize <= 0)
			return abortDownloads();

		Server.setHttpHeader("");
		Server.setBaseURL(App.baseUrl[App.mode]);
		Server.cleanFinishedDownloads();

		for (x in files)
		{
			local f = downloadsDirectory.getChildFile(x.filename);
			local url = x.download_url.replace(App.baseUrl[App.mode]);

			if (f.isFile())
				continue;

			productNames.pushIfNotAlreadyThere(x.product_name);
			downloads.push(Server.downloadFile(url, {}, f, downloadCallback));
		}

		if (!downloads.length)
			return broadcasters.isDownloading.state = false;

		addAbortButtonListener();
		progressTimer.startTimer(100);
	}

	inline function downloadCallback()
	{
		if (abort == true)
			this.abort();

		if (!this.data.finished)
			return;

		downloadCount++;

		if (downloadCount < downloads.length)
			return;

		Server.cleanFinishedDownloads();
		progressTimer.stopTimer();
		removeAbortButtonListener();
		broadcasters.isDownloading.state = false;

		if (this.data.success && !abort)
			return Installer.bulkInstall(downloadsDirectory);

		if (!abort)
			Engine.showMessageBox("Download Failed", "One or more downloads failed. If you’re using a VPN, try disabling it. Also, ensure Rhapsody is allowed through your system firewall.", 0);
	}

	inline function: object getDownloadsDirectory(bytesRequired: number)
	{
		local result = UserSettings.getDirectory("downloadPath");
		local errorMsg = "";

		if (result.toString(result.Filename) != "Rhapsody")
			result = result.createDirectory("Rhapsody");

		if (!result.hasWriteAccess())
			errorMsg = "Rhapsody is unable to write to the download location.";

		if (errorMsg == "" && result.getBytesFreeOnVolume() < bytesRequired)
			errorMsg = "There is not enough space in the download location: " + result.toString(result.FullPath) + ". You need at least " + FileSystem.descriptionOfSizeInBytes(bytesRequired) + ".";

		if (errorMsg != "")
		{
			Engine.showMessageBox("Invalid Location", errorMsg, 1);
			result = {};
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

		local timeRemaining = totalSize - bytesDownloaded / speed;

		progress = bytesDownloaded / totalSize;
		
		local data = {
			message: productNames.length == 1 ? "Downloading " + productNames[0] : "Downloading Instruments" + ": " + FileSystem.descriptionOfSizeInBytes(bytesDownloaded) + "/" + FileSystem.descriptionOfSizeInBytes(totalSize),
			value: progress,
			text: FileSystem.descriptionOfSizeInBytes(speed) + "/s - " + "About " + timeRemaining + " minutes remaining"
		};

		broadcasters.isDownloading.sendAsyncMessage([true, data]);

		if (progress >= 1.0)
			progressTimer.stopTimer();
	}

	inline function abortDownloads()
	{	
		for (x in downloads)
			x.abort();

		abort = true;

		progressTimer.stopTimer();
		deleteDownloadedArchives();
		removeAbortButtonListener();
		broadcasters.isDownloading.state = false;
	}
	
	inline function deleteDownloadedArchives()
	{
		local dir = getDownloadsDirectory(0);

		if (!isDefined(dir) || !dir.isDirectory())
			return;

		local files = FileSystem.findFiles(dir, "*.lwz", true);

		for (x in files)
			x.deleteFileOrDirectory();
	}

	inline function addAbortButtonListener()
	{
		broadcasters.abort.attachToComponentValue("btnProgressCancel", "");
	
		broadcasters.abort.addListener(0, "Abort downloads", function(component, value)
		{
			if (value || !broadcasters.isDownloading.state)
				return;
		
			Engine.showYesNoWindow("Cancel", "Do you want to stop all downloads?", function(response)
			{
				if (response)
					abortDownloads();
			});
		});
	}
	
	inline function removeAbortButtonListener()
	{
		broadcasters.abort.removeAllSources();
		broadcasters.abort.removeListener("Abort downloads");
	}
	
	//! Broadcasters	
	const broadcasters = {};
	broadcasters.isDownloading = Engine.createBroadcaster({id: "DownloadState", args: ["state", "progress"]});
	broadcasters.abort = Engine.createBroadcaster({id: "abortDownload", args: ["component", "value"]});
}
