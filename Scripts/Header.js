/*
    Copyright 2023 David Healey

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

namespace Header
{
	// pnlHeader
	const pnlHeader = Content.getComponent("pnlHeader");
	
	pnlHeader.setPaintRoutine(function(g)
	{
		g.fillAll(this.get("bgColour"));
	});
	
	// btnLogo
	const btnLogo = Content.getComponent("btnLogo");
	btnLogo.setControlCallback(onbtnLogoControl);
	
	inline function onbtnLogoControl(component, value)
	{
		if (value)
			return;
			
		About.show();	
	}

	const lafbtnLogo = Content.createLocalLookAndFeel();
	btnLogo.setLocalLookAndFeel(lafbtnLogo);

	lafbtnLogo.registerFunction("drawToggleButton", function(g, obj)
	{
		 var a = obj.area;
		 var down = obj.down || obj.value;

		 g.setColour(Colours.withAlpha(obj.itemColour1, obj.over ? 1.0 - 0.2 * down: 0.8));
		 g.fillPath(Paths.rhapsodyFullLogo, [a[0], a[3] / 2 - 24 / 2, 141, 24]);
	});
}