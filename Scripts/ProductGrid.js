/*
    Copyright 2022, 2023, 2024, 2025 David Healey

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

namespace ProductGrid
{
	const MARGIN = 10;
	reg numCols = 4;
	reg filterQuery = "";

	//! pnlProductGridContainer
	const pnlProductGridContainer = Content.getComponent("pnlProductGridContainer");
	
	pnlProductGridContainer.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		g.setColour(Colours.withAlpha(this.get("textColour"), 0.8));
		g.setFont("bold", 28);
		g.drawAlignedText(this.get("text"), [a[0], a[1], a[2], a[3] - 40], "centred");
	});

	//! pnlProductGrid
	const pnlProductGrid = Content.getComponent("pnlProductGrid");
	
	//! Functions
	inline function refresh()
	{
		local expansions = getExpansions(filterQuery);
		local width = pnlProductGrid.getWidth() / numCols - MARGIN;
		local numRows = Math.ceil(expansions.length / numCols);
		local height = width + 40;
		
		removeAllChildPanels();
		
		Engine.sortWithFunction(expansions, sortExpansions);
		
		pnlProductGrid.set("height", Math.max(height, numRows * height + MARGIN * numRows));

		for (i = 0; i < expansions.length; i++)
		{
			local e = expansions[i];
			local index = (i % numCols);
			local x = MARGIN + (index * width) + (index * MARGIN);
			local y = Math.floor(i / numCols) * (height + MARGIN);

			ProductTile.create(pnlProductGrid, e, [x, y, width, height]);
		}
		
		pnlProductGridContainer.set("text", expansions.length > 0 ? "" : "No Instruments Found");
		pnlProductGridContainer.repaint();
	}
	
	inline function removeAllChildPanels()
	{
		for (x in pnlProductGrid.getChildPanelList())
			x.removeFromParent();
	}
	
	inline function sortExpansions(a, b)
	{
		local nameA = a.getProperties().Name;
		local nameB = b.getProperties().Name;

		if (nameA < nameB)
			return -1;

		return nameA > nameB;
	}

	inline function: Array getExpansions(query: string)
	{
		local result = [];
		local expansions = Expansions.getList();

		if (query == "")
			return expansions;

		for (x in expansions)
		{
			local properties = x.getProperties();
			local tags = properties.Tags.split(",");
			
			if (!isDefined(tags) || !tags.length)
				tags = [""];

			for (i = 0; i < tags.length; i++)
			{
				local t = tags[i].toLowerCase();

				if (!Engine.matchesRegex(t.toLowerCase(), query) && !Engine.matchesRegex(properties.Name.toLowerCase(), query) && !Engine.matchesRegex(properties.Company.toLowerCase(), query))
					continue;
					
				result.push(x);

				break;	
			}			
		}

		return result;
	}
	
	//! Broadcasters
	Filter.getValueBroadcaster().addListener(0, "Listen for filter change", function(value)
	{
		filterQuery = isDefined(value) ? value.toLowerCase().trim() : "";
		refresh();
	});

	//! bcScaleFactor	
	const bcScaleFactor = Engine.createBroadcaster({id: "bcScaleFactor", args: ["component", "value"]});
	bcScaleFactor.attachToComponentValue(["pnlZoom"], "");

	bcScaleFactor.addListener(0, "Respond to UI scale changes", function(component, value)
	{
		numCols = value < 1.5 ? 4 : 5;
		refresh();
	});
	
}
