using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Converters;

public class RectangularRackOrientationIsEnabledConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values[0] == DependencyProperty.UnsetValue || values[1] == DependencyProperty.UnsetValue || !Enum.IsDefined(typeof(WellPattern), values[1]))
		{
			return DependencyProperty.UnsetValue;
		}
		if (!System.Convert.ToBoolean(values[0]) && (values[1].Equals(WellPattern.Standard96Plate) || values[1].Equals(WellPattern.Standard384Plate) || values[1].Equals(WellPattern.Standard1536Plate)))
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
