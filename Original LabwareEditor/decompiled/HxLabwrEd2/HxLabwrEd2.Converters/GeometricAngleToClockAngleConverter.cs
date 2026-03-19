using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

public class GeometricAngleToClockAngleConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (value == null || value == DependencyProperty.UnsetValue)
		{
			return null;
		}
		double num = 90.0 - (double)value;
		if (num < 0.0)
		{
			num += 360.0;
		}
		return num;
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (value == null || value == DependencyProperty.UnsetValue)
		{
			return null;
		}
		double num = 90.0 - double.Parse(value.ToString(), CultureInfo.InvariantCulture);
		if (num < 0.0)
		{
			num += 360.0;
		}
		return num;
	}
}
