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

namespace Manifest
{
	reg manifest = read();

	inline function: Array read()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("Manifest.json");

		if (f.isFile())
			return f.loadAsObject();

		f.writeObject([]);

		return [];
	}

	inline function write()
	{
		local f = FileSystem.getFolder(FileSystem.AppData).getChildFile("Manifest.json");	
		f.writeObject(manifest);
	}
		
	inline function: object getCompanyData(company: string)
	{		
		for (x in manifest)
		{
			if (x.company == company)
				return x;
		}

		local index = manifest.push({company: company, products: []});
		return manifest[index - 1];
	}

	inline function getProductData(company: string, productName: string)
	{
		local companyData = getCompanyData(company);

		for (x in companyData.products)
		{
			if (x.name == productName)
				return x;
		}

		local index = companyData.products.push({name: productName, files: []});
		return companyData.products[index - 1];
	}
		
	inline function: object getData(company: string, productName: string)
	{
		if (companyName != "" && productName != "")
			return getProductData(company, productName);

		if (companyName != "")
			return getCompanyData(company);

		return manifest;
	}

	inline function: Array getFilenames(company: string, productName: string)
	{
		local data = getData(company, productName);

		if (isDefined(data.files))
			return data.files;

		return [];
	}

	inline function updateFiles(company: string, productName: string, filenames: Array)
	{
		local currentFiles = getFilenames(company, productName);

		for (f in filenames)
			currentFiles.pushIfNotAlreadyThere(f);

		write();
	}

	inline function removeProduct(company: string, productName: string)
	{
		local products = [];	
		local companyData = getCompanyData(company);
	
		for (x in companyData.products)
		{
			if (x.name == productName)
				continue;
				
			products.push(x);
		}

		companyData.products = products;
		write();
	}
}
