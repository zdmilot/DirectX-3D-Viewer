using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

public class EnumToBoolConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (parameter == null || !Enum.IsDefined(value.GetType(), value))
		{
			return DependencyProperty.UnsetValue;
		}
		return Enum.Parse(value.GetType(), parameter.ToString()).Equals(value);
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (!(parameter is string))
		{
			return DependencyProperty.UnsetValue;
		}
		if (!System.Convert.ToBoolean(value))
		{
			return DependencyProperty.UnsetValue;
		}
		return parameter;
	}
}
