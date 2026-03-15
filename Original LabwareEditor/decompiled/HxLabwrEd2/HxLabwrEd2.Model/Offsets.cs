using System;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;

namespace HxLabwrEd2.Model;

public class Offsets : Coordinates
{
	public double DistanceFrom(double x, double y)
	{
		return Math.Sqrt(Math.Pow(base.X - x, 2.0) + Math.Pow(base.Y - y, 2.0));
	}

	public Vector2 AsVector2()
	{
		return Vector2.FromRectangular(base.X, base.Y);
	}

	public Offsets()
	{
		base.X = 0.0;
		base.Y = 0.0;
		base.Z = 0.0;
	}

	public Offsets(double x, double y, double z)
	{
		base.X = x;
		base.Y = y;
		base.Z = z;
	}

	public Offsets(Offsets offsets)
	{
		base.X = offsets.X;
		base.Y = offsets.Y;
		base.Z = offsets.Z;
	}
}
