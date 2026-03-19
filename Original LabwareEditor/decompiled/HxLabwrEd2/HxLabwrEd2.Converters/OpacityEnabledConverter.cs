using System;
using System.Globalization;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

public class OpacityEnabledConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (value is bool)
		{
			return ((bool)value) ? 1.0 : 0.4;
		}
		return 1;
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
