using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Converters;

public class RectangularRackWidthLengthIsEnabledConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (value == DependencyProperty.UnsetValue)
		{
			return DependencyProperty.UnsetValue;
		}
		object obj = Enum.Parse(typeof(WellPattern), value.ToString());
		if (obj.Equals(WellPattern.Regular) || obj.Equals(WellPattern.Irregular))
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
