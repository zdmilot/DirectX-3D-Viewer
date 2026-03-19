using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

public class FilterDeleteButtonIsEnabledConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values[0] == null || values[0] == DependencyProperty.UnsetValue || values[1] == null || values[1] == DependencyProperty.UnsetValue)
		{
			return false;
		}
		if ((bool)values[0] && values[1].ToString() != "Default")
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
