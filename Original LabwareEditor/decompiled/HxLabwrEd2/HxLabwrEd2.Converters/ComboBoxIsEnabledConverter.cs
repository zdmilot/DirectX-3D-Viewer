using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

public class ComboBoxIsEnabledConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		bool flag = true;
		if (values[0] != DependencyProperty.UnsetValue && values[1] != DependencyProperty.UnsetValue && ((bool)values[0] || !(bool)values[1]))
		{
			flag = false;
		}
		return flag;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
