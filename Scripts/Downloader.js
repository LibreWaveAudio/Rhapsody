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
	reg totalSize;
	reg abort = false;
	reg downloadsDirectory;
	reg productName;

	const downloads = [];
	const downloadedFiles = [];
		
	//! progressTimer
	const progressTimer = Engine.createTimerObject();

	progressTimer.setTimerCallback(function()
	{
		updateProgress();
	});

	Server.setNumAllowedDownloads(3);

	//! Functions
	inline function downloadProduct(productId: number)
	{
		local headers = ["Authorization: Bearer " + Account.readToken()];
		local endpoint =  App.apiPrefix + "get_downloads/";
		local version = 0;
		local p = {product_id: productId, user_version: 0};

		Server.setHttpHeader(headers.join("\n"));
		Server.setBaseURL(App.baseUrl[App.mode]);

		Spinner.show("Fetching Downloads");

		Server.callWithGET(endpoint, p, function(status, response)
		{
			Spinner.hide();

			var errorMsg = "";

			if (status == 0)
				errorMsg = "Unable to connect to the server. Please check your internet connection and try again. If the problem persists, try again later.";

			if (status != 200)
				errorMsg = isDefined(response.message) ? response.message : "A server error occurred. Please try again later.";

			if (!isDefined(response[0]) || !response[0])
				errorMsg = isDefined(response.message) ? response.message : "An undefined server error occurred. Please try again later.";

			if (errorMsg != "")
			{				
				Engine.showMessageBox("Server Error: " + status, errorMsg, 1);
				DownloadList.clearQueue();
			}

			downloadFiles(response);
		});
	}

	inline function downloadFiles(files: Array)
	{
		downloads.clear();
		downloadedFiles.clear();
		totalSize = 0;
		abort = false;

		for (x in files)
			totalSize += x.file_size;
			
		productName = files[0].product_name;
		downloadsDirectory = getDownloadsDirectory(totalSize);	

		if (!isDefined(downloadsDirectory.Filename) || totalSize <= 0)
			return abortDownloads();

		Server.setHttpHeader("");
		Server.setBaseURL(App.baseUrl[App.mode]);
		Server.cleanFinishedDownloads();

		broadcasters.isDownloading.state = true;

		for (x in files)
		{
			local f = downloadsDirectory.getChildFile(x.filename);
			local url = x.download_url.replace(App.baseUrl[App.mode]);

			if (f.isFile())
				continue;

			downloads.push(Server.downloadFile(url, {}, f, downloadCallback));
		}

		if (!downloads.length)
		{
			if (files.length > 0)
				Installer.install(downloadsDirectory.getChildFile(files[0].filename));

			return broadcasters.isDownloading.state = false;
		}

		addAbortButtonListener();
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
		removeAbortButtonListener();
		broadcasters.isDownloading.state = false;

		if (this.data.success && !abort)
			return Installer.install(this.getDownloadedTarget());

		if (!abort)
		{
			Engine.showMessageBox("Download Failed", "One or more downloads failed. If you’re using a VPN, try disabling it. Also, ensure Rhapsody is allowed through your system firewall.", 0);
			DownloadList.clearQueue();
		}			
	}

	inline function: object getDownloadsDirectory(bytesRequired: number)
	{
		local result = UserSettings.getDirectory("downloadPath");
		local errorMsg = "";

		if (!result.hasWriteAccess())
			errorMsg = "Rhapsody is unable to write to the download location.";

		if (errorMsg == "" && result.getBytesFreeOnVolume() < bytesRequired)
			errorMsg = "There is not enough space in the download location: " + result.toString(result.FullPath) + ". You need at least " + FileSystem.descriptionOfSizeInBytes(bytesRequired) + ".";

		if (errorMsg != "")
		{
			Engine.showMessageBox("Download Folder Issue", errorMsg, 1);
			DownloadList.clearQueue();
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

		progress = bytesDownloaded / totalSize;

		local timeRemaining = getFormattedTimeRemaining(totalSize, bytesDownloaded, speed);
		local progressAsText = FileSystem.descriptionOfSizeInBytes(bytesDownloaded) + " / " + FileSystem.descriptionOfSizeInBytes(totalSize);
		local speedAsText = FileSystem.descriptionOfSizeInBytes(speed) + "/s";
		
		local data = {					
			productName: productName,
			text: "Downloading: " + progressAsText + ", " + speedAsText + " - " + timeRemaining,
			value: progress
		};

		ProgressBar.setProgress(data);
		
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
		removeAbortButtonListener();
		broadcasters.isDownloading.state = false;
		DownloadList.processNextQueuedItem();
	}
	
	inline function deleteDownloadedFiles()
	{
		for (x in downloadedFiles)
			x.deleteFileOrDirectory();
			
		Server.cleanFinishedDownloads();
	}

	inline function addAbortButtonListener()
	{
		broadcasters.abort.attachToComponentValue("btnProgressCancel1", "");
	
		broadcasters.abort.addListener(0, "Abort downloads", function(component, value)
		{
			if (!value || !broadcasters.isDownloading.state)
				return;

			Engine.showYesNoWindow("Cancel", "Do you want to cancel this download?", function(response)
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

	broadcasters.isDownloading = Engine.createBroadcaster({id: "downloadState", args: ["state"]});
	broadcasters.abort = Engine.createBroadcaster({id: "abortDownload", args: ["component", "value"]});
}
