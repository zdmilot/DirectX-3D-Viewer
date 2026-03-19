using System;
using System.Globalization;
using System.Windows.Data;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Converters;

internal class LabwareNodeCategoryTitleConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (value != null && (value as LabwareNode).LabwareNodeData.CategoryIds.Count > 0)
		{
			return "Assigned Labware Categories:";
		}
		return "Labware has no valid Categories assigned";
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
