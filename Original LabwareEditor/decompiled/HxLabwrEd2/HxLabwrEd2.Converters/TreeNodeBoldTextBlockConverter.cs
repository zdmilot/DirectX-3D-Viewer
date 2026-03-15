using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

public class TreeNodeBoldTextBlockConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values[0] == null || values[0] == DependencyProperty.UnsetValue || values[1] == null || values[1] == DependencyProperty.UnsetValue)
		{
			return FontWeights.Normal;
		}
		if (values[1].ToString() == string.Empty)
		{
			return FontWeights.Normal;
		}
		if (values[0].ToString().IndexOf(values[1].ToString(), StringComparison.InvariantCultureIgnoreCase) >= 0)
		{
			return FontWeights.Bold;
		}
		return FontWeights.Normal;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
