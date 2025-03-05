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

namespace ManifestHandler
{
	reg manifest = readManifest();

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

	inline function: Array getManifest()
	{
		return manifest;
	}

	inline function: NotUndefined getData(projectName: string, variantName: string, key: string)
	{
		local obj = getObject(projectName, variantName);

		if (key != "" && isDefined(obj[key]))
			return obj[key];

		return obj;
	}
	
	inline function setData(projectName: string, variantName: string, key: string, value: NotUndefined)
	{
		local obj = getObject(projectName, variantName);

		if (key != "")
			obj[key] = value;

		writeManifest();
	}

	inline function: object getProject(projectName: string)
	{
		for (x in manifest)
		{
			if (x.projectName.toLowerCase().replace(" ", "_") == projectName.toLowerCase().replace(" ", "_"))
				return x;
		}
				
		return {};
	}

	inline function: object getVariant(projectName: string, variantName: string)
	{
		local project = getProject(projectName);

		if (!project.keys().length)
			return {};

		if (!isDefined(project.variants))
			project.variants = [];

		for (x in project.variants)
		{
			if (x.name == variantName)
				return x;
		}
		
		return {};
	}
		
	inline function: Array getVariants(projectName: string)
	{
		local project = getProject(projectName);

		if (!isDefined(project.variants))
			return [];

		return project.variants;
	}
		
	inline function: object getObject(projectName: string, variantName: string)
	{
		if (variantName == "")
			return getProject(projectName);

		return getVariant(projectName, variantName);			
	}
	
	inline function: object createProject(projectName: string)
	{
		local obj = getProject(projectName);
		
		if (obj.keys().length > 0)
			return obj;
			
		local index = manifest.push({projectName: projectName});
		return manifest[index - 1];
	}

	inline function: object createVariant(projectName: string, variantName: string)
	{
		local obj = getVariant(projectName, variantName);

		if (obj.keys().length > 0)
			return obj;

		local project = createProject(projectName);

		if (!isDefined(project.variants))
			project.variants = [];

		local index = project.variants.push({name: variantName});
		return project.variants[index - 1];
	}

	inline function: object createObject(projectName: string, variantName: string)
	{
		local obj = getObject(projectName, variantName);

		if (obj.keys().length > 0)
			return obj;	

		if (variantName == "")
			return createProject(projectName);
		else
			return createVariant(projectName, variantName);
	}
	
	inline function removeEntry(projectName: string, variantName: string)
	{
		local newObj = [];

		for (x in manifest)
		{
			if (x.projectName == projectName && isDefined(x.variants) && x.variants.length <= 1)
				continue;

			if (x.projectName == projectName && variantName == "")
				continue;

			if (x.projectName == projectName && isDefined(x.variants))
				x.variants = removeVariantFromEntry(x, variantName);

			newObj.push(x);
		}

		manifest = newObj;
		writeManifest();
	}

	inline function: Array removeVariantFromEntry(projectEntry: object, variantName: string)
	{
		local result = [];
		
		for (x in projectEntry.variants)
		{
			if (x.name == variantName)
				continue;

			result.push(x);
		}
		
		return result;
	}
		
	/** Return reference array of filenames for the passed project/variant */
	inline function: Array getFiles(projectName: string, variantName: string)
	{
		local obj = createObject(projectName, variantName);

		if (!isDefined(obj.files))
			obj.files = [];

		return obj.files;
	}
		
	/** Return new array of filenames that are only present in the passed project/variant and not shared by others */
	inline function: Array getUniqueFiles(projectName: string, variantName: string)
	{
		local result = [];
		local currentFiles = getFiles(projectName, variantName);
		local filesToSkip = ["info.hxi", "UserPresets/", "UserPresets/db.json", "AudioResources.dat", "ImageResources.dat", "MidiFiles.dat", "SampleMaps.dat"];
		local variants = [];
		local allFiles = [];

		for (x in manifest)
		{
			if (isDefined(x.variants))
				variants.concat(x.variants);

			if (x == projectName)
				continue;

			if (isDefined(x.files))
				allFiles.concat(x.files);
		}
		
		for (x in variants)
		{
			if (x.name == variantName)
				continue;

			if (isDefined(x.files))
				allFiles.concat(x.files);
		}

		for (x in currentFiles)
		{
			if (filesToSkip.contains(x))
				continue;

			if (!allFiles.contains(x))
				result.push(x);
		}

		return result;
	}
	
	/** Append to the reference array of filenames for the project/variant */
	inline function updateFiles(projectName: string, variantName: string, filenames: Array)
	{
		local currentFiles = getFiles(projectName, variantName);

		for (f in filenames)
			currentFiles.pushIfNotAlreadyThere(f);

		writeManifest();
	}
		
	inline function: number isUpdatable(projectName: string, variantName: string, latestVersion: string)
	{
		if (variantName == "")
		{
			local project = getProject(projectName);			
			local installedVersion = getVersion(projectName, "");

			if (installedVersion == "")
				return false;

			return versionCompare(latestVersion, installedVersion);
		}		

		local installedVersion = getVersion(projectName, variantName);

		if (installedVersion == "")
			return false;

		if (versionCompare(latestVersion, installedVersion))
			return true;

		return false;
	}
	
	inline function getVersion(projectName: string, variantName: string)
	{
		local obj = getObject(projectName, variantName);

		if (isDefined(obj.installedVersion))
			return obj.installedVersion;

		if (variantName == "")
			return Expansions.getVersion(projectName);

		return "";
	}
	
	inline function setVersion(projectName: string, variantName: string, versionNumber: string, overwriteHigherOnly: number)
	{
		local obj = createObject(projectName, variantName);
		local currentVersion = getVersion(projectName, variantName);
	
		if (!overwriteHigherOnly)
			obj.installedVersion = versionNumber;
		else if (versionCompare(versionNumber, currentVersion))
			obj.installedVersion = versionNumber;
	
		writeManifest();
	}

	inline function: number versionCompare(version1: string, version2: string)
	{
		if (version1 != "" && version2 == "")
			return 1;

		if (version1 == "" || version2 == "")
			return 0;

		local v1 = version1.split(".").map(function(x) {return parseFloat(x);});
		local v2 = version2.split(".").map(function(x) {return parseFloat(x);});

		if (v1[0] != v2[0])
			return v1[0] > v2[0];

		if (v1[1] != v2[1])
			return v1[1] > v2[1];

		if (v1[2] != v2[2])
			return v1[2] > v2[2];

		return 0;
	}
}
