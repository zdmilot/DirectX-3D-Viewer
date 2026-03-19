using System;
using System.Globalization;
using System.Windows;
using System.Windows.Data;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Converters;

public class TreeNodeContextMenuItemConverter : IValueConverter
{
	public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
	{
		if (value is CategoryNode)
		{
			return Visibility.Visible;
		}
		return Visibility.Collapsed;
	}

	public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
	{
		throw new NotImplementedException();
	}
}
