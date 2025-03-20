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

namespace Installer
{
	reg abort;
	reg fileCount;
	reg numFiles;
	reg success;
	reg tempDir;
		
	//! Background worker
	const worker = Engine.createBackgroundTask("fileMover");
	worker.setTimeOut(2000);

	worker.setFinishCallback(function(isFinished, threadShouldExit)
	{
		if (isFinished != 1)
			return;
		
		if (success)
			updateManifest();

		cleanup();
	});

	//! Functions		
	inline function install(lwzFile: ScriptObject)
	{
		local archives = getSiblingLwzFiles(lwzFile);
		tempDir = lwzFile.getParentDirectory();
		extractArchives(archives);
	}
	
	inline function bulkInstall(lwzDirectory: ScriptObject)
	{
		local archives = FileSystem.findFiles(lwzDirectory, "*.lwz", false);
		tempDir = lwzDirectory;
		extractArchives(archives);
	}
		
	inline function: Array getSiblingLwzFiles(lwzFile: ScriptObject)
	{
		local productName = getProductNameFromFilename(lwzFile.toString(lwzFile.NoExtension));
		local parentDirectory = lwzFile.getParentDirectory();
		return FileSystem.findFiles(parentDirectory, productName + "*.lwz", false);		
	}
	
	inline function extractArchives(archives: Array)
	{
		fileCount = 0;
		abort = false;
		numFiles = archives.length;

		addAbortButtonListener();

		Engine.sortWithFunction(archives, sortFiles);

		for (x in archives)
		{
			local filename = x.toString(x.Filename);
			local target = getTempDirectoryForArchive(x);

			if (filename.contains("_data_"))
			{
				local variantName = getVariantNameFromFilename(filename);
	
				if (variantName != "")
					createVariantHxi(filename, target);
			}			

			x.extractZipFile(target, true, function(obj)
			{
				obj.Cancel = (obj.Error != "" || abort);

				updateProgress("Extracting Archive: ", obj.Progress);

				if (obj.Status != 2)
					return;

				fileCount++;

				if (fileCount < numFiles)
					return;

				if (!obj.Cancel && !abort)
					return worker.callOnBackgroundThread(moveFiles);

				return cleanup();
			});
		}
	}

	function moveFiles(thread)
	{
		var files = getTempFiles();
		var targets = getTargetDirectories(files);

		success = true;
		fileCount = 0;
		numFiles = files.length;

		for (x in files)
		{
			var parentName = x.getParentDirectory().toString(x.Filename);
			var filename = x.toString(x.Filename);
			var ext = x.toString(x.Extension);

			if (abort)
				continue;

			updateProgress("Installing File: ", fileCount / numFiles);

			var target = targets[parentName + "_" + filename];

			if (!isDefined(target) || !target.isDirectory())
				continue;

			if (x.isDirectory())
				success = x.copyDirectory(target.createDirectory(filename));
			else
				success = x.copy(target.getChildFile(filename));

			if (worker.shouldAbort())
				return;

			fileCount++;
		}
	}

	inline function: Array getTempFiles()
	{
		local result = [];

		for (x in FileSystem.findFiles(tempDir, "librewave_temp_*", false))
		{
			if (x.isDirectory())
				result.concat(FileSystem.findFiles(x, "*", false));
		}

		return result;
	}

	inline function: object getTargetDirectories(files: Array)
	{
		local result = {};
		local dataDirs = {};
		local sampleDirs = {};

		for (x in files)
		{
			local parentName = x.getParentDirectory().toString(x.Filename);
			local filename = x.toString(x.Filename);
			local key = parentName + "_" + filename;

			if (isDefined(result[key]))
				continue;

			if (!isDefined(dataDirs[key]))
			{
				local hxiFile = x.getParentDirectory().getChildFile("info.hxi");
				local data = Expansions.getPropertiesFromHxi(hxiFile);
				dataDirs[key] = Expansions.createDataDirectory(data.Company, data.Name);
				sampleDirs[key] = Expansions.getSamplesDirectory(data.Company, data.Name, true);
			}

			local dataDir = dataDirs[key];
			local samplesDir = sampleDirs[key];
			local filename = x.toString(x.Filename);
			local ext = x.toString(x.Extension);

			if (ext == ".lwz")
				continue;

			if ([".hxi", ".dat", ".json", ".pdf", ".txt"].contains(ext) || filename == "UserPresets")
				result[key] = dataDir;
			else
				result[key] = samplesDir;			
		}

		return result;
	}

	inline function updateProgress(action: string, progress: number)
	{		
		local data = {
			message: action + (fileCount + 1) + "/" + numFiles,
			value: progress,
			text: abort == 1 ? "Cancelling..." : ""
		};

		ProgressBar.setProgress(data);
	}

	inline function updateManifest()
	{
		local directories = FileSystem.findFiles(tempDir, "librewave_temp_*", false);

		for (x in directories)
		{
			local hxiFile = x.getChildFile("info.hxi");

			if (!hxiFile.isFile())
				continue;

			local props = Expansions.getPropertiesFromHxi(hxiFile);
			local company = props.Company;
			local name = props.Name;

			if (!isDefined(company) || !isDefined(name))
				continue;

			local filenames = [];

			for (f in FileSystem.findFiles(x, "*", false))
				filenames.push(f.toString(f.Filename));

			Manifest.updateFiles(company, name, filenames);
		}
	}

	inline function: ScriptObject getTempDirectoryForArchive(file: ScriptObject)
	{
		local filename = file.toString(file.Filename);
		local productName = getProductNameFromFilename(filename);
		return file.getParentDirectory().createDirectory("librewave_temp_" + productName);
	}

	inline function cleanup()
	{
		deleteTemporaryFiles();
		removeAbortButtonListener();
		Expansions.refresh();
		ProductGrid.refresh();
		DownloadList.refresh();
		ProgressBar.hide();
	
		if (!success && !abort)
			Engine.showMessageBox("Installation Complete", "The installation finished but not all files could be copied. Please try again or contact support.", 1);
	}

	inline function deleteTemporaryFiles()
	{
		for (x in FileSystem.findFiles(tempDir, "librewave_temp_*", false))
			x.deleteFileOrDirectory();

		local downloadsDir = UserSettings.getDirectory("downloadPath");

		if (!isDefined(downloadsDir.Filename))
			return;

		for (x in FileSystem.findFiles(downloadsDir, "*.lwz", false))
			x.deleteFileOrDirectory();
	}

	inline function createVariantHxi(filename: string, target: ScriptObject)
	{
		local variantName = getVariantNameFromFilename(filename);
		local productName = getProductNameFromFilename(filename);
		local version = getVersionFromFilename(filename);

		local obj = {
			Name: variantName,
			ExpansionName: productName.replace("_", " ").capitalize(),
			Version: version
		};

		local f = target.getChildFile(variantName + ".hxi");
		f.writeObject(obj);	
	}

	inline function: number sortFiles(a: object, b: object)
	{
		local filenameA = a.toString(a.Filename);
		local filenameB = b.toString(b.Filename);

		local productNameA = getProductNameFromFilename(filenameA);
		local productNameB = getProductNameFromFilename(filenameB);

		if (productNameA != productNameB)
			return productNameA < productNameB ? -1 : 1;

		local versionA = getVersionFromFilename(filenameA);
		local versionB = getVersionFromFilename(filenameB);		

		return versionCompare(versionA, versionB);
	}

	inline function: string getVariantNameFromFilename(filename: string)
	{
		local matches = Engine.getRegexMatches(filename, "\\d+_\\d+_\\d+_([^()._]+)");
				
		if (matches.length < 2)
			return "";
	
		return matches[1];
	}

	inline function: string getProductNameFromFilename(filename: string)
	{
		if (filename.contains("_data"))
			return filename.substring(0, filename.indexOf("_data"));
		
		if (filename.contains("_samples"))
			return filename.substring(0, filename.indexOf("_samples"));
		
		return "";
	}

	inline function: string getVersionFromFilename(filename: string)
	{
		local version = Engine.getRegexMatches(filename, "\\d+_\\d+_\\d+")[0];
			
		if (isDefined(version))
			return version.replace("_", ".");
	
		return "";		
	}

	inline function: number versionCompare(version1: string, version2: string)
	{
		if (version1 == version2)
		     return 0;

		 if (version1 != "" && version2 == "")
		     return 1;

		 if (version1 == "" && version2 != "")
		     return -1;

		local separator = version1.contains("_") ? "_" : ".";
		local v1 = version1.split(separator).map(function(x) { return parseInt(x); });
		local v2 = version2.split(separator).map(function(x) { return parseInt(x); });

		for (i = 0; i < 3; i++)
		{
			if (v1[i] != v2[i])
				return v1[i] > v2[i] ? 1 : -1;
		}

		return 0;
	}

	inline function abortInstall()
	{
		abort = true;
		worker.sendAbortSignal(false);
		removeAbortButtonListener();
	}

	inline function addAbortButtonListener()
	{
		broadcasters.abort.attachToComponentValue(["btnProgressCancel"], "");

		broadcasters.abort.addListener(0, "Abort Installation", function(component, value)
		{
			if (!value)
				return;

			Engine.showYesNoWindow("Cancel", "Do you want to cancel the installation?", function(response)
			{
				if (response)
					abortInstall();
			});
		});
	}

	inline function removeAbortButtonListener()
	{
		broadcasters.abort.removeAllSources();
		broadcasters.abort.removeListener("Abort Installation");
	}

	//! Broadcasters
	const broadcasters = {};
	broadcasters.abort = Engine.createBroadcaster({id: "abortInstall", args: ["component", "value"]});
}
