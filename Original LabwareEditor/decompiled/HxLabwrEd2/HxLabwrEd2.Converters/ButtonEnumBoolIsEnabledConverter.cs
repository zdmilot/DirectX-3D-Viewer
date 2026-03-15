using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

public class ButtonEnumBoolIsEnabledConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (parameter == null || values[0] == DependencyProperty.UnsetValue || values[1] == DependencyProperty.UnsetValue || !Enum.IsDefined(values[1].GetType(), values[1]))
		{
			return DependencyProperty.UnsetValue;
		}
		object obj = Enum.Parse(values[1].GetType(), parameter.ToString());
		bool flag = System.Convert.ToBoolean(values[0]);
		if (obj.Equals(values[1]) && !flag)
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
