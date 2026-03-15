using System;
using System.Globalization;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

internal class CountToIsEnabledConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (value == null)
		{
			return true;
		}
		if (value != null && (int)value < 1)
		{
			return true;
		}
		return false;
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
