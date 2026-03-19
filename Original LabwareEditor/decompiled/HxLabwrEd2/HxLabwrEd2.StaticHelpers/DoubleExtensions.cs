using System;

namespace HxLabwrEd2.StaticHelpers;

public static class DoubleExtensions
{
	public static bool IsApproximatelyEqualTo(this double left, double right, double precision = 0.001)
	{
		return Math.Abs(left - right) < precision;
	}
}
