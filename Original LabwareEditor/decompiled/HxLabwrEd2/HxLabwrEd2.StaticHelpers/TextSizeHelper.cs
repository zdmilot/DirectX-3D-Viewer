using System.Globalization;
using System.Windows;
using System.Windows.Media;

namespace HxLabwrEd2.StaticHelpers;

public static class TextSizeHelper
{
	public static Size MeasureText(string text, CultureInfo cultureInfo, FlowDirection flowDirection, FontFamily fontFamily, FontStyle fontStyle, double fontSize, FontWeight fontWeight, FontStretch fontStretch)
	{
		FormattedText formattedText = new FormattedText(text, cultureInfo, flowDirection, new Typeface(fontFamily, fontStyle, fontWeight, fontStretch), fontSize, Brushes.Black);
		return new Size(formattedText.Width, formattedText.Height);
	}
}
