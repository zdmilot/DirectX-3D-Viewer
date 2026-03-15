using System;
using System.Globalization;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

public class BoolToIsEnabledReverseConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (bool.Parse(value.ToString()))
		{
			return false;
		}
		return true;
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (bool.Parse(value.ToString()))
		{
			return false;
		}
		return true;
	}
}
