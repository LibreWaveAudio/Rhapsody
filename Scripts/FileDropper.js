/*
    Copyright 2026 David Healey

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

namespace FileDropper
{
	//! pnlFileDropper
	const pnlFileDropper = Content.getComponent("pnlFileDropper");
	pnlFileDropper.setFileDropCallback("All Callbacks", "*.hr1", onpnlFileDropperFileDrop);
	pnlFileDropper.showControl(false);

	pnlFileDropper.setPaintRoutine(function(g)
	{
		var a = this.getLocalBounds(0);
		
		g.fillAll(this.get("bgColour"));
		
		var p = Content.createPath();
		p.addRoundedRectangle(a, this.get("borderRadius"));	
		
		var stroke = {EndCapStyle: "rounded", JointStyle: "beveled", Thickness: 2.0};
		var sp = p.createStrokedPath(stroke, [28, 43]);
		
		g.setColour(this.get("textColour"));
		g.drawPath(sp, a.reduced(150), stroke);
		
		g.setFont("monoSemiBold", 32);
		g.drawAlignedText("Drop to Install", a, "centred");	
	});
		
	inline function onpnlFileDropperFileDrop(obj)
	{
		local archive = FileSystem.fromAbsolutePath(obj.fileName);
	
		obj.hover ? show() : hide();
	
		if (obj.drop)
			hide();
		
		if (obj.drop)
			ManualInstaller.promptForSampleFolder(archive);
	}
	
	//! Functions
	inline function show()
	{
		pnlFileDropper.showControl(true);
	}
	
	inline function hide()
	{
		pnlFileDropper.showControl(false);
	}
}
