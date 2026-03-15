using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;

namespace HxLabwrEd2.StaticHelpers;

public static class AngleConverter
{
	public static Angle ConvertClockAngleToGeometricAngle(Angle clockAngle)
	{
		double num = 90.0 - clockAngle.Degrees;
		if (num < 0.0)
		{
			num += 360.0;
		}
		return Angle.FromDegrees(num);
	}

	public static Angle ConvertGeometricAngleToClockAngle(Angle angle)
	{
		double num = 90.0 - angle.Degrees;
		if (num < 0.0)
		{
			num += 360.0;
		}
		return Angle.FromDegrees(num);
	}
}
