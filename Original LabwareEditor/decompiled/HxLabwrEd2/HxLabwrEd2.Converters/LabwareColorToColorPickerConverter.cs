using System;
using System.Drawing;
using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

namespace HxLabwrEd2.Converters;

public class LabwareColorToColorPickerConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		System.Drawing.Color color = (System.Drawing.Color)value;
		return System.Windows.Media.Color.FromArgb((color.A == 0) ? byte.MaxValue : color.A, color.R, color.G, color.B);
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		System.Windows.Media.Color color = (System.Windows.Media.Color)value;
		return System.Drawing.Color.FromArgb(color.A, color.R, color.G, color.B);
	}
}
