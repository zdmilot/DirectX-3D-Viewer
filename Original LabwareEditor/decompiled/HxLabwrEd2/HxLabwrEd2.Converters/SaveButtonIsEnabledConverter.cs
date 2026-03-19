using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

internal class SaveButtonIsEnabledConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values[0] == DependencyProperty.UnsetValue || values[1] == DependencyProperty.UnsetValue)
		{
			return false;
		}
		bool num = System.Convert.ToBoolean(values[0]);
		bool flag = System.Convert.ToBoolean(values[1]);
		if (num && !flag)
		{
			return true;
		}
		return false;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
