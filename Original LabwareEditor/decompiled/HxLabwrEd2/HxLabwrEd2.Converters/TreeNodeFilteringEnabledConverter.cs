using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

public class TreeNodeFilteringEnabledConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values[0] == null || values[0] == DependencyProperty.UnsetValue || values[1] == null || values[1] == DependencyProperty.UnsetValue)
		{
			return Visibility.Collapsed;
		}
		bool num = System.Convert.ToBoolean(values[0]);
		bool flag = System.Convert.ToBoolean(values[1]);
		if (num && flag)
		{
			return Visibility.Visible;
		}
		return Visibility.Collapsed;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
