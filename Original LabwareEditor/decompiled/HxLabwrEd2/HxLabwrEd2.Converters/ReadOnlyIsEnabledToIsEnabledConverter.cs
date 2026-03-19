using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

public class ReadOnlyIsEnabledToIsEnabledConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values[0] == null || values[0] == DependencyProperty.UnsetValue || values[1] == null || values[1] == DependencyProperty.UnsetValue)
		{
			return DependencyProperty.UnsetValue;
		}
		bool flag = System.Convert.ToBoolean(values[0]);
		return System.Convert.ToBoolean(values[1]) && !flag;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
