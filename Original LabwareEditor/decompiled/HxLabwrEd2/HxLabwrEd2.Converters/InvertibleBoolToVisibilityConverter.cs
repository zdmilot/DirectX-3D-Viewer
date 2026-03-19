using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

[ValueConversion(typeof(bool), typeof(Visibility))]
public class InvertibleBoolToVisibilityConverter : IValueConverter
{
	private enum Parameters
	{
		Normal,
		Inverted
	}

	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		bool flag = value != null && (bool)value;
		if (parameter == null)
		{
			return (!flag) ? Visibility.Collapsed : Visibility.Visible;
		}
		if ((Parameters)Enum.Parse(typeof(Parameters), (string)parameter) == Parameters.Inverted)
		{
			return flag ? Visibility.Collapsed : Visibility.Visible;
		}
		return (!flag) ? Visibility.Collapsed : Visibility.Visible;
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		return null;
	}
}
