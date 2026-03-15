using System;
using System.Globalization;
using System.Windows.Data;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Converters;

public class TreeNodeContextMenuConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (value is CategoryNode || (value is TitleNode && (value as TitleNode).ViewName == TitleNode.CategoryLabwareTitleNodeName) || (value is LabwareNode && (value as LabwareNode).Parent.ViewName != TitleNode.UncategorizedLabwareTitleNodeName))
		{
			return true;
		}
		return false;
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
