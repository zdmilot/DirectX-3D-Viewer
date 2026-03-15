using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;

namespace HxLabwrEd2.Model;

public class Dimensions : Coordinates
{
	public Vector2 AsVector2()
	{
		return Vector2.FromRectangular(base.X, base.Y);
	}

	public Dimensions()
	{
		base.X = 0.0;
		base.Y = 0.0;
		base.Z = 0.0;
	}

	public Dimensions(double x, double y, double z)
	{
		base.X = x;
		base.Y = y;
		base.Z = z;
	}

	public Dimensions(Dimensions dimensions)
	{
		base.X = dimensions.X;
		base.Y = dimensions.Y;
		base.Z = dimensions.Z;
	}
}
