using System;
using System.Globalization;
using System.Windows.Data;

namespace HxLabwrEd2.Converters;

internal class SegmentsToSaveButtonConverter : IMultiValueConverter
{
	public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
	{
		if (values[0] != null)
		{
			_ = values[0];
		}
		_ = values[1];
		return true;
	}

	public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
