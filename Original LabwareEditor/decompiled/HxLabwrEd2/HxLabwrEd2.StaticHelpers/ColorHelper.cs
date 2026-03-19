using System.Drawing;
using System.Globalization;

namespace HxLabwrEd2.StaticHelpers;

public static class ColorHelper
{
	public static int ColorToVectorLabwareColorInt(Color color)
	{
		return int.Parse(color.B.ToString("X2") + color.G.ToString("X2") + color.R.ToString("X2"), NumberStyles.HexNumber);
	}

	public static Color VectorLabwareColorIntToColor(int vectorLabwareColorInt)
	{
		Color color = Color.FromArgb(vectorLabwareColorInt);
		return Color.FromArgb(255, color.B, color.G, color.R);
	}
}
